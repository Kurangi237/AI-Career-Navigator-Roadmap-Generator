import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { UserProfile } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const user = loginUser(name, email);
      setLoading(false);
      onLoginSuccess(user);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2f8d46] text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg shadow-green-200">
            K
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to KARE26 Students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@university.edu"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2f8d46] text-white font-bold py-3.5 rounded-lg hover:bg-[#1e6b30] transition-colors shadow-lg shadow-green-200 transform active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Enter Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Demo Mode: No password required.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
