import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { getSocket, resetSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session and active ride
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setDriverProfile(res.driverProfile || null);
        setVehicle(res.vehicle || null);
        setActiveRide(res.activeRide || null);
      } else {
        setUser(null);
        setDriverProfile(null);
        setActiveRide(null);
      }
    } catch (err) {
      setUser(null);
      setDriverProfile(null);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Connect socket and listen to ride lifecycle updates
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleRideAccepted = (data) => {
      console.log('[Socket] Ride Accepted:', data);
      setActiveRide(data.ride);
    };

    const handleRideArrived = (data) => {
      console.log('[Socket] Driver Arrived:', data);
      setActiveRide((prev) => (prev ? { ...prev, status: 'arrived', arrivedAt: data.arrivedAt } : prev));
    };

    const handleRideStarted = (data) => {
      console.log('[Socket] Trip Started:', data);
      setActiveRide((prev) => (prev ? { ...prev, status: 'in_progress', startedAt: data.startedAt } : prev));
    };

    const handleRideCompleted = (data) => {
      console.log('[Socket] Trip Completed:', data);
      setActiveRide((prev) => (prev ? { ...prev, status: 'completed', finalFare: data.finalFare, completedAt: data.completedAt } : prev));
    };

    const handleRideCancelled = (data) => {
      console.log('[Socket] Ride Cancelled:', data);
      setActiveRide((prev) => (prev ? { ...prev, status: 'cancelled', cancellation: data } : null));
    };

    const handleNoDrivers = (data) => {
      console.warn('[Socket] No drivers available:', data);
      setActiveRide((prev) => (prev ? { ...prev, noDriversAvailable: true } : prev));
    };

    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:arrived', handleRideArrived);
    socket.on('ride:started', handleRideStarted);
    socket.on('ride:completed', handleRideCompleted);
    socket.on('ride:cancelled', handleRideCancelled);
    socket.on('ride:no_drivers_available', handleNoDrivers);

    return () => {
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:arrived', handleRideArrived);
      socket.off('ride:started', handleRideStarted);
      socket.off('ride:completed', handleRideCompleted);
      socket.off('ride:cancelled', handleRideCancelled);
      socket.off('ride:no_drivers_available', handleNoDrivers);
    };
  }, [user]);

  // Join active ride room explicitly
  useEffect(() => {
    if (activeRide?._id && user) {
      const socket = getSocket();
      socket.emit('ride:join', { rideId: activeRide._id });
    }
  }, [activeRide?._id, user]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token) {
      localStorage.setItem('rideflow_token', res.token);
    }
    resetSocket();
    await loadUser();
    return res;
  };

  const register = async (data) => {
    const res = await api.register(data);
    if (res.token) {
      localStorage.setItem('rideflow_token', res.token);
    }
    resetSocket();
    await loadUser();
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    localStorage.removeItem('rideflow_token');
    resetSocket();
    setUser(null);
    setDriverProfile(null);
    setVehicle(null);
    setActiveRide(null);
  };

  // Demo 1-click Quick Switcher for seamless testing across personas
  const quickLogin = async (roleType) => {
    let email = 'passenger@rideflow.com';
    let password = 'password123';

    if (roleType === 'passenger') {
      email = 'passenger@rideflow.com';
      password = 'password123';
    } else if (roleType === 'driver') {
      email = 'driver@rideflow.com';
      password = 'password123';
    } else if (roleType === 'driver_pending') {
      email = 'driver_pending@rideflow.com';
      password = 'password123';
    } else if (roleType === 'admin') {
      email = 'admin@rideflow.com';
      password = 'admin123';
    }

    return login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        driverProfile,
        vehicle,
        activeRide,
        setActiveRide,
        loading,
        login,
        register,
        logout,
        quickLogin,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
