import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Clock, History, DollarSign, Award, ShieldAlert, 
  Sparkles, Zap, ChevronRight, User, TrendingUp, AlertCircle, Heart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, collection, onSnapshot, writeBatch, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Auction, Bid } from '../types';

interface AuctionDetailsProps {
  auctionId: string;
  onBack: () => void;
  currentUser: { uid: string; displayName: string | null; email: string | null } | null;
}

interface AppraisalData {
  estimatedValue: number;
  demandRating: 'High' | 'Medium' | 'Low';
  buyersStrategy: string;
  sellersStrategy: string;
  verdict: string;
  isSimulation?: boolean;
}

export default function AuctionDetails({ auctionId, onBack, currentUser }: AuctionDetailsProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [biddingProgress, setBiddingProgress] = useState(false);
  const [bidError, setBidError] = useState('');
  const [buyNowSuccess, setBuyNowSuccess] = useState(false);

  // Time remaining states
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // AI Appraisal States
  const [appraisal, setAppraisal] = useState<AppraisalData | null>(null);
  const [loadingAppraisal, setLoadingAppraisal] = useState(false);
  const [showAppraisal, setShowAppraisal] = useState(false);

  // Visual celebrations
  const [showConfetti, setShowConfetti] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);

  // 1. Real-time Listeners for current item details and its bids collection
  useEffect(() => {
    if (!auctionId) return;

    setLoading(true);

    // Live Auction document listener
    const unsubAuction = onSnapshot(doc(db, 'auctions', auctionId), (docSnap) => {
      if (docSnap.exists()) {
        setAuction({ id: docSnap.id, ...docSnap.data() } as Auction);
      } else {
        console.error('Auction not found');
      }
      setLoading(false);
    }, (error) => {
      console.error('Auction doc snapshot error:', error);
      setLoading(false);
    });

    // Live Subcollection Bids listener
    const bidsQuery = query(
      collection(db, 'auctions', auctionId, 'bids'),
      orderBy('amount', 'desc'),
      limit(25)
    );

    const unsubBids = onSnapshot(bidsQuery, (querySnap) => {
      const bidsList: Bid[] = [];
      querySnap.forEach((doc) => {
        bidsList.push({ id: doc.id, ...doc.data() } as Bid);
      });
      setBids(bidsList);
    }, (error) => {
      console.error('Bids subcollection snapshot error:', error);
    });

    return () => {
      unsubAuction();
      unsubBids();
    };
  }, [auctionId]);

  // 2. Local Countdowns
  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      if (auction.status !== 'active') {
        setTimeLeft(auction.status === 'sold' ? 'Sold' : 'Auction Ended');
        setIsExpired(true);
        return;
      }

      const expiryDate = auction.expiresAt?.toDate ? auction.expiresAt.toDate() : new Date(auction.expiresAt);
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(diff < 5 * 60 * 1000); // 5 mins

      let timerString = '';
      if (days > 0) {
        timerString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timerString = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        timerString = `${minutes}m ${seconds}s`;
      }
      setTimeLeft(timerString);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  // 3. Smart AI valuation appraisal trigger
  const handleFetchAiAppraisal = async () => {
    if (!auction) return;
    setLoadingAppraisal(true);
    setShowAppraisal(true);

    try {
      const response = await fetch('/api/ai/appraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: auction.title,
          description: auction.description,
          category: auction.category,
          startingBid: auction.startingBid,
          currentBid: auction.currentBid
        })
      });

      const data = await response.json();
      setAppraisal(data);
    } catch (error) {
      console.error('Appraisal API Fetch Failed:', error);
    } finally {
      setLoadingAppraisal(false);
    }
  };

  // 4. Atomic transaction bidding handler
  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !auction) return;
    setBidError('');

    const bidVal = parseFloat(bidAmount);
    if (isNaN(bidVal)) {
      setBidError('Please enter a valid numeric amount.');
      return;
    }

    // Validation
    const minBidRequired = auction.currentBid === auction.startingBid && auction.bidCount === 0
      ? auction.startingBid
      : Math.round(auction.currentBid * 1.02); // Require 2% minimum raise

    if (bidVal < minBidRequired) {
      setBidError(`Your bid must be at least $${minBidRequired.toLocaleString()} (Minimum 2% higher than current bid).`);
      return;
    }

    if (bidVal >= auction.buyNowPrice) {
      setBidError(`This bid exceeds or matches the Buy Now price ($${auction.buyNowPrice.toLocaleString()}). Use the Buy Now button for instant win!`);
      return;
    }

    setBiddingProgress(true);

    try {
      const batch = writeBatch(db);

      // 1. Create Bid document
      const bidDocId = `bid-${Date.now()}`;
      const bidRef = doc(collection(db, 'auctions', auction.id, 'bids'), bidDocId);
      
      const newBid: Bid = {
        id: bidDocId,
        bidderId: currentUser.uid,
        bidderName: currentUser.displayName || 'Anonymous Bidder',
        bidderEmail: currentUser.email || 'bidder@example.com',
        amount: bidVal,
        timestamp: Timestamp.now(),
        isBuyNow: false
      };
      batch.set(bidRef, newBid);

      // 2. Update Auction summary
      const auctionRef = doc(db, 'auctions', auction.id);
      batch.update(auctionRef, {
        currentBid: bidVal,
        highestBidderId: currentUser.uid,
        highestBidderName: currentUser.displayName || 'Anonymous Bidder',
        highestBidderEmail: currentUser.email || 'bidder@example.com',
        bidCount: (auction.bidCount || 0) + 1
      });

      await batch.commit();
      setBidAmount('');
      
      // Fun mini vibration/glow visual trigger
      triggerMiniCelebration();
    } catch (err: any) {
      console.error('Bidding failed:', err);
      setBidError('Failed to place bid. Please verify connection and try again.');
    } finally {
      setBiddingProgress(false);
    }
  };

  // 5. Buy Now transaction handler
  const handleBuyNow = async () => {
    if (!currentUser || !auction) return;
    
    const confirmBuy = window.confirm(`Are you sure you want to buy this item instantly for $${auction.buyNowPrice.toLocaleString()}?`);
    if (!confirmBuy) return;

    setBiddingProgress(true);
    try {
      const batch = writeBatch(db);

      // 1. Create Buy-Now Bid item
      const bidDocId = `bid-${Date.now()}`;
      const bidRef = doc(collection(db, 'auctions', auction.id, 'bids'), bidDocId);
      const buyNowBid: Bid = {
        id: bidDocId,
        bidderId: currentUser.uid,
        bidderName: currentUser.displayName || 'Anonymous Purchaser',
        bidderEmail: currentUser.email || 'purchaser@example.com',
        amount: auction.buyNowPrice,
        timestamp: Timestamp.now(),
        isBuyNow: true
      };
      batch.set(bidRef, buyNowBid);

      // 2. Close Auction
      const auctionRef = doc(db, 'auctions', auction.id);
      batch.update(auctionRef, {
        currentBid: auction.buyNowPrice,
        highestBidderId: currentUser.uid,
        highestBidderName: currentUser.displayName || 'Anonymous Purchaser',
        highestBidderEmail: currentUser.email || 'purchaser@example.com',
        bidCount: (auction.bidCount || 0) + 1,
        status: 'sold'
      });

      await batch.commit();
      setBuyNowSuccess(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    } catch (err) {
      console.error('Instant buy transaction failed:', err);
      alert('Failed to complete instant buyout.');
    } finally {
      setBiddingProgress(false);
    }
  };

  const triggerMiniCelebration = () => {
    // Custom active particle trigger
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading auction workspace...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold">Auction Listing Not Found</h3>
          <button onClick={onBack} className="text-indigo-400 hover:underline">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const isSeller = currentUser && auction.sellerId === currentUser.uid;
  const isWinning = currentUser && auction.highestBidderId === currentUser.uid;
  const minBid = auction.currentBid === auction.startingBid && auction.bidCount === 0
    ? auction.startingBid
    : Math.round(auction.currentBid * 1.02);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 pb-16 relative">
      {/* Absolute Confetti Particles overlay */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: -20, 
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  y: window.innerHeight + 20, 
                  rotate: Math.random() * 720,
                  opacity: 0
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  ease: 'easeOut' 
                }}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i % 5]
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Detail Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-xl hover:bg-gray-900 text-gray-300 hover:text-white transition-all text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 rounded-full text-xs font-semibold uppercase tracking-wider">
              {auction.category}
            </span>
            <span className={`px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider ${
              auction.status === 'active' 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                : 'bg-rose-950/40 border-rose-800 text-rose-400'
            }`}>
              {auction.status}
            </span>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Media & Narrative Description (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden aspect-[16/10] relative shadow-lg">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
              
              {/* Dynamic Overlay Banner */}
              {auction.status === 'sold' && (
                <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  >
                    <Award className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mt-2">Sold Instantly!</h3>
                  <p className="text-xs text-gray-400">Winning Purchaser: {auction.highestBidderName}</p>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                {auction.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pb-4 border-b border-gray-800/80">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-500" />
                  Listed by: <strong className="text-gray-300 font-semibold">{auction.sellerName}</strong>
                </span>
                <span className="h-1.5 w-1.5 bg-gray-700 rounded-full" />
                <span>Expires: {new Date(auction.expiresAt?.toDate ? auction.expiresAt.toDate() : auction.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="text-sm leading-relaxed text-gray-300 space-y-4">
                <p className="whitespace-pre-line">{auction.description}</p>
              </div>
            </div>

            {/* Gemini AI appraisal trigger box */}
            <div className="bg-gradient-to-r from-indigo-950/25 to-purple-950/25 border border-indigo-900/30 rounded-3xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="h-32 w-32 text-indigo-500" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Powered by Gemini 2.5
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 mt-1">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    AI Appraisal & Strategic Insights
                  </h3>
                  <p className="text-xs text-gray-400">
                    Get an instant real-time market appraisal, historical context, and customized bidding strategies.
                  </p>
                </div>
                <button
                  onClick={handleFetchAiAppraisal}
                  disabled={loadingAppraisal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/25 shrink-0 flex items-center justify-center gap-1.5"
                >
                  {loadingAppraisal ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Appraising...
                    </>
                  ) : (
                    <>
                      Request Appraisal
                    </>
                  )}
                </button>
              </div>

              {/* Appraisal Content Block */}
              <AnimatePresence>
                {showAppraisal && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-indigo-900/40 pt-5 space-y-5 overflow-hidden"
                  >
                    {loadingAppraisal ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="inline-flex gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                        </div>
                        <p className="text-xs text-gray-500 italic">Gemini is evaluating condition history and live market datasets...</p>
                      </div>
                    ) : appraisal && (
                      <div className="space-y-5">
                        {/* Simulation mode indicator */}
                        {appraisal.isSimulation && (
                          <div className="p-2.5 bg-yellow-950/20 border border-yellow-800/30 rounded-xl text-[10px] text-yellow-300">
                            <strong>Note:</strong> {appraisal.notice}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Value Estimate card */}
                          <div className="bg-gray-950/50 p-4 border border-indigo-950 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Fair Market Estimate</span>
                              <span className="block text-2xl font-extrabold text-white mt-1">
                                ${appraisal.estimatedValue.toLocaleString()}
                              </span>
                            </div>
                            <span className="h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                              USD
                            </span>
                          </div>

                          {/* Demand rating */}
                          <div className="bg-gray-950/50 p-4 border border-indigo-950 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Live Bidder Demand</span>
                              <span className="block text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                  appraisal.demandRating === 'High' ? 'bg-emerald-500' : appraisal.demandRating === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                                {appraisal.demandRating} Demand
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Verdict Narrative */}
                        <div className="bg-indigo-950/10 p-4 border border-indigo-900/20 rounded-2xl space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Expert Appraisal Verdict</span>
                          <p className="text-xs leading-relaxed text-gray-300 italic">{appraisal.verdict}</p>
                        </div>

                        {/* Strategy Bento cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-950/40 border border-gray-850 rounded-2xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              Bidders' Action Strategy
                            </span>
                            <p className="text-xs leading-normal text-gray-400">{appraisal.buyersStrategy}</p>
                          </div>
                          <div className="p-4 bg-gray-950/40 border border-gray-850 rounded-2xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5" />
                              Seller's Listing Tactics
                            </span>
                            <p className="text-xs leading-normal text-gray-400">{appraisal.sellersStrategy}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT PANEL: Live Bidding & History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Bidding Console */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bidding Console</span>
                {auction.status === 'active' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-950/50 border border-gray-850 rounded-2xl">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Current Price</span>
                  <span className="text-2xl font-black text-white mt-0.5 block tracking-tight">
                    <span className="text-sm font-semibold text-indigo-400 mr-0.5">$</span>
                    {auction.currentBid.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-400" /> Time Left
                  </span>
                  <span className={`text-base font-bold block mt-1 font-mono tracking-tight ${
                    isUrgent ? 'text-rose-400 animate-pulse' : 'text-indigo-300'
                  }`}>
                    {timeLeft}
                  </span>
                </div>
              </div>

              {/* Status messaging */}
              {auction.status !== 'active' ? (
                <div className="p-4 bg-gray-950 border border-gray-850 rounded-2xl text-center space-y-2">
                  <Award className="h-8 w-8 text-indigo-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">This Auction Has Closed</h4>
                  <p className="text-xs text-gray-400">
                    {auction.status === 'sold' 
                      ? `Purchased by ${auction.highestBidderName} for $${auction.currentBid.toLocaleString()}`
                      : 'Expired without meeting buy-now price.'}
                  </p>
                </div>
              ) : !currentUser ? (
                <div className="p-4 bg-gray-950 border border-gray-850 rounded-2xl text-center">
                  <p className="text-xs text-gray-400">Please sign in to place a live bid on this listing.</p>
                </div>
              ) : isSeller ? (
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-center flex items-center gap-2.5 text-xs text-indigo-300">
                  <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>As the seller of this auction, you cannot bid on your own item. Monitor incoming bids below!</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Highest Bidder Header */}
                  {auction.highestBidderId ? (
                    <div className="flex items-center justify-between text-xs p-3 bg-gray-950/40 rounded-xl border border-gray-850">
                      <span className="text-gray-400 font-medium">Highest Bidder:</span>
                      <span className={`font-bold flex items-center gap-1 ${isWinning ? 'text-emerald-400' : 'text-gray-200'}`}>
                        {isWinning ? (
                          <>
                            <Award className="h-3.5 w-3.5" /> You are winning!
                          </>
                        ) : (
                          auction.highestBidderName
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-center p-3 bg-gray-950/40 rounded-xl text-gray-500 italic">
                      No bids placed yet. Be the first to bid!
                    </div>
                  )}

                  {/* Placing Bids Form */}
                  <form onSubmit={handlePlaceBid} className="space-y-3">
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
                      </div>
                      <input
                        type="number"
                        required
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min Bid: $${minBid.toLocaleString()}`}
                        className="block w-full pl-10 pr-24 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                      />
                      <div className="absolute inset-y-1 right-1 pr-1 flex items-center">
                        <button
                          type="button"
                          onClick={() => setBidAmount(minBid.toString())}
                          className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-indigo-400 transition-all uppercase tracking-wide"
                        >
                          Min Bid
                        </button>
                      </div>
                    </div>

                    {bidError && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 leading-normal">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {bidError}
                      </p>
                    )}

                    {/* Presets bid increment triggers */}
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 500, 2000].map((increment) => {
                        const targetVal = auction.currentBid + increment;
                        return (
                          <button
                            type="button"
                            key={increment}
                            onClick={() => setBidAmount(targetVal.toString())}
                            className="py-1.5 border border-gray-850 hover:border-gray-700 bg-gray-950/35 hover:bg-gray-950 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white transition-all font-mono"
                          >
                            +${increment}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bidding Buttons */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="submit"
                        disabled={biddingProgress}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {biddingProgress ? (
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Place Live Bid'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={biddingProgress}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 gap-1"
                      >
                        <Zap className="h-4 w-4 text-emerald-100" />
                        Buy Now: ${auction.buyNowPrice.toLocaleString()}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Real-time Bid History Collection Feed */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm space-y-4 flex flex-col max-h-[380px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-indigo-400" />
                  Live Bid History
                </span>
                <span className="text-[10px] bg-gray-950 px-2 py-0.5 border border-gray-850 text-gray-500 rounded-full font-mono uppercase">
                  Real-time
                </span>
              </div>

              {/* Timeline list */}
              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1.5 scrollbar-thin">
                <AnimatePresence initial={false}>
                  {bids.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-12 text-center">
                      <p className="text-xs text-gray-500 italic">No bids logged in database.</p>
                    </div>
                  ) : (
                    bids.map((bid, index) => {
                      const isFirst = index === 0;
                      const bidTime = bid.timestamp?.toDate ? bid.timestamp.toDate() : new Date(bid.timestamp);
                      const isUserBid = currentUser && bid.bidderId === currentUser.uid;

                      return (
                        <motion.div
                          key={bid.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            bid.isBuyNow
                              ? 'bg-emerald-950/30 border-emerald-800/40'
                              : isFirst
                              ? 'bg-indigo-950/30 border-indigo-800/40 shadow-md shadow-indigo-600/5'
                              : 'bg-gray-950/40 border-gray-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar bubble */}
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 uppercase ${
                              bid.isBuyNow
                                ? 'bg-emerald-900/40 text-emerald-300'
                                : isFirst
                                ? 'bg-indigo-900/40 text-indigo-300'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {bid.bidderName ? bid.bidderName.substring(0, 2) : 'AN'}
                            </div>

                            <div className="min-w-0">
                              <span className={`block text-xs font-bold truncate ${isUserBid ? 'text-indigo-300' : 'text-gray-200'}`}>
                                {bid.bidderName} {isUserBid && '(You)'}
                              </span>
                              <span className="block text-[9px] text-gray-500 font-mono">
                                {bidTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-black font-mono block ${
                              bid.isBuyNow ? 'text-emerald-400' : isFirst ? 'text-indigo-400' : 'text-gray-300'
                            }`}>
                              ${bid.amount.toLocaleString()}
                            </span>
                            <span className="text-[8px] uppercase font-semibold text-gray-500 block">
                              {bid.isBuyNow ? 'Buyout' : isFirst ? 'Top Bid' : 'Raised'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
                <div ref={historyEndRef} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
