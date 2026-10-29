import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Car, User, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [role, setRole] = useState('passenger'); // 'passenger' | 'driver'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Driver fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [year, setYear] = useState(2023);
  const [color, setColor] = useState('Silver');
  const [licensePlate, setLicensePlate] = useState('');
  const [category, setCategory] = useState('economy');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const payload = {
        name,
        email,
        phone,
        password,
        role,
        ...(role === 'driver' && {
          licenseNumber: licenseNumber || `DL-${Date.now().toString().slice(-6)}`,
          make,
          model,
          year: Number(year),
          color,
          licensePlate: licensePlate || `RF-${Math.floor(1000 + Math.random() * 9000)}`,
          category,
          capacity: category === 'xl' ? 6 : 4,
        }),
      };

      await register(payload);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">Get started with RideFlow in seconds</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('passenger')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              role === 'passenger'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Passenger</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('driver')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              role === 'driver'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Drive with us</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 characters)"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Additional Driver Vehicle Fields */}
          {role === 'driver' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3 mt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Vehicle & Driver Details
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="economy">Economy</option>
                    <option value="comfort">Comfort</option>
                    <option value="premium">Black / Luxury</option>
                    <option value="xl">XL (6 seats)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">License Plate</label>
                  <input
                    type="text"
                    placeholder="e.g. 7XYZ99"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Registering...' : `Join as ${role === 'driver' ? 'Driver' : 'Passenger'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-slate-900 hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
