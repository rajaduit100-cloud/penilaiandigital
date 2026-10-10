import React, { useState } from 'react';
import { Lock, User as UserIcon, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { soundService } from '../services/sound';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Mohon isi nama pengguna (username) dan kata sandi.');
      return;
    }

    setIsLoading(true);
    soundService.playClick();

    setTimeout(() => {
      const users = StorageService.getUsers();
      const match = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      if (match) {
        StorageService.setCurrentUser(match);
        soundService.playSuccessFanfare();
        onLoginSuccess(match);
        onClose();
      } else {
        setErrorMsg('Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali.');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 px-6 py-5 border-b border-amber-500/30 text-center relative">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-amber-100 tracking-wide font-display">
            MASUK SISTEM S-IMPEL DIGITAL
          </h3>
          <p className="text-xs text-amber-200/70 mt-0.5">
            Portal Otentikasi Khusus Admin, Juri, dan Voter
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-amber-200/90 block mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              Nama Pengguna (Username)
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username Anda..."
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Kata Sandi (Password)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Tampilkan</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all font-mono tracking-wider"
              />
            </div>
          </div>

          {/* Secure Privacy Box */}
          <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-xl text-[11px] text-stone-400 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Keamanan & Privasi Kredensial:</span>
            </div>
            <p className="text-stone-400">
              Karakter kata sandi tersamarkan secara otomatis demi keamanan kredensial. Akses masuk hanya diperkenankan untuk akun resmi yang telah didaftarkan oleh Administrator Utama.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
