import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Book, Search, Loader2, X, BookOpen, 
  Eye, EyeOff, Play, Pause, Square, Copy, Check, Layers, Volume2 
} from 'lucide-react';
import { BIBLE_BOOKS } from '../data/bibleData';
import { generateSpeech } from '../services/ttsService';

interface BibleReaderProps {
  onBack: () => void;
  initialBook?: string;
  initialChapter?: number;
}

interface Verse {
  book_id?: string;
  book_name?: string;
  chapter?: number;
  verse: number;
  text: string;
}

interface ChapterData {
  reference: string;
  verses: Verse[];
  text?: string;
  translation_name?: string;
  translation_id?: string;
}

export const BIBLE_VERSIONS = [
  { id: 'NKJV', label: 'NKJV', fullName: 'New King James Version', description: 'Modern accuracy with classic majesty' },
  { id: 'AMP', label: 'AMP', fullName: 'Amplified Bible', description: 'Reveals nuanced word meanings in brackets' },
  { id: 'ESV', label: 'ESV', fullName: 'English Standard Version', description: 'Word-for-word accuracy and literary beauty' },
  { id: 'NLT', label: 'NLT', fullName: 'New Living Translation', description: 'Clear, modern & easy to read' },
  { id: 'NASB', label: 'NASB', fullName: 'New American Standard', description: 'Strict literal translation for in-depth study' },
  { id: 'KJV', label: 'KJV', fullName: 'King James Version', description: 'Traditional historic English translation' },
  { id: 'WEB', label: 'WEB', fullName: 'World English Bible', description: 'Modern public domain translation' },
  { id: 'BBE', label: 'BBE', fullName: 'Bible in Basic English', description: 'Simple 1,000-word vocabulary' },
  { id: 'ASV', label: 'ASV', fullName: 'American Standard Version', description: 'Classic 1901 scholarly revision' },
  { id: 'Darby', label: 'Darby', fullName: 'Darby Translation', description: 'Literal translation by J.N. Darby' },
];

