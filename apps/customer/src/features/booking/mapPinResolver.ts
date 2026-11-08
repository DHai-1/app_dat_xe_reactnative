import type { RideCoordinates } from '@datxe/shared';
import type { BookingPlace } from './types';

export const PIN_IDLE_DELAY_MS = 800;
export const PIN_DISTANCE_THRESHOLD_METERS = 15;
const MAX_CACHE_ENTRIES = 200;

export type PinSelection = {
  phase: 'waiting' | 'moving' | 'debouncing' | 'resolving' | 'ready' | 'error';
  point: RideCoordinates | null;
  place: BookingPlace | null;
  error: string;
};

export function pinCacheKey(point: RideCoordinates) {
  return `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
}

export function pinDistanceMeters(a: RideCoordinates, b: RideCoordinates) {
  const radians = Math.PI / 180;
  const haversine = Math.sin((b.lat - a.lat) * radians / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians)
    * Math.sin((b.lng - a.lng) * radians / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - Math.min(1, haversine)));
}

export class MapPinResolver {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private request: AbortController | undefined;
  private generation = 0;
  private idlePoint: RideCoordinates | undefined;
  private lastResolved: { point: RideCoordinates; place: BookingPlace } | undefined;

  constructor(
    private lookup: (point: RideCoordinates, signal: AbortSignal) => Promise<BookingPlace>,
    private cache: Map<string, BookingPlace>,
    private publish: (selection: PinSelection) => void,
  ) {}

  cancel() {
    this.idlePoint = undefined;
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.request?.abort();
    this.request = undefined;
  }

  moving() {
    this.cancel();
    this.publish({ phase: 'moving', point: null, place: null, error: '' });
  }

  idle(point: RideCoordinates) {
    // Repeated camera-idle notifications must not restart a debounce or a completed lookup.
    if (this.idlePoint?.lat === point.lat && this.idlePoint.lng === point.lng) return;
    this.cancel();
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) {
      this.publish({ phase: 'error', point: null, place: null, error: 'Tọa độ không hợp lệ. Vui lòng chọn lại vị trí.' });
      return;
    }
    this.idlePoint = point;
    this.publish({ phase: 'debouncing', point, place: null, error: '' });
    const generation = this.generation;
    this.timer = setTimeout(() => { void this.resolve(point, generation); }, PIN_IDLE_DELAY_MS);
  }

  private ready(point: RideCoordinates, place: BookingPlace) {
    this.publish({
      phase: 'ready', point,
      place: { ...place, id: `pin:${point.lng},${point.lat}`, coordinate: point },
      error: '',
    });
  }

  private async resolve(point: RideCoordinates, generation: number) {
    if (generation !== this.generation) return;
    // Keep the last successfully resolved anchor, so many tiny drags cannot bypass the threshold.
    if (this.lastResolved && pinDistanceMeters(this.lastResolved.point, point) < PIN_DISTANCE_THRESHOLD_METERS) {
      this.ready(point, this.lastResolved.place);
      return;
    }
    const key = pinCacheKey(point);
    const cached = this.cache.get(key);
    if (cached) {
      this.lastResolved = { point, place: cached };
      this.ready(point, cached);
      return;
    }

    const controller = new AbortController();
    this.request = controller;
    this.publish({ phase: 'resolving', point, place: null, error: '' });
    try {
      const place = await this.lookup(point, controller.signal);
      if (controller.signal.aborted || generation !== this.generation) return;
      if (!place.address?.trim()) throw new Error('Chưa xác định được địa chỉ. Vui lòng thử lại.');
      if (this.cache.size >= MAX_CACHE_ENTRIES && !this.cache.has(key)) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) this.cache.delete(oldest);
      }
      this.cache.set(key, place);
      this.lastResolved = { point, place };
      this.ready(point, place);
    } catch (error) {
      if (controller.signal.aborted || generation !== this.generation) return;
      this.publish({
        phase: 'error', point, place: null,
        error: error instanceof Error ? error.message : 'Chưa xác định được địa chỉ. Vui lòng thử lại.',
      });
    } finally {
      if (this.request === controller) this.request = undefined;
    }
  }
}
