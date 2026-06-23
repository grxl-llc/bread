import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BreadLogo from '@/components/branding/BreadLogo';

export default function SignInPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.signIn(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
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
          <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1 text-center">Welcome Back</h1>
          <p className="text-[#C4C4BA] text-center mb-8 text-sm">Sign in to your account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#C4C4BA] text-xs font-medium ml-0.5">Password</label>
                <Link to="/forgot-password" className="text-[#FF6B35] text-xs hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-[#C4C4BA]/60 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#FF6B35] hover:underline font-medium">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}