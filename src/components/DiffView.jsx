import React from 'react';
import { Plus, Minus, ArrowLeftRight, GitPullRequest, GitBranch } from 'lucide-react';

/**
 * DiffView Component
 * Renders a side-by-side comparison of two repository releases/date ranges.
 * Fully styled for both Light and Dark themes.
 */
export default function DiffView({ baseData, compareData }) {
  if (!baseData || !compareData) return null;

  const baseCommits = baseData.commits || [];
  const compareCommits = compareData.commits || [];
  
  const basePRs = baseData.mergedPRs || [];
  const comparePRs = compareData.mergedPRs || [];

  // Create lookup maps
  const baseShaSet = new Set(baseCommits.map(c => c.fullSha));
  const compareShaSet = new Set(compareCommits.map(c => c.fullSha));

  // Compute differences
  const addedCommits = compareCommits.filter(c => !baseShaSet.has(c.fullSha));
  const removedCommits = baseCommits.filter(c => !compareShaSet.has(c.fullSha));
  const sharedCommitsCount = compareCommits.filter(c => baseShaSet.has(c.fullSha)).length;

  // Compute PR differences
  const basePrNumbers = new Set(basePRs.map(p => p.number));
  const comparePrNumbers = new Set(comparePRs.map(p => p.number));
  const addedPRs = comparePRs.filter(p => !basePrNumbers.has(p.number));
  const removedPRs = basePRs.filter(p => !comparePrNumbers.has(p.number));

  // Determine unique files changed
  const addedFiles = new Set();
  addedCommits.forEach(c => {
    if (c.files) {
      c.files.forEach(f => addedFiles.add(f.filename));
    }
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Comparative Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Added Commits Card */}
        <div className="p-4 rounded-xl dark:bg-emerald-950/20 bg-emerald-50 dark:border-emerald-900/40 border-emerald-200 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-500">Added to Compare</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 font-mono">+{addedCommits.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Commits not in Base</div>
          </div>
          <div className="p-2.5 rounded-lg dark:bg-slate-900/60 bg-white border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Plus size={18} />
          </div>
        </div>

        {/* Removed Commits Card */}
        <div className="p-4 rounded-xl dark:bg-rose-950/20 bg-rose-50 dark:border-rose-900/40 border-rose-200 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-500">Removed / Rolled Back</span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1 font-mono">-{removedCommits.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Commits present in Base only</div>
          </div>
          <div className="p-2.5 rounded-lg dark:bg-slate-900/60 bg-white border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 shadow-sm">
            <Minus size={18} />
          </div>
        </div>

        {/* Shared / Common Card */}
        <div className="p-4 rounded-xl dark:bg-slate-900/40 bg-slate-50 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Shared / Stable</span>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 font-mono">{sharedCommitsCount}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Identical commits in both</div>
          </div>
          <div className="p-2.5 rounded-lg dark:bg-slate-900/60 bg-white border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm">
            <ArrowLeftRight size={16} />
          </div>
        </div>

      </div>

      {/* Side-by-Side Commits and PRs Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Base Release */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-2.5">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-slate-450 dark:text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide">
                Base Release
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 dark:bg-slate-900 bg-slate-100 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              {baseCommits.length} commits · {basePRs.length} PRs
            </span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {baseCommits.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No commits in base range.</div>
            ) : (
              baseCommits.map(c => {
                const isRemoved = !compareShaSet.has(c.fullSha);
                return (
                  <div 
                    key={c.fullSha}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isRemoved 
                        ? 'dark:bg-rose-950/15 bg-rose-50/60 border-rose-200 dark:border-rose-900/30' 
                        : 'dark:bg-slate-950 bg-white border-slate-200 dark:border-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">{c.sha}</span>
                      <div className="flex items-center gap-1.5">
                        {isRemoved && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-600 dark:text-rose-400">
                            Removed
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{c.author}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{c.message}</p>
                    {c.prNumber && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        <GitPullRequest size={10} />
                        <span>PR #{c.prNumber}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Compare Release */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-2.5">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-amber-600 dark:text-amber-500" />
              <h3 className="font-bold text-amber-600 dark:text-amber-500 text-xs uppercase tracking-wide">
                Compare Release
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 dark:bg-slate-900 bg-slate-100 rounded border border-slate-200 dark:border-slate-800 text-amber-650 dark:text-amber-400">
              {compareCommits.length} commits · {comparePRs.length} PRs
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {compareCommits.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No commits in compare range.</div>
            ) : (
              compareCommits.map(c => {
                const isAdded = !baseShaSet.has(c.fullSha);
                return (
                  <div 
                    key={c.fullSha}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isAdded 
                        ? 'dark:bg-emerald-950/15 bg-emerald-50/60 border-emerald-200 dark:border-emerald-900/30' 
                        : 'dark:bg-slate-950 bg-white border-slate-200 dark:border-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">{c.sha}</span>
                      <div className="flex items-center gap-1.5">
                        {isAdded && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-600 dark:text-emerald-400">
                            Added
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{c.author}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{c.message}</p>
                    {c.prNumber && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        <GitPullRequest size={10} />
                        <span>PR #{c.prNumber}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Added Files Summary */}
      {addedFiles.size > 0 && (
        <div className="dark:bg-slate-900/40 bg-white border border-slate-200 dark:border-slate-850/80 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>Impacted Files in Added Commits</span>
            <span className="text-[9px] font-mono dark:bg-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-normal">
              {addedFiles.size} unique files
            </span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {Array.from(addedFiles).map(file => (
              <div key={file} className="font-mono text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-0.5 transition-colors truncate">
                • {file}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
