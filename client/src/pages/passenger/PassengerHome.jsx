import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { BookingPanel } from '../../components/passenger/BookingPanel.jsx';
import { ActiveRideTracker } from '../../components/passenger/ActiveRideTracker.jsx';
import { ReceiptModal } from '../../components/passenger/ReceiptModal.jsx';
import { RatingModal } from '../../components/passenger/RatingModal.jsx';
import { InteractiveMap } from '../../components/map/InteractiveMap.jsx';

export const PassengerHome = () => {
  const { user, activeRide, setActiveRide, loadUser } = useAuth();
  const [mapRoute, setMapRoute] = useState({
    pickup: null,
    destination: null,
    polyline: [],
  });
  const [driverLocation, setDriverLocation] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRating, setShowRating] = useState(false);

  // Sync active ride with map
  useEffect(() => {
    if (activeRide) {
      setMapRoute({
        pickup: activeRide.pickup,
        destination: activeRide.destination,
        polyline: activeRide.route?.polyline || [],
      });

      // If ride is completed, prompt receipt
      if (activeRide.status === 'completed' && activeRide.paymentStatus !== 'paid') {
        setShowReceipt(true);
      }
    }
  }, [activeRide]);

  // Listen to live driver location updates
  useEffect(() => {
    if (!activeRide) return;

    const socket = getSocket();

    const handleDriverLocation = (data) => {
      setDriverLocation({
        coordinates: data.coordinates,
        heading: data.heading || 0,
        speed: data.speed || 0,
      });
    };

    socket.on('ride:driver_location', handleDriverLocation);

    return () => {
      socket.off('ride:driver_location', handleDriverLocation);
    };
  }, [activeRide]);

  const handleRouteCalculated = ({ pickup, destination, route }) => {
    setMapRoute({
      pickup,
      destination,
      polyline: route.polyline,
    });
  };

  const handleRequestRide = async (ridePayload) => {
    try {
      setIsRequesting(true);
      const res = await api.createRide(ridePayload);
      if (res.success) {
        setActiveRide(res.ride);
        loadUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to request ride');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelRide = async (reason) => {
    if (!activeRide) return;
    if (activeRide.status === 'completed') {
      setActiveRide(null);
      setDriverLocation(null);
      loadUser();
      return;
    }
    try {
      const res = await api.cancelRide(activeRide._id, { reason });
      if (res.success) {
        setActiveRide(null);
        setDriverLocation(null);
        loadUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel ride');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-6.5rem)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* Floating / Split Booking & Tracking Panel */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-md pointer-events-auto max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-4">
        {activeRide ? (
          <ActiveRideTracker
            ride={activeRide}
            onCancelRide={handleCancelRide}
            onViewReceipt={() => setShowReceipt(true)}
          />
        ) : (
          <BookingPanel
            onRouteCalculated={handleRouteCalculated}
            onRequestRide={handleRequestRide}
            isRequesting={isRequesting}
          />
        )}
      </div>

      {/* Background Interactive Map */}
      <div className="flex-1 h-full w-full relative">
        <InteractiveMap
          pickup={mapRoute.pickup}
          destination={mapRoute.destination}
          driverLocation={driverLocation}
          polyline={mapRoute.polyline}
          height="100%"
        />
      </div>

      {/* Receipt Modal */}
      {showReceipt && activeRide && (
        <ReceiptModal
          ride={activeRide}
          onClose={() => setShowReceipt(false)}
          onRatingPrompt={() => setShowRating(true)}
        />
      )}

      {/* Rating Modal */}
      {showRating && activeRide && (
        <RatingModal
          ride={activeRide}
          onClose={() => {
            setShowRating(false);
            setActiveRide(null);
            loadUser();
          }}
          onSuccess={() => {
            setActiveRide(null);
            loadUser();
          }}
        />
      )}
    </div>
  );
};
