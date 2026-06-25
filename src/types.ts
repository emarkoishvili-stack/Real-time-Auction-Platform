export interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startingBid: number;
  currentBid: number;
  buyNowPrice: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  highestBidderEmail: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  category: string;
  status: 'active' | 'sold' | 'expired';
  bidCount: number;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  bidderEmail: string;
  amount: number;
  timestamp: any; // Firestore Timestamp
  isBuyNow: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: any;
}

export type Category = 'All' | 'Ancient' | 'Gold & Silver' | 'Banknotes' | 'Modern Proofs' | 'Error Coins';
