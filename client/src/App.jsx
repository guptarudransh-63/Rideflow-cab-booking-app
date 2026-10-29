import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DemoSwitcher } from './components/common/DemoSwitcher.jsx';
import { Navbar } from './components/common/Navbar.jsx';
import { PassengerHome } from './pages/passenger/PassengerHome.jsx';
import { PassengerRides } from './pages/passenger/PassengerRides.jsx';
import { DriverDashboard } from './pages/driver/DriverDashboard.jsx';
import { EarningsCard } from './components/driver/EarningsCard.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { Login } from './pages/auth/Login.jsx';
import { Register } from './pages/auth/Register.jsx';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // Reset tab if currentTab does not belong to the newly logged-in role
  useEffect(() => {
    if (!user) return;
    const passengerTabs = ['home', 'book', 'rides'];
    const driverTabs = ['home', 'driver-console', 'driver-earnings'];
    const adminTabs = ['home', 'admin-dashboard', 'admin-drivers', 'admin-fares'];

    if (user.role === 'passenger' && !passengerTabs.includes(currentTab)) {
      setCurrentTab('home');
    } else if (user.role === 'driver' && !driverTabs.includes(currentTab)) {
      setCurrentTab('home');
    } else if (user.role === 'admin' && !adminTabs.includes(currentTab)) {
      setCurrentTab('home');
    }
  }, [user?.role, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
        Connecting to RideFlow Platform...
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <DemoSwitcher />
        <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1 flex items-center justify-center p-4">
          {authView === 'login' ? (
            <Login onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthView('login')} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoSwitcher />
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="flex-1 flex flex-col">
        {/* Passenger Views */}
        {user.role === 'passenger' && (
          <>
            {(currentTab === 'home' || currentTab === 'book') && <PassengerHome />}
            {currentTab === 'rides' && <PassengerRides />}
          </>
        )}

        {/* Driver Views */}
        {user.role === 'driver' && (
          <>
            {(currentTab === 'home' || currentTab === 'driver-console') && <DriverDashboard />}
            {currentTab === 'driver-earnings' && (
              <div className="max-w-2xl mx-auto py-8 px-4 w-full">
                <EarningsCard />
              </div>
            )}
          </>
        )}

        {/* Admin Views */}
        {user.role === 'admin' && <AdminDashboard initialTab={currentTab} />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
