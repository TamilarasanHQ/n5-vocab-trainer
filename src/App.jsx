import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, 
  HelpCircle, 
  Clock, 
  Flame, 
  BookOpen, 
  Settings, 
  Calendar,
  Sparkles,
  List,
  RotateCcw,
  Zap
} from 'lucide-react';
import { loadVocabulary, saveVocabulary, updateSRSWord, resetScoresAndSRS } from './utils/storage';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import WordListView from './components/WordListView';
import VerbsView from './components/VerbsView';
import ImportExportModal from './components/ImportExportModal';

export default function App() {
  const [allWords, setAllWords] = useState([]);
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'quiz' | 'verbs' | 'wordlist' | 'lessons'
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'due' | 'weak' | 'week-X' | number (lesson)
  const [batchLimit, setBatchLimit] = useState('20'); // '10' | '20' | '30' | 'all'
  const [reverseMode, setReverseMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Kanji Display Toggle (Default false = Hiragana/Katakana only for beginners)
  const [showKanji, setShowKanji] = useState(() => {
    try {
      return localStorage.getItem('n5_show_kanji') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleKanji = (val) => {
    setShowKanji(val);
    try {
      localStorage.setItem('n5_show_kanji', String(val));
    } catch (e) {
      console.warn(e);
    }
  };

  // Initialize vocabulary from local storage
  useEffect(() => {
    const loaded = loadVocabulary();
    setAllWords(loaded);
  }, []);

  // Save changes when allWords update
  const handleUpdateAllWords = (newWords) => {
    setAllWords(newWords);
    saveVocabulary(newWords);
  };

  // SRS Update handler:
  // ONLY advance SRS nextReviewDate if user is explicitly in the "due" filter mode!
  // In 'all', 'weak', 'week-X', or lesson filters, it acts as free practice and won't disrupt Due Today count.
  const handleWordResult = (word, isSuccess) => {
    const isSRSMode = selectedFilter === 'due';
    const updated = updateSRSWord(word, isSuccess, isSRSMode);
    const newWords = allWords.map(w => w.id === word.id ? updated : w);
    handleUpdateAllWords(newWords);
  };

  // Reset scores specifically for the active filter (Lesson or Week)
  const handleResetCurrentScope = (scope) => {
    let scopeName = "all words";
    if (typeof scope === 'number') scopeName = `Lesson ${scope}`;
    else if (scope === 'week-1') scopeName = "Week 1 (L1-5)";
    else if (scope === 'week-2') scopeName = "Week 2 (L6-10)";
    else if (scope === 'week-3') scopeName = "Week 3 (L11-15)";
    else if (scope === 'week-4') scopeName = "Week 4 (L16-20)";
    else if (scope === 'week-5') scopeName = "Week 5 (L21-25)";

    if (window.confirm(`Reset review scores and mastery level for ${scopeName}?`)) {
      const resetList = resetScoresAndSRS(allWords, scope);
      handleUpdateAllWords(resetList);
    }
  };

  // Calculate SRS Review Stats
  const stats = useMemo(() => {
    const now = new Date();
    let dueCount = 0;
    let weakCount = 0;
    let masteredCount = 0;
    const lessonSet = new Set();

    allWords.forEach(w => {
      lessonSet.add(w.lesson || 1);
      if (!w.nextReviewDate || new Date(w.nextReviewDate) <= now) {
        dueCount++;
      }
      if ((w.history?.wrong || 0) > (w.history?.correct || 0)) {
        weakCount++;
      }
      if ((w.level || 0) >= 4) {
        masteredCount++;
      }
    });

    const sortedLessons = Array.from(lessonSet).sort((a, b) => a - b);

    return {
      dueCount,
      weakCount,
      masteredCount,
      lessons: sortedLessons
    };
  }, [allWords]);

  // Filtered Words for Study (Category / Lesson / Week)
  const filteredWords = useMemo(() => {
    const now = new Date();
    if (selectedFilter === 'due') {
      return allWords.filter(w => !w.nextReviewDate || new Date(w.nextReviewDate) <= now);
    }
    if (selectedFilter === 'weak') {
      return allWords.filter(w => (w.history?.wrong || 0) > (w.history?.correct || 0));
    }
    // Week groupings (5 lessons per week)
    if (selectedFilter === 'week-1') {
      return allWords.filter(w => w.lesson >= 1 && w.lesson <= 5);
    }
    if (selectedFilter === 'week-2') {
      return allWords.filter(w => w.lesson >= 6 && w.lesson <= 10);
    }
    if (selectedFilter === 'week-3') {
      return allWords.filter(w => w.lesson >= 11 && w.lesson <= 15);
    }
    if (selectedFilter === 'week-4') {
      return allWords.filter(w => w.lesson >= 16 && w.lesson <= 20);
    }
    if (selectedFilter === 'week-5') {
      return allWords.filter(w => w.lesson >= 21 && w.lesson <= 25);
    }
    if (typeof selectedFilter === 'number') {
      return allWords.filter(w => w.lesson === selectedFilter);
    }
    return allWords;
  }, [allWords, selectedFilter]);

  // Is active filter a specific lesson or week?
  const isScopedFilter = typeof selectedFilter === 'number' || (typeof selectedFilter === 'string' && selectedFilter.startsWith('week-'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-rose-500">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-950/40">
              N5
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                N5 Vocab Master
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {showKanji ? 'Kanji ON' : 'Kana Mode'}
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Word Batch Limit Selector (10 / 20 / 30 / ALL) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Set:</span>
            {['10', '20', '30', 'all'].map((limit) => (
              <button
                key={limit}
                onClick={() => setBatchLimit(limit)}
                className={`px-2 py-0.5 rounded-lg text-xs font-black transition ${
                  batchLimit === limit
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {limit === 'all' ? 'All' : limit}
              </button>
            ))}

            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-1 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Settings & Kanji Toggle"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto p-4">
        {/* Quick Filter Pill Selector (Visible in study modes) */}
        {activeTab !== 'wordlist' && activeTab !== 'lessons' && activeTab !== 'verbs' && (
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  selectedFilter === 'all'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                All ({allWords.length})
              </button>

              <button
                onClick={() => setSelectedFilter('due')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  selectedFilter === 'due'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-950/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Due ({stats.dueCount})
              </button>

              <button
                onClick={() => setSelectedFilter('weak')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  selectedFilter === 'weak'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Weak ({stats.weakCount})
              </button>

              {/* Week Filters (5-Day Crunch Target) */}
              {[
                { id: 'week-1', label: 'W1 (L1-5)' },
                { id: 'week-2', label: 'W2 (L6-10)' },
                { id: 'week-3', label: 'W3 (L11-15)' },
                { id: 'week-4', label: 'W4 (L16-20)' },
                { id: 'week-5', label: 'W5 (L21-25)' },
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedFilter(w.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                    selectedFilter === w.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-teal-400" /> {w.label}
                </button>
              ))}

              {/* Individual Lesson Pills */}
              {stats.lessons.map(lessonNum => (
                <button
                  key={lessonNum}
                  onClick={() => setSelectedFilter(lessonNum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedFilter === lessonNum
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  L{lessonNum}
                </button>
              ))}
            </div>

            {/* Scope reset notice if in specific Lesson or Week */}
            {isScopedFilter && (
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl text-[11px] text-slate-400 border border-slate-850">
                <span>Practicing: <strong className="text-slate-200">{typeof selectedFilter === 'number' ? `Lesson ${selectedFilter}` : selectedFilter.toUpperCase()}</strong></span>
                <button
                  onClick={() => handleResetCurrentScope(selectedFilter)}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset {typeof selectedFilter === 'number' ? 'Lesson' : 'Week'} Score
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'flashcards' && (
          <FlashcardView
            words={filteredWords}
            onWordResult={handleWordResult}
            reverseMode={reverseMode}
            setReverseMode={setReverseMode}
            batchLimit={batchLimit}
            selectedFilter={selectedFilter}
            showKanji={showKanji}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            words={filteredWords}
            allWords={allWords}
            onWordResult={handleWordResult}
            batchLimit={batchLimit}
            selectedFilter={selectedFilter}
            showKanji={showKanji}
          />
        )}

        {activeTab === 'verbs' && (
          <VerbsView showKanji={showKanji} />
        )}

        {activeTab === 'wordlist' && (
          <WordListView
            allWords={allWords}
            selectedLesson={typeof selectedFilter === 'number' ? selectedFilter : 1}
            showKanji={showKanji}
          />
        )}

        {activeTab === 'lessons' && (
          <div className="flex-1 pb-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" /> 30-Day Weekly Schedule
              </h2>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {[
                  { id: 'week-1', title: 'Week 1 Target', lessons: 'Lessons 1 – 5' },
                  { id: 'week-2', title: 'Week 2 Target', lessons: 'Lessons 6 – 10' },
                  { id: 'week-3', title: 'Week 3 Target', lessons: 'Lessons 11 – 15' },
                  { id: 'week-4', title: 'Week 4 Target', lessons: 'Lessons 16 – 20' },
                  { id: 'week-5', title: 'Week 5 Target', lessons: 'Lessons 21 – 25' },
                ].map((w, idx) => {
                  const weekWords = allWords.filter(word => {
                    const l = word.lesson;
                    if (idx === 0) return l >= 1 && l <= 5;
                    if (idx === 1) return l >= 6 && l <= 10;
                    if (idx === 2) return l >= 11 && l <= 15;
                    if (idx === 3) return l >= 16 && l <= 20;
                    return l >= 21 && l <= 25;
                  });

                  return (
                    <div
                      key={w.id}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <button
                        onClick={() => {
                          setSelectedFilter(w.id);
                          setActiveTab('flashcards');
                        }}
                        className="text-left flex-1"
                      >
                        <span className="text-xs font-bold text-teal-300 block">{w.title}</span>
                        <span className="text-xs text-slate-400">{w.lessons}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {weekWords.length} words
                        </span>
                        <button
                          onClick={() => handleResetCurrentScope(w.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                          title="Reset Week Score"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> All 25 Lessons
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
                const count = allWords.filter(w => w.lesson === num).length;
                const isSelected = selectedFilter === num;

                return (
                  <div
                    key={num}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedFilter(num);
                        setActiveTab('flashcards');
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-300">Lesson {num}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {count}w
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mb-2">
                        {count > 0 ? 'Review lesson' : 'No words'}
                      </div>
                    </button>

                    <div className="flex justify-end pt-1 border-t border-slate-800/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetCurrentScope(num);
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                        title="Reset Lesson Scores"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile Tab Bar (5 Tabs) */}
      <nav className="sticky bottom-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 py-2 px-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'flashcards' ? 'text-rose-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="text-[9px]">Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'quiz' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <HelpCircle className="w-4 h-4 mb-0.5" />
            <span className="text-[9px]">Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('verbs')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'verbs' ? 'text-rose-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Zap className="w-4 h-4 mb-0.5" />
            <span className="text-[9px]">Te-Verbs</span>
          </button>

          <button
            onClick={() => setActiveTab('wordlist')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'wordlist' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <List className="w-4 h-4 mb-0.5" />
            <span className="text-[9px]">Vocab</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeTab === 'lessons' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[9px]">Lessons</span>
          </button>
        </div>
      </nav>

      {/* Import / Export & Settings Modal */}
      <ImportExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        allWords={allWords}
        onUpdateAllWords={handleUpdateAllWords}
        showKanji={showKanji}
        onToggleKanji={handleToggleKanji}
      />
    </div>
  );
}
