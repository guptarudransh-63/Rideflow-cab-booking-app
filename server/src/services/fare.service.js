import { FareConfiguration } from '../models/FareConfiguration.js';

export class FareService {
  /**
   * Get default fallback fare configuration for category if not found in DB
   */
  static getDefaultConfig(category) {
    const defaults = {
      economy: {
        category: 'economy',
        name: 'RideFlow Eco',
        baseFare: 3.5,
        perKmRate: 1.4,
        perMinuteRate: 0.35,
        minimumFare: 8.0,
        platformFeePercent: 20,
        surgeMultiplier: 1.0,
        cancellationFee: 5.0,
      },
      comfort: {
        category: 'comfort',
        name: 'RideFlow Comfort',
        baseFare: 5.0,
        perKmRate: 1.85,
        perMinuteRate: 0.45,
        minimumFare: 12.0,
        platformFeePercent: 20,
        surgeMultiplier: 1.0,
        cancellationFee: 7.0,
      },
      premium: {
        category: 'premium',
        name: 'RideFlow Black',
        baseFare: 9.0,
        perKmRate: 2.8,
        perMinuteRate: 0.7,
        minimumFare: 18.0,
        platformFeePercent: 25,
        surgeMultiplier: 1.0,
        cancellationFee: 10.0,
      },
      xl: {
        category: 'xl',
        name: 'RideFlow XL',
        baseFare: 7.5,
        perKmRate: 2.3,
        perMinuteRate: 0.55,
        minimumFare: 15.0,
        platformFeePercent: 22,
        surgeMultiplier: 1.0,
        cancellationFee: 8.0,
      },
    };
    return defaults[category] || defaults.economy;
  }

  /**
   * Get configuration for category from database or fallback
   */
  static async getConfig(category) {
    let config = await FareConfiguration.findOne({ category, isActive: true });
    if (!config) {
      config = this.getDefaultConfig(category);
    }
    return config;
  }

  /**
   * Calculate estimate for distance and duration
   */
  static async calculateEstimate(category, distanceKm, durationMin, surgeOverride = null) {
    const config = await this.getConfig(category);
    const surge = surgeOverride !== null ? surgeOverride : config.surgeMultiplier || 1.0;

    const baseCost = config.baseFare;
    const distanceCost = Math.round(distanceKm * config.perKmRate * 100) / 100;
    const timeCost = Math.round(durationMin * config.perMinuteRate * 100) / 100;

    const rawSubtotal = (baseCost + distanceCost + timeCost) * surge;
    const subtotal = Math.max(config.minimumFare, Math.round(rawSubtotal * 100) / 100);

    const platformFee = Math.round((subtotal * (config.platformFeePercent / 100)) * 100) / 100;
    const total = subtotal;

    return {
      category,
      base: config.baseFare,
      distance: distanceCost,
      duration: timeCost,
      distanceKm,
      durationMin,
      surgeMultiplier: surge,
      platformFeePercent: config.platformFeePercent,
      platformFee,
      total,
      minimumFare: config.minimumFare,
    };
  }

  /**
   * Calculate all category estimates simultaneously for a route
   */
  static async calculateAllEstimates(distanceKm, durationMin) {
    const categories = ['economy', 'comfort', 'premium', 'xl'];
    const estimates = {};

    for (const cat of categories) {
      estimates[cat] = await this.calculateEstimate(cat, distanceKm, durationMin);
    }

    return estimates;
  }

  /**
   * Calculate final fare based on actual completed distance, duration, or cancellation
   */
  static async calculateFinalFare(ride, actualDistanceKm = null, actualDurationMin = null, explicitFee = null) {
    const config = await this.getConfig(ride.category);
    
    // If cancelled with fee
    if (ride.status === 'cancelled') {
      const cancellationFee = explicitFee !== null ? explicitFee : (ride.cancellation?.fee ?? 0);
      const platformCommission = Math.round((cancellationFee * (config.platformFeePercent / 100)) * 100) / 100;
      const driverNet = Math.round((cancellationFee - platformCommission) * 100) / 100;

      return {
        base: 0,
        distance: 0,
        duration: 0,
        subtotal: cancellationFee,
        platformFee: platformCommission,
        cancellationFee: cancellationFee,
        total: cancellationFee,
        driverNet,
        platformCommission,
        calculatedAt: new Date(),
      };
    }

    const dist = actualDistanceKm || ride.route.distanceKm;
    const duration = actualDurationMin || ride.route.durationMin;
    const surge = ride.fareEstimate.surgeMultiplier || 1.0;

    const baseCost = config.baseFare;
    const distanceCost = Math.round(dist * config.perKmRate * 100) / 100;
    const timeCost = Math.round(duration * config.perMinuteRate * 100) / 100;

    const rawSubtotal = (baseCost + distanceCost + timeCost) * surge;
    const total = Math.max(config.minimumFare, Math.round(rawSubtotal * 100) / 100);

    const platformCommission = Math.round((total * (config.platformFeePercent / 100)) * 100) / 100;
    const driverNet = Math.round((total - platformCommission) * 100) / 100;

    return {
      base: config.baseFare,
      distance: distanceCost,
      duration: timeCost,
      subtotal: total,
      platformFee: platformCommission,
      cancellationFee: 0,
      total,
      driverNet,
      platformCommission,
      calculatedAt: new Date(),
    };
  }
}
