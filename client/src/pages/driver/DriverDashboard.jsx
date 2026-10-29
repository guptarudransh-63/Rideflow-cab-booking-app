import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { DriverStatusToggle } from '../../components/driver/DriverStatusToggle.jsx';
import { IncomingOfferModal } from '../../components/driver/IncomingOfferModal.jsx';
import { TripNavigationCard } from '../../components/driver/TripNavigationCard.jsx';
import { EarningsCard } from '../../components/driver/EarningsCard.jsx';
import { InteractiveMap } from '../../components/map/InteractiveMap.jsx';
import { Car, Navigation, Shield, AlertTriangle } from 'lucide-react';

export const DriverDashboard = () => {
  const { user, driverProfile, activeRide, setActiveRide, loadUser } = useAuth();
  const [currentOffer, setCurrentOffer] = useState(null);
  const [driverLocation, setDriverLocation] = useState({ coordinates: [-122.404, 37.789], heading: 45 });

  // Poll or listen for ride offers via Socket.IO
  useEffect(() => {
    const socket = getSocket();

    const handleOffer = (offerData) => {
      console.log('[Driver] Received Ride Offer:', offerData);
      setCurrentOffer(offerData);
    };

    socket.on('ride:offer', handleOffer);

    // Also check pending offers via API upon mounting
    const checkPendingOffers = async () => {
      try {
        const res = await api.getOffers();
        if (res.success && res.offers?.length > 0) {
          const offer = res.offers[0];
          setCurrentOffer({
            offerId: offer._id,
            rideId: offer.ride._id,
            category: offer.ride.category,
            pickup: offer.ride.pickup,
            destination: offer.ride.destination,
            distanceKm: offer.ride.route.distanceKm,
            durationMin: offer.ride.route.durationMin,
            estimatedFare: offer.ride.fareEstimate?.total,
            pickupDistanceKm: offer.distanceToPickupKm,
            passenger: offer.ride.passenger,
          });
        }
      } catch (e) {}
    };

    if (driverProfile?.isOnline) {
      checkPendingOffers();
    }

    return () => {
      socket.off('ride:offer', handleOffer);
    };
  }, [driverProfile?.isOnline]);

  const handleOfferAccepted = (ride) => {
    setCurrentOffer(null);
    setActiveRide(ride);
    loadUser();
  };

  const handleOfferRejected = () => {
    setCurrentOffer(null);
  };

  const handleTripUpdated = (updatedRide) => {
    setActiveRide(updatedRide);
    loadUser();
  };

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] flex flex-col md:flex-row overflow-hidden bg-slate-900">
      {/* Left / Overlay Driver Controls */}
      <div className="w-full md:w-96 p-4 md:p-6 z-20 flex flex-col gap-4 overflow-y-auto max-h-full">
        {/* Online / Offline Toggle */}
        <DriverStatusToggle
          profile={driverProfile}
          onStatusChanged={() => loadUser()}
        />

        {/* Active Trip Navigation Card */}
        {activeRide ? (
          <TripNavigationCard
            ride={activeRide}
            onTripUpdated={handleTripUpdated}
          />
        ) : (
          driverProfile?.isOnline && (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold">Scanning for ride requests</p>
                <p className="text-[11px] text-slate-400">Keep app active to receive offers nearby</p>
              </div>
            </div>
          )
        )}

        {/* Earnings Quick Summary */}
        <EarningsCard />
      </div>

      {/* Right / Background Full Interactive Map */}
      <div className="flex-1 h-full w-full relative">
        <InteractiveMap
          pickup={activeRide?.pickup}
          destination={activeRide?.destination}
          driverLocation={driverLocation}
          polyline={activeRide?.route?.polyline || []}
          height="100%"
        />
      </div>

      {/* Urgent Ride Offer Modal */}
      {currentOffer && !activeRide && (
        <IncomingOfferModal
          offer={currentOffer}
          onAccepted={handleOfferAccepted}
          onRejected={handleOfferRejected}
        />
      )}
    </div>
  );
};
