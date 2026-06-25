import React, { useState } from 'react';
import { X, Sparkles, Image, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Auction } from '../types';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { uid: string; displayName: string | null; email: string | null } | null;
}

const STOCK_IMAGES = [
  { name: 'Ancient Silver Coin', url: 'https://images.unsplash.com/photo-1599740831671-2ca3c080061e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Gold Coins Pile', url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800' },
  { name: 'Paper Banknotes', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800' },
  { name: 'Gold Bullion', url: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&q=80&w=800' },
  { name: 'Macro Error Coin', url: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=800' },
];

export default function CreateListingModal({ isOpen, onClose, currentUser }: CreateListingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ancient');
  const [startingBid, setStartingBid] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [duration, setDuration] = useState('24'); // 24 hours default
  const [selectedImage, setSelectedImage] = useState(STOCK_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // AI State
  const [keyDetails, setKeyDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!title.trim()) {
      alert('Please fill in the item Title before using the AI Description Generator.');
      return;
    }

    setIsGenerating(true);
    setAiSuccess(false);

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          keyDetails: keyDetails || 'Pristine state, highly valuable collectible.'
        }),
      });

      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
        setAiSuccess(true);
      }
    } catch (error) {
      console.error('Failed to generate description with AI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const startBidNum = parseFloat(startingBid);
    const buyNowNum = parseFloat(buyNowPrice);

    if (isNaN(startBidNum) || startBidNum <= 0) {
      alert('Please enter a valid starting bid.');
      return;
    }
    if (isNaN(buyNowNum) || buyNowNum <= startBidNum) {
      alert('Buy Now Price must be greater than the Starting Bid.');
      return;
    }

    setLoading(true);
    try {
      const auctionId = `auc-${Date.now()}`;
      const now = new Date();
      const hours = parseInt(duration);
      const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const finalImageUrl = customImageUrl.trim() || selectedImage;

      const newAuction: Auction = {
        id: auctionId,
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        startingBid: startBidNum,
        currentBid: startBidNum,
        buyNowPrice: buyNowNum,
        highestBidderId: null,
        highestBidderName: null,
        highestBidderEmail: null,
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || 'Anonymous Seller',
        sellerEmail: currentUser.email || 'seller@example.com',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        category,
        status: 'active',
        bidCount: 0
      };

      await setDoc(doc(db, 'auctions', auctionId), newAuction);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Ancient');
      setStartingBid('');
      setBuyNowPrice('');
      setDuration('24');
      setKeyDetails('');
      setCustomImageUrl('');
      setAiSuccess(false);
    } catch (error) {
      console.error('Error creating auction listing:', error);
      alert('Failed to list item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Create Auction Listing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Item Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                 placeholder="e.g., კოლხური თეთრი Silver Didrachm..."
                className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Ancient">Ancient</option>
                <option value="Gold & Silver">Gold & Silver</option>
                <option value="Banknotes">Banknotes</option>
                <option value="Modern Proofs">Modern Proofs</option>
                <option value="Error Coins">Error Coins</option>
              </select>
            </div>
          </div>

          {/* AI Helper block */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Gemini AI Description Writer
              </span>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isGenerating || !title.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Writing...
                  </>
                ) : aiSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Regenerate
                  </>
                ) : (
                  <>
                    Write Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              Enter the item name above, jot down any quick features below, and let Gemini construct a stunning, high-converting product description catalog block.
            </p>
            <input
              type="text"
              value={keyDetails}
              onChange={(e) => setKeyDetails(e.target.value)}
              placeholder="Features e.g., 2024 model, pristine condition, extra accessories..."
              className="block w-full px-3.5 py-2 bg-gray-950 border border-gray-850 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Item Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell bidders why they should win this item. Mention context, flaws, box contents, or technical specifications."
              className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Pricing & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Starting Bid ($)</label>
              <input
                type="number"
                required
                min="1"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                placeholder="Starting Bid e.g. 50"
                className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Buy Now Price ($)</label>
              <input
                type="number"
                required
                min="1"
                value={buyNowPrice}
                onChange={(e) => setBuyNowPrice(e.target.value)}
                placeholder="Buy Now e.g. 150"
                className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Auction Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="1">1 Hour (Fast Test)</option>
                <option value="4">4 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="72">72 Hours (3 Days)</option>
                <option value="168">168 Hours (7 Days)</option>
              </select>
            </div>
          </div>

          {/* Image Chooser */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Image className="h-4 w-4" />
              Item Cover Photo
            </label>
            
            {/* Stock Image Presets */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x">
              {STOCK_IMAGES.map((img) => (
                <button
                  type="button"
                  key={img.url}
                  onClick={() => {
                    setSelectedImage(img.url);
                    setCustomImageUrl('');
                  }}
                  className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden snap-center border-2 transition-all ${
                    selectedImage === img.url && !customImageUrl
                      ? 'border-indigo-500 scale-95 shadow-lg shadow-indigo-600/10'
                      : 'border-gray-800 grayscale hover:grayscale-0'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-850" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-2 bg-gray-900 text-gray-500 uppercase tracking-wider font-semibold">
                  Or Paste Custom URL
                </span>
              </div>
            </div>

            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => {
                setCustomImageUrl(e.target.value);
              }}
              placeholder="https://images.unsplash.com/your-custom-image-url"
              className="block w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-650 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Submitting Buttons */}
          <div className="pt-4 border-t border-gray-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-850 text-gray-300 font-medium text-sm rounded-xl hover:bg-gray-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
