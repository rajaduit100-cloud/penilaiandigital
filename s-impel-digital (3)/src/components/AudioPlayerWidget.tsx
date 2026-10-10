import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, Play, Pause, Disc } from 'lucide-react';
import { soundService } from '../services/sound';

interface AudioPlayerWidgetProps {
  customAudioUrl?: string;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ customAudioUrl }) => {
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isPlaying, setIsPlaying] = useState(!soundService.getIsMuted());
  const [volume, setVolume] = useState(soundService.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const unsub = soundService.subscribe(() => {
      setIsMuted(soundService.getIsMuted());
      setVolume(soundService.getVolume());
      setIsPlaying(!soundService.getIsMuted());
    });
    return unsub;
  }, []);

  const handleTogglePlay = () => {
    soundService.playClick();
    if (isMuted || !isPlaying) {
      soundService.setMuted(false);
      setIsPlaying(true);
      soundService.startGlobalBGM(customAudioUrl);
    } else {
      soundService.setMuted(true);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    soundService.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      soundService.setMuted(false);
    }
  };

  return (
    <div className="relative inline-flex items-center bg-stone-900/80 backdrop-blur-md border border-amber-500/30 rounded-full px-3 py-1.5 shadow-lg text-xs text-amber-200">
      <div className="flex items-center gap-2 mr-2">
        <Disc className={`w-4 h-4 text-amber-400 ${isPlaying && !isMuted ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
        <span className="hidden sm:inline font-medium text-[11px] text-amber-100/90 tracking-wide">
          BGM {isPlaying && !isMuted ? 'Aktif' : 'Mute'}
        </span>
      </div>

      {/* Play/Mute Toggle Button */}
      <button
        onClick={handleTogglePlay}
        title={isMuted ? 'Putar Musik Latar' : 'Heningkan Musik Latar'}
        className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          isPlaying && !isMuted
            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
            : 'bg-stone-800 text-stone-400 hover:text-amber-200'
        }`}
      >
        {isMuted || !isPlaying ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        )}
      </button>

      {/* Volume slider toggle */}
      <div 
        className="relative ml-1"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="p-1 text-amber-200/70 hover:text-amber-300 transition-colors"
          title="Atur Volume"
        >
          <Music className="w-3 h-3" />
        </button>

        {showVolumeSlider && (
          <div className="absolute right-0 top-full mt-2 bg-stone-950/95 border border-amber-500/40 p-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-36">
            <span className="text-[10px] text-amber-300/80">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-amber-400 font-mono w-6 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
