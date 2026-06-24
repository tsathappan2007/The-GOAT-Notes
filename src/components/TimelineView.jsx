import React, { useState, useMemo } from 'react';
import { GitCommit, GitPullRequest, Calendar, Clock, Filter, Sparkles, ExternalLink } from 'lucide-react';

/**
 * TimelineView Component
 * Renders a visually stunning timeline of changes matching the user's screenshot.
 * Includes:
 * - Dynamic Git contribution calendar grid ("3 RELEASES · LAST MONTH") in gold
 * - Interactive filter bar (All, Fix 🐛, Improvement ✨, New Feature 🚀)
 * - Vertical card-based timeline with dates on the left
 */
export default function TimelineView({ commits = [], prs = [], owner, repo }) {
  const [activeFilter, setActiveFilter] = useState('All');

  // Categorize commits on-the-fly
  const timelineEvents = useMemo(() => {
    return commits.map((commit, index) => {
      const message = commit.message.toLowerCase();
      
      let category = 'Improvement';
      let emoji = '✨';
      let tagColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      
      if (message.includes('fix') || message.includes('bug') || message.includes('issue') || message.includes('error') || message.includes('crash') || message.includes('solve')) {
        category = 'Fix';
        emoji = '🐛';
        tagColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      } else if (message.includes('feat') || message.includes('new') || message.includes('add') || message.includes('create') || message.includes('implement')) {
        category = 'New Feature';
        emoji = '🚀';
        tagColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      }

      // Check if it's the latest release (first commit)
      const isLatest = index === 0;

      return {
        id: commit.fullSha,
        sha: commit.sha,
        fullSha: commit.fullSha,
        title: commit.message,
        description: commit.fullMessage || 'Routine update and code maintenance.',
        author: commit.author,
        date: commit.date ? new Date(commit.date) : new Date(),
        prNumber: commit.prNumber,
        category,
        emoji,
        tagColor,
        isLatest
      };
    });
  }, [commits]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return timelineEvents;
    return timelineEvents.filter(e => e.category === activeFilter);
  }, [timelineEvents, activeFilter]);

  // Counts for filters
  const counts = useMemo(() => {
    const total = timelineEvents.length;
    const fixes = timelineEvents.filter(e => e.category === 'Fix').length;
    const improvements = timelineEvents.filter(e => e.category === 'Improvement').length;
    const features = timelineEvents.filter(e => e.category === 'New Feature').length;
    return { All: total, Fix: fixes, Improvement: improvements, 'New Feature': features };
  }, [timelineEvents]);

  // Format date for timeline column (e.g., JUN 24 / 2026)
  const formatDateColumn = (date) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(date);
    return {
      monthDay: `${months[d.getMonth()]} ${d.getDate()}`,
      year: d.getFullYear()
    };
  };

  // Generate simulated Git contribution calendar grid dynamically based on commits
  const contributionCells = useMemo(() => {
    // 24 columns x 4 rows = 96 cells representing a visual grid
    const totalCells = 96;
    const cells = Array.from({ length: totalCells }, (_, i) => ({ id: i, count: 0 }));
    
    if (commits.length === 0) return cells;

    // Distribute commits across cells based on index to create a natural-looking distribution
    commits.forEach((c, idx) => {
      // Hash the commit SHA to get a pseudo-random cell index (deterministic)
      let hash = 0;
      for (let i = 0; i < c.fullSha.length; i++) {
        hash = c.fullSha.charCodeAt(i) + ((hash << 5) - hash);
      }
      const cellIndex = Math.abs(hash) % totalCells;
      cells[cellIndex].count += 1;
    });

    return cells;
  }, [commits]);

  // Determine the color of each contribution block (shades of gold)
  const getCellColor = (count) => {
    if (count === 0) return 'dark:bg-slate-950 bg-slate-100 border-slate-900/10 dark:border-slate-900';
    if (count === 1) return 'bg-amber-600/30 border-amber-500/20';
    if (count === 2) return 'bg-amber-500/60 border-amber-400/30';
    return 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'; // Gold glowing
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Timeline Header & Grid Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-slate-900/25 dark:bg-slate-950/25 border border-amber-500/10 p-5 rounded-2xl">
        
        {/* Left side text */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 font-mono">Changelog</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 dark:text-white tracking-tight capitalize">
            {repo} Timeline
          </h2>
          <p className="text-xs text-slate-400 max-w-md">
            Every change, in order — the continuous timeline of everything shipped.
          </p>
        </div>

        {/* Right side Git Calendar Grid */}
        <div className="p-4 rounded-xl dark:bg-black/40 bg-white/50 border border-slate-200 dark:border-slate-850 self-stretch lg:self-auto flex flex-col justify-center min-w-[280px]">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span className="uppercase tracking-wider">{commits.length} commits · {prs.length} releases</span>
            <span className="uppercase tracking-wider">activity graph</span>
          </div>
          
          {/* Calendar Grid 24 cols x 4 rows */}
          <div className="grid grid-flow-col grid-rows-4 gap-1 select-none">
            {contributionCells.map(cell => (
              <div 
                key={cell.id} 
                className={`w-2.5 h-2.5 rounded-sm border transition-all duration-300 ${getCellColor(cell.count)}`}
                title={`${cell.count} commit${cell.count === 1 ? '' : 's'}`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2">
            <span>Past Weeks</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="w-2 h-2 rounded-sm dark:bg-slate-950 bg-slate-100 border dark:border-slate-900" />
              <div className="w-2 h-2 rounded-sm bg-amber-600/30 border border-amber-500/20" />
              <div className="w-2 h-2 rounded-sm bg-amber-500/60 border border-amber-400/30" />
              <div className="w-2 h-2 rounded-sm bg-amber-400 border border-amber-300" />
              <span>More</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Filter Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-900 pb-3">
        {['All', 'Fix', 'Improvement', 'New Feature'].map(filter => {
          const isActive = activeFilter === filter;
          const count = counts[filter] || 0;
          
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10 font-bold'
                  : 'dark:bg-slate-950 bg-white text-slate-400 hover:text-slate-200 border-slate-200 dark:border-slate-850 hover:border-slate-700'
              }`}
            >
              <span>{filter === 'Fix' ? '🐛 Fix' : filter === 'Improvement' ? '✨ Improvement' : filter === 'New Feature' ? '🚀 New Feature' : '📦 All Changes'}</span>
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/10 text-black' : 'dark:bg-slate-900 bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vertical Timeline Card List */}
      <div className="relative border-l border-slate-200 dark:border-slate-900 ml-4 sm:ml-20 pl-4 sm:pl-8 space-y-8 py-2">
        
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No changes found matching the selected filter.
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const dateInfo = formatDateColumn(event.date);
            const commitUrl = owner && repo ? `https://github.com/${owner}/${repo}/commit/${event.fullSha}` : '#';

            return (
              <div key={event.id} className="relative group">
                
                {/* Date indicator on the far left (for larger screens) */}
                <div className="hidden sm:block absolute -left-[140px] top-1.5 w-24 text-right select-none">
                  <span className="block text-xs font-bold text-slate-200 dark:text-slate-300 font-mono tracking-wider">
                    {dateInfo.monthDay}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500 font-mono mt-0.5">
                    {dateInfo.year}
                  </span>
                </div>

                {/* Vertical line indicator circle */}
                <div className={`absolute -left-[21px] sm:-left-[37px] top-2.5 w-3 h-3 rounded-full border-2 bg-black transition-all group-hover:scale-125 ${
                  event.isLatest 
                    ? 'border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' 
                    : 'border-slate-700 dark:border-slate-800'
                }`} />

                {/* Timeline Event Card */}
                <div className="p-4 sm:p-5 rounded-2xl dark:bg-black bg-white border border-slate-200 dark:border-slate-900 group-hover:border-amber-500/20 transition-all duration-300 shadow-sm hover:shadow-md">
                  
                  {/* Card Header (Meta tags & Actions) */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    
                    {/* Tags */}
                    <div className="flex items-center gap-1.5">
                      {event.isLatest && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded text-amber-400">
                          Latest Release
                        </span>
                      )}
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${event.tagColor}`}>
                        {event.category}
                      </span>
                    </div>

                    {/* Small date for mobile view (hidden on desktop) */}
                    <span className="sm:hidden text-[10px] font-bold text-slate-500 font-mono">
                      {dateInfo.monthDay}, {dateInfo.year}
                    </span>

                    {/* Commit Link */}
                    <a 
                      href={commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
                      title="View Commit on GitHub"
                    >
                      <span className="font-semibold">{event.sha}</span>
                      <ExternalLink size={10} />
                    </a>

                  </div>

                  {/* Card Title */}
                  <h4 className="text-sm sm:text-base font-bold text-slate-200 dark:text-slate-100 flex items-center gap-2">
                    <span>{event.emoji}</span>
                    <span className="group-hover:text-white transition-colors leading-snug">{event.title}</span>
                  </h4>

                  {/* Card Description */}
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>

                  {/* Card Footer (Author & PR) */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500 select-none">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-800" />
                      <span>Committed by <span className="font-semibold text-slate-400">{event.author}</span></span>
                    </div>
                    {event.prNumber && (
                      <span className="inline-flex items-center gap-1 text-indigo-400 font-semibold">
                        <GitPullRequest size={10} />
                        <span>PR #{event.prNumber}</span>
                      </span>
                    )}
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
