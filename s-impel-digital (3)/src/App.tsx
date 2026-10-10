import React, { useState, useEffect } from 'react';
import { EventConfig, User } from './types';
import { StorageService } from './services/storage';
import { soundService } from './services/sound';
import { Navbar } from './components/Navbar';
import { PublicLanding } from './components/PublicLanding';
import { AdminDashboard } from './components/AdminDashboard';
import { JuriDashboard } from './components/JuriDashboard';
import { VoterDashboard } from './components/VoterDashboard';
import { LoginModal } from './components/LoginModal';
import { DanaPaymentModal } from './components/DanaPaymentModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => StorageService.getEventConfig());
  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>(() => {
    const user = StorageService.getCurrentUser();
    return user ? 'dashboard' : 'public';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDanaModalOpen, setIsDanaModalOpen] = useState(false);

  // Sync state in real time across tabs & window storage
  useEffect(() => {
    const unsub = StorageService.onRemoteChange(() => {
      setCurrentUser(StorageService.getCurrentUser());
      setEventConfig(StorageService.getEventConfig());
    });
    return unsub;
  }, []);

  // Initialize global background music
  useEffect(() => {
    const startAudioOnInteraction = () => {
      soundService.startGlobalBGM(eventConfig.bgmAudioUrl);
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('keydown', startAudioOnInteraction);
    };

    window.addEventListener('click', startAudioOnInteraction, { once: true });
    window.addEventListener('keydown', startAudioOnInteraction, { once: true });

    return () => {
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('keydown', startAudioOnInteraction);
    };
  }, [eventConfig.bgmAudioUrl]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('public');
    soundService.playClick();
  };

  const handleUpdateEventConfig = (newCfg: EventConfig) => {
    setEventConfig(newCfg);
  };

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-amber-500 selection:text-stone-950"
      style={{
        backgroundColor: eventConfig.backgroundColor || '#1c1917',
        backgroundImage: eventConfig.backgroundUrl ? `url(${eventConfig.backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        eventConfig={eventConfig}
        currentView={currentView}
        onNavigateView={setCurrentView}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Router */}
      <div className="flex-1">
        {currentView === 'public' || !currentUser ? (
          <PublicLanding
            eventConfig={eventConfig}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenVotingModal={() => {
              if (!currentUser) {
                setIsLoginModalOpen(true);
              } else if (currentUser.role === 'voter') {
                setIsDanaModalOpen(true);
              } else {
                setCurrentView('dashboard');
              }
            }}
          />
        ) : (
          <>
            {/* Super Admin & Shadow Admin Dashboard */}
            {(currentUser.role === 'super_admin' || currentUser.role === 'shadow_admin') && (
              <AdminDashboard
                currentUser={currentUser}
                eventConfig={eventConfig}
                onUpdateEventConfig={handleUpdateEventConfig}
                onLogout={handleLogout}
                onViewPublic={() => setCurrentView('public')}
              />
            )}

            {/* Juri Dashboard */}
            {currentUser.role === 'juri' && (
              <JuriDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}

            {/* Voter Dashboard */}
            {currentUser.role === 'voter' && (
              <VoterDashboard
                currentUser={currentUser}
                eventConfig={eventConfig}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* DANA Payment Modal for Quick Access */}
      {currentUser && (
        <DanaPaymentModal
          currentUser={currentUser}
          eventConfig={eventConfig}
          isOpen={isDanaModalOpen}
          onClose={() => setIsDanaModalOpen(false)}
          onSuccess={() => setIsDanaModalOpen(false)}
        />
      )}
    </div>
  );
}
