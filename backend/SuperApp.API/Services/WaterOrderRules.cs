namespace SuperApp.API.Services;

public static class WaterOrderRules
{
    public static bool CanOrderCases(int minimumCases, int availableCases, int requestedCases) =>
        minimumCases > 0 && availableCases >= 0 && requestedCases >= minimumCases && requestedCases <= availableCases;
}
