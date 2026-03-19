import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useStorage } from './hooks/useStorage';
import { useDailyReminder } from './hooks/useDailyReminder';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { BibleReader } from './components/BibleReader';
import { DevotionFlow } from './components/DevotionFlow';
import { SplashScreen } from './components/SplashScreen';
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
    setBibleInitial({ book, chapter });
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
        <>
          <DevotionFlow 
            devotion={currentDevotion} 
            streak={userData.streak}
            onComplete={handleCompleteDevotion} 
            onExit={handleExitDevotion} 
          />
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-xs w-full text-center">
                <h3 className="text-xl font-bold mb-2">Skip Today's Altar?</h3>
                <p className="text-zinc-400 text-sm mb-8">Are you sure you want to skip your morning time with God?</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmExit}
                    className="w-full bg-zinc-800 text-white font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-colors"
                  >
                    Yes, Skip Today
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl hover:bg-amber-400 transition-colors"
                  >
                    No, Stay Here
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <div className="min-h-screen bg-black">
        {currentView === 'home' ? (
          <Home 
            userData={userData} 
            onStartDevotion={handleStartDevotion}
            onNavigateBible={handleNavigateBible}
            onUpdateUserData={updateUserData}
          />
        ) : (
          <BibleReader 
            onBack={() => {
              setCurrentView('home');
              setBibleInitial({});
            }} 
            initialBook={bibleInitial.book}
            initialChapter={bibleInitial.chapter}
          />
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
    </>
  );
}
