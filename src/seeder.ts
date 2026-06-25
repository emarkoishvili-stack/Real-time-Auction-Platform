import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Auction } from './types';

const INITIAL_AUCTIONS = [
  {
    id: 'colchian-tetri',
    title: 'კოლხური თეთრი (Kolkhi Tetri) - Silver Didrachm',
    description: 'ძალზედ იშვიათი კოლხური თეთრი (Kolkhi Tetri), ძვ. წ. V საუკუნე. This iconic silver didrachm features the classic design of a female head (often associated with Hecate or a Colchian deity) and a bull head on the reverse. Masterfully struck in the Colchis Kingdom (modern-day western Georgia). Graded Ch VF by NGC Ancients. A cornerstone piece for any historical numismatist.',
    imageUrl: 'https://images.unsplash.com/photo-1599740831671-2ca3c080061e?auto=format&fit=crop&q=80&w=800',
    startingBid: 3200,
    currentBid: 3500,
    buyNowPrice: 5000,
    highestBidderId: 'demo-user-1',
    highestBidderName: 'Sandro Kavtaradze',
    highestBidderEmail: 'sandro.k@example.com',
    sellerId: 'admin-seller',
    sellerName: 'Georgian Heritage Numismatics',
    sellerEmail: 'heritage@numismatics.ge',
    category: 'Ancient',
    status: 'active' as const,
    bidCount: 2,
    hoursOffset: 6, // Ends in 6 hours
  },
  {
    id: 'queen-tamar-gold',
    title: 'თამარ მეფის ოქროს მონეტა (Queen Tamar Gold Dram)',
    description: 'უნიკალური და ისტორიული თამარ მეფის ეპოქის ოქროს მონეტა (XII-XIII სს). Celebrated medieval Georgian gold issue with beautifully preserved Arabic legends declaring her sovereignty and faith. This is a magnificent sample of Georgian Golden Age metallurgy and cultural heritage. Authenticated and graded AU58 by NGC.',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
    startingBid: 15000,
    currentBid: 16500,
    buyNowPrice: 25000,
    highestBidderId: 'demo-user-2',
    highestBidderName: 'Nini Abramishvili',
    highestBidderEmail: 'nini.a@example.com',
    sellerId: 'admin-seller-2',
    sellerName: 'Tbilisi Coin Vault',
    sellerEmail: 'vault@coins.ge',
    category: 'Gold & Silver',
    status: 'active' as const,
    bidCount: 3,
    hoursOffset: 24, // Ends in 24 hours
  },
  {
    id: 'democratic-republic-1919',
    title: 'საქართველოს დემოკრატიული რესპუბლიკა - 10,000 მანეთი (1921)',
    description: 'Rare 10,000 Maneti banknote issued in 1921 by the Democratic Republic of Georgia just before the Soviet annexation. Features stunning intricate Georgian national ornaments, the coat of arms, and signatures of the Minister of Finance and the Government Director. Remarkable crisp paper condition, graded PMG Very Fine 30.',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800',
    startingBid: 450,
    currentBid: 450,
    buyNowPrice: 850,
    highestBidderId: null,
    highestBidderName: null,
    highestBidderEmail: null,
    sellerId: 'admin-seller-3',
    sellerName: 'Historical Banknotes Ltd.',
    sellerEmail: 'info@papercurrency.ge',
    category: 'Banknotes',
    status: 'active' as const,
    bidCount: 0,
    hoursOffset: 72, // Ends in 3 days
  },
  {
    id: 'golden-fleece-2006',
    title: 'საიუბილეო ოქროს მონეტა "ოქროს საწმისი" (Golden Fleece Gold Proof)',
    description: 'საქართველოს ეროვნული ბანკის საიუბილეო ოქროს საწმისის მონეტა (2006), 1000 ლარის ნომინალი. Weight: 1 troy ounce of .9999 pure gold. Striking deep-cameo proof finishes featuring the Argonauts and Jason. In original velvet presentation box with official Certificate of Authenticity.',
    imageUrl: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&q=80&w=800',
    startingBid: 2400,
    currentBid: 2600,
    buyNowPrice: 3100,
    highestBidderId: 'demo-user-3',
    highestBidderName: 'Giorgi Lomidze',
    highestBidderEmail: 'giorgi.l@example.com',
    sellerId: 'admin-seller-4',
    sellerName: 'Modern Mint Distributor',
    sellerEmail: 'mint@bullion.ge',
    category: 'Modern Proofs',
    status: 'active' as const,
    bidCount: 1,
    hoursOffset: 120, // Ends in 5 days
  },
  {
    id: 'lari-error-double-struck',
    title: '1 ლარი ორმაგი მოჭრის დეფექტით (Double-Struck Error Coin)',
    description: 'A fascinating 1 Lari coin displaying a massive 45% off-center double-strike error. The second strike is highly detailed, showing a clear duplicate of the St. George graphic. A dream coin for error specialists (mint error). Certified by PCGS Mint Error MS62.',
    imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=800',
    startingBid: 120,
    currentBid: 180,
    buyNowPrice: 350,
    highestBidderId: 'demo-user-1',
    highestBidderName: 'Sandro Kavtaradze',
    highestBidderEmail: 'sandro.k@example.com',
    sellerId: 'admin-seller-5',
    sellerName: 'Error Specialists Club',
    sellerEmail: 'errors@numismatics.org',
    category: 'Error Coins',
    status: 'active' as const,
    bidCount: 4,
    hoursOffset: 168, // Ends in 7 days
  }
];

export async function seedInitialAuctions() {
  try {
    const auctionsCol = collection(db, 'auctions');
    const snapshot = await getDocs(auctionsCol);

    const hasLegacyItems = snapshot.docs.some(doc => ['porsche-1989', 'macbook-m3-max', 'rolex-submariner'].includes(doc.id));

    if (snapshot.empty || hasLegacyItems) {
      console.log('Seeding initial numismatic items to Firestore...');
      
      // Clean old test entries if present to support a seamless theme transition
      if (hasLegacyItems) {
        const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
        for (const d of snapshot.docs) {
          await deleteDoc(firestoreDoc(db, 'auctions', d.id));
        }
      }

      for (const item of INITIAL_AUCTIONS) {
        const { hoursOffset, ...auctionData } = item;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);

        const auctionDoc: Auction = {
          ...auctionData,
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
        };

        await setDoc(doc(db, 'auctions', item.id), auctionDoc);

        // Pre-fill some sample bid history if there was previous bids
        if (item.bidCount > 0) {
          const bidsCol = collection(db, 'auctions', item.id, 'bids');
          const mockBidders = [
            { id: 'demo-user-2', name: 'Nini Abramishvili', email: 'nini.a@example.com' },
            { id: 'demo-user-3', name: 'Giorgi Lomidze', email: 'giorgi.l@example.com' },
            { id: 'demo-user-1', name: 'Sandro Kavtaradze', email: 'sandro.k@example.com' }
          ];

          for (let i = 0; i < item.bidCount; i++) {
            const bidder = mockBidders[i % mockBidders.length];
            const bidAmount = item.startingBid + (i + 1) * Math.round(item.startingBid * 0.05);
            const bidTime = new Date(now.getTime() - (item.bidCount - i) * 30 * 60 * 1000);

            await setDoc(doc(bidsCol, `bid-${i}`), {
              id: `bid-${i}`,
              bidderId: bidder.id,
              bidderName: bidder.name,
              bidderEmail: bidder.email,
              amount: bidAmount,
              timestamp: Timestamp.fromDate(bidTime),
              isBuyNow: false
            });
          }
        }
      }
      console.log('Successfully seeded database!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
