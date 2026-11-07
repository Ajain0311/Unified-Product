import { Hotel, HotelRoom, HotelBooking, HotelCancellationPolicy } from '../models/hotel';

const BOOKING_UNAVAILABLE_MESSAGE =
  'Online hotel reservations are not available yet. Please contact the hotel directly.';

class HotelService {
  async getHotels(_cityFilter?: string): Promise<Hotel[]> {
    return [];
  }

  async getHotelById(_hotelId: string): Promise<Hotel | null> {
    return null;
  }

  async getRoomsForHotel(_hotelId: string): Promise<HotelRoom[]> {
    return [];
  }

  async getRoomsByHotel(hotelId: string): Promise<HotelRoom[]> {
    return this.getRoomsForHotel(hotelId);
  }

  async registerHotel(_newHotel: Omit<Hotel, 'id' | 'isVerified' | 'isActive'>): Promise<Hotel> {
    throw new Error(BOOKING_UNAVAILABLE_MESSAGE);
  }

  async addRoomToHotel(_newRoom: Omit<HotelRoom, 'id'>): Promise<HotelRoom> {
    throw new Error(BOOKING_UNAVAILABLE_MESSAGE);
  }

  async updateHotelCancellationPolicy(
    _hotelId: string,
    _policy: HotelCancellationPolicy,
  ): Promise<Hotel | null> {
    throw new Error(BOOKING_UNAVAILABLE_MESSAGE);
  }

  async getBookings(_userId?: string): Promise<HotelBooking[]> {
    return [];
  }

  async getMyBookings(userId?: string): Promise<HotelBooking[]> {
    return this.getBookings(userId);
  }

  async createBooking(
    _bookingData: Omit<HotelBooking, 'id' | 'bookingCode' | 'createdAt' | 'updatedAt'>,
  ): Promise<HotelBooking> {
    throw new Error(BOOKING_UNAVAILABLE_MESSAGE);
  }

  calculateRefund(_booking: HotelBooking): {
    refundAmount: number;
    refundPercentage: number;
    message: string;
  } {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      message: BOOKING_UNAVAILABLE_MESSAGE,
    };
  }

  async cancelBooking(_bookingId: string, _reason: string): Promise<HotelBooking | null> {
    return null;
  }
}

export const hotelService = new HotelService();
