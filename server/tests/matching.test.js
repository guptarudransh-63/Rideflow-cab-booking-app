import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, DriverProfile, Vehicle, Ride, RideOffer } from '../src/models/index.js';
import { MatchingService } from '../src/services/matching.service.js';

let passenger, driver1, driver2, unapprovedDriver;
let vehicle1, vehicle2, vehicleUnapproved;
let profile1, profile2, profileUnapproved;

beforeAll(async () => {
  await connectDB();

  const pw = await User.hashPassword('testpass123');

  passenger = await User.create({
    name: 'Test Passenger M',
    email: `pass_m_${Date.now()}@test.com`,
    phone: '+15559990001',
    passwordHash: pw,
    role: 'passenger',
  });

  // Driver 1
  driver1 = await User.create({
    name: 'Driver One',
    email: `driver1_${Date.now()}@test.com`,
    phone: '+15559990002',
    passwordHash: pw,
    role: 'driver',
  });
  vehicle1 = await Vehicle.create({
    driver: driver1._id,
    make: 'Toyota',
    model: 'Prius',
    year: 2022,
    color: 'White',
    licensePlate: `LP1_${Date.now()}`,
    category: 'economy',
    capacity: 4,
  });
  profile1 = await DriverProfile.create({
    user: driver1._id,
    licenseNumber: `LIC1_${Date.now()}`,
    licenseExpiry: new Date(Date.now() + 100000000),
    verificationStatus: 'approved',
    vehicle: vehicle1._id,
    isOnline: true,
    isAvailable: true,
  });

  // Driver 2
  driver2 = await User.create({
    name: 'Driver Two',
    email: `driver2_${Date.now()}@test.com`,
    phone: '+15559990003',
    passwordHash: pw,
    role: 'driver',
  });
  vehicle2 = await Vehicle.create({
    driver: driver2._id,
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    color: 'Black',
    licensePlate: `LP2_${Date.now()}`,
    category: 'economy',
    capacity: 4,
  });
  profile2 = await DriverProfile.create({
    user: driver2._id,
    licenseNumber: `LIC2_${Date.now()}`,
    licenseExpiry: new Date(Date.now() + 100000000),
    verificationStatus: 'approved',
    vehicle: vehicle2._id,
    isOnline: true,
    isAvailable: true,
  });

  // Unapproved Driver
  unapprovedDriver = await User.create({
    name: 'Driver Pending',
    email: `driver_pend_${Date.now()}@test.com`,
    phone: '+15559990004',
    passwordHash: pw,
    role: 'driver',
  });
  vehicleUnapproved = await Vehicle.create({
    driver: unapprovedDriver._id,
    make: 'Ford',
    model: 'Focus',
    year: 2021,
    color: 'Blue',
    licensePlate: `LP3_${Date.now()}`,
    category: 'economy',
    capacity: 4,
  });
  profileUnapproved = await DriverProfile.create({
    user: unapprovedDriver._id,
    licenseNumber: `LIC3_${Date.now()}`,
    licenseExpiry: new Date(Date.now() + 100000000),
    verificationStatus: 'pending',
    vehicle: vehicleUnapproved._id,
    isOnline: false,
    isAvailable: false,
  });
});

afterAll(async () => {
  await disconnectDB();
});

describe('Ride Matching & Atomic Offer Dispatch Engine Tests', () => {
  it('should prevent two drivers from accepting the same ride concurrently', async () => {
    // Create a ride
    const ride = await Ride.create({
      passenger: passenger._id,
      category: 'economy',
      status: 'offered',
      pickup: { address: 'Market St', coordinates: [-122.404, 37.789] },
      destination: { address: 'Mission St', coordinates: [-122.418, 37.763] },
      route: { distanceKm: 3.5, durationMin: 10, polyline: [] },
      fareEstimate: { base: 3.5, distance: 4.9, duration: 3.5, total: 11.9 },
      pin: '1234',
    });

    // Create 2 offers for the same ride
    const offer1 = await RideOffer.create({
      ride: ride._id,
      driver: driver1._id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30000),
    });

    const offer2 = await RideOffer.create({
      ride: ride._id,
      driver: driver2._id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30000),
    });

    // Simulate concurrent accept attempts
    const results = await Promise.allSettled([
      MatchingService.acceptOffer(offer1._id, driver1._id),
      MatchingService.acceptOffer(offer2._id, driver2._id),
    ]);

    // Exactly one should succeed and one must fail
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify ride status
    const updatedRide = await Ride.findById(ride._id);
    expect(updatedRide.status).toBe('driver_assigned');
    expect(updatedRide.driver).not.toBeNull();

    // Verify competing offer was marked expired
    const otherOffer = await RideOffer.findById(
      succeeded[0].value.driver._id.toString() === driver1._id.toString()
        ? offer2._id
        : offer1._id
    );
    expect(otherOffer.status).toBe('expired');
  });

  it('should prevent an unapproved driver from accepting a ride offer', async () => {
    const ride = await Ride.create({
      passenger: passenger._id,
      category: 'economy',
      status: 'offered',
      pickup: { address: 'Market St', coordinates: [-122.404, 37.789] },
      destination: { address: 'Mission St', coordinates: [-122.418, 37.763] },
      route: { distanceKm: 2.0, durationMin: 6, polyline: [] },
      fareEstimate: { base: 3.5, distance: 2.8, duration: 2.1, total: 8.4 },
      pin: '5678',
    });

    const offer = await RideOffer.create({
      ride: ride._id,
      driver: unapprovedDriver._id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30000),
    });

    await expect(
      MatchingService.acceptOffer(offer._id, unapprovedDriver._id)
    ).rejects.toThrow(/not currently available/i);
  });
});
