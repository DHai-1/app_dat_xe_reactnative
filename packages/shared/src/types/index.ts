export type CustomerProfile = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  default_payment_method: PaymentMethod | null;
  avatar_url: string | null;
};

export type PaymentMethod = 'CASH' | 'WALLET' | 'VNPAY' | 'MOMO';

export type CustomerProfileUpdate = {
  full_name: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  default_payment_method: PaymentMethod | null;
};

export type RideStatus =
  | 'PENDING'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'VEHICLE_HANDOVER'
  | 'IN_PROGRESS'
  | 'ARRIVED_DESTINATION'
  | 'VEHICLE_RETURNED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_DRIVER_FOUND'
  | 'EXPIRED';

export type RideActorRole = 'CUSTOMER' | 'DRIVER' | 'SYSTEM';
export type RideStatusResponse = {
  rideId: number;
  previousStatus: RideStatus;
  currentStatus: RideStatus;
  changedAt: string;
};

export type CustomerRideDetail = {
  pickupNote?: string | null;
  route?: SavedRideRoute | null;
  id: number;
  customerId: number;
  driverId: number | null;
  vehicleId: number;
  type: 'INSTANT' | 'SCHEDULED';
  scheduledAt: string | null;
  pickupAddress: string | null;
  pickup: { lat: number | null; lng: number | null };
  dropoffAddress: string | null;
  dropoff: { lat: number | null; lng: number | null };
  distanceKm: number | null;
  estimatedFare: number;
  finalFare: number | null;
  status: RideStatus;
  cancelReason: string | null;
  cancelledBy: number | null;
  statusHistory: Array<{
    id: number;
    fromStatus: RideStatus | null;
    toStatus: RideStatus;
    actorId: number | null;
    note: string | null;
    createdAt: string;
    actorRole: RideActorRole | null;
  }>;
  handoverReports: Array<{
    id: number;
    phase: 'PICKUP' | 'DROPOFF';
    odometer: number;
    fuelLevel: number | null;
    notes: string | null;
    confirmedByCustomer: boolean;
    photos: Array<{
      id: number;
      angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'DASHBOARD';
      fileUrl: string;
      createdAt: string;
    }>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledByRole: RideActorRole | null;
  discountAmount: number | null;
  unreadChatCount: number;
};

export type CustomerRidePage = {
  content: CustomerRideSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type CustomerRideSummary = {
  id: number;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  type: 'INSTANT' | 'SCHEDULED';
  status: RideStatus;
  estimatedFare: number;
  finalFare: number | null;
  scheduledAt: string | null;
  createdAt: string;
};

export type RideCoordinates = { lat: number; lng: number };
export type SavedRideRoute = { id: string; polyline: string; polylinePrecision: number; coordinates: RideCoordinates[]; distanceMeters: number; durationSeconds: number; provider: string; vehicleType: 'CAR' | 'MOTORCYCLE'; limitation?: string | null; expiresAt?: string | null };
export type NearbyDriverMarker = { location: RideCoordinates };
export type RideEstimateRequest = {
  routeQuoteId?: string | null;
  vehicleId: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  scheduledAt?: string | null;
  voucher_code?: string | null;
};
export type RideEstimate = {
  route?: SavedRideRoute | null;
  pricingRuleId: number;
  distanceKm: number;
  estimatedDurationMinutes: number;
  baseFare: number;
  distanceFare: number;
  waitingFare: number;
  nightSurcharge: number;
  returnFee: number;
  estimatedFare: number;
  discountAmount: number;
  payableFare: number;
};
export type CreateCustomerRideRequest = RideEstimateRequest & {
  pickupNote?: string | null;
  type: 'INSTANT' | 'SCHEDULED';
  paymentMethod: PaymentMethod;
  note?: string | null;
};
export type CreateCustomerRideResponse = {
  route?: SavedRideRoute | null;
  id: number;
  status: RideStatus;
  estimatedFare: number;
  discountAmount: number;
  payableFare: number;
  createdAt: string;
};
export type CustomerNotification = {
  id: number;
  messageId: string;
  type: string;
  payload: unknown;
  createdAt: string;
  readAt: string | null;
};

export type CustomerVehicleCreate = {
  plate_number: string;
  transmission_type: 'MANUAL' | 'AUTO';
  vehicle_type: 'CAR' | 'MOTORCYCLE';
  engine_cc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
};

export type CustomerVehicle = {
  id: number;
  plate_number: string | null;
  transmission_type: string | null;
  vehicle_type: string | null;
  engine_cc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  images: Array<{ id: number; secure_url: string }>;
};

export type CustomerVoucher = {
  id: number;
  code: string;
  discountType: string;
  value: number;
  maxDiscount: number | null;
  minimumOrderAmount: number;
  usageCount: number;
  usageLimit: number | null;
  validFrom: string;
  validTo: string;
};

export type CustomerChatMessage = {
  id: number;
  clientMessageId: string | null;
  senderRole: 'CUSTOMER' | 'DRIVER';
  messageType: 'TEXT' | 'IMAGE';
  content: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  readAt: string | null;
};

export type CustomerChatPage = {
  rideId: number;
  messages: CustomerChatMessage[];
  hasMore: boolean;
};

export type CustomerChatSendRequest = {
  clientMessageId: string;
  messageType?: 'TEXT' | 'IMAGE';
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentPublicId?: string | null;
};

export type CustomerChatPageOptions = {
  beforeId?: number;
  afterId?: number;
  size?: number;
};


export type CustomerImageFile = { uri: string; fileName?: string | null; mimeType?: string | null };
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';
export type Ride = CustomerRideDetail;
