import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Loader2, ChevronRight, Play, Pause, Music } from 'lucide-react';
import { generateSpeech } from '../services/ttsService';
import { useAmbientAudio, MusicStyle } from '../hooks/useAmbientAudio';

interface MeditationStepProps {
  script: string[];
  theme: string;
  onComplete: () => void;
}

export function MeditationStep({ script, theme, onComplete }: MeditationStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAmbientMuted, setIsAmbientMuted] = useState(false);
  const [musicStyle, setMusicStyle] = useState<MusicStyle>('inspirational');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedIndexRef = useRef<number | null>(null);

  // Use synthesized ambient audio to avoid cross-browser audio format and CORS issues
  useAmbientAudio(musicStyle, isAmbientMuted, hasStarted && !isPaused);

  const playLine = async (index: number) => {
    if (index >= script.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setHasStarted(false);
      return;
    }

    // If we already have this line loaded and we are just resuming
    if (loadedIndexRef.current === index && audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    setIsGenerating(true);
    try {
      const audioData = await generateSpeech(script[index]);
      if (audioData) {
        if (audioRef.current) {
          if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          audioRef.current.src = audioData;
          audioRef.current.load();
        }

        loadedIndexRef.current = index;

        if (audioRef.current) {
          audioRef.current.onended = () => {
            if (index + 1 < script.length) {
              setCurrentIndex(index + 1);
            } else {
              setIsPlaying(false);
              setIsPaused(false);
              setHasStarted(false);
            }
          };

          await audioRef.current.play();
          setIsPlaying(true);
          setIsPaused(false);
          setHasStarted(true);
        }
      } else {
        // Fallback if audio generation fails: just show text and wait a bit
        setIsPlaying(true);
        setIsPaused(false);
        setHasStarted(true);
        setTimeout(() => {
          if (index + 1 < script.length) {
            setCurrentIndex(index + 1);
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            setHasStarted(false);
          }
        }, 5000); // Wait 5 seconds for the user to read
      }
    } catch (error) {
      console.error("Meditation audio error:", error);
      setIsPlaying(false);
      setIsPaused(false);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (hasStarted && !isPaused) {
      playLine(currentIndex);
    }
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);

  const handleStart = () => {
    // Synchronously unlock audio elements on user interaction
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
      }).catch(() => {});
    }
    playLine(currentIndex);
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    if (audioRef.current && loadedIndexRef.current === currentIndex) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      playLine(currentIndex);
    }
  };

  return (
    <div className="flex flex-col items-center text-center w-full max-w-md">
      <div className="flex items-center justify-between w-full mb-4 px-4 relative">
        <div className="flex items-center">
          <div className="relative group">
            <select 
              value={musicStyle}
              onChange={(e) => setMusicStyle(e.target.value as MusicStyle)}
              className="bg-theme-card border border-theme-border text-theme-text text-xs rounded-full pl-8 pr-3 py-1.5 outline-none focus:ring-1 focus:ring-theme-accent appearance-none cursor-pointer transition-colors hover:border-theme-accent"
            >
              <option value="inspirational">Inspirational</option>
              <option value="emotional">Emotional</option>
              <option value="motivational">Motivational</option>
              <option value="nature">Nature Sounds</option>
            </select>
            <Music className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-theme-accent transition-colors" />
          </div>
        </div>
        
        <p className="text-theme-accent text-xs font-bold uppercase tracking-widest absolute left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block">
          Guided Meditation
        </p>
        
        <button 
          onClick={() => setIsAmbientMuted(!isAmbientMuted)}
          className="w-10 h-10 rounded-full bg-theme-card border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-accent transition-colors z-10"
          title={isAmbientMuted ? "Unmute Background" : "Mute Background"}
        >
          {isAmbientMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-12 leading-tight">
        {theme}
      </h2>

      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        {/* Breathing Circle */}
        <motion.div 
          animate={{ 
            scale: isPlaying ? [1, 1.4, 1] : 1,
            opacity: isPlaying ? [0.2, 0.4, 0.2] : 0.2
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-theme-accent rounded-full"
        />
        <div className="relative z-10 bg-theme-card w-48 h-48 rounded-full border border-theme-border flex flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-theme-text/80 italic leading-relaxed"
            >
              {script[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-xs">
        {!hasStarted ? (
          <button 
            onClick={handleStart}
            disabled={isGenerating}
            className="w-full bg-theme-card border border-theme-border p-4 rounded-2xl flex items-center justify-center gap-2 text-theme-text hover:opacity-80 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isGenerating ? 'Loading...' : 'Start Guidance'}
          </button>
        ) : (
          <div className="flex gap-4">
            {isPlaying ? (
              <button 
                onClick={handlePause}
                disabled={isGenerating}
                className="flex-1 bg-theme-card border border-theme-border p-4 rounded-2xl flex items-center justify-center gap-2 text-theme-text hover:opacity-80 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pause className="w-5 h-5" />}
                {isGenerating ? 'Loading...' : 'Pause'}
              </button>
            ) : (
              <button 
                onClick={handleResume}
                className="flex-1 bg-theme-card border border-theme-border p-4 rounded-2xl flex items-center justify-center gap-2 text-theme-text hover:opacity-80 transition-all"
              >
                <Play className="w-5 h-5" /> Resume
              </button>
            )}
          </div>
        )}

        <button 
          onClick={onComplete}
          className="w-full bg-theme-accent text-theme-bg font-bold py-5 rounded-2xl hover:opacity-90 transition-all"
        >
          I'm Centered
        </button>
      </div>

      <div className="mt-8 flex gap-1">
        {script.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-4 bg-theme-accent' : 'w-1 bg-theme-border'
            }`} 
          />
        ))}
      </div>
      
      {/* Hidden audio elements to ensure browser compatibility and autoplay policies */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
