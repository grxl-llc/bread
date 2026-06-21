import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { breadClient } from '@/api/breadClient';
import BreadLogo from '@/components/branding/BreadLogo';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', zipcode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-fill zipcode from the device location so users don't have to look it up.
  const handleUseLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError("Location isn't available on this device — enter your zip manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Keyless reverse-geocode → postcode
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const zip = data?.postcode || '';
          if (zip) {
            setForm((f) => ({ ...f, zipcode: zip }));
          } else {
            setError("Couldn't determine your zip — please enter it manually.");
          }
        } catch {
          setError("Couldn't look up your location — please enter your zip manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location permission denied — please enter your zip manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await breadClient.auth.signUp(
        form.email,
        form.password,
        form.fullName || undefined,
        form.zipcode?.trim() || undefined
      );
      navigate('/post-signup-onboarding');
    } catch (err) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BreadLogo size="2xl" />
        </div>

        <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1 text-center">Create Account</h1>
          <p className="text-[#C4C4BA] text-center mb-8 text-sm">Cook smarter, spend less</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">Name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter password"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">
                Zip Code <span className="text-[#C4C4BA]/40">— for local grocery prices</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="zipcode"
                  inputMode="numeric"
                  value={form.zipcode}
                  onChange={handleChange}
                  placeholder="e.g. 27576"
                  className="flex-1 bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="shrink-0 flex items-center gap-1.5 bg-[#15233A] border border-white/10 hover:border-[#FF6B35]/50 disabled:opacity-50 text-[#C4C4BA] px-3 rounded-xl transition-colors text-sm"
                  title="Use my location"
                >
                  <MapPin className="w-4 h-4" />
                  {locating ? '...' : 'Use location'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-[#C4C4BA]/60 text-xs text-center mt-6">
            By signing up you agree to our{' '}
            <a href="/TermsOfService" className="text-[#FF6B35] hover:underline">Terms</a>
            {' '}and{' '}
            <a href="/PrivacyPolicy" className="text-[#FF6B35] hover:underline">Privacy Policy</a>
          </p>

          <p className="text-[#C4C4BA]/60 text-sm text-center mt-4">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#FF6B35] hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
