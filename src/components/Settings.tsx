import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Clock, Bell, BookOpen, HelpCircle, Mail, Globe, ExternalLink, ChevronRight, User, Palette, Heart } from 'lucide-react';
import { UserData, StudyPlanType, ThemeId, DevotionPlanType } from '../types';

interface SettingsProps {
  userData: UserData;
  onClose: () => void;
  onUpdate: (updates: Partial<UserData>) => void;
}

export function Settings({ userData, onClose, onUpdate }: SettingsProps) {
  const [time, setTime] = useState(userData.devotionTime);
  const [studyPlan, setStudyPlan] = useState<StudyPlanType>(userData.studyPlan);
  const [devotionPlan, setDevotionPlan] = useState<DevotionPlanType>(userData.devotionPlan || 'Faith');
  const [username, setUsername] = useState(userData.username || '');
  const [email, setEmail] = useState(userData.email || '');
  const [themeId, setThemeId] = useState<ThemeId>(userData.themeId || 'classic');
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
      devotionPlan: devotionPlan,
      username: username,
      email: email,
      themeId: themeId,
    };

    if (studyPlan !== userData.studyPlan) {
      updates.studyPlanStartDate = studyPlan !== 'none' ? new Date().toISOString() : null;
    }

    onUpdate(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-theme-bg border border-theme-border p-8 rounded-[2rem] w-full max-w-sm flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <h2 className="text-2xl font-bold text-theme-text">Settings</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-theme-card flex items-center justify-center hover:opacity-80 transition-colors"
          >
            <X className="w-5 h-5 text-theme-muted" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 pb-4 flex-1 custom-scrollbar">
          {/* Profile */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <User className="w-4 h-4" /> Profile
            </label>
            <div className="space-y-3">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-theme-card border border-theme-border rounded-2xl p-4 text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
              />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Recovery Email (Optional)"
                className="w-full bg-theme-card border border-theme-border rounded-2xl p-4 text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Devotion Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <Clock className="w-4 h-4" /> Daily Reminder Time
            </label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-theme-card border border-theme-border rounded-2xl p-4 text-2xl text-center text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
            />
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <Bell className="w-4 h-4" /> Notifications
            </label>
            <button 
              onClick={requestNotifications}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                notificationsGranted 
                  ? 'bg-theme-accent/10 border-theme-accent/20 text-theme-accent' 
                  : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
              }`}
            >
              <span className="font-medium">
                {notificationsGranted ? 'Notifications Enabled' : 'Enable Notifications'}
              </span>
              <Bell className="w-5 h-5" />
            </button>
            {!notificationsGranted && (
              <p className="text-xs text-theme-muted mt-2">
                Enable notifications to receive your daily reminder.
              </p>
            )}
          </div>

          {/* Study Plan */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
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
                      ? 'bg-theme-accent border-theme-accent text-theme-bg font-bold' 
                      : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Devotion Plan */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <Heart className="w-4 h-4" /> Daily Devotion Theme
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'Faith', label: 'Faith', desc: 'Build your trust and belief in God.' },
                { id: 'Discipline', label: 'Discipline', desc: 'Cultivate consistency and spiritual habits.' },
                { id: 'Purpose', label: 'Purpose', desc: 'Discover and walk in your God-given calling.' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDevotionPlan(p.id as DevotionPlanType)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    devotionPlan === p.id 
                      ? 'bg-theme-accent border-theme-accent text-theme-bg' 
                      : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
                  }`}
                >
                  <span className="font-bold text-sm">{p.label}</span>
                  <span className="text-xs opacity-80">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <Palette className="w-4 h-4" /> App Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'classic', label: 'Classic Dark', preview: '#000' },
                { id: 'dawn', label: 'Morning Dawn', preview: '#fdfcfb' },
                { id: 'forest', label: 'Quiet Forest', preview: '#0b1a10' },
                { id: 'midnight', label: 'Midnight', preview: '#020617' },
                { id: 'sepia', label: 'Ancient Scroll', preview: '#f4ecd8' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id as ThemeId)}
                  className={`p-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                    themeId === t.id 
                      ? 'bg-theme-accent border-theme-accent text-theme-bg font-bold' 
                      : 'bg-theme-card border-theme-border text-theme-muted hover:opacity-80'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-theme-text/20" 
                    style={{ backgroundColor: t.preview }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Support & Contact */}
          <div className="pt-4 border-t border-theme-border">
            <label className="flex items-center gap-2 text-sm font-bold text-theme-muted uppercase tracking-widest mb-3">
              <HelpCircle className="w-4 h-4" /> Support & Contact
            </label>
            <div className="space-y-3">
              <a 
                href="mailto:smarttechpro2021@gmail.com"
                className="w-full p-4 rounded-2xl bg-theme-card border border-theme-border text-theme-text/80 hover:opacity-80 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-theme-accent" />
                  <span className="font-medium text-sm">Email Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted" />
              </a>
              
              <a 
                href="https://smarttechprotech.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl bg-theme-card border border-theme-border text-theme-text/80 hover:opacity-80 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-theme-accent" />
                  <span className="font-medium text-sm">Visit Our Website</span>
                </div>
                <ExternalLink className="w-4 h-4 text-theme-muted" />
              </a>

              <div className="bg-theme-accent/10 border border-theme-accent/20 p-4 rounded-2xl mt-4">
                <p className="text-xs text-theme-accent/90 leading-relaxed">
                  <strong className="font-bold">Claiming Gifts:</strong> To claim your rewards, please take a screenshot of your dashboard showing your points and email it to us!
                </p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 flex-shrink-0 bg-theme-accent text-theme-bg font-bold py-4 rounded-2xl hover:opacity-90 transition-colors"
        >
          Save Changes
        </button>
      </motion.div>
    </div>
  );
}
