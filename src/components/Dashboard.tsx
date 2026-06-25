import React, { useState } from 'react';
import { Search, Gavel, Sparkles, Filter, PlusCircle, HelpCircle, Activity, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Auction, Category } from '../types';
import AuctionCard from './AuctionCard';
import MyProfilePanel from './MyProfilePanel';

interface DashboardProps {
  auctions: Auction[];
  currentUser: { uid: string; displayName: string | null; email: string | null } | null;
  onSelectAuction: (auction: Auction) => void;
  onOpenCreateListing: () => void;
  onSignOut: () => void;
}

const CATEGORIES: Category[] = ['All', 'Ancient', 'Gold & Silver', 'Banknotes', 'Modern Proofs', 'Error Coins'];

export default function Dashboard({ 
  auctions, 
  currentUser, 
  onSelectAuction, 
  onOpenCreateListing,
  onSignOut 
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [activeTab, setActiveTab] = useState<'browse' | 'profile'>('browse');

  // Filter listings
  const filteredAuctions = auctions.filter((auc) => {
    const matchesSearch = auc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          auc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || auc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalVolume = auctions.reduce((sum, item) => sum + (item.currentBid || 0), 0);
  const activeCount = auctions.filter((auc) => auc.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full bg-indigo-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full bg-emerald-900/5 blur-[120px] pointer-events-none" />

      {/* Main Header / Navigation bar */}
      <header className="border-b border-gray-800/80 bg-gray-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Gavel className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-md font-extrabold tracking-tight text-white font-sans">
              BidSynchrony
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab(activeTab === 'browse' ? 'profile' : 'browse')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/15'
                  : 'border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {activeTab === 'profile' ? 'View Auction Lobby' : 'My Dashboard'}
            </button>

            {currentUser && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
                <div className="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                  {currentUser.displayName ? currentUser.displayName.substring(0, 2) : 'US'}
                </div>
                <button
                  onClick={onSignOut}
                  className="text-[10px] uppercase font-bold text-gray-500 hover:text-rose-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Scroll Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        
        {activeTab === 'browse' ? (
          <div className="space-y-8">
            {/* Hero segment */}
            <div className="bg-gradient-to-r from-gray-900/50 via-[#111726]/40 to-gray-900/50 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                  Numismatic Elite Lobby
                </span>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                  იშვიათი მონეტები, ბანკნოტები და ანტიკვარიატი
                </h1>
                <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
                  Bid, appraise, and discover rare physical currency in real-time. List rare historic coins and modern bullion proofs, with instant AI coin grading and valuation tips.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={onOpenCreateListing}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  Create New Listing
                </button>
              </div>
            </div>

            {/* Platform metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900/20 border border-gray-800/60 rounded-2xl flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase font-semibold">Active Lobby Items</span>
                  <span className="text-lg font-black text-white font-mono mt-0.5 block">{activeCount}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-900/20 border border-gray-800/60 rounded-2xl flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-950 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase font-semibold">Bidding Volume</span>
                  <span className="text-lg font-black text-white font-mono mt-0.5 block">${totalVolume.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-900/20 border border-gray-800/60 rounded-2xl flex items-center gap-3 col-span-2">
                <div className="h-10 w-10 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                  AI
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase font-semibold">AI Valuation Grounding</span>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    Dual expert strategic planning models enabled.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Pill and Search bar section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-800/50">
              
              {/* Categories selection pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-950/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search form bar */}
              <div className="relative max-w-md w-full rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4.5 w-4.5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog titles or descriptors..."
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Active Auction Grid */}
            <div>
              {filteredAuctions.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/10 border border-dashed border-gray-800 rounded-3xl space-y-3">
                  <Filter className="h-10 w-10 text-gray-600 mx-auto" />
                  <h3 className="text-md font-bold text-gray-300">No Listings Match Filters</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-normal">
                    Try adjusting your category filter, changing your search terms, or publishing a new custom item.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAuctions.map((auc) => (
                    <AuctionCard
                      key={auc.id}
                      auction={auc}
                      onSelect={onSelectAuction}
                      currentUserId={currentUser?.uid || null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <MyProfilePanel
            auctions={auctions}
            currentUser={currentUser}
            onSelectAuction={onSelectAuction}
          />
        )}
      </main>
    </div>
  );
}
