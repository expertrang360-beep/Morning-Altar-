import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Book, Search, Loader2, X, BookOpen, Eye, EyeOff, Play, Pause, Square } from 'lucide-react';
import { BIBLE_BOOKS } from '../data/bibleData';
import { generateSpeech } from '../services/ttsService';

interface BibleReaderProps {
  onBack: () => void;
  initialBook?: string;
  initialChapter?: number;
}

interface Verse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface ChapterData {
  reference: string;
  verses: Verse[];
  text: string;
}

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
  const [selectedVersion, setSelectedVersion] = useState('kjv');
  
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
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${version}`);
      if (!response.ok) throw new Error('Failed to fetch scripture');
      const data = await response.json();
      setChapterData(data);
    } catch (err) {
      setError('Could not load scripture. Please check your connection.');
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
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      setIsPlaying(false);
    }
  }, [selectedBook, selectedChapter, selectedVersion]);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.hasAttribute('src') && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (!chapterData) return;

    setIsAudioLoading(true);
    try {
      const chapterText = chapterData.verses.map(v => v.text).join(' ');
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

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-zinc-100 font-sans relative overflow-hidden">
      {/* Focus Mode Background */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.03),transparent_70%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`flex items-center justify-between p-4 border-bottom border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-500 ${isFocusMode ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <span className="font-bold text-sm tracking-tight">
            {selectedBook.name} {selectedChapter}
          </span>
          <ChevronRight className="w-4 h-4 rotate-90 text-amber-500" />
        </button>

        <div className="relative">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-full pl-4 pr-8 py-2 text-xs font-bold text-zinc-300 outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <option value="kjv">KJV</option>
            <option value="web">WEB</option>
            <option value="bbe">BBE</option>
          </select>
          <ChevronRight className="w-3 h-3 rotate-90 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </header>

      {/* Focus Mode Toggle */}
      <button 
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 flex items-center justify-center z-[60] transition-all hover:bg-zinc-800 ${isFocusMode ? 'text-amber-500 border-amber-500/30' : 'text-zinc-500'}`}
      >
        {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pb-32 z-10">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium animate-pulse">Opening the Word...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-zinc-400 mb-6">{error}</p>
            <button 
              onClick={() => fetchChapter(selectedBook.name, selectedChapter, selectedVersion)}
              className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`max-w-2xl mx-auto transition-all duration-700 ${isFocusMode ? 'mt-12' : ''}`}
          >
            <div className="mb-12 text-center">
              <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                {selectedBook.name}
              </p>
              <h2 className={`font-bold tracking-tighter mb-4 transition-all duration-500 ${isFocusMode ? 'text-6xl' : 'text-5xl'}`}>Chapter {selectedChapter}</h2>
              <div className="h-1 w-12 bg-amber-500/20 mx-auto rounded-full mb-6" />
              
              {/* Audio Controls */}
              <div className={`flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handlePlayAudio}
                    disabled={isAudioLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {isAudioLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Play className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-xs font-bold text-zinc-300">
                      {isAudioLoading ? 'Loading Audio...' : isPlaying ? 'Pause' : 'Listen'}
                    </span>
                  </button>
                  
                  {audioRef.current?.src && (
                    <button
                      onClick={handleStopAudio}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
                      title="Stop"
                    >
                      <Square className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Speed:</span>
                  {[0.75, 1, 1.25].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                        playbackSpeed === speed 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`space-y-8 transition-all duration-500 ${isFocusMode ? 'space-y-12' : 'space-y-8'}`}>
              {chapterData?.verses.map((v) => (
                <div 
                  key={v.verse} 
                  id={`verse-${v.verse}`}
                  className="group relative pl-8 md:pl-0"
                >
                  <span className={`absolute left-0 md:-left-8 top-1.5 md:top-1 text-[10px] font-bold transition-all duration-500 ${isFocusMode ? 'opacity-20' : 'text-zinc-600 group-hover:text-amber-500'} ${targetVerse === v.verse ? '!text-amber-500 scale-125' : ''}`}>
                    {v.verse}
                  </span>
                  <p className={`leading-relaxed font-light transition-all duration-500 ${isFocusMode ? 'text-2xl leading-[1.8] text-zinc-100' : 'text-xl'} ${targetVerse === v.verse ? 'text-amber-400 font-normal drop-shadow-md' : 'text-zinc-300'}`}>
                    {v.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className={`mt-20 flex justify-between items-center gap-4 transition-all duration-500 ${isFocusMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100'}`}>
              <button 
                onClick={handlePrevChapter}
                className="flex-1 flex items-center justify-center gap-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] hover:bg-zinc-800 transition-all group"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm font-bold text-zinc-400 group-hover:text-white">Previous</span>
              </button>
              <button 
                onClick={handleNextChapter}
                className="flex-1 flex items-center justify-center gap-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] hover:bg-zinc-800 transition-all group"
              >
                <span className="text-sm font-bold text-zinc-400 group-hover:text-white">Next</span>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Book & Chapter Picker Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            <header className="p-4 flex items-center justify-between border-bottom border-zinc-800">
              <div className="flex gap-4">
                <button 
                  onClick={() => setPickerTab('browse')}
                  className={`text-lg font-bold transition-colors ${pickerTab === 'browse' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Browse
                </button>
                <button 
                  onClick={() => setPickerTab('search')}
                  className={`text-lg font-bold transition-colors ${pickerTab === 'search' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Search
                </button>
              </div>
              <button 
                onClick={() => setIsPickerOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {pickerTab === 'browse' ? (
              <>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                  {/* Books List */}
                  <div className="w-1/2 overflow-y-auto border-right border-zinc-800 p-2">
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
                            ? 'bg-amber-500 text-black' 
                            : 'text-zinc-400 hover:bg-zinc-900'
                        }`}
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>

                  {/* Chapters Grid */}
                  <div className="w-1/2 overflow-y-auto p-4">
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
                              ? 'bg-amber-500 border-amber-500 text-black' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
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
                <div className="p-4">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search verses (e.g., Jesus, love, faith)..."
                      value={verseSearchQuery}
                      onChange={(e) => setVerseSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-24 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching || !verseSearchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-500 text-black rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isSearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                      <p className="text-sm font-medium">Searching scriptures...</p>
                    </div>
                  ) : searchError ? (
                    <div className="text-center text-red-500 p-8">{searchError}</div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">
                        Found {searchResults.length} results
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
                            className="w-full text-left p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                                {bookName} {result.chapter}:{result.verse}
                              </span>
                              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <p 
                              className="text-sm text-zinc-300 leading-relaxed [&>b]:text-amber-500 [&>b]:font-bold"
                              dangerouslySetInnerHTML={{ __html: result.text }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : verseSearchQuery && !isSearching ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                      <Search className="w-12 h-12 mb-4 opacity-20" />
                      <p>No results found for "{verseSearchQuery}"</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                      <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                      <p>Enter a keyword or phrase to search the scriptures.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden" 
      />
    </div>
  );
}
