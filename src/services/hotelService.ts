import { Hotel, HotelRoom, HotelBooking, HotelCancellationPolicy } from '../models/hotel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_HOTELS = 'app_hotel_listings';
const STORAGE_KEY_ROOMS = 'app_hotel_rooms';
const STORAGE_KEY_BOOKINGS = 'app_hotel_bookings';

export const DEFAULT_HOTELS: Hotel[] = [
  {
    id: 'hotel-001',
    ownerId: 'owner-taj-01',
    name: 'The Grand Heritage Palace & Spa',
    tagline: '5-Star Luxury Living in the Heart of the City',
    description: 'Experience royal hospitality with state-of-the-art suites, Olympic-size swimming pool, fine-dining restaurants, and complimentary gourmet breakfast.',
    starRating: 5,
    userRating: 4.8,
    totalReviews: 420,
    city: 'Jaipur',
    address: 'Bhawani Singh Road, Near Civil Lines, Jaipur',
    latitude: 26.9124,
    longitude: 75.7873,
    featuredPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop',
    ],
    amenities: ['Free High-Speed WiFi', 'Swimming Pool', 'Luxury Spa', 'Fine Dining Bar', '24/7 Room Service', 'Free Valet Parking'],
    startingPricePerNight: 4999,
    cancellationPolicy: {
      type: 'FLEXIBLE',
      title: 'Free Cancellation up to 24 Hours',
      description: 'Cancel up to 24 hours before check-in for a 100% full refund. 50% refund if cancelled within 24 hours of check-in.',
      freeCancellationHoursBeforeCheckIn: 24,
      refundPercentageWithin24Hours: 50,
      nonRefundable: false,
    },
    payAtHotelPolicy: {
      allowPayAtHotel: true,
      holdCutoffHour: 18,
      requireTokenDeposit: true,
      tokenDepositAmount: 500,
      autoCancelUnconfirmedAtCutoff: true,
    },
    isVerified: true,
    isActive: true,
    contactPhone: '+91 98290 12345',
    contactEmail: 'reservations@grandheritage.com',
  },
  {
    id: 'hotel-002',
    ownerId: 'owner-marriott-02',
    name: 'Metropolitan Business Hotel & Suites',
    tagline: 'Modern Elegance for Business and Leisure Travelers',
    description: 'Designed for the modern professional with ergonomic work suites, high-speed fiber broadband, rooftop cocktail lounge, and seamless airport shuttle.',
    starRating: 4,
    userRating: 4.6,
    totalReviews: 285,
    city: 'Delhi',
    address: 'Aerocity, International Airport Zone, New Delhi',
    latitude: 28.5562,
    longitude: 77.1000,
    featuredPhoto: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop',
    ],
    amenities: ['24/7 Airport Shuttle', 'High-Speed WiFi', 'Business Center', 'Rooftop Bar', 'Fitness Center'],
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
    contactPhone: '+91 11 4567 8900',
    contactEmail: 'info@metropolitanhotel.com',
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
