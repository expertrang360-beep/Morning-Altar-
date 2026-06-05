import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { useStorage } from './hooks/useStorage';
import { useDailyReminder } from './hooks/useDailyReminder';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { BibleReader } from './components/BibleReader';
import { DevotionFlow } from './components/DevotionFlow';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { devotions } from './data/devotions';

export default function App() {
  const { userData, updateOnboarding, completeDevotion, selectDailyDevotion, updateUserData } = useStorage();
  
  // Initialize daily reminder
  useDailyReminder(userData);

  const [currentView, setCurrentView] = useState<'home' | 'bible' | 'devotion'>('home');
  const [bibleInitial, setBibleInitial] = useState<{ book?: string; chapter?: number }>({});
  const [currentDevotion, setCurrentDevotion] = useState(devotions[0]);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500); // 3.5 seconds to allow animation to complete
    return () => clearTimeout(timer);
  }, []);

  // Select a devotion based on the day (random but stable for the day)
  useEffect(() => {
    if (userData.onboarded) {
      const selected = selectDailyDevotion();
      setCurrentDevotion(selected);
    }
  }, [userData.onboarded, selectDailyDevotion]);

  useEffect(() => {
    const themeClass = userData.themeId && userData.themeId !== 'classic' ? `theme-${userData.themeId}` : '';
    document.body.className = themeClass;
  }, [userData.themeId]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleStartDevotion = () => {
    setCurrentView('devotion');
  };

  const handleCompleteDevotion = (reflection: string) => {
    completeDevotion(reflection, currentDevotion.theme);
    setCurrentView('home');
  };

  const handleExitDevotion = () => {
    setShowExitConfirm(true);
  };

  const handleNavigateBible = (book?: string, chapter?: number) => {
    if (typeof book === 'string') {
      setBibleInitial({ book, chapter });
    } else {
      setBibleInitial({});
    }
    setCurrentView('bible');
  };

  const confirmExit = () => {
    setCurrentView('home');
    setShowExitConfirm(false);
  };

  const renderContent = () => {
    if (!userData.onboarded) {
      return <Onboarding onComplete={updateOnboarding} />;
    }

    if (currentView === 'devotion') {
      return (
        <div className="min-h-screen bg-theme-bg text-theme-text font-sans">
          <ErrorBoundary fallbackMessage="We encountered an issue loading today's devotion.">
            <DevotionFlow 
              devotion={currentDevotion} 
              streak={userData.streak}
              onComplete={handleCompleteDevotion} 
              onExit={handleExitDevotion} 
            />
          </ErrorBoundary>
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-theme-card border border-theme-border p-8 rounded-[2rem] max-w-xs w-full text-center">
                <h3 className="text-xl font-bold mb-2">Skip Today's Altar?</h3>
                <p className="text-theme-muted text-sm mb-8">Are you sure you want to skip your morning time with God?</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmExit}
                    className="w-full bg-theme-border text-theme-text font-bold py-4 rounded-2xl hover:bg-theme-card transition-colors"
                  >
                    Yes, Skip Today
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full bg-theme-accent text-black font-bold py-4 rounded-2xl hover:bg-theme-accent/80 transition-colors"
                  >
                    No, Stay Here
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-theme-bg text-theme-text font-sans">
        {currentView === 'home' ? (
          <Home 
            userData={userData} 
            onStartDevotion={handleStartDevotion}
            onNavigateBible={handleNavigateBible}
            onUpdateUserData={updateUserData}
          />
        ) : (
          <ErrorBoundary fallbackMessage="We encountered an issue loading the Bible reader.">
            <BibleReader 
              onBack={() => {
                setCurrentView('home');
                setBibleInitial({});
              }} 
              initialBook={bibleInitial.book}
              initialChapter={bibleInitial.chapter}
            />
          </ErrorBoundary>
        )}
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      {renderContent()}
      <Analytics />
    </>
  );
}
