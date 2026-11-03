import type { NearbyDriverMarker,RideCoordinates } from '@datxe/shared';
import type { ComponentType } from 'react';
export declare const HomeMap: ComponentType<{
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  /** Bản đồ phủ toàn màn hình, ẩn tiêu đề và chú thích. */
  fullscreen?: boolean;
  /** Tăng giá trị để camera quay lại vị trí người dùng. */
  recenterToken?: number;
}>;
