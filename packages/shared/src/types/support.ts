export type SupportImage = { fileUrl: string; publicId: string };
export type SupportTicket = {
  id: number; code: string; rideId: number | null; category: string; description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; response: string | null;
  images: SupportImage[]; createdAt: string; updatedAt: string;
};
export type SupportDraft = { clientRequestId: string; rideId: number | null; category: string; description: string; images: SupportImage[] };
export type SupportRide = { id: number; pickupAddress: string | null; dropoffAddress: string | null };
