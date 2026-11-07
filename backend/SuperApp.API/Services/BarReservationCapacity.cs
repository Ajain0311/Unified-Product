namespace SuperApp.API.Services;

public static class BarReservationCapacity
{
    public static bool CanFit(int capacity, int occupied, int requestedPartySize) =>
        capacity > 0 && occupied >= 0 && requestedPartySize > 0 && requestedPartySize <= capacity - occupied;
}
