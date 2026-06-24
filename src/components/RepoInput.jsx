import React, { useState, useEffect } from 'react';
import { Search, Calendar, GitCompare, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { parseRepoUrl } from '../api/github';

/**
 * RepoInput Component
 * Supports both Single Repo changelog generation and comparative Changelog Diff Mode.
 * Fully styled for both Light and Dark themes.
 */
export default function RepoInput({ 
  onGenerate, 
  onGenerateDiff,
  isLoading,
  defaultRepo = 'microsoft/vscode'
}) {
  const [isDiffMode, setIsDiffMode] = useState(false);
  
  // Single Mode State
  const [repo, setRepo] = useState(defaultRepo);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Diff Mode State
  const [baseRepo, setBaseRepo] = useState(defaultRepo);
  const [baseDateFrom, setBaseDateFrom] = useState('');
  const [baseDateTo, setBaseDateTo] = useState('');
  
  const [compareRepo, setCompareRepo] = useState(defaultRepo);
  const [compareDateFrom, setCompareDateFrom] = useState('');
  const [compareDateTo, setCompareDateTo] = useState('');

  const [validationError, setValidationError] = useState('');

  // Set default dates on load (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Set Single Mode defaults
    setDateTo(formatDate(today));
    setDateFrom(formatDate(thirtyDaysAgo));
    
    // Set Diff Mode defaults
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);
    setBaseDateTo(formatDate(thirtyDaysAgo));
    setBaseDateFrom(formatDate(sixtyDaysAgo));
    
    setCompareDateTo(formatDate(today));
    setCompareDateFrom(formatDate(thirtyDaysAgo));
  }, []);

  const handleBaseRepoChange = (val) => {
    setBaseRepo(val);
    setCompareRepo(val);
  };

  const applyQuickRange = (days, mode) => {
    const today = new Date();
    const priorDate = new Date();
    priorDate.setDate(today.getDate() - days);
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    if (mode === 'single') {
      setDateTo(formatDate(today));
      setDateFrom(formatDate(priorDate));
    } else if (mode === 'base') {
      setBaseDateTo(formatDate(today));
      setBaseDateFrom(formatDate(priorDate));
    } else if (mode === 'compare') {
      setCompareDateTo(formatDate(today));
      setCompareDateFrom(formatDate(priorDate));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (isDiffMode) {
      const parsedBase = parseRepoUrl(baseRepo);
      const parsedCompare = parseRepoUrl(compareRepo);
      
      if (!parsedBase) {
        setValidationError('Invalid Base Repository path. Use "owner/repo" or GitHub URL.');
        return;
      }
      if (!parsedCompare) {
        setValidationError('Invalid Compare Repository path. Use "owner/repo" or GitHub URL.');
        return;
      }
      if (!baseDateFrom || !baseDateTo || !compareDateFrom || !compareDateTo) {
        setValidationError('Please select all date ranges for comparison.');
        return;
      }

      onGenerateDiff({
        base: { ...parsedBase, since: baseDateFrom, until: baseDateTo },
        compare: { ...parsedCompare, since: compareDateFrom, until: compareDateTo }
      });
    } else {
      const parsed = parseRepoUrl(repo);
      if (!parsed) {
        setValidationError('Invalid Repository path. Use "owner/repo" or GitHub URL.');
        return;
      }
      if (!dateFrom || !dateTo) {
        setValidationError('Please select both start and end dates.');
        return;
      }

      onGenerate({
        owner: parsed.owner,
        repo: parsed.repo,
        since: dateFrom,
        until: dateTo
      });
    }
  };

  return (
    <div className="dark:bg-slate-900/35 bg-white border border-slate-200 dark:border-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl transition-colors duration-200">
      {/* Tab Selectors */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500 w-4 h-4" />
          <h2 className="font-bold text-slate-800 dark:text-slate-200 tracking-wide text-xs uppercase">Configure Generator</h2>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setIsDiffMode(!isDiffMode);
            setValidationError('');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-slate-950 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-amber-600 dark:text-amber-500 cursor-pointer transition-all"
        >
          <GitCompare size={13} />
          <span>{isDiffMode ? 'Switch to Single Repo' : 'Switch to Compare Diff'}</span>
        </button>
      </div>

      {validationError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Single Repo Form */}
        {!isDiffMode && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Repo Input */}
            <div className="lg:col-span-6 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                GitHub Repository
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. facebook/react"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-500 outline-none text-sm transition-all font-medium"
                />
              </div>
            </div>

            {/* Date Picker From */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Date From
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 focus:border-amber-500 dark:focus:border-amber-500 outline-none text-xs font-mono transition-all"
                />
              </div>
            </div>

            {/* Date Picker To */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Date To
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border border-slate-200 dark:border-slate-850 text-slate-855 dark:text-slate-200 focus:border-amber-500 dark:focus:border-amber-500 outline-none text-xs font-mono transition-all"
                />
              </div>
            </div>

          </div>
        )}

        {/* Diff Mode Form */}
        {isDiffMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            
            <div className="hidden lg:flex absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-10 dark:bg-slate-950 bg-white p-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-650">
              <ArrowRight size={14} />
            </div>

            {/* Side A: Base Release */}
            <div className="p-4 rounded-xl dark:bg-slate-950/40 bg-slate-50/50 border border-slate-200 dark:border-slate-850/50 space-y-3">
              <div className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <span>Base Release (A)</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Repository URL / Path</label>
                <input
                  type="text"
                  value={baseRepo}
                  onChange={(e) => handleBaseRepoChange(e.target.value)}
                  placeholder="e.g. facebook/react"
                  className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 text-xs font-medium focus:border-amber-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Since</label>
                  <input
                    type="date"
                    value={baseDateFrom}
                    onChange={(e) => setBaseDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs font-mono focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Until</label>
                  <input
                    type="date"
                    value={baseDateTo}
                    onChange={(e) => setBaseDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-1 pt-1">
                <button type="button" onClick={() => applyQuickRange(7, 'base')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">7d</button>
                <button type="button" onClick={() => applyQuickRange(30, 'base')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">30d</button>
                <button type="button" onClick={() => applyQuickRange(90, 'base')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">90d</button>
              </div>
            </div>

            {/* Side B: Compare Release */}
            <div className="p-4 rounded-xl dark:bg-amber-950/5 bg-amber-500/5 border border-amber-200/30 dark:border-amber-950/20 space-y-3">
              <div className="flex items-center gap-1.5 mb-1 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span>Compare Release (B)</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Repository URL / Path</label>
                <input
                  type="text"
                  value={compareRepo}
                  onChange={(e) => setCompareRepo(e.target.value)}
                  placeholder="e.g. facebook/react"
                  className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 text-xs font-medium focus:border-amber-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Since</label>
                  <input
                    type="date"
                    value={compareDateFrom}
                    onChange={(e) => setCompareDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs font-mono focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Until</label>
                  <input
                    type="date"
                    value={compareDateTo}
                    onChange={(e) => setCompareDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg dark:bg-slate-950 bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-1 pt-1">
                <button type="button" onClick={() => applyQuickRange(7, 'compare')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">7d</button>
                <button type="button" onClick={() => applyQuickRange(30, 'compare')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">30d</button>
                <button type="button" onClick={() => applyQuickRange(90, 'compare')} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer">90d</button>
              </div>
            </div>

          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
          
          {/* Quick Dates */}
          {!isDiffMode ? (
            <div className="flex items-center gap-1.5 self-start sm:self-auto select-none">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Range:</span>
              <button 
                type="button" 
                onClick={() => applyQuickRange(7, 'single')}
                className="text-xs px-2.5 py-1 rounded-lg dark:bg-slate-950 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 transition-colors cursor-pointer"
              >
                7 Days
              </button>
              <button 
                type="button" 
                onClick={() => applyQuickRange(30, 'single')}
                className="text-xs px-2.5 py-1 rounded-lg dark:bg-slate-950 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 transition-colors cursor-pointer"
              >
                30 Days
              </button>
              <button 
                type="button" 
                onClick={() => applyQuickRange(90, 'single')}
                className="text-xs px-2.5 py-1 rounded-lg dark:bg-slate-950 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 transition-colors cursor-pointer"
              >
                90 Days
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic max-w-sm">
              Comparing base release to compare release. Actionable Git comparative view.
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:opacity-75 disabled:cursor-not-allowed text-black font-bold text-sm shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isDiffMode ? 'Compare Releases' : 'Generate Changelog'}</span>
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}
