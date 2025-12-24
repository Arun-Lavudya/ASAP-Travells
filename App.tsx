
import React, { useState, useEffect } from 'react';
import { 
  Bus as BusIcon, 
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Ticket
} from 'lucide-react';
import { AppState, User } from './types';
import CustomerPortal from './components/CustomerPortal';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const savedUser = localStorage.getItem('ASAP_AUTH_USER');
    if (savedUser) {
      const user = JSON.parse(savedUser) as User;
      return {
        view: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'ADMIN',
        currentUser: user
      };
    }
    return {
      view: 'CUSTOMER', // Default to landing page
      currentUser: null
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');

  const handleLogin = (user: User) => {
    localStorage.setItem('ASAP_AUTH_USER', JSON.stringify(user));
    setAppState({
      view: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'ADMIN',
      currentUser: user
    });
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ASAP_AUTH_USER');
    setAppState({ view: 'CUSTOMER', currentUser: null });
  };

  const openLogin = (mode: 'CUSTOMER' | 'STAFF') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Auth Modal Overlay - Rendered as a modal to preserve background state */}
      {isAuthModalOpen && (
        <AuthPage 
          onLogin={handleLogin} 
          initialMode={authMode} 
          onCancel={() => setIsAuthModalOpen(false)} 
        />
      )}

      {/* Navigation Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(prev => ({ ...prev, view: 'CUSTOMER' }))}>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
              <BusIcon className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-indigo-900">ASAP <span className="text-orange-500">Travels</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setAppState(prev => ({ ...prev, view: 'CUSTOMER' }))}
              className={`font-bold transition-colors text-sm ${appState.view === 'CUSTOMER' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Book Tickets
            </button>
            <a href="#" className="text-slate-500 hover:text-indigo-600 font-bold text-sm">Offers</a>
            {appState.currentUser?.role !== 'CUSTOMER' && appState.currentUser && (
              <button 
                onClick={() => setAppState(prev => ({ ...prev, view: 'ADMIN' }))}
                className={`font-bold transition-colors text-sm flex items-center gap-2 ${appState.view === 'ADMIN' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Management
              </button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {appState.currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none mb-1">{appState.currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{appState.currentUser.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openLogin('STAFF')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Staff Login
                </button>
                <button 
                  onClick={() => openLogin('CUSTOMER')}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Login / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {appState.view === 'CUSTOMER' ? (
          <CustomerPortal user={appState.currentUser} onLoginRequired={() => openLogin('CUSTOMER')} />
        ) : (
          <AdminPanel user={appState.currentUser!} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <BusIcon className="text-indigo-500 w-8 h-8" />
              <span className="text-2xl font-black text-white">ASAP Travels</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Redefining bus travel with speed, luxury, and security. Experience the next generation of transit.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><Ticket className="w-5 h-5 text-white" /></div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><ShieldCheck className="w-5 h-5 text-white" /></div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Route Map</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Offers & Coupons</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Premium Lounges</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Mobile App</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Ticket Cancellation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Travel Insurance</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Partners</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><button onClick={() => openLogin('STAFF')} className="hover:text-indigo-400 transition-colors">Staff Login</button></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Operator Sign Up</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Corporate Travel</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">API Integration</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          <span>&copy; 2025 ASAP Travels. Premium Transit Solutions.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
