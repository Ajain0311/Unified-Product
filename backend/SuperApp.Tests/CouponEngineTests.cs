using SuperApp.API.Services;
using Xunit;

namespace SuperApp.Tests;

public class CouponEngineTests
{
    [Theory]
    [InlineData("FOOD", "FOOD")]
    [InlineData("food", "FOOD")]
    [InlineData("BAZAAR", "MARKETPLACE")]
    [InlineData("MARKETPLACE", "MARKETPLACE")]
    [InlineData("marketplace", "MARKETPLACE")]
    [InlineData(null, "FOOD")]
    public void NormalizeModule_ReturnsCorrectStandardModuleName(string? input, string expected)
    {
        var result = CouponEngine.NormalizeModule(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void AllocateDiscountProportionally_SplitsDiscountCorrectlyAcrossBaskets()
    {
        var baskets = new List<(long RestaurantId, decimal SubTotal)>
        {
            (101, 100m),
            (102, 300m)
        };

        // Total 400m, discount is 100m. 101 gets 25%, 102 gets 75%
        var allocations = CouponEngine.AllocateDiscountProportionally(100m, baskets);

        Assert.Equal(25m, allocations[101]);
        Assert.Equal(75m, allocations[102]);
        Assert.Equal(100m, allocations[101] + allocations[102]);
    }

    [Fact]
    public void AllocateDiscountProportionally_ZeroDiscount_ReturnsZeroAllocations()
    {
        var baskets = new List<(long RestaurantId, decimal SubTotal)>
        {
            (101, 150m),
            (102, 250m)
        };

        var allocations = CouponEngine.AllocateDiscountProportionally(0m, baskets);

        Assert.Equal(0m, allocations[101]);
        Assert.Equal(0m, allocations[102]);
    }
}
