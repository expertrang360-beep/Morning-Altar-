import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Clock, Timer, Mic, Bell, BookOpen } from 'lucide-react';
import { StudyPlanType } from '../types';

interface OnboardingProps {
  onComplete: (time: string, length: number, studyPlan: StudyPlanType) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [time, setTime] = useState('06:00');
  const [length, setLength] = useState(10);
  const [studyPlan, setStudyPlan] = useState<StudyPlanType>('none');
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  useEffect(() => {
    // Check notifications
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
    
    // Check mic - using navigator.permissions if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setNotificationsGranted(prev => {
          // Re-check notifications just in case
          if ('Notification' in window) {
            return Notification.permission === 'granted';
          }
          return prev;
        });
        setMicGranted(result.state === 'granted');
        
        result.onchange = () => {
          setMicGranted(result.state === 'granted');
        };
      }).catch(() => {
        // Fallback if query fails
      });
    }
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission === 'granted');
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicGranted(true);
    } catch (err) {
      console.error("Mic permission denied", err);
      setMicGranted(false);
    }
  };

  const steps = [
    {
      title: "Meet God before the noise",
      description: "Morning Altar is your sacred space to start the day with intention, scripture, and reflection.",
      icon: <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
    },
    {
      title: "Set Your Altar Time",
      description: "Choose a time for your daily reminder. We'll help you stay consistent.",
      icon: <Clock className="w-16 h-16 text-amber-500 mb-8" />,
      content: (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-4xl text-center text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      )
    },
    {
      title: "Session Length",
      description: "How much time would you like to dedicate each morning?",
      icon: <Timer className="w-16 h-16 text-amber-500 mb-8" />,
      content: (
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[5, 10, 15].map((l) => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={`p-4 rounded-2xl border transition-all ${
                length === l 
                  ? 'bg-amber-500 border-amber-500 text-black font-bold' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {l}m
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Bible Study Plan",
      description: "Would you like to follow a plan to read through the entire Bible?",
      icon: <BookOpen className="w-16 h-16 text-amber-500 mb-8" />,
      content: (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {[
            { id: '6months', label: '6 Months' },
            { id: '1year', label: '1 Year' },
            { id: '2years', label: '2 Years' },
            { id: 'none', label: 'No Plan' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setStudyPlan(p.id as StudyPlanType)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                studyPlan === p.id 
                  ? 'bg-amber-500 border-amber-500 text-black font-bold' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Ready to Begin",
      description: "To provide the best experience, we need access to notifications and your microphone for the read-aloud feature.",
      icon: <div className="flex gap-4 mb-8">
              <Bell className={`w-12 h-12 ${notificationsGranted ? 'text-emerald-500' : 'text-amber-500'}`} />
              <Mic className={`w-12 h-12 ${micGranted ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>,
      content: (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={requestNotifications}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                notificationsGranted 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Bell className="w-6 h-6" />
              <span className="text-xs font-medium">Notifications</span>
            </button>
            <button 
              onClick={requestMic}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                micGranted 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Mic className="w-6 h-6" />
              <span className="text-xs font-medium">Microphone</span>
            </button>
          </div>
          
          <button 
            onClick={() => onComplete(time, length, studyPlan)}
            disabled={!notificationsGranted && !micGranted}
            className={`w-full mt-4 font-bold py-4 rounded-2xl transition-all ${
              notificationsGranted || micGranted
                ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Continue to my day
          </button>
        </div>
      )
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col items-center text-center max-w-md w-full"
        >
          {currentStep.icon}
          <h1 className="text-3xl font-bold mb-4 tracking-tight">{currentStep.title}</h1>
          <p className="text-zinc-400 mb-12 leading-relaxed">{currentStep.description}</p>
          
          {currentStep.content}

          {step < steps.length - 1 && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="mt-12 flex items-center gap-2 text-amber-500 font-medium hover:text-amber-400 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-12 flex gap-2">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${
              i === step ? 'w-8 bg-amber-500' : 'w-2 bg-zinc-800'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
