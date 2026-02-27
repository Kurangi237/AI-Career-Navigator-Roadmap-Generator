import React, { useState } from 'react';
import { loginUser, createUser } from '../../services/authService';
import { UserProfile, UserRole } from '@shared/types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [role, setRole] = useState<UserRole>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (isCreatingAccount && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate network delay
    setTimeout(() => {
      try {
        const user = isCreatingAccount 
          ? createUser(name, email, password, role, 'starter')
          : loginUser(name, email, password);
        setLoading(false);
        onLoginSuccess(user);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Operation failed');
      }
    }, 800);
  };

  const toggleMode = () => {
    setIsCreatingAccount(!isCreatingAccount);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1220] via-[#111827] to-[#1f2937] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-orange-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-600 text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg shadow-orange-200">
            K
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isCreatingAccount ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isCreatingAccount ? 'Join AI Career Navigator & Roadmap Generator' : 'Sign in to AI Career Navigator & Roadmap Generator'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isCreatingAccount ? "Create a password" : "Enter your password"}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {isCreatingAccount && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>
          )}

          {isCreatingAccount && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 transform active:scale-[0.98]"
          >
            {loading 
              ? (isCreatingAccount ? 'Creating Account...' : 'Signing in...')
              : (isCreatingAccount ? 'Create Account' : 'Enter Dashboard')
            }
          </button>
        </form>

        {!isCreatingAccount && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Demo users: `admin@kbv.com` (admin/business), `demo@kbv.com` (mentor/pro), `student@kbv.com` (student/starter).
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
          >
            {isCreatingAccount 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

