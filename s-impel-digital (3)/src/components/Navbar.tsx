import React from 'react';
import {
  Trophy,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  Flame,
  Volume2
} from 'lucide-react';
import { EventConfig, User } from '../types';
import { AudioPlayerWidget } from './AudioPlayerWidget';

interface NavbarProps {
  currentUser: User | null;
  eventConfig: EventConfig;
  currentView: 'public' | 'dashboard';
  onNavigateView: (view: 'public' | 'dashboard') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  eventConfig,
  currentView,
  onNavigateView,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="no-print bg-stone-950/95 border-b border-amber-600/40 text-stone-100 sticky top-0 z-40 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigateView('public')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 font-display">
                S-IMPEL DIGITAL
              </span>
              <span className="bg-red-700 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-amber-300/70 font-medium tracking-tight truncate max-w-[200px] sm:max-w-xs">
              Sistem Penilaian Digital & Voting Berbayar
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Background Music Widget (Always available globally with mute/unmute & loop) */}
          <AudioPlayerWidget customAudioUrl={eventConfig.bgmAudioUrl} />

          {/* Navigation & Role Actions */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateView(currentView === 'public' ? 'dashboard' : 'public')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-200 border border-stone-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {currentView === 'public' ? (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Ke Dashboard</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Halaman Publik</span>
                  </>
                )}
              </button>

              <div className="hidden md:flex items-center gap-1.5 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-[10px] text-stone-400">Akun:</span>
                <strong className="text-amber-300 text-[11px] truncate max-w-[120px]">
                  {currentUser.name}
                </strong>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-800 text-stone-300">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-stone-400 hover:text-red-400 bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Masuk Sistem</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
