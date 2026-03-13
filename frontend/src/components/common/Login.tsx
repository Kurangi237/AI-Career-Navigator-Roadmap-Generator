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
    <div className="app-shell p-4 md:p-8">
      <div className="max-w-6xl mx-auto min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-6 items-stretch">
        <section className="hidden lg:flex glass-panel rounded-2xl p-10 flex-col justify-between premium-page">
          <div>
            <span className="brand-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] text-cyan-200">CAREER OS</span>
            <h1 className="text-4xl font-bold text-slate-100 mt-4 leading-tight">Build your complete career pipeline in one workspace.</h1>
            <p className="text-slate-300 mt-3">Roadmaps, jobs, resume optimization, and interview prep with one consistent flow.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="glass-panel rounded-xl p-3">
              <p className="text-slate-400">Live Jobs</p>
              <p className="text-white font-semibold">Multi-source</p>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <p className="text-slate-400">Resume</p>
              <p className="text-white font-semibold">ATS + Export</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6 md:p-8 rounded-2xl w-full max-w-lg mx-auto border border-slate-700/70 self-center">
          <div className="text-center mb-8">
            <div className="icon-chip w-16 h-16 text-3xl mx-auto mb-4">
              M
            </div>
            <h1 className="text-3xl font-bold text-slate-100">
              {isCreatingAccount ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-300 mt-2">
              {isCreatingAccount ? 'Join AI Career Navigator & Roadmap Generator' : 'Sign in to AI Career Navigator & Roadmap Generator'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-400/40 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="field-control"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@university.edu"
                className="field-control"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isCreatingAccount ? "Create a password" : "Enter your password"}
                className="field-control"
                required
              />
            </div>

            {isCreatingAccount && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="field-control"
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
            )}

            {isCreatingAccount && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="field-control"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full primary-btn text-white font-bold py-3.5 transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading 
                ? (isCreatingAccount ? 'Creating Account...' : 'Signing in...')
                : (isCreatingAccount ? 'Create Account' : 'Enter Dashboard')
              }
            </button>
          </form>

          {!isCreatingAccount && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300">
              Demo users: `admin@kbv.com` (admin/business), `demo@kbv.com` (mentor/pro), `student@kbv.com` (student/starter).
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-cyan-300 hover:text-cyan-200 text-sm font-medium transition-colors"
            >
              {isCreatingAccount 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"
              }
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;



