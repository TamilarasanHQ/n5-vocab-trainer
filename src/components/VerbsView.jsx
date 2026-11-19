import React, { useState, useMemo } from 'react';
import { Volume2, Search, Sparkles, Filter, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { speakJapanese } from '../utils/storage';
import { N5_VERBS } from '../data/verbsData';

export default function VerbsView({ showKanji }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' | '1' | '2' | '3'
  const [showRules, setShowRules] = useState(false);

  const filteredVerbs = useMemo(() => {
    return N5_VERBS.filter(v => {
      // Group filter
      if (selectedGroup === '1' && !v.type.includes('Group 1')) return false;
      if (selectedGroup === '2' && !v.type.includes('Group 2')) return false;
      if (selectedGroup === '3' && !v.type.includes('Group 3')) return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        v.kanji.toLowerCase().includes(q) ||
        v.reading.toLowerCase().includes(q) ||
        v.masu.toLowerCase().includes(q) ||
        v.te.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
      );
    });
  }, [selectedGroup, searchTerm]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col flex-1 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-400" /> N5 Te-Form Verbs
          </h2>
          <p className="text-[11px] text-slate-400">All ~100 verbs with ~te forms & verb groups</p>
        </div>

        {/* Te-Form Rules Toggle Button */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-bold active:scale-95 transition"
        >
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Rules</span>
          {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Te-Form Rule Quick Reference Cheat Sheet */}
      {showRules && (
        <div className="mb-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-fade-in shadow-lg">
          <div className="font-bold text-indigo-200 border-b border-indigo-900/60 pb-1">
            💡 Te-Form Conjugation Quick Rules:
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300 leading-relaxed">
            <div><strong className="text-rose-400">Group 1 (Godan):</strong></div>
            <div className="pl-2">• う、つ、る ➔ <span className="text-amber-300 font-bold">～って</span> (買<strong>って</strong>, 待<strong>って</strong>, 帰<strong>って</strong>)</div>
            <div className="pl-2">• む、ぶ、ぬ ➔ <span className="text-amber-300 font-bold">～んで</span> (飲<strong>んで</strong>, 遊<strong>んで</strong>, 死<strong>んで</strong>)</div>
            <div className="pl-2">• く ➔ <span className="text-amber-300 font-bold">～いて</span> (書<strong>いて</strong>) <span className="text-rose-300 font-semibold">[Exception: 行く ➔ いって]</span></div>
            <div className="pl-2">• ぐ ➔ <span className="text-amber-300 font-bold">～いで</span> (泳<strong>いで</strong>)</div>
            <div className="pl-2">• す ➔ <span className="text-amber-300 font-bold">～して</span> (話<strong>して</strong>)</div>
            
            <div className="pt-1"><strong className="text-teal-400">Group 2 (Ichidan - ending in いる/える):</strong></div>
            <div className="pl-2">• Drop る + <span className="text-amber-300 font-bold">て</span> (食<strong>べて</strong>, 見<strong>て</strong>, 起<strong>きて</strong>)</div>

            <div className="pt-1"><strong className="text-purple-400">Group 3 (Irregulars):</strong></div>
            <div className="pl-2">• する ➔ <span className="text-amber-300 font-bold">して</span> | 来る (くる) ➔ <span className="text-amber-300 font-bold">きて</span></div>
          </div>
        </div>
      )}

      {/* Group Filter Tabs (All / G1 / G2 / G3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {[
          { id: 'all', label: `All Verbs (${N5_VERBS.length})` },
          { id: '1', label: 'Group 1 (Godan)' },
          { id: '2', label: 'Group 2 (Ichidan)' },
          { id: '3', label: 'Group 3 (Irregular)' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedGroup(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedGroup === tab.id
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search Verb, Te-form, Masu-form, or English..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2 text-xs text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Count pill */}
      <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 mb-2 font-mono">
        <span>Showing verbs</span>
        <span>{filteredVerbs.length} verbs</span>
      </div>

      {/* Verb Cards List */}
      <div className="space-y-2.5 max-h-[64vh] overflow-y-auto pr-0.5">
        {filteredVerbs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-850">
            No verbs match your search.
          </div>
        ) : (
          filteredVerbs.map((item, idx) => {
            const hasKanji = item.kanji && item.kanji !== item.reading;
            const primaryTitle = showKanji && hasKanji ? item.kanji : item.reading;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition shadow-sm"
              >
                {/* Top Row: Verb Title, Audio Button, Group Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakJapanese(item.te)}
                      className="p-1.5 rounded-full bg-slate-800 text-rose-400 hover:bg-slate-700 active:scale-90 transition shrink-0"
                      title="Pronounce Te-form"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-white">
                          {primaryTitle}
                        </span>
                        {showKanji && hasKanji && (
                          <span className="text-xs text-slate-400 font-medium">
                            ({item.reading})
                          </span>
                        )}
                        {!showKanji && hasKanji && (
                          <span className="text-[11px] text-slate-500">
                            [{item.kanji}]
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {item.meaning}
                      </div>
                    </div>
                  </div>

                  {/* Group Tag */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.type.includes('Group 1')
                      ? 'bg-amber-950/50 border-amber-800/40 text-amber-300'
                      : item.type.includes('Group 2')
                      ? 'bg-teal-950/50 border-teal-800/40 text-teal-300'
                      : 'bg-purple-950/50 border-purple-800/40 text-purple-300'
                  }`}>
                    {item.type.split(' ')[0]} {item.type.split(' ')[1]}
                  </span>
                </div>

                {/* Bottom Row: Conjugation Chips (Dictionary -> Masu -> Te-Form) */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs">
                  {/* Masu Form */}
                  <div className="bg-slate-950/60 rounded-xl px-2.5 py-1.5 border border-slate-850 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">~masu:</span>
                    <span className="font-semibold text-slate-200">{item.masu}</span>
                  </div>

                  {/* Te Form - Highlighted */}
                  <div className="bg-rose-950/30 rounded-xl px-2.5 py-1.5 border border-rose-500/30 flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">~te:</span>
                    <span className="font-black text-rose-300 text-sm tracking-wide">{item.te}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
