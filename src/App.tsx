import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PublicLanding } from './components/PublicLanding';
import { AdminDashboard } from './components/AdminDashboard';
import { JuriDashboard } from './components/JuriDashboard';
import { VoterDashboard } from './components/VoterDashboard';
import { DanaPaymentModal } from './components/DanaPaymentModal';
import { StorageService } from './services/storage';
import { soundService } from './services/sound';
import { signInWithGoogle, signOutFromSupabase, onAuthStateChange } from './services/supabaseClient.js';
import { EventConfig, User } from './types';
import {
  Lock,
  User as UserIcon,
  X,
  LogIn,
  Shield,
  Award,
  Vote,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => StorageService.getEventConfig());
  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>(() => {
    const user = StorageService.getCurrentUser();
    return user ? 'dashboard' : 'public';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDanaModalOpen, setIsDanaModalOpen] = useState(false);

  // Login form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const refreshState = useCallback(() => {
    setCurrentUser(StorageService.getCurrentUser());
    setEventConfig(StorageService.getEventConfig());
  }, []);

  useEffect(() => {
    // Sinkronisasi otomatis dari database Supabase saat aplikasi dibuka
    StorageService.syncFromSupabase().then(() => {
      refreshState();
    });

    const cleanup = StorageService.onRemoteChange(() => {
      refreshState();
    });

    // Listen to Supabase Google OAuth state changes
    const unsubscribeAuth = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const sbUser = session.user;
        const existingUsers = StorageService.getUsers();
        const userEmail = sbUser.email || '';
        const userName =
          sbUser.user_metadata?.full_name ||
          sbUser.user_metadata?.name ||
          userEmail.split('@')[0] ||
          'Pengguna Google';

        let matchedUser = existingUsers.find(
          u => u.id === sbUser.id || (userEmail && (u.username === userEmail || u.phone === userEmail))
        );

        if (!matchedUser) {
          matchedUser = {
            id: sbUser.id,
            username: userEmail || `google_${sbUser.id.substring(0, 8)}`,
            name: userName,
            role: 'voter',
            phone: sbUser.phone || userEmail,
            avatarUrl: sbUser.user_metadata?.avatar_url || '',
            voteBalance: 0,
            createdAt: new Date().toISOString(),
          };
          StorageService.saveUsers([...existingUsers, matchedUser]);
        }

        StorageService.setCurrentUser(matchedUser);
        setCurrentUser(matchedUser);
        setIsLoginModalOpen(false);
        setCurrentView('dashboard');
        soundService.playSuccessFanfare();
      }
    });

    return () => {
      cleanup();
      unsubscribeAuth();
    };
  }, [refreshState]);

  const handleLogout = () => {
    soundService.playClick();
    signOutFromSupabase().catch(() => {});
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('public');
  };

  const handleGoogleSignIn = async () => {
    soundService.playClick();
    setLoginError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setLoginError(err?.message || 'Gagal terhubung ke Google OAuth Supabase. Pastikan provider Google aktif di Supabase.');
    }
  };

  const handleUpdateEventConfig = (cfg: EventConfig) => {
    setEventConfig(cfg);
    StorageService.saveEventConfig(cfg);
  };

  const handleOpenLogin = () => {
    soundService.playClick();
    setLoginError('');
    setIsLoginModalOpen(true);
  };

  const handleOpenVotingModal = () => {
    soundService.playClick();
    if (!currentUser) {
      // Prompt user to login or quick register as voter first
      setAuthMode('login');
      setIsLoginModalOpen(true);
    } else {
      setIsDanaModalOpen(true);
    }
  };

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    soundService.playClick();

    if (authMode === 'login') {
      const users = StorageService.getUsers();
      const matched = users.find(
        u => u.username.toLowerCase() === usernameInput.trim().toLowerCase() && u.password === passwordInput
      );

      if (!matched) {
        setLoginError('Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali.');
        return;
      }

      soundService.playSuccessFanfare();
      StorageService.setCurrentUser(matched);
      setCurrentUser(matched);
      setIsLoginModalOpen(false);
      setUsernameInput('');
      setPasswordInput('');
      setCurrentView('dashboard');
    } else {
      // Register new Voter account
      if (!usernameInput.trim() || !passwordInput.trim() || !nameInput.trim()) {
        setLoginError('Mohon lengkapi nama lengkap, username, dan password.');
        return;
      }

      const users = StorageService.getUsers();
      if (users.some(u => u.username.toLowerCase() === usernameInput.trim().toLowerCase())) {
        setLoginError('Username ini telah digunakan. Gunakan username lain.');
        return;
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        username: usernameInput.trim(),
        password: passwordInput,
        name: nameInput.trim(),
        role: 'voter',
        phone: phoneInput.trim() || '081200000000',
        voteBalance: 0,
        createdAt: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      StorageService.saveUsers(updated);
      StorageService.setCurrentUser(newUser);
      setCurrentUser(newUser);
      soundService.playSuccessFanfare();
      setIsLoginModalOpen(false);
      setUsernameInput('');
      setPasswordInput('');
      setNameInput('');
      setPhoneInput('');
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Global Navbar */}
      <Navbar
        currentUser={currentUser}
        eventConfig={eventConfig}
        currentView={currentView}
        onNavigateView={(view) => {
          soundService.playClick();
          setCurrentView(view);
        }}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'public' || !currentUser ? (
          <PublicLanding
            eventConfig={eventConfig}
            onOpenLogin={handleOpenLogin}
            onOpenVotingModal={handleOpenVotingModal}
          />
        ) : (
          <>
            {(currentUser.role === 'super_admin' || currentUser.role === 'shadow_admin') && (
              <AdminDashboard
                currentUser={currentUser}
                eventConfig={eventConfig}
                onUpdateEventConfig={handleUpdateEventConfig}
                onLogout={handleLogout}
                onViewPublic={() => {
                  soundService.playClick();
                  setCurrentView('public');
                }}
              />
            )}

            {currentUser.role === 'juri' && (
              <JuriDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'voter' && (
              <VoterDashboard
                currentUser={currentUser}
                eventConfig={eventConfig}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* DANA Payment Topup Modal */}
      {currentUser && (
        <DanaPaymentModal
          currentUser={currentUser}
          eventConfig={eventConfig}
          isOpen={isDanaModalOpen}
          onClose={() => setIsDanaModalOpen(false)}
          onSuccess={() => {
            setIsDanaModalOpen(false);
            refreshState();
          }}
        />
      )}

      {/* Login & Role Selection Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-200 font-display">
                  {authMode === 'login' ? 'Masuk ke Sistem Digital' : 'Daftar Akun Voter Baru'}
                </h3>
                <p className="text-xs text-stone-400">
                  {authMode === 'login'
                    ? 'Masukkan username dan kata sandi resmi Anda untuk melanjutkan'
                    : 'Daftar untuk melakukan voting peserta terfavorit'}
                </p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginFormSubmit} className="space-y-3.5 mb-6">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Nomor HP / WhatsApp (Aktif)
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Sekarang</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar & Masuk</span>
                  </>
                )}
              </button>

              {/* Pemisah Opsi Masuk */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-stone-800 w-full"></div>
                <span className="bg-stone-900 px-3 text-[10px] text-stone-500 uppercase tracking-wider select-none shrink-0 font-medium">
                  atau
                </span>
                <div className="border-t border-stone-800 w-full"></div>
              </div>

              {/* Tombol Continue with Google (Supabase OAuth) */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-amber-500/50 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800">
              <span>
                {authMode === 'login' ? 'Belum punya akun Voter?' : 'Sudah punya akun?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setLoginError('');
                }}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                {authMode === 'login' ? 'Daftar Sebagai Voter' : 'Masuk di sini'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
