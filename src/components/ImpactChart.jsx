import React from 'react';
import { ExternalLink, Flame, ShieldAlert, Code2, Hammer } from 'lucide-react';

/**
 * ImpactChart Component
 * Renders a highly polished horizontal bar chart displaying the top 5 highest-impact commits.
 * Supports hover tooltips, category breakdowns, and direct links to GitHub.
 * Fully styled for both Light and Dark modes.
 */
export default function ImpactChart({ topCommits = [], owner, repo }) {
  if (!topCommits || topCommits.length === 0) return null;

  // Find the maximum impact score to scale the bars proportionally
  const maxScore = Math.max(...topCommits.map(c => c.impactScore), 1);

  // Helper to determine color based on impact score
  const getBarColorClass = (score) => {
    if (score >= 6) return 'bg-gradient-to-r from-red-600 to-rose-500';
    if (score >= 3) return 'bg-gradient-to-r from-amber-600 to-amber-400';
    return 'bg-gradient-to-r from-indigo-650 to-indigo-500';
  };

  // Helper to get an icon representing the commit type
  const getImpactIcon = (breakdown = {}) => {
    if (breakdown.security > 0) return <ShieldAlert size={14} className="text-rose-500 dark:text-rose-400" title="Security/Auth modifications" />;
    if (breakdown.api > 0) return <Code2 size={14} className="text-amber-600 dark:text-amber-400" title="API/Schema modifications" />;
    if (breakdown.config > 0) return <Hammer size={14} className="text-blue-550 dark:text-blue-400" title="Configuration modifications" />;
    return <Flame size={14} className="text-indigo-600 dark:text-indigo-400" title="General feature/logic modifications" />;
  };

  return (
    <div className="dark:bg-slate-900/40 bg-white border border-slate-250 dark:border-slate-800/80 rounded-xl p-5 shadow-sm dark:shadow-inner transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-amber-500 animate-pulse" />
        <h3 className="font-semibold text-slate-850 dark:text-slate-100 text-xs uppercase tracking-wide">
          Semantic Impact Highlights
        </h3>
        <span className="text-[9px] dark:bg-slate-800 bg-slate-100 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
          Top 5 commits
        </span>
      </div>

      <div className="space-y-3.5">
        {topCommits.map((commit, index) => {
          const percentWidth = Math.max(8, (commit.impactScore / maxScore) * 100);
          const commitUrl = owner && repo ? `https://github.com/${owner}/${repo}/commit/${commit.fullSha}` : '#';

          return (
            <div 
              key={commit.fullSha}
              className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2.5 rounded-lg dark:hover:bg-slate-800/35 hover:bg-slate-50 border border-transparent dark:hover:border-slate-800 hover:border-slate-150 transition-all duration-200"
            >
              {/* Score Pill & Category Icon */}
              <div className="flex items-center gap-2 shrink-0 md:w-32">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-5">#{index + 1}</span>
                
                {/* Category Icon */}
                <div className="p-1 dark:bg-slate-950 bg-slate-100 border border-slate-200 dark:border-slate-800/80 shrink-0 rounded">
                  {getImpactIcon(commit.breakdown)}
                </div>
                
                {/* Impact score badge */}
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded dark:bg-slate-950 bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                  {commit.impactScore} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">pts</span>
                </span>
              </div>

              {/* Commit Info & Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  {/* Message & Link */}
                  <a 
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-750 dark:text-slate-300 font-medium truncate hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1 group/link"
                  >
                    <span>{commit.message}</span>
                    <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-amber-500" />
                  </a>
                  {/* Author / SHA */}
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">
                    {commit.sha} · {commit.author}
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2 dark:bg-slate-950 bg-slate-100 rounded overflow-hidden border border-slate-200 dark:border-slate-900 shadow-inner">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${getBarColorClass(commit.impactScore)}`}
                    style={{ width: `${percentWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer explanation */}
      <div className="mt-3 text-[9px] text-slate-400 dark:text-slate-550 text-right">
        Scores: Security = 3 | API/Schema = 2 | Config = 2 | Test = 0.5 | Others = 1 (Log scaled for large diffs)
      </div>
    </div>
  );
}
