import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  DriverProfile,
  Vehicle,
  DriverLocation,
  Ride,
  Payment,
  Rating,
  FareConfiguration,
  AuditLog,
} from '../models/index.js';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seeding...');

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    DriverProfile.deleteMany({}),
    Vehicle.deleteMany({}),
    DriverLocation.deleteMany({}),
    Ride.deleteMany({}),
    Payment.deleteMany({}),
    Rating.deleteMany({}),
    FareConfiguration.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing data.');

  // 2. Seed Fare Configurations
  const fareConfigs = await FareConfiguration.create([
    {
      category: 'economy',
      name: 'RideFlow Eco',
      description: 'Affordable, everyday reliable rides',
      capacity: 4,
      baseFare: 3.5,
      perKmRate: 1.4,
      perMinuteRate: 0.35,
      minimumFare: 8.0,
      platformFeePercent: 20,
      surgeMultiplier: 1.0,
      cancellationFee: 5.0,
      isActive: true,
    },
    {
      category: 'comfort',
      name: 'RideFlow Comfort',
      description: 'Newer cars with extra legroom & top-rated drivers',
      capacity: 4,
      baseFare: 5.0,
      perKmRate: 1.85,
      perMinuteRate: 0.45,
      minimumFare: 12.0,
      platformFeePercent: 20,
      surgeMultiplier: 1.0,
      cancellationFee: 7.0,
      isActive: true,
    },
    {
      category: 'premium',
      name: 'RideFlow Black',
      description: 'Premium luxury vehicles with professional chauffeurs',
      capacity: 4,
      baseFare: 9.0,
      perKmRate: 2.8,
      perMinuteRate: 0.7,
      minimumFare: 18.0,
      platformFeePercent: 25,
      surgeMultiplier: 1.0,
      cancellationFee: 10.0,
      isActive: true,
    },
    {
      category: 'xl',
      name: 'RideFlow XL',
      description: 'Spacious SUVs with seating up to 6 passengers',
      capacity: 6,
      baseFare: 7.5,
      perKmRate: 2.3,
      perMinuteRate: 0.55,
      minimumFare: 15.0,
      platformFeePercent: 22,
      surgeMultiplier: 1.0,
      cancellationFee: 8.0,
      isActive: true,
    },
  ]);
  console.log(`[Seed] Created ${fareConfigs.length} fare configurations.`);

  // 3. Create Admin User
  const adminPasswordHash = await User.hashPassword('admin123');
  const adminUser = await User.create({
    name: 'Platform Ops Admin',
    email: 'admin@rideflow.com',
    phone: '+1 (555) 019-9000',
    passwordHash: adminPasswordHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  });

  // 4. Create Demo Passengers
  const passPasswordHash = await User.hashPassword('password123');
  const passengerAlice = await User.create({
    name: 'Alice Walker',
    email: 'passenger@rideflow.com',
    phone: '+1 (555) 012-3456',
    passwordHash: passPasswordHash,
    role: 'passenger',
    ratingAvg: 4.95,
    ratingCount: 28,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  });

  const passengerBob = await User.create({
    name: 'Bob Smith',
    email: 'passenger2@rideflow.com',
    phone: '+1 (555) 014-7890',
    passwordHash: passPasswordHash,
    role: 'passenger',
    ratingAvg: 4.8,
    ratingCount: 14,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  });

  // 5. Create Demo Drivers
  // Driver 1: Carlos (Approved, Online & Available)
  const driverCarlos = await User.create({
    name: 'Carlos Mendoza',
    email: 'driver@rideflow.com',
    phone: '+1 (555) 018-4321',
    passwordHash: passPasswordHash,
    role: 'driver',
    ratingAvg: 4.92,
    ratingCount: 142,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  });

  const vehicleCarlos = await Vehicle.create({
    driver: driverCarlos._id,
    make: 'Toyota',
    model: 'Camry Hybrid',
    year: 2023,
    color: 'Midnight Silver',
    licensePlate: 'RF-8821',
    category: 'economy',
    capacity: 4,
  });

  const profileCarlos = await DriverProfile.create({
    user: driverCarlos._id,
    licenseNumber: 'DL-CA-992144',
    licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    verificationStatus: 'approved',
    vehicle: vehicleCarlos._id,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 1450.5,
    completedTrips: 64,
  });

  // Position Carlos near Downtown San Francisco
  await DriverLocation.create({
    driver: driverCarlos._id,
    location: { type: 'Point', coordinates: [-122.404, 37.789] },
    heading: 45,
    speed: 25,
    isOnline: true,
    isAvailable: true,
    category: 'economy',
  });

  // Driver 2: Elena (Approved, Comfort, Online & Available)
  const driverElena = await User.create({
    name: 'Elena Rostova',
    email: 'driver_comfort@rideflow.com',
    phone: '+1 (555) 016-5678',
    passwordHash: passPasswordHash,
    role: 'driver',
    ratingAvg: 4.98,
    ratingCount: 215,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  });

  const vehicleElena = await Vehicle.create({
    driver: driverElena._id,
    make: 'Honda',
    model: 'Accord Touring',
    year: 2024,
    color: 'Pearl White',
    licensePlate: 'RF-4019',
    category: 'comfort',
    capacity: 4,
  });

  await DriverProfile.create({
    user: driverElena._id,
    licenseNumber: 'DL-CA-771203',
    licenseExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
    verificationStatus: 'approved',
    vehicle: vehicleElena._id,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 2890.0,
    completedTrips: 112,
  });

  await DriverLocation.create({
    driver: driverElena._id,
    location: { type: 'Point', coordinates: [-122.412, 37.785] },
    heading: 120,
    speed: 30,
    isOnline: true,
    isAvailable: true,
    category: 'comfort',
  });

  // Driver 3: David Kim (Pending Verification for Admin Queue)
  const driverDavid = await User.create({
    name: 'David Kim',
    email: 'driver_pending@rideflow.com',
    phone: '+1 (555) 017-9911',
    passwordHash: passPasswordHash,
    role: 'driver',
    ratingAvg: 5.0,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  });

  const vehicleDavid = await Vehicle.create({
    driver: driverDavid._id,
    make: 'Hyundai',
    model: 'Ioniq 5',
    year: 2023,
    color: 'Matte Grey',
    licensePlate: 'RF-9932',
    category: 'comfort',
    capacity: 4,
  });

  await DriverProfile.create({
    user: driverDavid._id,
    licenseNumber: 'DL-CA-445892',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    verificationStatus: 'pending', // PENDING for Admin Review
    vehicle: vehicleDavid._id,
    isOnline: false,
    isAvailable: false,
    documents: [
      { type: 'license', status: 'pending' },
      { type: 'insurance', status: 'pending' },
      { type: 'vehicle_registration', status: 'pending' },
    ],
  });

  // Driver 4: Marcus Vance (Approved, XL Category)
  const driverMarcus = await User.create({
    name: 'Marcus Vance',
    email: 'driver_xl@rideflow.com',
    phone: '+1 (555) 013-3322',
    passwordHash: passPasswordHash,
    role: 'driver',
    ratingAvg: 4.88,
    ratingCount: 89,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  });

  const vehicleMarcus = await Vehicle.create({
    driver: driverMarcus._id,
    make: 'Chevrolet',
    model: 'Suburban',
    year: 2023,
    color: 'Onyx Black',
    licensePlate: 'RF-6610',
    category: 'xl',
    capacity: 6,
  });

  await DriverProfile.create({
    user: driverMarcus._id,
    licenseNumber: 'DL-CA-558291',
    licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    verificationStatus: 'approved',
    vehicle: vehicleMarcus._id,
    isOnline: true,
    isAvailable: true,
    totalEarnings: 1820.0,
    completedTrips: 45,
  });

  await DriverLocation.create({
    driver: driverMarcus._id,
    location: { type: 'Point', coordinates: [-122.422, 37.778] },
    heading: 90,
    speed: 20,
    isOnline: true,
    isAvailable: true,
    category: 'xl',
  });

  // 6. Seed Historical Completed Ride & Payment for Alice with Carlos
  const pastRide = await Ride.create({
    passenger: passengerAlice._id,
    driver: driverCarlos._id,
    vehicle: vehicleCarlos._id,
    category: 'economy',
    status: 'completed',
    pickup: {
      address: '100 Market St, Financial District',
      coordinates: [-122.399, 37.793],
    },
    destination: {
      address: 'Pier 39, Beach St & The Embarcadero',
      coordinates: [-122.409, 37.808],
    },
    route: {
      distanceKm: 4.2,
      durationMin: 12,
      polyline: [
        [-122.399, 37.793],
        [-122.404, 37.801],
        [-122.409, 37.808],
      ],
    },
    fareEstimate: {
      base: 3.5,
      distance: 5.88,
      duration: 4.2,
      surgeMultiplier: 1.0,
      platformFee: 2.72,
      total: 13.58,
    },
    finalFare: {
      base: 3.5,
      distance: 5.88,
      duration: 4.2,
      subtotal: 13.58,
      platformFee: 2.72,
      cancellationFee: 0,
      total: 13.58,
      driverNet: 10.86,
      platformCommission: 2.72,
      calculatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    pin: '7391',
    paymentStatus: 'paid',
    arrivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 25 * 60 * 1000),
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 20 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  const paymentRecord = await Payment.create({
    ride: pastRide._id,
    passenger: passengerAlice._id,
    amount: 13.58,
    currency: 'USD',
    provider: 'simulated',
    providerTransactionId: 'SIM_TX_INIT_001',
    status: 'succeeded',
    idempotencyKey: 'SEED_TX_ALICE_001',
    paymentMethod: 'demo_card',
    cardLast4: '4242',
    receiptNumber: 'RF-RCP-2026-9011',
  });

  pastRide.payment = paymentRecord._id;
  await pastRide.save();

  await Rating.create({
    ride: pastRide._id,
    reviewer: passengerAlice._id,
    reviewee: driverCarlos._id,
    role: 'passenger',
    score: 5,
    comment: 'Carlos was very polite, smooth drive and arrived right on time!',
  });

  // Seed an Audit Log entry
  await AuditLog.create({
    actor: adminUser._id,
    action: 'driver_approved',
    entityType: 'DriverProfile',
    entityId: profileCarlos._id,
    changes: { status: 'approved' },
  });

  console.log('[Seed] Database seeded successfully!');
  console.log(`[Seed] Demo Accounts Ready:`);
  console.log(`  👤 Passenger: passenger@rideflow.com / password123 (Alice Walker)`);
  console.log(`  🚗 Driver:    driver@rideflow.com / password123 (Carlos Mendoza - Approved, Online)`);
  console.log(`  ⏳ Driver:    driver_pending@rideflow.com / password123 (David Kim - Pending Approval)`);
  console.log(`  🛡️  Admin:     admin@rideflow.com / admin123 (Platform Ops Admin)`);
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    }
  })();
}
