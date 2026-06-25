import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, DollarSign, Award, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Auction } from '../types';

interface AuctionCardProps {
  key?: React.Key;
  auction: Auction;
  onSelect: (auction: Auction) => void;
  currentUserId: string | null;
}

export default function AuctionCard({ auction, onSelect, currentUserId }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (auction.status !== 'active') {
        setTimeLeft(auction.status === 'sold' ? 'Sold' : 'Ended');
        setIsExpired(true);
        return;
      }

      const expiryDate = auction.expiresAt?.toDate ? auction.expiresAt.toDate() : new Date(auction.expiresAt);
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsExpired(true);
        return;
      }

      // Calculate time components
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(diff < 5 * 60 * 1000); // urgent if less than 5 minutes

      let timerString = '';
      if (days > 0) {
        timerString = `${days}d ${hours}h ${minutes}m`;
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

  const isUserHighestBidder = currentUserId && auction.highestBidderId === currentUserId;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onSelect(auction)}
      className="group relative flex flex-col bg-gray-900/40 border border-gray-800 hover:border-gray-700 rounded-3xl overflow-hidden cursor-pointer backdrop-blur-sm transition-all"
    >
      {/* Category Tag & Timer */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-gray-950/85 backdrop-blur-md rounded-full border border-gray-800 text-indigo-400">
          {auction.category}
        </span>
        {isUserHighestBidder && (
          <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-950/90 text-emerald-400 backdrop-blur-md rounded-full border border-emerald-800/50 flex items-center gap-1">
            <Award className="h-3 w-3" /> Winning
          </span>
        )}
      </div>

      {/* Image Preview Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-950 border-b border-gray-800/50">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />

        {/* Dynamic Bid Count Overlay */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs text-gray-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[11px] uppercase tracking-wide">
            {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} placed
          </span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
            {auction.title}
          </h3>
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {auction.description}
          </p>
        </div>

        {/* Pricing & Countdown Stats */}
        <div className="mt-5 pt-4 border-t border-gray-800/60 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              Current Bid
            </span>
            <span className="text-lg font-bold text-white flex items-center mt-0.5 tracking-tight">
              <span className="text-xs text-indigo-400 mr-0.5">$</span>
              {auction.currentBid.toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
              <Clock className={`h-3 w-3 ${isUrgent ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`} />
              Time Left
            </span>
            <span
              className={`text-xs font-bold block mt-1 ${
                isExpired
                  ? 'text-gray-500'
                  : isUrgent
                  ? 'text-rose-400 animate-pulse font-mono'
                  : 'text-indigo-300 font-mono'
              }`}
            >
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Action footer strip */}
      <div className="px-5 py-2.5 bg-gray-950/40 border-t border-gray-800/30 flex items-center justify-between group-hover:bg-indigo-950/20 transition-all">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
          Buy Now: <strong className="text-emerald-400">${auction.buyNowPrice.toLocaleString()}</strong>
        </span>
        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}
