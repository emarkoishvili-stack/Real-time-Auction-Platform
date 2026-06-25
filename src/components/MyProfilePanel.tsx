import React from 'react';
import { Award, ShoppingBag, Gavel, Package, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Auction } from '../types';

interface MyProfilePanelProps {
  auctions: Auction[];
  currentUser: { uid: string; displayName: string | null; email: string | null } | null;
  onSelectAuction: (auction: Auction) => void;
}

export default function MyProfilePanel({ auctions, currentUser, onSelectAuction }: MyProfilePanelProps) {
  if (!currentUser) return null;

  // Filter lists based on relations
  const myListings = auctions.filter((auc) => auc.sellerId === currentUser.uid);
  
  const myWinningAuctions = auctions.filter(
    (auc) => auc.status === 'active' && auc.highestBidderId === currentUser.uid
  );

  const myWins = auctions.filter(
    (auc) => (auc.status === 'sold' || auc.status === 'expired') && auc.highestBidderId === currentUser.uid
  );

  return (
    <div className="space-y-10">
      
      {/* User Card Profile Header */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
          <Award className="h-44 w-44 text-indigo-500" />
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shadow-indigo-600/15 uppercase">
            {currentUser.displayName ? currentUser.displayName.substring(0, 2) : 'ME'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{currentUser.displayName || 'Developer Guest'}</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{currentUser.email || 'developer.sandbox@firebase.local'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10">
          <div className="text-center md:text-right">
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Listed Items</span>
            <span className="text-xl font-black text-white block mt-1 font-mono">{myListings.length}</span>
          </div>
          <div className="h-8 w-px bg-gray-800" />
          <div className="text-center md:text-right">
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Bids</span>
            <span className="text-xl font-black text-indigo-400 block mt-1 font-mono">{myWinningAuctions.length}</span>
          </div>
          <div className="h-8 w-px bg-gray-800" />
          <div className="text-center md:text-right">
            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Won Auctions</span>
            <span className="text-xl font-black text-emerald-400 block mt-1 font-mono">{myWins.length}</span>
          </div>
        </div>
      </div>

      {/* Main Grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: My Active Bids (Winning) */}
        <div className="bg-gray-900/20 border border-gray-800/80 rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gavel className="h-4.5 w-4.5 text-indigo-400" />
            Currently Leading ({myWinningAuctions.length})
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {myWinningAuctions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-800 rounded-2xl">
                <p className="text-xs text-gray-500 italic">You aren't holding any high bids yet. Discover live listings!</p>
              </div>
            ) : (
              myWinningAuctions.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc)}
                  className="p-3.5 bg-gray-950/40 hover:bg-gray-950 border border-gray-850 hover:border-indigo-900/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={auc.imageUrl} alt={auc.title} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg bg-gray-900" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{auc.title}</span>
                      <span className="block text-[9px] text-emerald-400 uppercase tracking-wide font-semibold mt-0.5">Leading Bidder</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-black text-white font-mono">${auc.currentBid.toLocaleString()}</span>
                    <span className="block text-[8px] text-gray-500 uppercase font-bold mt-0.5">Top price</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: My Wins */}
        <div className="bg-gray-900/20 border border-gray-800/80 rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="h-4.5 w-4.5 text-emerald-400" />
            Auctions Won ({myWins.length})
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {myWins.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-800 rounded-2xl">
                <p className="text-xs text-gray-500 italic">No victories registered yet. Finalize buyouts to win instantly!</p>
              </div>
            ) : (
              myWins.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc)}
                  className="p-3.5 bg-emerald-950/10 hover:bg-emerald-950/15 border border-emerald-900/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={auc.imageUrl} alt={auc.title} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg bg-gray-900" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{auc.title}</span>
                      <span className="block text-[9px] text-emerald-400 uppercase tracking-wide font-semibold mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Claimed Win
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-black text-emerald-400 font-mono">${auc.currentBid.toLocaleString()}</span>
                    <span className="block text-[8px] text-gray-500 uppercase font-bold mt-0.5">Purchased</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: My Published Listings */}
        <div className="bg-gray-900/20 border border-gray-800/80 rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="h-4.5 w-4.5 text-indigo-400" />
            My Listings ({myListings.length})
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {myListings.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-800 rounded-2xl">
                <p className="text-xs text-gray-500 italic">You haven't listed any items for sale. Click "Create Listing" to start!</p>
              </div>
            ) : (
              myListings.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc)}
                  className="p-3.5 bg-gray-950/40 hover:bg-gray-950 border border-gray-850 hover:border-indigo-900/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={auc.imageUrl} alt={auc.title} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg bg-gray-900" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{auc.title}</span>
                      <span className="block text-[9px] text-gray-400 mt-0.5">
                        {auc.status === 'active' ? `${auc.bidCount} active bids` : `Ended (${auc.status})`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-black text-white font-mono">${auc.currentBid.toLocaleString()}</span>
                    <span className="block text-[8px] text-gray-500 uppercase font-bold mt-0.5">Current price</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
