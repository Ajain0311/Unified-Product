FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files
COPY ["backend/SuperApp.API/SuperApp.API.csproj", "backend/SuperApp.API/"]
RUN dotnet restore "backend/SuperApp.API/SuperApp.API.csproj"

# Copy full source and publish
COPY backend/SuperApp.API/ backend/SuperApp.API/
WORKDIR "/src/backend/SuperApp.API"
RUN dotnet publish "SuperApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SuperApp.API.dll"]
