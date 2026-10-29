import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  Users,
  Car,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Layers,
  Settings,
  AlertTriangle,
  FileText,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard = ({ initialTab = 'overview' }) => {
  const getTabFromInitial = (tab) => {
    if (tab === 'admin-drivers') return 'drivers';
    if (tab === 'admin-fares') return 'pricing';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromInitial(initialTab));
  const [metrics, setMetrics] = useState(null);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [fareConfigs, setFareConfigs] = useState([]);
  const [rides, setRides] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(getTabFromInitial(initialTab));
    }
  }, [initialTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, driversRes, fareRes, ridesRes, logsRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getPendingDrivers(),
        api.getFareConfigs(),
        api.getAdminRides(),
        api.getAuditLogs(),
      ]);

      if (dashRes.success) setMetrics(dashRes.metrics);
      if (driversRes.success) setPendingDrivers(driversRes.drivers || []);
      if (fareRes.success) setFareConfigs(fareRes.configs || []);
      if (ridesRes.success) setRides(ridesRes.rides || []);
      if (logsRes.success) setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Driver Approval
  const handleApproveDriver = async (driverProfileId) => {
    try {
      const res = await api.approveDriver(driverProfileId);
      if (res.success) {
        setActionMessage('Driver approved successfully!');
        loadData();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Handle Driver Rejection
  const handleRejectDriver = async (driverProfileId) => {
    const reason = prompt('Enter rejection reason for driver:', 'Incomplete vehicle documentation');
    if (!reason) return;
    try {
      const res = await api.rejectDriver(driverProfileId, reason);
      if (res.success) {
        setActionMessage('Driver application rejected.');
        loadData();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Handle Fare Config Update
  const handleSaveFareConfig = async (cat, newValues) => {
    try {
      const res = await api.updateFareConfig(cat, newValues);
      if (res.success) {
        setActionMessage(`Updated pricing for ${cat.toUpperCase()}`);
        loadData();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Operations Hub...
      </div>
    );
  }

  // Chart data formatting
  const chartData = metrics?.dailyTrends?.length > 0
    ? metrics.dailyTrends.map((d) => ({
        date: d._id.slice(5), // MM-DD
        rides: d.ridesCount,
        revenue: Math.round(d.revenue || 0),
      }))
    : [
        { date: 'Mon', rides: 14, revenue: 195 },
        { date: 'Tue', rides: 22, revenue: 310 },
        { date: 'Wed', rides: 18, revenue: 260 },
        { date: 'Thu', rides: 29, revenue: 410 },
        { date: 'Fri', rides: 42, revenue: 580 },
        { date: 'Sat', rides: 51, revenue: 720 },
        { date: 'Sun', rides: 38, revenue: 490 },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Platform Operations
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fleet monitoring, driver verification, and algorithmic pricing controls
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'drivers', label: `Verifications (${pendingDrivers.length})`, icon: ShieldCheck },
            { id: 'pricing', label: 'Pricing Rules', icon: Settings },
            { id: 'rides', label: 'All Rides', icon: Car },
            { id: 'logs', label: 'Audit Logs', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Booking Value</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ${metrics?.grossBookingValue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total passenger payments</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Platform Take (20%)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                ${metrics?.platformCommission?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Platform retained net</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Online Drivers</span>
                <Car className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics?.onlineDrivers || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {metrics?.totalDrivers || 0}</span>
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active on road
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Completed Rides</span>
                <CheckCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics?.completedRides || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {metrics?.activeRides || 0} active now
              </p>
            </div>
          </div>

          {/* Recharts Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Area Chart */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Gross Revenue Trend ($)</h3>
                  <p className="text-[11px] text-slate-400">Daily gross booking volumes</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Last 7 Days
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Trips Completed Bar Chart */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ride Volume Trend</h3>
                  <p className="text-[11px] text-slate-400">Total requested and completed rides</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  Trips
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="rides" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING DRIVER VERIFICATIONS QUEUE */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Driver Application Queue</h3>
              <p className="text-xs text-slate-500">
                Review driver licenses, insurance, and vehicle registration before authorizing online status
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingDrivers.length} Pending Approval
            </span>
          </div>

          {pendingDrivers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              All driver applications have been reviewed and processed!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingDrivers.map((driver) => (
                <div key={driver._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-4">
                    <img
                      src={driver.user?.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}
                      alt={driver.user?.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{driver.user?.name}</h4>
                      <p className="text-xs text-slate-500">{driver.user?.email} • {driver.user?.phone}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                          License: {driver.licenseNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                          Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </span>
                        {driver.vehicle && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                            {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.category.toUpperCase()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleRejectDriver(driver._id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveDriver(driver._id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Driver</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRICING RULES CONFIGURATOR */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fareConfigs.map((config) => (
            <div key={config.category} className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{config.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{config.category} tier</p>
                </div>
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg uppercase">
                  {config.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Base Fare ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={config.baseFare}
                    id={`base-${config.category}`}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Rate / Km ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={config.perKmRate}
                    id={`km-${config.category}`}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Rate / Min ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    defaultValue={config.perMinuteRate}
                    id={`min-${config.category}`}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Surge Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    defaultValue={config.surgeMultiplier || 1.0}
                    id={`surge-${config.category}`}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-amber-600"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const base = parseFloat(document.getElementById(`base-${config.category}`).value);
                  const km = parseFloat(document.getElementById(`km-${config.category}`).value);
                  const min = parseFloat(document.getElementById(`min-${config.category}`).value);
                  const surge = parseFloat(document.getElementById(`surge-${config.category}`).value);

                  handleSaveFareConfig(config.category, {
                    baseFare: base,
                    perKmRate: km,
                    perMinuteRate: min,
                    surgeMultiplier: surge,
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
              >
                Save Pricing Rule
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ALL RIDES TABLE */}
      {activeTab === 'rides' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Platform Rides History</h3>
              <p className="text-xs text-slate-500">Live query across all passenger and driver trips</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Total: {rides.length} rides</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">Ride ID</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Pickup &rarr; Destination</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fare</th>
                  <th className="p-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">#{r._id.slice(-6)}</td>
                    <td className="p-4 font-medium text-slate-800">{r.passenger?.name || 'Passenger'}</td>
                    <td className="p-4 font-medium text-slate-800">{r.driver?.name || 'Unassigned'}</td>
                    <td className="p-4 max-w-xs truncate text-slate-500">
                      {r.pickup?.address} → {r.destination?.address}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-slate-100 text-slate-800">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      ${(r.finalFare?.total || r.fareEstimate?.total || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          r.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Administrative Security Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable logging of driver verifications, status modifications, and fare changes</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">Actor: {log.actor?.name || 'System Admin'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target: {log.entityType} ({log.entityId})
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
