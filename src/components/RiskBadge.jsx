import React from 'react';
import { AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';

/**
 * RiskBadge Component
 * Renders the risk severity assessment and confidence level of the release.
 * Fully optimized for WCAG color contrast in both Light and Dark modes.
 */
export default function RiskBadge({ risk }) {
  if (!risk) return null;
  
  const { severity, confidence, matchedKeywords = [], flaggedCommits = [], flaggedPRs = [] } = risk;

  // Design config based on severity with explicit dark/light mode support
  const severityStyles = {
    High: {
      bg: 'dark:bg-rose-950/30 bg-rose-50 dark:border-rose-900/50 border-rose-200 dark:text-rose-400 text-rose-800',
      pill: 'bg-rose-500/10 dark:text-rose-400 text-rose-700 border-rose-500/20',
      glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      icon: <AlertOctagon className="dark:text-rose-400 text-rose-700 w-5 h-5 animate-pulse" />,
      text: 'High Risk Release'
    },
    Medium: {
      bg: 'dark:bg-amber-950/30 bg-amber-50 dark:border-amber-900/50 border-amber-200 dark:text-amber-400 text-amber-800',
      pill: 'bg-amber-500/10 dark:text-amber-400 text-amber-700 border-amber-500/20',
      glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.1)]',
      icon: <AlertTriangle className="dark:text-amber-400 text-amber-750 w-5 h-5" />,
      text: 'Medium Risk Release'
    },
    Low: {
      bg: 'dark:bg-emerald-950/30 bg-emerald-50 dark:border-emerald-900/50 border-emerald-200 dark:text-emerald-400 text-emerald-800',
      pill: 'bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border-emerald-500/20',
      glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      icon: <CheckCircle className="dark:text-emerald-400 text-emerald-700 w-5 h-5" />,
      text: 'Low Risk / Stable Release'
    }
  };

  const style = severityStyles[severity] || severityStyles.Low;

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.glow} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300`}>
      
      {/* Left section: Icon + Severity */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg dark:bg-slate-900/60 bg-white border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
          {style.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold dark:text-slate-100 text-slate-900 tracking-wide text-xs uppercase">Risk Assessment</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.pill}`}>
              {severity}
            </span>
          </div>
          <p className="text-xs dark:text-slate-300 text-slate-600 mt-1">
            {severity === 'High' 
              ? 'Contains multiple potentially breaking changes, removals, or security-sensitive updates.' 
              : severity === 'Medium' 
                ? 'Contains configuration or minor schema changes that may require attention.' 
                : 'Contains routine updates, bug fixes, or test additions. High stability.'}
          </p>
        </div>
      </div>

      {/* Right section: Confidence & Keyword Badges */}
      <div className="flex flex-col sm:flex-row md:items-center gap-4 shrink-0 border-t border-slate-200 dark:border-slate-800/40 md:border-t-0 pt-3 md:pt-0">
        
        {/* Confidence score */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase">Confidence</span>
            <span className="text-slate-900 dark:text-slate-200 font-mono font-black">{confidence}%</span>
          </div>
          <div className="w-full h-1.5 dark:bg-slate-950 bg-slate-200 rounded-full overflow-hidden border border-slate-200 dark:border-slate-900 shadow-inner">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                severity === 'High' ? 'bg-rose-600' : severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600'
              }`} 
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Matched keywords */}
        {matchedKeywords.length > 0 && (
          <div className="flex flex-col gap-1 max-w-[200px]">
            <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 font-extrabold tracking-wider">Triggers</span>
            <div className="flex flex-wrap gap-1">
              {matchedKeywords.map(kw => (
                <span 
                  key={kw} 
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded dark:bg-slate-900 bg-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 capitalize shadow-sm"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
