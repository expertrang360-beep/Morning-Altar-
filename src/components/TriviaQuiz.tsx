import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, XCircle, Trophy, ChevronRight } from 'lucide-react';
import { weeklyTrivia } from '../data/trivia';

interface TriviaQuizProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function TriviaQuiz({ onClose, onComplete }: TriviaQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = weeklyTrivia[currentQ];

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsChecked(true);
    if (selectedOption === question.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < weeklyTrivia.length - 1) {
      setCurrentQ(q => q + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    onComplete(score);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-theme-card border border-theme-border p-8 rounded-[2rem] w-full max-w-md flex flex-col relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center hover:bg-theme-bg/80 transition-colors z-10"
        >
          <X className="w-5 h-5 text-theme-muted" />
        </button>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col"
            >
              <div className="mb-8 pr-12">
                <p className="text-theme-accent text-xs font-bold uppercase tracking-widest mb-2">
                  Question {currentQ + 1} of {weeklyTrivia.length}
                </p>
                <h2 className="text-2xl font-bold text-theme-text leading-tight">
                  {question.question}
                </h2>
              </div>

              <div className="space-y-3 mb-8">
                {question.options.map((opt, i) => {
                  let btnClass = "bg-theme-bg border-theme-border text-theme-muted";
                  let icon = null;

                  if (isChecked) {
                    if (i === question.correctIndex) {
                      btnClass = "bg-theme-accent/20 border-theme-accent/50 text-theme-accent";
                      icon = <CheckCircle2 className="w-5 h-5" />;
                    } else if (i === selectedOption) {
                      btnClass = "bg-red-500/20 border-red-500/50 text-red-500";
                      icon = <XCircle className="w-5 h-5" />;
                    } else {
                      btnClass = "bg-theme-bg/50 border-theme-border text-theme-muted/50 opacity-50";
                    }
                  } else if (selectedOption === i) {
                    btnClass = "bg-theme-accent/20 border-theme-accent/50 text-theme-accent";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !isChecked && setSelectedOption(i)}
                      disabled={isChecked}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${btnClass} ${!isChecked && 'hover:border-theme-accent/50'}`}
                    >
                      <span className="font-medium">{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {isChecked && question.explanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-theme-bg/50 rounded-2xl border border-theme-border/50"
                >
                  <p className="text-sm text-theme-text/80 leading-relaxed">
                    <span className="font-bold text-theme-muted uppercase text-xs tracking-wider block mb-1">Did you know?</span>
                    {question.explanation}
                  </p>
                </motion.div>
              )}

              {!isChecked ? (
                <button 
                  onClick={handleCheck}
                  disabled={selectedOption === null}
                  className="w-full bg-theme-accent text-theme-bg font-bold py-4 rounded-2xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="w-full bg-theme-bg text-theme-text font-bold py-4 rounded-2xl border border-theme-border hover:bg-theme-bg/80 transition-colors flex items-center justify-center gap-2"
                >
                  {currentQ < weeklyTrivia.length - 1 ? 'Next Question' : 'See Results'} <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="w-24 h-24 rounded-full bg-theme-accent/10 flex items-center justify-center mb-6 border border-theme-accent/20">
                <Trophy className={`w-12 h-12 ${score === 5 ? 'text-theme-accent' : 'text-theme-muted'}`} />
              </div>
              
              <h2 className="text-3xl font-bold text-theme-text mb-2">Quiz Complete!</h2>
              <p className="text-theme-muted mb-8">
                You scored <span className="text-theme-accent font-bold text-xl">{score}</span> out of {weeklyTrivia.length}
              </p>

              {score === 5 ? (
                <div className="bg-theme-accent/10 border border-theme-accent/20 p-4 rounded-2xl mb-8 w-full">
                  <p className="text-theme-accent font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Perfect Score! +2 Points
                  </p>
                </div>
              ) : (
                <div className="bg-theme-bg/50 border border-theme-border p-4 rounded-2xl mb-8 w-full">
                  <p className="text-theme-muted text-sm">
                    Keep studying the Word! Answer all 5 correctly next time for bonus points.
                  </p>
                </div>
              )}

              <button 
                onClick={handleFinish}
                className="w-full bg-theme-accent text-theme-bg font-bold py-4 rounded-2xl hover:opacity-90 transition-colors"
              >
                Claim & Return
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
