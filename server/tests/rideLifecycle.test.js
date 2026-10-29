import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, DriverProfile, Vehicle, Ride } from '../src/models/index.js';
import { RideService } from '../src/services/ride.service.js';

let passenger, driver, vehicle, profile;

beforeAll(async () => {
  await connectDB();

  const pw = await User.hashPassword('testpass123');
  passenger = await User.create({
    name: 'Passenger Life',
    email: `pass_life_${Date.now()}@test.com`,
    phone: '+15558880001',
    passwordHash: pw,
    role: 'passenger',
  });

  driver = await User.create({
    name: 'Driver Life',
    email: `driver_life_${Date.now()}@test.com`,
    phone: '+15558880002',
    passwordHash: pw,
    role: 'driver',
  });

  vehicle = await Vehicle.create({
    driver: driver._id,
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    color: 'Red',
    licensePlate: `LIFE_${Date.now()}`,
    category: 'comfort',
    capacity: 4,
  });

  profile = await DriverProfile.create({
    user: driver._id,
    licenseNumber: `LIC_L_${Date.now()}`,
    licenseExpiry: new Date(Date.now() + 100000000),
    verificationStatus: 'approved',
    vehicle: vehicle._id,
    isOnline: true,
    isAvailable: true,
  });
});

afterAll(async () => {
  await disconnectDB();
});

describe('Ride Lifecycle State Transitions & PIN Validation Tests', () => {
  it('should create a ride with valid 4-digit PIN and route estimates', async () => {
    const ride = await RideService.createRide({
      passengerId: passenger._id,
      pickup: { address: 'Union Square', coordinates: [-122.407, 37.788] },
      destination: { address: 'SFO Airport', coordinates: [-122.378, 37.621] },
      category: 'comfort',
    });

    expect(ride.status).toBe('requested');
    expect(ride.pin).toMatch(/^\d{4}$/);
    expect(ride.fareEstimate.total).toBeGreaterThan(15);
  });

  it('should strictly validate the 4-digit pickup PIN to start a ride', async () => {
    // Manually assign driver
    const ride = await Ride.create({
      passenger: passenger._id,
      driver: driver._id,
      vehicle: vehicle._id,
      category: 'comfort',
      status: 'driver_assigned',
      pickup: { address: 'A', coordinates: [-122.4, 37.7] },
      destination: { address: 'B', coordinates: [-122.41, 37.71] },
      route: { distanceKm: 2, durationMin: 5, polyline: [] },
      fareEstimate: { base: 5, distance: 3.7, duration: 2.25, total: 12 },
      pin: '4829',
    });

    // Mark arrived
    await RideService.driverArrived(ride._id, driver._id);
    const arrivedRide = await Ride.findById(ride._id);
    expect(arrivedRide.status).toBe('arrived');

    // Attempt start with wrong PIN
    await expect(
      RideService.startRide(ride._id, driver._id, '9999')
    ).rejects.toThrow(/invalid pickup pin/i);

    // Start with correct PIN
    const startedRide = await RideService.startRide(ride._id, driver._id, '4829');
    expect(startedRide.status).toBe('in_progress');
    expect(startedRide.startedAt).toBeDefined();

    // Complete ride
    const completedRide = await RideService.completeRide(ride._id, driver._id, 2.5, 6);
    expect(completedRide.status).toBe('completed');
    expect(completedRide.finalFare.total).toBeGreaterThan(0);
    expect(completedRide.finalFare.driverNet).toBeGreaterThan(0);

    // Completed rides cannot be cancelled
    await expect(
      RideService.cancelRide({
        rideId: ride._id,
        userId: passenger._id,
        userRole: 'passenger',
        reason: 'Change of mind',
      })
    ).rejects.toThrow(/completed rides cannot be cancelled/i);
  });
});
