
import React, { useState, useEffect } from 'react';
import { Bus as BusIcon, Mail, Lock, ArrowRight, ShieldCheck, X, Loader2, User as UserIcon } from 'lucide-react';
import { APIService } from '../backend-simulation';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
  initialMode?: 'CUSTOMER' | 'STAFF';
  onCancel?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, initialMode = 'CUSTOMER', onCancel }) => {
  const [isStaff, setIsStaff] = useState(initialMode === 'STAFF');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsStaff(initialMode === 'STAFF');
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let user: User;
      if (mode === 'LOGIN') {
        user = await APIService.login(email, password);
        if (isStaff && user.role === 'CUSTOMER') {
          throw new Error("Invalid credentials for Staff Portal.");
        }
      } else {
        user = await APIService.register(name, email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md relative">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="flex flex-col items-center mb-8">
            <div className={`p-3 rounded-2xl mb-4 shadow-xl transition-all ${isStaff ? 'bg-slate-900 shadow-slate-200' : 'bg-indigo-600 shadow-indigo-100'}`}>
              <BusIcon className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {isStaff ? 'Staff Portal' : mode === 'LOGIN' ? 'Customer Login' : 'Create Account'}
            </h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 text-[10px]">
              {isStaff ? 'Fleet & Operations' : 'Bookings & Travel'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              {!isStaff && mode === 'REGISTER' && (
                <div className="relative animate-fade-in">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-center animate-fade-in">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70 ${isStaff ? 'bg-slate-900 hover:bg-black' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isStaff ? 'Enter Terminal' : mode === 'LOGIN' ? 'Login to ASAP' : 'Sign Up Free'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {!isStaff && (
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); }}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {mode === 'LOGIN' ? (
                    <>Don't have an account? <span className="text-indigo-600">Register Now</span></>
                  ) : (
                    <>Already have an account? <span className="text-indigo-600">Log In</span></>
                  )}
                </button>
              </div>
            )}
          </form>

          <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all ${isStaff ? 'bg-slate-400' : 'bg-indigo-400'}`} />
        </div>

        <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-[10px] font-mono text-white/60 border border-white/10 text-center">
          {isStaff ? (
            <p>Admin: admin@asap.com | Staff: staff@asap.com <br/> Pwd: password123</p>
          ) : mode === 'LOGIN' ? (
            <p>Customer: customer@test.com | Pwd: password123</p>
          ) : (
            <p>Enter your details above to create a new traveler profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
