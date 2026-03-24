import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Flame, Play, History, Settings as SettingsIcon, Search, BookOpen, X, Volume2, Book, Loader2, Wind, Quote, Gift, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { UserData, Devotion } from '../types';
import { devotions } from '../data/devotions';
import { calculateDailyReading, calculatePlanProgress } from '../data/biblePlanHelper';
import { christianQuotes } from '../data/quotes';
import { generateSpeech } from '../services/ttsService';
import { MeditationStep } from './MeditationStep';
import { Settings } from './Settings';
import { PrayerRequests } from './PrayerRequests';
import { VerseOfTheDay } from './VerseOfTheDay';
import { Rewards } from './Rewards';
import { TriviaQuiz } from './TriviaQuiz';

interface HomeProps {
  userData: UserData;
  onStartDevotion: () => void;
  onNavigateBible: (book?: string, chapter?: number) => void;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

export function Home({ userData, onStartDevotion, onNavigateBible, onUpdateUserData }: HomeProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isCompletedToday = userData.lastCompletedDate === new Date().toISOString().split('T')[0];

  const dailyReading = useMemo(() => {
    return calculateDailyReading(userData.studyPlanStartDate, userData.studyPlan);
  }, [userData.studyPlanStartDate, userData.studyPlan]);

  const dailyQuote = useMemo(() => {
    // Use the current date to pick a consistent quote for the day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return christianQuotes[dayOfYear % christianQuotes.length];
  }, []);

  const planProgress = useMemo(() => {
    return calculatePlanProgress(userData.studyPlanStartDate, userData.studyPlan);
  }, [userData.studyPlanStartDate, userData.studyPlan]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevotion, setSelectedDevotion] = useState<Devotion | null>(null);
  const [activeMeditation, setActiveMeditation] = useState<Devotion | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).setHours(0,0,0,0);
  };

  const isQuizCompletedThisWeek = useMemo(() => {
    if (!userData.lastQuizDate) return false;
    return getStartOfWeek(new Date(userData.lastQuizDate)) === getStartOfWeek(new Date());
  }, [userData.lastQuizDate]);

  const handlePlayAudio = async (devotion: Devotion) => {
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
          audioRef.current.play();
        } else {
          const audio = new Audio(audioData);
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

  const filteredDevotions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length === 0) return [];

    return devotions.filter(d => {
      const searchableText = [
        d.theme || '',
        d.scripture?.reference || '',
        d.affirmation || '',
        ...(d.scripture?.verses || [])
      ].join(' ').toLowerCase();

      return keywords.every(keyword => searchableText.includes(keyword));
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text p-6 pb-32 font-sans">
      <header className="flex justify-between items-center mb-8 mt-4">
        <div>
          <p className="text-theme-muted text-sm font-medium uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {userData.username ? `Good morning, ${userData.username}` : 'Morning Altar'}
          </h1>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-theme-card flex items-center justify-center border border-theme-border hover:opacity-80 transition-colors"
        >
          <SettingsIcon className="w-5 h-5 text-theme-muted" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
        <input 
          type="text"
          placeholder="Search scriptures, themes, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-theme-card/50 border border-theme-border rounded-2xl py-4 pl-12 pr-4 text-theme-text focus:outline-none focus:border-theme-accent/50 transition-colors"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-theme-muted" />
          </button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchQuery.trim() !== '' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-12 space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest">Search Results ({filteredDevotions.length})</h3>
            </div>
            {filteredDevotions.length === 0 ? (
              <div className="p-8 text-center bg-theme-card/30 border border-dashed border-theme-border rounded-3xl">
                <p className="text-theme-muted text-sm italic">No scriptures found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDevotions.map((devotion) => (
                  <button 
                    key={devotion.id}
                    onClick={() => setSelectedDevotion(devotion)}
                    className="bg-theme-card/80 border border-theme-border p-5 rounded-3xl text-left hover:border-theme-accent/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-theme-accent text-xs font-bold uppercase tracking-widest">{devotion.theme}</p>
                      <BookOpen className="w-4 h-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                    </div>
                    <p className="text-theme-text/80 text-sm font-medium mb-1">{devotion.scripture.reference}</p>
                    <p className="text-theme-muted text-xs line-clamp-1 italic">"{devotion.affirmation}"</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {searchQuery.trim() === '' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-theme-card/50 border border-theme-border p-6 rounded-3xl flex flex-col items-center text-center"
            >
              <Flame className={`w-8 h-8 mb-2 ${userData.streak > 0 ? 'text-theme-accent' : 'text-theme-muted'}`} />
              <p className="text-2xl font-bold">{userData.streak}</p>
              <p className="text-xs text-theme-muted uppercase tracking-wider font-medium">Day Streak</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-theme-card/50 border border-theme-border p-6 rounded-3xl flex flex-col items-center text-center"
            >
              <Calendar className="w-8 h-8 mb-2 text-theme-accent" />
              <p className="text-2xl font-bold">{userData.reflections.length}</p>
              <p className="text-xs text-theme-muted uppercase tracking-wider font-medium">Total Altars</p>
            </motion.div>
          </div>

          {dailyReading && planProgress && (
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                  <Book className="w-4 h-4" /> Daily Bible Reading
                </h3>
                <span className="text-[10px] bg-theme-accent/10 text-theme-accent px-2 py-1 rounded-full font-bold uppercase tracking-tighter">
                  {userData.studyPlan === '6months' ? '6 Months' : userData.studyPlan === '1year' ? '1 Year' : '2 Years'} Plan
                </span>
              </div>

              <div className="bg-theme-card/80 border border-theme-border p-6 rounded-[2rem] mb-4">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-theme-muted text-xs font-medium uppercase tracking-wider mb-1">Plan Progress</p>
                    <p className="text-lg font-bold text-theme-text">Week {planProgress.week} of {planProgress.totalWeeks}</p>
                  </div>
                  <p className="text-theme-accent font-bold text-2xl">{planProgress.percentage}%</p>
                </div>
                <div className="h-2 w-full bg-theme-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-theme-accent rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${planProgress.percentage}%` }}
                  />
                </div>
                <p className="text-theme-muted text-xs mt-3 text-right">Day {planProgress.day} of {planProgress.totalDays}</p>
              </div>

              <button 
                onClick={() => onNavigateBible(dailyReading.startBook, dailyReading.startChapter)}
                className="w-full bg-theme-card/80 border border-theme-border p-6 rounded-[2rem] flex items-center justify-between hover:bg-theme-card transition-colors group"
              >
                <div className="text-left">
                  <p className="text-theme-muted text-xs mb-1">Today's Portion</p>
                  <h4 className="text-xl font-bold text-theme-text group-hover:text-theme-accent transition-colors">
                    {dailyReading.startBook} {dailyReading.startChapter}
                    {dailyReading.chapters.length > 1 && ` - ${dailyReading.endBook} ${dailyReading.endChapter}`}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center group-hover:bg-theme-accent/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-theme-accent" />
                </div>
              </button>
            </section>
          )}

          {/* Weekly Trivia Section */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Weekly Trivia
              </h3>
            </div>
            
            <button 
              onClick={() => !isQuizCompletedThisWeek && setShowTrivia(true)}
              disabled={isQuizCompletedThisWeek}
              className={`w-full border p-6 rounded-[2rem] flex items-center justify-between transition-colors group ${
                isQuizCompletedThisWeek 
                  ? 'bg-theme-card/30 border-theme-border/50 cursor-default' 
                  : 'bg-theme-card/80 border-theme-border hover:bg-theme-card'
              }`}
            >
              <div className="text-left">
                <p className="text-theme-muted text-xs mb-1">
                  {isQuizCompletedThisWeek ? 'Completed' : 'Test Your Knowledge'}
                </p>
                <h4 className={`text-xl font-bold transition-colors ${
                  isQuizCompletedThisWeek ? 'text-theme-muted' : 'text-theme-text group-hover:text-theme-accent'
                }`}>
                  {isQuizCompletedThisWeek ? 'Come back next week!' : '5 Questions'}
                </h4>
                {!isQuizCompletedThisWeek && (
                  <p className="text-theme-accent text-xs font-bold mt-2">Get 5/5 for +2 Points!</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${
                isQuizCompletedThisWeek 
                  ? 'bg-theme-accent/10 border-theme-accent/20' 
                  : 'bg-theme-accent/10 border-theme-accent/20 group-hover:bg-theme-accent/20'
              }`}>
                {isQuizCompletedThisWeek ? (
                  <CheckCircle2 className="w-6 h-6 text-theme-accent" />
                ) : (
                  <BrainCircuit className="w-6 h-6 text-theme-accent" />
                )}
              </div>
            </button>
          </section>

          <section className="mb-8 overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                <Wind className="w-4 h-4" /> Guided Meditations
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {devotions.filter(d => d.meditationScript).map((devotion) => (
                <button
                  key={devotion.id}
                  onClick={() => setActiveMeditation(devotion)}
                  className="flex-shrink-0 w-48 bg-theme-card/50 border border-theme-border p-5 rounded-3xl text-left hover:border-theme-accent/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center mb-4 group-hover:bg-theme-accent/20 transition-colors">
                    <Wind className="w-5 h-5 text-theme-accent" />
                  </div>
                  <h4 className="text-sm font-bold text-theme-text/90 mb-1 line-clamp-1">{devotion.theme}</h4>
                  <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold">5 Min Session</p>
                </button>
              ))}
            </div>
          </section>

          <div className="relative mb-12">
            <div className="absolute inset-0 bg-theme-accent/10 blur-3xl rounded-full" />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-theme-card border border-theme-border p-8 rounded-[2.5rem] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center mb-6 border border-theme-accent/20">
                  <Play className="w-6 h-6 text-theme-accent fill-theme-accent" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {isCompletedToday ? "Altar Completed" : "Today's Altar is Ready"}
                </h2>
                <p className="text-theme-muted text-sm mb-8 max-w-[200px]">
                  {isCompletedToday 
                    ? "You've already met with God today. Great job!" 
                    : "Dedicate the next 10 minutes to God before the noise begins."}
                </p>
                
                {!isCompletedToday && (
                  <button 
                    onClick={onStartDevotion}
                    className="w-full bg-theme-accent text-theme-bg font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-[0_0_30px_rgba(var(--accent),0.2)] active:scale-95"
                  >
                    Start Today's Altar
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          <VerseOfTheDay />

          <section className="mb-12">
            <div className="bg-theme-card/50 border border-theme-border p-6 rounded-3xl relative overflow-hidden">
              <Quote className="absolute -top-2 -left-2 w-16 h-16 text-theme-muted/20 rotate-180" />
              <div className="relative z-10">
                <p className="text-lg font-serif italic text-theme-text/90 mb-4 leading-relaxed">
                  "{dailyQuote.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[1px] bg-theme-accent/50" />
                  <p className="text-xs font-bold text-theme-accent uppercase tracking-widest">{dailyQuote.author}</p>
                </div>
              </div>
            </div>
          </section>

          <PrayerRequests userData={userData} onUpdateUserData={onUpdateUserData} />

          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-theme-accent" />
                Recent Reflections
              </h3>
              <button className="text-theme-accent text-sm font-medium">View All</button>
            </div>

            <div className="space-y-4">
              {userData.reflections.length === 0 ? (
                <div className="p-8 text-center bg-theme-card/30 border border-dashed border-theme-border rounded-3xl">
                  <p className="text-theme-muted text-sm italic">Your reflections will appear here.</p>
                </div>
              ) : (
                userData.reflections.slice(0, 3).map((ref, i) => (
                  <div key={i} className="bg-theme-card/50 border border-theme-border p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-theme-accent text-xs font-bold uppercase tracking-widest">{ref.theme}</p>
                      <p className="text-theme-muted text-[10px] font-medium">{new Date(ref.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-theme-text/80 text-sm line-clamp-2 leading-relaxed">{ref.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* Devotion Detail Modal */}
      <AnimatePresence>
        {selectedDevotion && (
          <div className="fixed inset-0 bg-theme-bg z-[100] overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="min-h-screen p-8 flex flex-col"
            >
              <header className="flex justify-end mb-8">
                <button 
                  onClick={() => setSelectedDevotion(null)}
                  className="w-12 h-12 rounded-full bg-theme-card border border-theme-border flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-theme-muted" />
                </button>
              </header>

              <div className="max-w-md mx-auto w-full flex-1">
                <p className="text-theme-accent text-xs font-bold uppercase tracking-widest mb-2">{selectedDevotion.theme}</p>
                <h2 className="text-4xl font-bold mb-8 tracking-tight">{selectedDevotion.theme}</h2>
                
                <section className="mb-12">
                  <h3 className="text-theme-muted text-xs font-bold uppercase tracking-widest mb-4">Affirmation</h3>
                  <p className="text-2xl font-serif italic leading-relaxed text-theme-text/90">
                    "{selectedDevotion.affirmation}"
                  </p>
                </section>

                <section className="mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-theme-muted text-xs font-bold uppercase tracking-widest">Scripture</h3>
                    <p className="text-theme-accent text-xs font-bold">{selectedDevotion.scripture.reference}</p>
                  </div>
                  <div className="space-y-6 text-theme-text/90">
                    {selectedDevotion.scripture.verses.map((verse, i) => (
                      <p key={i} className="text-xl leading-relaxed font-light">
                        {verse}
                      </p>
                    ))}
                  </div>
                </section>

                <section className="mb-12 p-6 bg-theme-card/50 border border-theme-border rounded-3xl">
                  <h3 className="text-theme-muted text-xs font-bold uppercase tracking-widest mb-4">Reflection Prompt</h3>
                  <p className="text-lg font-medium text-theme-text/90">
                    {selectedDevotion.reflectionPrompt}
                  </p>
                </section>

                <button 
                  onClick={() => handlePlayAudio(selectedDevotion)}
                  disabled={isGeneratingAudio}
                  className="w-full bg-theme-card border border-theme-border p-5 rounded-2xl flex items-center justify-center gap-3 text-theme-muted hover:text-theme-text transition-colors mb-12 disabled:opacity-50"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                  {isGeneratingAudio ? 'Generating Audio...' : 'Listen to Devotion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meditation Modal */}
      <AnimatePresence>
        {activeMeditation && (
          <div className="fixed inset-0 bg-theme-bg z-[200] flex flex-col items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              <header className="w-full flex justify-end mb-8">
                <button 
                  onClick={() => setActiveMeditation(null)}
                  className="w-12 h-12 rounded-full bg-theme-card border border-theme-border flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-theme-muted" />
                </button>
              </header>
              
              <MeditationStep 
                script={activeMeditation.meditationScript!} 
                theme={activeMeditation.theme}
                onComplete={() => setActiveMeditation(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-theme-bg via-theme-bg/90 to-transparent z-50">
        <div className="max-w-md mx-auto bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-full p-2 flex justify-around items-center shadow-2xl">
          <button 
            onClick={() => {
              setSearchQuery('');
              // If we were in bible view, App.tsx handles the state back to home
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${searchQuery === '' ? 'bg-theme-accent text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`}
          >
            <Play className={`w-5 h-5 ${searchQuery === '' ? 'fill-theme-bg' : ''}`} />
          </button>
          <button 
            onClick={() => onNavigateBible()}
            className="w-12 h-12 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors">
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowRewards(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-accent transition-colors"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showSettings && (
          <Settings 
            userData={userData}
            onClose={() => setShowSettings(false)}
            onUpdate={onUpdateUserData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRewards && (
          <Rewards 
            userData={userData}
            onClose={() => setShowRewards(false)}
            onUpdateUserData={onUpdateUserData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrivia && (
          <TriviaQuiz 
            onClose={() => setShowTrivia(false)}
            onComplete={(score) => {
              // We need to pass completeQuiz from App to Home, or we can just update UserData here.
              // Wait, Home doesn't have completeQuiz. I need to update UserData directly or pass completeQuiz.
              // Let's update UserData directly here since we have onUpdateUserData.
              const newPoints = (userData.points || 0) + (score === 5 ? 2 : 0);
              onUpdateUserData({
                points: newPoints,
                lastQuizDate: new Date().toISOString()
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
