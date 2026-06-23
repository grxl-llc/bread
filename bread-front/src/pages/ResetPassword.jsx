import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BreadLogo from '@/components/branding/BreadLogo';
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new reset link.');
    }
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword(token, form.password);
      setSuccess(true);
      // Redirect to sign in after a brief pause
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BreadLogo size="2xl" />
          </div>

          <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F0] mb-2">Password updated!</h1>
            <p className="text-[#C4C4BA] text-sm">
              Redirecting you to sign in…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BreadLogo size="2xl" />
        </div>

        <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F5F0]">Set new password</h1>
              <p className="text-[#C4C4BA] text-xs">Must be at least 8 characters</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
              {!token && (
                <Link to="/forgot-password" className="text-[#FF6B35] text-sm hover:underline mt-1 block">
                  Request a new reset link →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter new password"
                  className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 pr-11 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4C4BA]/50 hover:text-[#C4C4BA] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                required
                placeholder="Re-enter new password"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-[#C4C4BA] hover:text-[#F5F5F0] text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
