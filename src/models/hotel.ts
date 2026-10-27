export type CancellationType = 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM';

export interface HotelCancellationPolicy {
  type: CancellationType;
  title: string;
  description: string;
  freeCancellationHoursBeforeCheckIn: number;
  refundPercentageWithin24Hours: number;
  nonRefundable: boolean;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  bedType: string;
  maxGuests: number;
  roomSizeSqFt: number;
  basePricePerNight: number;
  taxPercentage: number;
  photos: string[];
  amenities: string[];
  totalInventory: number;
  availableInventory: number;
  isAvailable: boolean;
}

export interface PayAtHotelConfig {
  allowPayAtHotel: boolean;
  holdCutoffHour: number;
  requireTokenDeposit: boolean;
  tokenDepositAmount: number;
  autoCancelUnconfirmedAtCutoff: boolean;
}

export interface Hotel {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  description: string;
  starRating: number;
  userRating: number;
  totalReviews: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  featuredPhoto: string;
  photos: string[];
  amenities: string[];
  startingPricePerNight: number;
  cancellationPolicy: HotelCancellationPolicy;
  payAtHotelPolicy: PayAtHotelConfig;
  isVerified: boolean;
  isActive: boolean;
  contactPhone: string;
  contactEmail: string;
}

export type HotelBookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'AUTO_CANCELLED_NO_SHOW'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface HotelBooking {
  id: string;
  bookingCode: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelPhoto: string;
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfRooms: number;
  numberOfGuests: number;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  roomRatePerNight: number;
  subtotalAmount: number;
  taxesAndFees: number;
  totalAmount: number;
  paymentMethod: 'RAZORPAY' | 'PAY_AT_HOTEL' | 'TOKEN_DEPOSIT_PARTIAL';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'TOKEN_PAID_BALANCE_DUE';
  tokenAmountPaid?: number;
  balanceDueAtCheckIn?: number;
  holdCutoffTimeText?: string;
  status: HotelBookingStatus;
  cancellationPolicyApplied: HotelCancellationPolicy;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}
