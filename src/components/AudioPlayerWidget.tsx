import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { soundService } from '../services/sound';

interface AudioPlayerWidgetProps {
  customAudioUrl?: string;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ customAudioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.isMuted());

  useEffect(() => {
    // If custom audio provided and previously playing, update track
    if (isPlaying && customAudioUrl) {
      soundService.startGlobalBGM(customAudioUrl);
    }
  }, [customAudioUrl, isPlaying]);

  const toggleSound = () => {
    soundService.playClick();
    if (!isPlaying) {
      soundService.setMuted(false);
      setIsMuted(false);
      setIsPlaying(true);
      if (customAudioUrl) {
        soundService.startGlobalBGM(customAudioUrl);
      }
    } else {
      const nextMute = !isMuted;
      soundService.setMuted(nextMute);
      setIsMuted(nextMute);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSound}
      title={isMuted ? 'Buka Suara & Musik' : 'Bisukan Suara'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
        !isMuted && isPlaying
          ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
      }`}
    >
      {!isMuted && isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden lg:inline text-[11px]">Audio Aktif</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-stone-400" />
          <span className="hidden lg:inline text-[11px]">Audio Hening</span>
        </>
      )}
    </button>
  );
};
