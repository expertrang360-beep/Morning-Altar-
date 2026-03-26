import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Clock, Timer, Mic, Bell, BookOpen, User, Mail, Heart } from 'lucide-react';
import { StudyPlanType, DevotionPlanType } from '../types';

interface OnboardingProps {
  onComplete: (time: string, length: number, studyPlan: StudyPlanType, username?: string, email?: string, devotionPlan?: DevotionPlanType) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [time, setTime] = useState('06:00');
  const [length, setLength] = useState(10);
  const [studyPlan, setStudyPlan] = useState<StudyPlanType>('none');
  const [devotionPlan, setDevotionPlan] = useState<DevotionPlanType>('Faith');
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
      icon: <div className="w-20 h-20 rounded-full bg-theme-accent/10 flex items-center justify-center mb-8 border border-theme-accent/20">
              <div className="w-12 h-12 rounded-full bg-theme-accent/20 flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 rounded-full bg-theme-accent shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.5)]" />
              </div>
            </div>
    },
    {
      title: "What should we call you?",
      description: "Enter a username to personalize your experience.",
      icon: <User className="w-16 h-16 text-theme-accent mb-8" />,
      content: (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-theme-card border border-theme-border rounded-2xl p-4 text-xl text-center text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
          />
        </div>
      )
    },
    {
      title: "Account Recovery",
      description: "Add an email address so you can recover your account if you lose access. This is optional.",
      icon: <Mail className="w-16 h-16 text-theme-accent mb-8" />,
      content: (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (Optional)"
            className="w-full bg-theme-card border border-theme-border rounded-2xl p-4 text-xl text-center text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
          />
        </div>
      )
    },
    {
      title: "Set Your Altar Time",
      description: "Choose a time for your daily reminder. We'll help you stay consistent.",
      icon: <Clock className="w-16 h-16 text-theme-accent mb-8" />,
      content: (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-theme-card border border-theme-border rounded-2xl p-6 text-4xl text-center text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
          />
        </div>
      )
    },
    {
      title: "Session Length",
      description: "How much time would you like to dedicate each morning?",
      icon: <Timer className="w-16 h-16 text-theme-accent mb-8" />,
      content: (
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[5, 10, 15].map((l) => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={`p-4 rounded-2xl border transition-all ${
                length === l 
                  ? 'bg-theme-accent border-theme-accent text-theme-bg font-bold' 
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
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
      icon: <BookOpen className="w-16 h-16 text-theme-accent mb-8" />,
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
                  ? 'bg-theme-accent border-theme-accent text-theme-bg font-bold' 
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Daily Devotion Theme",
      description: "Select a theme for your daily devotions. You can change this later in settings.",
      icon: <Heart className="w-16 h-16 text-theme-accent mb-8" />,
      content: (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {[
            { id: 'Faith', label: 'Faith', desc: 'Build your trust and belief in God.' },
            { id: 'Discipline', label: 'Discipline', desc: 'Cultivate consistency and spiritual habits.' },
            { id: 'Purpose', label: 'Purpose', desc: 'Discover and walk in your God-given calling.' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setDevotionPlan(p.id as DevotionPlanType)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                devotionPlan === p.id 
                  ? 'bg-theme-accent border-theme-accent text-theme-bg' 
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
              }`}
            >
              <span className="font-bold">{p.label}</span>
              <span className="text-sm opacity-80">{p.desc}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Ready to Begin",
      description: "To provide the best experience, we need access to notifications and your microphone for the read-aloud feature.",
      icon: <div className="flex gap-4 mb-8">
              <Bell className={`w-12 h-12 ${notificationsGranted ? 'text-emerald-500' : 'text-theme-accent'}`} />
              <Mic className={`w-12 h-12 ${micGranted ? 'text-emerald-500' : 'text-theme-accent'}`} />
            </div>,
      content: (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={requestNotifications}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                notificationsGranted 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
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
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
              }`}
            >
              <Mic className="w-6 h-6" />
              <span className="text-xs font-medium">Microphone</span>
            </button>
          </div>
          
          <button 
            onClick={() => onComplete(time, length, studyPlan, username, email, devotionPlan)}
            disabled={!notificationsGranted && !micGranted}
            className={`w-full mt-4 font-bold py-4 rounded-2xl transition-all ${
              notificationsGranted || micGranted
                ? 'bg-theme-accent text-theme-bg hover:opacity-90 shadow-[0_0_30px_rgba(var(--theme-accent-rgb),0.3)]'
                : 'bg-theme-card text-theme-muted cursor-not-allowed'
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
    <div className="fixed inset-0 bg-theme-bg text-theme-text flex flex-col items-center justify-center p-8 overflow-hidden">
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
          <p className="text-theme-muted mb-12 leading-relaxed">{currentStep.description}</p>
          
          {currentStep.content}

          {step < steps.length - 1 && (
            <button
              onClick={() => {
                if (step === 1 && !username.trim()) {
                  // Require username
                  return;
                }
                setStep(s => s + 1)
              }}
              disabled={step === 1 && !username.trim()}
              className={`mt-12 flex items-center gap-2 font-medium transition-colors ${
                step === 1 && !username.trim() ? 'text-theme-muted/50 cursor-not-allowed' : 'text-theme-accent hover:opacity-80'
              }`}
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
              i === step ? 'w-8 bg-theme-accent' : 'w-2 bg-theme-border'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
