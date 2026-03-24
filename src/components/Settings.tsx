import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Clock, Bell, BookOpen, HelpCircle, Mail, Globe, ExternalLink, ChevronRight } from 'lucide-react';
import { UserData, StudyPlanType } from '../types';

interface SettingsProps {
  userData: UserData;
  onClose: () => void;
  onUpdate: (updates: Partial<UserData>) => void;
}

export function Settings({ userData, onClose, onUpdate }: SettingsProps) {
  const [time, setTime] = useState(userData.devotionTime);
  const [studyPlan, setStudyPlan] = useState<StudyPlanType>(userData.studyPlan);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission === 'granted');
    }
  };

  const handleSave = () => {
    const updates: Partial<UserData> = {
      devotionTime: time,
      studyPlan: studyPlan,
    };

    if (studyPlan !== userData.studyPlan) {
      updates.studyPlanStartDate = studyPlan !== 'none' ? new Date().toISOString() : null;
    }

    onUpdate(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] w-full max-w-sm flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 pb-4 flex-1 custom-scrollbar">
          {/* Devotion Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
              <Clock className="w-4 h-4" /> Daily Reminder Time
            </label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-2xl text-center text-white focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
              <Bell className="w-4 h-4" /> Notifications
            </label>
            <button 
              onClick={requestNotifications}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                notificationsGranted 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <span className="font-medium">
                {notificationsGranted ? 'Notifications Enabled' : 'Enable Notifications'}
              </span>
              <Bell className="w-5 h-5" />
            </button>
            {!notificationsGranted && (
              <p className="text-xs text-zinc-500 mt-2">
                Enable notifications to receive your daily reminder.
              </p>
            )}
          </div>

          {/* Study Plan */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
              <BookOpen className="w-4 h-4" /> Bible Study Plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '6months', label: '6 Months' },
                { id: '1year', label: '1 Year' },
                { id: '2years', label: '2 Years' },
                { id: 'none', label: 'No Plan' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setStudyPlan(p.id as StudyPlanType)}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    studyPlan === p.id 
                      ? 'bg-amber-500 border-amber-500 text-black font-bold' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Support & Contact */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
              <HelpCircle className="w-4 h-4" /> Support & Contact
            </label>
            <div className="space-y-3">
              <a 
                href="mailto:smarttechpro2021@gmail.com"
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-sm">Email Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </a>
              
              <a 
                href="https://smarttechprotech.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-sm">Visit Our Website</span>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </a>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mt-4">
                <p className="text-xs text-amber-500/90 leading-relaxed">
                  <strong className="font-bold">Claiming Gifts:</strong> To claim your rewards, please take a screenshot of your dashboard showing your points and email it to us!
                </p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 flex-shrink-0 bg-amber-500 text-black font-bold py-4 rounded-2xl hover:bg-amber-400 transition-colors"
        >
          Save Changes
        </button>
      </motion.div>
    </div>
  );
}
