import { FareService } from '../src/services/fare.service.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Fare Calculation Engine Tests', () => {
  it('should enforce minimum fare for very short distances', async () => {
    // 0.2 km, 1 min
    const estimate = await FareService.calculateEstimate('economy', 0.2, 1);
    expect(estimate.total).toBeGreaterThanOrEqual(estimate.minimumFare);
  });

  it('should accurately calculate fare with distance, time, and base components', async () => {
    // Economy default: base $3.50, km $1.40, min $0.35
    // 10 km, 20 mins: 3.50 + (10 * 1.4) + (20 * 0.35) = 3.50 + 14.00 + 7.00 = 24.50
    const estimate = await FareService.calculateEstimate('economy', 10, 20, 1.0);
    expect(estimate.total).toBe(24.5);
    expect(estimate.base).toBe(3.5);
    expect(estimate.distance).toBe(14);
    expect(estimate.duration).toBe(7);
  });

  it('should apply surge pricing multiplier properly', async () => {
    const normal = await FareService.calculateEstimate('economy', 10, 20, 1.0);
    const surged = await FareService.calculateEstimate('economy', 10, 20, 1.5);

    expect(surged.total).toBe(Math.round(normal.total * 1.5 * 100) / 100);
    expect(surged.surgeMultiplier).toBe(1.5);
  });

  it('should calculate category variations with higher tiers costing more', async () => {
    const all = await FareService.calculateAllEstimates(8, 15);
    expect(all.comfort.total).toBeGreaterThan(all.economy.total);
    expect(all.premium.total).toBeGreaterThan(all.comfort.total);
    expect(all.xl.total).toBeGreaterThan(all.economy.total);
  });
});
