import { Hotel, HotelRoom, HotelBooking, HotelCancellationPolicy } from '../models/hotel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_HOTELS = 'app_hotel_listings';
const STORAGE_KEY_ROOMS = 'app_hotel_rooms';
const STORAGE_KEY_BOOKINGS = 'app_hotel_bookings';

export const DEFAULT_HOTELS: Hotel[] = [
  {
    id: 'hotel-003',
    ownerId: 'owner-sanwaliya-01',
    name: 'Shree Sanwaliya Seth Atithi Bhavan & Resort',
    tagline: 'Divine Stay Near Shree Sanwaliya Seth Mandir',
    description: 'Located just 350 meters from Shree Sanwaliya Seth Mandir in Mandphiya. Features luxurious air-conditioned suites, pure vegetarian Mewari bhojanalaya, 24-hour hot water, and priority temple darshan assistance.',
    starRating: 4,
    userRating: 4.9,
    totalReviews: 540,
    city: 'Mandphiya',
    address: 'Temple Marg, Near Shree Sanwaliya Seth Mandir, Mandphiya, Bhadesar, Rajasthan 312027',
    latitude: 24.6612,
    longitude: 74.3985,
    featuredPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
    ],
    amenities: ['Near Temple (350m)', 'Free High-Speed WiFi', 'Pure Veg Restaurant', 'AC Deluxe Rooms', '24/7 Hot Water', 'Free Parking'],
    startingPricePerNight: 1499,
    cancellationPolicy: {
      type: 'FLEXIBLE',
      title: 'Free Cancellation up to 24 Hours',
      description: 'Cancel up to 24 hours before check-in for a 100% full refund.',
      freeCancellationHoursBeforeCheckIn: 24,
      refundPercentageWithin24Hours: 50,
      nonRefundable: false,
    },
    payAtHotelPolicy: {
      allowPayAtHotel: true,
      holdCutoffHour: 18,
      requireTokenDeposit: false,
      tokenDepositAmount: 0,
      autoCancelUnconfirmedAtCutoff: true,
    },
    isVerified: true,
    isActive: true,
    contactPhone: '+91 94141 23456',
    contactEmail: 'darshan@sanwariyasethresort.com',
  },
  {
    id: 'hotel-004',
    ownerId: 'owner-mewar-02',
    name: 'Mewar Royal Heritage Retreat & Gardens',
    tagline: 'Authentic Mewari Palace Experience in Bhadesar Tehsil',
    description: 'Immerse yourself in authentic Rajasthani heritage surrounded by serene lush gardens, traditional courtyard architecture, Mewari thali, and folk music evenings. Only 4 km from Mandphiya.',
    starRating: 4,
    userRating: 4.8,
    totalReviews: 290,
    city: 'Mandphiya',
    address: 'Bhadso-Mandphiya Link Road, Mandphiya, Chittorgarh, Rajasthan 312027',
    latitude: 24.6650,
    longitude: 74.4080,
    featuredPhoto: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop',
    ],
    amenities: ['Lush Garden Courtyard', 'Rajasthani Dining', 'Free WiFi', 'Spacious AC Suites', 'Family Friendly', 'Travel Desk'],
    startingPricePerNight: 2199,
    cancellationPolicy: {
      type: 'FLEXIBLE',
      title: 'Free Cancellation up to 24 Hours',
      description: 'Cancel up to 24 hours before check-in for a full refund.',
      freeCancellationHoursBeforeCheckIn: 24,
      refundPercentageWithin24Hours: 50,
      nonRefundable: false,
    },
    payAtHotelPolicy: {
      allowPayAtHotel: true,
      holdCutoffHour: 18,
      requireTokenDeposit: true,
      tokenDepositAmount: 300,
      autoCancelUnconfirmedAtCutoff: true,
    },
    isVerified: true,
    isActive: true,
    contactPhone: '+91 98291 76543',
    contactEmail: 'info@mewarroyalretreat.com',
  },
  {
    id: 'hotel-002',
    ownerId: 'owner-padmini-02',
    name: 'Padmini Haveli & Heritage Suites',
    tagline: 'Regal Rajput Hospitality Overlooking Chittorgarh Fort',
    description: 'Located at the foothills of historic Chittorgarh Fort, offering royal heritage suites, rooftop view of Vijay Stambh, organic Mewari dining, and customized fort excursions.',
    starRating: 4,
    userRating: 4.7,
    totalReviews: 285,
    city: 'Chittorgarh',
    address: 'Near Fort Road, Senthi, Chittorgarh, Rajasthan',
    latitude: 24.8910,
    longitude: 74.6320,
    featuredPhoto: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop',
    ],
    amenities: ['Fort View', '24/7 Fort Shuttle', 'High-Speed WiFi', 'Rooftop Restaurant', 'Free Parking'],
    startingPricePerNight: 3499,
    cancellationPolicy: {
      type: 'MODERATE',
      title: 'Free Cancellation up to 48 Hours',
      description: 'Full refund 48 hours prior to check-in. Non-refundable thereafter.',
      freeCancellationHoursBeforeCheckIn: 48,
      refundPercentageWithin24Hours: 0,
      nonRefundable: false,
    },
    payAtHotelPolicy: {
      allowPayAtHotel: true,
      holdCutoffHour: 18,
      requireTokenDeposit: false,
      tokenDepositAmount: 0,
      autoCancelUnconfirmedAtCutoff: true,
    },
    isVerified: true,
    isActive: true,
    contactPhone: '+91 1472 241234',
    contactEmail: 'info@padminihaveli.com',
  },
];

