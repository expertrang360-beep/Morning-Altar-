import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Loader2, ChevronRight, Play, Pause } from 'lucide-react';
import { generateSpeech } from '../services/ttsService';

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedIndexRef = useRef<number | null>(null);

  const playLine = async (index: number) => {
    if (index >= script.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setHasStarted(false);
      return;
    }

    // If we already have this line loaded and we are just resuming
    if (loadedIndexRef.current === index && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    setIsGenerating(true);
    try {
      const audioData = await generateSpeech(script[index]);
      if (audioData) {
        if (audioRef.current) {
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          audioRef.current.src = audioData;
        } else {
          audioRef.current = new Audio(audioData);
        }

        loadedIndexRef.current = index;

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
      <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">Guided Meditation</p>
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
          className="absolute inset-0 bg-amber-500 rounded-full"
        />
        <div className="relative z-10 bg-zinc-900 w-48 h-48 rounded-full border border-zinc-800 flex flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-zinc-300 italic leading-relaxed"
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
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
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
                className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pause className="w-5 h-5" />}
                {isGenerating ? 'Loading...' : 'Pause'}
              </button>
            ) : (
              <button 
                onClick={handleResume}
                className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-white hover:bg-zinc-800 transition-all"
              >
                <Play className="w-5 h-5" /> Resume
              </button>
            )}
          </div>
        )}

        <button 
          onClick={onComplete}
          className="w-full bg-amber-500 text-black font-bold py-5 rounded-2xl hover:bg-amber-400 transition-all"
        >
          I'm Centered
        </button>
      </div>

      <div className="mt-8 flex gap-1">
        {script.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-4 bg-amber-500' : 'w-1 bg-zinc-800'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
