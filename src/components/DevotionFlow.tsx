import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Mic, CheckCircle2, Volume2, Flame, Loader2, Eye, EyeOff } from 'lucide-react';
import { Devotion } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { generateSpeech } from '../services/ttsService';
import { MeditationStep } from './MeditationStep';

interface DevotionFlowProps {
  devotion: Devotion;
  streak: number;
  onComplete: (reflection: string) => void;
  onExit: () => void;
}

export function DevotionFlow({ devotion, streak, onComplete, onExit }: DevotionFlowProps) {
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const { isListening, transcript, startListening } = useSpeech();
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (transcript.length > 10) {
      setIsSpeechDetected(true);
    }
  }, [transcript]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handlePlayAudio = async () => {
    if (isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    try {
      const textToSpeak = `${devotion.theme}. ${devotion.scripture.reference}. ${devotion.scripture.verses.join(' ')}`;
      const audioData = await generateSpeech(textToSpeak);
      
      if (audioData) {
        if (audioRef.current) {
          // Cleanup old URL if it was a blob URL
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          audioRef.current.src = audioData;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioData);
          audio.playbackRate = playbackSpeed;
          audioRef.current = audio;
          audio.play();
        }
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const steps = [
    {
      id: 'opening',
      title: devotion.theme,
      subtitle: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      content: (
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">{devotion.theme}</h1>
          <p className="text-zinc-400 text-lg mb-12">Take a deep breath. God is with you.</p>
          <button 
            onClick={() => setStep(1)}
            className="w-full max-w-xs bg-amber-500 text-black font-bold py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            Start Today's Altar
          </button>
        </div>
      )
    },
    {
      id: 'affirmation',
      title: 'Daily Affirmation',
      content: (
        <div className="flex flex-col items-center text-center max-w-md">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-8">Declare This</p>
          <h2 className="text-3xl font-serif italic leading-relaxed mb-12 text-zinc-100">
            "{devotion.affirmation}"
          </h2>
          <button 
            onClick={() => setStep(2)}
            className="w-full max-w-xs bg-zinc-900 border border-zinc-800 text-white font-bold py-5 rounded-2xl hover:bg-zinc-800 transition-all"
          >
            I've Declared This
          </button>
        </div>
      )
    },
    {
      id: 'scripture',
      title: 'Scripture Reading',
      content: (
        <div className="flex flex-col items-center text-center max-w-md">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">{devotion.scripture.reference}</p>
          <div className="space-y-6 mb-12 text-left">
            {devotion.scripture.verses.map((verse, i) => (
              <p key={i} className="text-xl leading-relaxed text-zinc-200 font-light">
                {verse}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="flex gap-4 w-full">
              <button 
                onClick={handlePlayAudio}
                disabled={isGeneratingAudio}
                className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
                {isGeneratingAudio ? 'Generating...' : 'Play Audio'}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex-1 bg-amber-500 text-black font-bold p-4 rounded-2xl hover:bg-amber-400 transition-all"
              >
                Continue
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Speed:</span>
              {[0.75, 1, 1.25].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${
                    playbackSpeed === speed 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'read-aloud',
      title: 'Read Aloud',
      content: (
        <div className="flex flex-col items-center text-center max-w-md">
          <p className="text-zinc-400 text-sm mb-8">Read this verse aloud to God</p>
          <h2 className="text-2xl font-serif italic leading-relaxed mb-12 text-zinc-100">
            "{devotion.readAloudVerse}"
          </h2>
          
          <div className="flex flex-col items-center gap-6 w-full">
            <button 
              onClick={startListening}
              disabled={isListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' 
                  : 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]'
              }`}
            >
              <Mic className={`w-8 h-8 ${isListening ? 'text-red-500' : 'text-black'}`} />
            </button>
            
            <p className="text-zinc-500 text-sm h-6">
              {isListening ? "Listening..." : isSpeechDetected ? "Speech detected" : "Tap to speak"}
            </p>

            <button 
              disabled={!isSpeechDetected}
              onClick={() => setStep(prev => prev + 1)}
              className={`w-full max-w-xs font-bold py-5 rounded-2xl transition-all ${
                isSpeechDetected 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )
    },
    ...(devotion.meditationScript ? [{
      id: 'meditation',
      title: 'Guided Meditation',
      content: (
        <MeditationStep 
          script={devotion.meditationScript} 
          theme={devotion.theme}
          onComplete={() => setStep(prev => prev + 1)}
        />
      )
    }] : []),
    {
      id: 'reflection',
      title: 'Reflection',
      content: (
        <div className="flex flex-col items-center text-center w-full max-w-md">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">God is Listening</p>
          <h2 className="text-2xl font-bold mb-8 leading-tight">
            {devotion.reflectionPrompt}
          </h2>
          
          <textarea 
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your reflection here..."
            className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-colors resize-none mb-8"
          />

          <button 
            disabled={reflection.length < 5}
            onClick={() => setStep(prev => prev + 1)}
            className={`w-full max-w-xs font-bold py-5 rounded-2xl transition-all ${
              reflection.length >= 5 
                ? 'bg-amber-500 text-black hover:bg-amber-400' 
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Complete Today's Altar
          </button>
        </div>
      )
    },
    {
      id: 'completion',
      title: 'Altar Completed',
      content: (
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-amber-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Well done, faithful one.</h1>
          <p className="text-zinc-400 mb-12">You've completed today's altar.</p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 mb-12 w-full max-w-xs">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">{streak + 1}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Day Streak</p>
            </div>
          </div>

          <button 
            onClick={() => onComplete(reflection)}
            className="w-full max-w-xs bg-amber-500 text-black font-bold py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            Continue to My Day
          </button>
        </div>
      )
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center p-8 overflow-hidden z-50">
      {/* Focus Mode Background */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)] animate-pulse" />
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_50%)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`w-full flex justify-between items-center mb-12 z-10 transition-all duration-500 ${isFocusMode ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Step {step + 1} <span className="text-zinc-700 mx-1">/</span> {steps.length}
          </p>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'w-6 bg-amber-500' : 'w-2 bg-zinc-800'
                }`} 
              />
            ))}
          </div>
        </div>
        <button 
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </header>

      {/* Focus Mode Toggle */}
      <button 
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 flex items-center justify-center z-[60] transition-all hover:bg-zinc-800 ${isFocusMode ? 'text-amber-500 border-amber-500/30' : 'text-zinc-500'}`}
      >
        {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 flex flex-col items-center justify-center w-full"
        >
          {currentStep.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