export const DEFAULT_ROOMS: HotelRoom[] = [
  {
    id: 'room-001-a',
    hotelId: 'hotel-001',
    name: 'Royal Heritage Deluxe Room',
    description: 'Spacious 450 sq.ft room with king-size bed, marble bathroom, bathtub, and city skyline view.',
    bedType: '1 King Bed',
    maxGuests: 3,
    roomSizeSqFt: 450,
    basePricePerNight: 4999,
    taxPercentage: 18,
    photos: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop'],
    amenities: ['King Bed', 'City View', 'Bathtub', 'Balcony', 'Mini Bar', 'Breakfast Included'],
    totalInventory: 10,
    availableInventory: 8,
    isAvailable: true,
  },
  {
    id: 'room-001-b',
    hotelId: 'hotel-001',
    name: 'Presidential Royal Suite',
    description: 'Opulent 900 sq.ft suite featuring private living salon, butler service, jacuzzi, and private balcony.',
    bedType: '1 Super King Bed + 1 Sofa Bed',
    maxGuests: 4,
    roomSizeSqFt: 900,
    basePricePerNight: 9999,
    taxPercentage: 18,
    photos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop'],
    amenities: ['Jacuzzi', 'Butler Service', 'Private Terrace', 'Complimentary Champagne', 'VIP Lounge Access'],
    totalInventory: 4,
    availableInventory: 3,
    isAvailable: true,
  },
  {
    id: 'room-003-a',
    hotelId: 'hotel-003',
    name: 'Sanwaliya Darshan AC Deluxe Room',
    description: 'Comfortable air-conditioned room with double bed, attached modern bath, and 24/7 hot water. Perfect for pilgrims visiting Mandphiya Seth Mandir.',
    bedType: '1 Queen Bed',
    maxGuests: 3,
    roomSizeSqFt: 300,
    basePricePerNight: 1499,
    taxPercentage: 12,
    photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop'],
    amenities: ['AC', 'Free WiFi', 'Geyser / 24h Hot Water', 'Daily Housekeeping', 'Temple Assistance'],
    totalInventory: 20,
    availableInventory: 15,
    isAvailable: true,
  },
  {
    id: 'room-003-b',
    hotelId: 'hotel-003',
    name: 'Family Heritage Quad Suite',
    description: 'Spacious family room with two double beds, living seating, refrigerator, and temple road view.',
    bedType: '2 Double Beds',
    maxGuests: 5,
    roomSizeSqFt: 550,
    basePricePerNight: 2499,
    taxPercentage: 12,
    photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop'],
    amenities: ['Family Seating', '2 Double Beds', 'Free WiFi', 'Pure Veg Room Service', 'AC'],
    totalInventory: 8,
    availableInventory: 6,
    isAvailable: true,
  },
  {
    id: 'room-004-a',
    hotelId: 'hotel-004',
    name: 'Mewar Garden Courtyard Suite',
    description: 'Traditional heritage room with handcrafted wooden furniture, garden view patio, and complimentary Rajasthani breakfast.',
    bedType: '1 King Bed',
    maxGuests: 3,
    roomSizeSqFt: 420,
    basePricePerNight: 2199,
    taxPercentage: 12,
    photos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop'],
    amenities: ['Garden View', 'Free Breakfast', 'AC', 'Mini Fridge', 'Tea/Coffee Maker'],
    totalInventory: 12,
    availableInventory: 10,
    isAvailable: true,
  },
  {
    id: 'room-002-a',
    hotelId: 'hotel-002',
    name: 'Executive Business Suite',
    description: 'Designed for the corporate traveler with dedicated workstation, ergonomic chair, and plush queen bed.',
    bedType: '1 Queen Bed',
    maxGuests: 2,
    roomSizeSqFt: 350,
    basePricePerNight: 3499,
    taxPercentage: 12,
    photos: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop'],
    amenities: ['Ergonomic Workstation', 'High-Speed WiFi', 'Nespresso Coffee Maker'],
    totalInventory: 15,
    availableInventory: 12,
    isAvailable: true,
  },
];

