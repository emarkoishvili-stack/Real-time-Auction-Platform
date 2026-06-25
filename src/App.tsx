import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { seedInitialAuctions } from './seeder';
import { Auction } from './types';

// Components
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import AuctionDetails from './components/AuctionDetails';
import CreateListingModal from './components/CreateListingModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Auction Collection Sync & Automatic Seeding
  useEffect(() => {
    const auctionsQuery = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(auctionsQuery, async (snapshot) => {
      const itemsList: Auction[] = [];
      snapshot.forEach((doc) => {
        itemsList.push({ id: doc.id, ...doc.data() } as Auction);
      });
      
      setAuctions(itemsList);

      const hasLegacy = itemsList.some(item => ['porsche-1989', 'macbook-m3-max', 'rolex-submariner'].includes(item.id));

      // If Firestore is empty or contains legacy non-numismatic items, seed initial high-quality coins
      // Seeding requires writes, so only run when there is an authenticated user session active.
      if ((itemsList.length === 0 || hasLegacy) && auth.currentUser) {
        try {
          await seedInitialAuctions();
        } catch (err) {
          console.error('Failed to seed initial auctions:', err);
        }
      }
    }, (error) => {
      console.error('Error listening to auctions:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleGuestLogin = (name: string) => {
    // Auth state is handled in Firebase's auth.onAuthStateChanged automatically!
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedAuctionId(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading auction workspace...</p>
        </div>
      </div>
    );
  }

  // Require login to access platform lobby
  if (!currentUser) {
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
  }

  const selectedAuction = auctions.find((a) => a.id === selectedAuctionId);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 relative">
      {selectedAuctionId ? (
        <AuctionDetails
          auctionId={selectedAuctionId}
          currentUser={currentUser}
          onBack={() => setSelectedAuctionId(null)}
        />
      ) : (
        <Dashboard
          auctions={auctions}
          currentUser={currentUser}
          onSelectAuction={(auc) => setSelectedAuctionId(auc.id)}
          onOpenCreateListing={() => setIsCreateOpen(true)}
          onSignOut={handleSignOut}
        />
      )}

      {/* Overlays */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