export function BibleReader({ onBack, initialBook, initialChapter }: BibleReaderProps) {
  const [selectedBook, setSelectedBook] = useState(() => {
    if (initialBook) {
      return BIBLE_BOOKS.find(b => b.name === initialBook) || BIBLE_BOOKS[0];
    }
    return BIBLE_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState(initialChapter || 1);

  useEffect(() => {
    if (initialBook) {
      const book = BIBLE_BOOKS.find(b => b.name === initialBook);
      if (book) setSelectedBook(book);
    }
    if (initialChapter) {
      setSelectedChapter(initialChapter);
    }
  }, [initialBook, initialChapter]);

  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'browse' | 'search'>('browse');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('NKJV');
  
  // Search state
  const [verseSearchQuery, setVerseSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive study states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparingVerse, setComparingVerse] = useState<number | null>(null);
  const [comparisonResults, setComparisonResults] = useState<{ version: string; name: string; text: string }[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChapter = async (book: string, chapter: number, version: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.name.toLowerCase() === book.toLowerCase());
      const bookId = bookIndex !== -1 ? bookIndex + 1 : 1;

      // Try bolls.life first (supports NKJV, AMP, ESV, NLT, NASB, KJV, etc.)
      try {
        const bollsRes = await fetch(`https://bolls.life/get-chapter/${version.toUpperCase()}/${bookId}/${chapter}/`);
        if (bollsRes.ok) {
          const rawVerses = await bollsRes.json();
          if (Array.isArray(rawVerses) && rawVerses.length > 0) {
            const verses = rawVerses.map((v: any) => {
              const cleanText = (v.text || '')
                .replace(/<S>\d+<\/S>/gi, '') // Strip Strong's numbers
                .replace(/<br\s*\/?>/gi, ' ')  // Replace line breaks with spaces
                .replace(/\s+/g, ' ')
                .trim();
              return {
                verse: Number(v.verse),
                text: cleanText
              };
            });
            const meta = BIBLE_VERSIONS.find(ver => ver.id.toLowerCase() === version.toLowerCase());
            setChapterData({
              reference: `${book} ${chapter}`,
              translation_name: meta?.fullName || version,
              translation_id: version,
              verses
            });
            return;
          }
        }
      } catch (bollsErr) {
        console.warn('bolls.life fetch error, falling back:', bollsErr);
      }

      // Fallback to bible-api.com
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${version.toLowerCase()}`);
      if (!response.ok) throw new Error('Failed to fetch scripture');
      const data = await response.json();
      setChapterData(data);
    } catch (err) {
      setError('Could not load scripture. Please check your connection or choose another version.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chapterData && scrollRef.current) {
      if (targetVerse) {
        setTimeout(() => {
          const verseElement = document.getElementById(`verse-${targetVerse}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [chapterData, targetVerse]);

  useEffect(() => {
    fetchChapter(selectedBook.name, selectedChapter, selectedVersion);
    
    // Reset audio when chapter changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [selectedBook, selectedChapter, selectedVersion]);

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (!chapterData) return;

    setIsAudioLoading(true);
    try {
      const chapterText = chapterData.verses
        .map(v => v.text.replace(/<[^>]+>/g, ''))
        .join(' ');
      const audioUrl = await generateSpeech(chapterText);
      
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        setError('Failed to generate audio.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate audio.');
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleCompareVerse = async (verseNum: number) => {
    setComparingVerse(verseNum);
    setShowCompareModal(true);
    setIsComparing(true);
    const versionsToCompare = ['NKJV', 'AMP', 'ESV', 'KJV'];
    const bookIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook.name);
    const bookId = bookIndex !== -1 ? bookIndex + 1 : 1;
    
    try {
      const results = await Promise.all(
        versionsToCompare.map(async (v) => {
          try {
            const res = await fetch(`https://bolls.life/get-verse/${v}/${bookId}/${selectedChapter}/${verseNum}/`);
            if (res.ok) {
              const data = await res.json();
              const clean = (data.text || '')
                .replace(/<S>\d+<\/S>/gi, '')
                .replace(/<br\s*\/?>/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              const meta = BIBLE_VERSIONS.find(ver => ver.id === v);
              return { version: v, name: meta?.fullName || v, text: clean };
            }
          } catch (e) {
            console.warn(`Failed to fetch ${v}:`, e);
          }
          return { version: v, name: v, text: 'Text unavailable for this translation.' };
        })
      );
      setComparisonResults(results);
    } catch (err) {
      console.error('Error comparing verses:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleCopyVerse = (verseNum: number, text: string) => {
    const clean = text.replace(/<[^>]+>/g, '');
    const toCopy = `"${clean}" — ${selectedBook.name} ${selectedChapter}:${verseNum} (${selectedVersion})`;
    navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaySingleVerse = async (verseNum: number, text: string) => {
    const clean = text.replace(/<[^>]+>/g, '');
    setIsAudioLoading(true);
    try {
      const audioUrl = await generateSpeech(`${selectedBook.name} chapter ${selectedChapter} verse ${verseNum}. ${clean}`);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleNextChapter = () => {
    setTargetVerse(null);
    if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook.name);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        setSelectedBook(BIBLE_BOOKS[bookIndex + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    setTargetVerse(null);
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook.name);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const filteredBooks = BIBLE_BOOKS.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!verseSearchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(`https://bolls.life/search/${selectedVersion.toUpperCase()}/?search=${encodeURIComponent(verseSearchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setSearchError('Failed to perform search. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectedVerseObj = chapterData?.verses.find(v => v.verse === targetVerse);

  return (
    <div className="flex flex-col h-[100dvh] bg-theme-bg text-theme-text font-sans relative overflow-hidden">
      {/* Focus Mode Background */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(var(--accent),0.03),transparent_70%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`flex items-center justify-between p-4 border-b border-theme-border bg-theme-bg/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-500 ${isFocusMode ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-theme-muted hover:text-theme-text transition-colors"
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-theme-card border border-theme-border hover:opacity-80 transition-colors shadow-sm"
        >
          <span className="font-bold text-sm tracking-tight">
            {selectedBook.name} {selectedChapter}
          </span>
          <ChevronRight className="w-4 h-4 rotate-90 text-theme-accent" />
        </button>

        {/* Translation Selector */}
        <div className="relative">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-theme-card border border-theme-border rounded-full pl-3.5 pr-8 py-2 text-xs font-bold text-theme-accent outline-none appearance-none cursor-pointer hover:border-theme-accent transition-colors shadow-sm"
          >
            {BIBLE_VERSIONS.map((ver) => (
              <option key={ver.id} value={ver.id} className="bg-theme-card text-theme-text">
                {ver.label} - {ver.fullName}
              </option>
            ))}
          </select>
          <ChevronRight className="w-3 h-3 rotate-90 text-theme-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </header>

      {/* Focus Mode Toggle */}
      <button 
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-theme-card/80 backdrop-blur-md border border-theme-border flex items-center justify-center z-[60] transition-all hover:opacity-80 shadow-lg ${isFocusMode ? 'text-theme-accent border-theme-accent/50' : 'text-theme-muted'}`}
        title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
      >
        {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pb-36 z-10 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-theme-muted gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
            <p className="text-sm font-medium animate-pulse">Opening the Word ({selectedVersion})...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-theme-accent" />
            </div>
            <p className="text-theme-text font-bold mb-2">{error}</p>
            <button 
              onClick={() => fetchChapter(selectedBook.name, selectedChapter, selectedVersion)}
              className="mt-4 px-6 py-2 bg-theme-accent text-theme-bg font-bold rounded-full text-sm hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`max-w-2xl mx-auto transition-all duration-500 ${isFocusMode ? 'py-12' : 'py-4'}`}
          >
            {/* Chapter Header */}
            <div className={`text-center mb-8 transition-all duration-500 ${isFocusMode ? 'mb-16' : 'mb-8'}`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-theme-accent uppercase tracking-widest bg-theme-accent/10 px-3 py-1 rounded-full">
                  {selectedVersion} • {chapterData?.translation_name || selectedVersion}
                </span>
              </div>
              <h1 className={`font-serif font-bold text-theme-text tracking-tight transition-all duration-500 ${isFocusMode ? 'text-5xl md:text-6xl mb-4' : 'text-3xl md:text-4xl mb-2'}`}>
                {selectedBook.name} {selectedChapter}
              </h1>
              <p className="text-xs text-theme-muted italic">
                Tap any verse to study, copy, or compare translations
              </p>

              {/* Audio Controls */}
              <div className={`flex flex-col items-center gap-3 mt-6 transition-all duration-500 ${isFocusMode ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAudio}
                    disabled={isAudioLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-theme-card border border-theme-border rounded-full hover:border-theme-accent/50 transition-colors"
                  >
                    {isAudioLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-theme-accent" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 text-theme-accent" />
                    ) : (
                      <Play className="w-4 h-4 text-theme-accent" />
                    )}
                    <span className="text-xs font-bold text-theme-text/80">
                      {isAudioLoading ? 'Loading Audio...' : isPlaying ? 'Pause Audio' : 'Listen to Chapter'}
                    </span>
                  </button>
                  
                  {audioRef.current?.src && (
                    <button
                      onClick={handleStopAudio}
                      className="p-2 bg-theme-card border border-theme-border rounded-full hover:opacity-80 transition-colors"
                      title="Stop"
                    >
                      <Square className="w-4 h-4 text-theme-muted" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">Speed:</span>
                  {[0.75, 1, 1.25].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                        playbackSpeed === speed 
                          ? 'bg-theme-accent text-theme-bg' 
                          : 'bg-theme-card border border-theme-border text-theme-muted hover:opacity-80'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Verses Container */}
            <div className={`space-y-6 transition-all duration-500 ${isFocusMode ? 'space-y-10' : 'space-y-6'}`}>
              {chapterData?.verses.map((v) => {
                const isSelected = targetVerse === v.verse;
                return (
                  <div 
                    key={v.verse} 
                    id={`verse-${v.verse}`}
                    onClick={() => setTargetVerse(isSelected ? null : v.verse)}
                    className={`group relative pl-8 md:pl-0 cursor-pointer transition-all rounded-2xl p-3 ${
                      isSelected 
                        ? 'bg-theme-accent/15 ring-1 ring-theme-accent/40 shadow-sm' 
                        : 'hover:bg-theme-card/30'
                    }`}
                  >
                    <span className={`absolute left-1 md:-left-7 top-3.5 text-[11px] font-bold transition-all duration-300 ${
                      isFocusMode ? 'opacity-30' : 'text-theme-muted/70 group-hover:text-theme-accent'
                    } ${isSelected ? '!text-theme-accent scale-110 font-black' : ''}`}>
                      {v.verse}
                    </span>
                    <p 
                      className={`leading-relaxed font-light transition-all duration-300 ${
                        isFocusMode ? 'text-2xl leading-[1.8] text-theme-text' : 'text-xl leading-relaxed'
                      } ${isSelected ? 'text-theme-accent font-normal' : 'text-theme-text/95'} [&>i]:italic [&>i]:text-theme-accent/90`}
                      dangerouslySetInnerHTML={{ __html: v.text }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className={`mt-16 flex justify-between items-center gap-4 transition-all duration-500 ${isFocusMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100'}`}>
              <button 
                onClick={handlePrevChapter}
                className="flex-1 flex items-center justify-center gap-2 p-5 bg-theme-card/60 border border-theme-border rounded-[2rem] hover:border-theme-accent/50 transition-all group"
              >
                <ChevronLeft className="w-5 h-5 text-theme-muted group-hover:text-theme-accent transition-colors" />
                <span className="text-sm font-bold text-theme-muted group-hover:text-theme-text">Previous Chapter</span>
              </button>
              <button 
                onClick={handleNextChapter}
                className="flex-1 flex items-center justify-center gap-2 p-5 bg-theme-card/60 border border-theme-border rounded-[2rem] hover:border-theme-accent/50 transition-all group"
              >
                <span className="text-sm font-bold text-theme-muted group-hover:text-theme-text">Next Chapter</span>
                <ChevronRight className="w-5 h-5 text-theme-muted group-hover:text-theme-accent transition-colors" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Verse Action Bar for Studies & References */}
      <AnimatePresence>
        {targetVerse !== null && selectedVerseObj && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-theme-card/95 backdrop-blur-md border border-theme-accent/40 rounded-3xl p-3 shadow-2xl z-50 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 pl-2">
              <span className="text-xs font-black text-theme-accent">
                {selectedBook.name} {selectedChapter}:{targetVerse}
              </span>
              <span className="text-[10px] text-theme-muted font-bold px-1.5 py-0.5 rounded bg-theme-border">
                {selectedVersion}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCompareVerse(targetVerse)}
                className="px-3 py-1.5 rounded-full bg-theme-accent/15 border border-theme-accent/30 text-theme-accent hover:bg-theme-accent/25 text-xs font-bold flex items-center gap-1 transition-all"
                title="Compare Translations"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => handleCopyVerse(targetVerse, selectedVerseObj.text)}
                className="p-2 rounded-full bg-theme-card border border-theme-border text-theme-text hover:text-theme-accent transition-colors"
                title="Copy Verse with Reference"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handlePlaySingleVerse(targetVerse, selectedVerseObj.text)}
                className="p-2 rounded-full bg-theme-card border border-theme-border text-theme-text hover:text-theme-accent transition-colors"
                title="Speak Verse"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTargetVerse(null)}
                className="p-2 text-theme-muted hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Version Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card border border-theme-border p-6 rounded-[2rem] w-full max-w-lg flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-border flex-shrink-0">
                <div>
                  <span className="text-[11px] font-bold text-theme-accent uppercase tracking-widest block">
                    Scripture Comparison & Study
                  </span>
                  <h3 className="text-xl font-bold text-theme-text">
                    {selectedBook.name} {selectedChapter}:{comparingVerse}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="w-9 h-9 rounded-full bg-theme-border/50 flex items-center justify-center hover:opacity-80 transition-colors"
                >
                  <X className="w-5 h-5 text-theme-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                {isComparing ? (
                  <div className="py-12 flex flex-col items-center justify-center text-theme-muted gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-theme-accent" />
                    <p className="text-xs font-medium">Fetching translation comparisons...</p>
                  </div>
                ) : (
                  comparisonResults.map((item) => (
                    <div
                      key={item.version}
                      className="p-4 rounded-2xl bg-theme-bg/60 border border-theme-border/80 hover:border-theme-accent/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-theme-accent bg-theme-accent/15 px-2.5 py-0.5 rounded-full">
                            {item.version}
                          </span>
                          <span className="text-xs font-semibold text-theme-muted">
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedVersion(item.version);
                            setShowCompareModal(false);
                          }}
                          className="text-[11px] text-theme-accent hover:underline font-bold"
                        >
                          Switch to {item.version}
                        </button>
                      </div>
                      <p 
                        className="text-sm font-light leading-relaxed text-theme-text/90 [&>i]:italic [&>i]:text-theme-accent"
                        dangerouslySetInnerHTML={{ __html: item.text }}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-theme-border flex-shrink-0 flex justify-end">
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="px-6 py-2.5 bg-theme-accent text-theme-bg font-bold rounded-2xl text-xs hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book & Chapter Picker Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-theme-bg/90 backdrop-blur-md z-[100] flex flex-col"
          >
            {/* Modal Header */}
            <header className="flex items-center justify-between p-4 border-b border-theme-border">
              <div className="flex items-center gap-2 bg-theme-card p-1 rounded-2xl border border-theme-border">
                <button
                  onClick={() => setPickerTab('browse')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${pickerTab === 'browse' ? 'bg-theme-accent text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`}
                >
                  Browse Chapters
                </button>
                <button
                  onClick={() => setPickerTab('search')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${pickerTab === 'search' ? 'bg-theme-accent text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`}
                >
                  Search Verses
                </button>
              </div>

              <button 
                onClick={() => setIsPickerOpen(false)}
                className="w-10 h-10 rounded-full bg-theme-card flex items-center justify-center hover:opacity-80"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {pickerTab === 'browse' ? (
              <>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input 
                      type="text"
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-theme-accent/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                  {/* Books List */}
                  <div className="w-1/2 overflow-y-auto border-r border-theme-border p-2 custom-scrollbar">
                    {filteredBooks.map(book => (
                      <button 
                        key={book.name}
                        onClick={() => {
                          setSelectedBook(book);
                          setSelectedChapter(1);
                          setTargetVerse(null);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          selectedBook.name === book.name 
                            ? 'bg-theme-accent text-theme-bg font-bold' 
                            : 'text-theme-muted hover:bg-theme-card'
                        }`}
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>

                  {/* Chapters Grid */}
                  <div className="w-1/2 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                        <button 
                          key={ch}
                          onClick={() => {
                            setSelectedChapter(ch);
                            setTargetVerse(null);
                            setIsPickerOpen(false);
                          }}
                          className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${
                            selectedChapter === ch 
                              ? 'bg-theme-accent border-theme-accent text-theme-bg' 
                              : 'bg-theme-card border-theme-border text-theme-muted hover:border-theme-muted/50'
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-theme-border">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input 
                      type="text"
                      placeholder={`Search keywords in ${selectedVersion}... (e.g. faith, love, peace)`}
                      value={verseSearchQuery}
                      onChange={(e) => setVerseSearchQuery(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-2xl py-3 pl-10 pr-24 text-sm focus:outline-none focus:border-theme-accent/50"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching || !verseSearchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-theme-accent text-theme-bg rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {isSearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-theme-muted gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
                      <p className="text-sm font-medium">Searching scripture in {selectedVersion}...</p>
                    </div>
                  ) : searchError ? (
                    <div className="text-center text-theme-accent p-8">{searchError}</div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4 max-w-2xl mx-auto">
                      <p className="text-xs text-theme-muted font-medium uppercase tracking-wider mb-4">
                        Found {searchResults.length} results in {selectedVersion}
                      </p>
                      {searchResults.map((result, idx) => {
                        const bookName = BIBLE_BOOKS[result.book - 1]?.name || 'Unknown Book';
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const book = BIBLE_BOOKS[result.book - 1];
                              if (book) {
                                setSelectedBook(book);
                                setSelectedChapter(result.chapter);
                                setTargetVerse(result.verse);
                                setIsPickerOpen(false);
                              }
                            }}
                            className="w-full text-left p-4 rounded-2xl bg-theme-card/60 border border-theme-border hover:bg-theme-card transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-theme-accent text-xs font-bold uppercase tracking-wider">
                                {bookName} {result.chapter}:{result.verse}
                              </span>
                              <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                            </div>
                            <p 
                              className="text-sm text-theme-text/80 leading-relaxed [&>b]:text-theme-accent [&>b]:font-bold"
                              dangerouslySetInnerHTML={{ __html: result.text }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : verseSearchQuery && !isSearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-theme-muted p-8 text-center">
                      <Search className="w-12 h-12 mb-4 opacity-20" />
                      <p>No results found for "{verseSearchQuery}"</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-theme-muted/60 p-8 text-center">
                      <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                      <p>Search any word or phrase across the entire Bible.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}
