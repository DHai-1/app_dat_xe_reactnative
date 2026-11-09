type OfferTiming = { expiresAt: number; serverTime: number; clientExpiresAt: number };

/** Device clock offset cancels out: count down the window returned by the server. */
export function offerRemainingMs(offer: OfferTiming, receivedAt: number, now: number): number {
  const window = Math.min(offer.expiresAt, offer.clientExpiresAt) - offer.serverTime;
  if (!Number.isFinite(window) || !Number.isFinite(receivedAt) || !Number.isFinite(now)) return 0;
  return Math.max(0, window - Math.max(0, now - receivedAt));
}
