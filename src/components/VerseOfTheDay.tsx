import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Loader2 } from 'lucide-react';

interface VerseData {
  reference: string;
  text: string;
}

const VERSES_OF_THE_DAY = [
  "John 3:16", "Romans 8:28", "Jeremiah 29:11", "Philippians 4:13",
  "Proverbs 3:5-6", "Isaiah 41:10", "Psalm 46:1", "Galatians 5:22-23",
  "Hebrews 11:1", "2 Timothy 1:7", "1 Corinthians 13:4-7", "Matthew 11:28",
  "Romans 12:2", "Psalm 23:1", "Isaiah 40:31", "Joshua 1:9",
  "Matthew 6:33", "Romans 8:38-39", "Psalm 119:105", "Ephesians 2:8-9"
];

export function VerseOfTheDay() {
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const reference = VERSES_OF_THE_DAY[dayOfYear % VERSES_OF_THE_DAY.length];
        
        const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
        if (!response.ok) throw new Error('Failed to fetch verse');
        
        const data = await response.json();
        setVerse({
          reference: data.reference,
          text: data.text.trim()
        });
      } catch (err) {
        console.error(err);
        setError('Could not load Verse of the Day.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerse();
  }, []);

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Verse of the Day
        </h3>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Loading Verse...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-zinc-500 text-sm">{error}</p>
          </div>
        ) : verse ? (
          <div>
            <p className="text-lg font-serif italic text-zinc-200 mb-4 leading-relaxed">
              "{verse.text}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[1px] bg-amber-500/50" />
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">{verse.reference}</p>
            </div>
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