class HotelService {
  async getHotels(cityFilter?: string): Promise<Hotel[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HOTELS);
    let hotels: Hotel[] = raw ? JSON.parse(raw) : DEFAULT_HOTELS;
    if (cityFilter && cityFilter.trim().length > 0) {
      const q = cityFilter.toLowerCase();
      hotels = hotels.filter(h => h.city.toLowerCase().includes(q) || h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
    }
    return hotels;
  }

  async getHotelById(hotelId: string): Promise<Hotel | null> {
    const hotels = await this.getHotels();
    return hotels.find(h => h.id === hotelId) || null;
  }

  async getRoomsForHotel(hotelId: string): Promise<HotelRoom[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ROOMS);
    const rooms: HotelRoom[] = raw ? JSON.parse(raw) : DEFAULT_ROOMS;
    return rooms.filter(r => r.hotelId === hotelId);
  }

  async getRoomsByHotel(hotelId: string): Promise<HotelRoom[]> {
    return this.getRoomsForHotel(hotelId);
  }

  async registerHotel(newHotel: Omit<Hotel, 'id' | 'isVerified' | 'isActive'>): Promise<Hotel> {
    const hotels = await this.getHotels();
    const created: Hotel = {
      ...newHotel,
      id: `hotel-${Date.now()}`,
      isVerified: true,
      isActive: true,
    };
    hotels.unshift(created);
    await AsyncStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(hotels));
    return created;
  }

  async addRoomToHotel(newRoom: Omit<HotelRoom, 'id'>): Promise<HotelRoom> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ROOMS);
    const rooms: HotelRoom[] = raw ? JSON.parse(raw) : DEFAULT_ROOMS;
    const room: HotelRoom = {
      ...newRoom,
      id: `room-${Date.now()}`,
    };
    rooms.push(room);
    await AsyncStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    return room;
  }

  async updateHotelCancellationPolicy(hotelId: string, policy: HotelCancellationPolicy): Promise<Hotel | null> {
    const hotels = await this.getHotels();
    const idx = hotels.findIndex(h => h.id === hotelId);
    if (idx >= 0) {
      hotels[idx].cancellationPolicy = policy;
      await AsyncStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(hotels));
      return hotels[idx];
    }
    return null;
  }

  async getBookings(userId?: string): Promise<HotelBooking[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BOOKINGS);
    let bookings: HotelBooking[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      bookings = bookings.filter(b => b.userId === userId);
    }
    return bookings;
  }

  async getMyBookings(userId?: string): Promise<HotelBooking[]> {
    return this.getBookings(userId);
  }

  async createBooking(bookingData: Omit<HotelBooking, 'id' | 'bookingCode' | 'createdAt' | 'updatedAt'>): Promise<HotelBooking> {
    const bookings = await this.getBookings();
    const bookingCode = `HTL-${Math.floor(100000 + Math.random() * 900000)}`;
    const created: HotelBooking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      bookingCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    bookings.unshift(created);
    await AsyncStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    return created;
  }

  calculateRefund(booking: HotelBooking): { refundAmount: number; refundPercentage: number; message: string } {
    const policy = booking.cancellationPolicyApplied;
    if (policy.nonRefundable) {
      return { refundAmount: 0, refundPercentage: 0, message: 'This reservation is Non-Refundable according to hotel policy.' };
    }

    const checkInDateTime = new Date(`${booking.checkInDate}T12:00:00Z`).getTime();
    const nowMs = Date.now();
    const hoursRemaining = (checkInDateTime - nowMs) / (1000 * 60 * 60);

    if (hoursRemaining >= policy.freeCancellationHoursBeforeCheckIn) {
      return {
        refundAmount: booking.totalAmount,
        refundPercentage: 100,
        message: `Eligible for 100% Full Refund (Cancelled > ${policy.freeCancellationHoursBeforeCheckIn} hours before check-in).`,
      };
    } else {
      const pct = policy.refundPercentageWithin24Hours;
      const refund = Math.round((booking.totalAmount * pct) / 100);
      return {
        refundAmount: refund,
        refundPercentage: pct,
        message: pct > 0
          ? `Eligible for ${pct}% Partial Refund per hotel policy (${refund} Rs).`
          : 'Non-refundable: Cancellation is within the restricted check-in window.',
      };
    }
  }

  async cancelBooking(bookingId: string, reason: string): Promise<HotelBooking | null> {
    const bookings = await this.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx >= 0) {
      const booking = bookings[idx];
      const { refundAmount } = this.calculateRefund(booking);
      booking.status = 'CANCELLED';
      booking.cancellationReason = reason;
      booking.refundAmount = refundAmount;
      booking.paymentStatus = refundAmount > 0 ? 'REFUNDED' : booking.paymentStatus;
      booking.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
      return booking;
    }
    return null;
  }
}

export const hotelService = new HotelService();
