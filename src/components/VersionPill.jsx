import React, { useState } from 'react';
import { ArrowRight, Sparkles, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Info, BookOpen } from 'lucide-react';
import { suggestVersionBump } from '../utils/riskRadar';

/**
 * VersionPill Component
 * Suggests the next version bump based on risk severity assessment.
 * Shows: Current Version -> Suggested Version (Bump Type)
 * Interactive: Clicking the pill expands a detailed SemVer remediation advice card.
 */
export default function VersionPill({ severity, currentVersion = 'v1.0.0' }) {
  const [isOpen, setIsOpen] = useState(false);
  const bump = suggestVersionBump(severity, currentVersion);
  
  const config = {
    major: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15',
      label: 'Major Bump',
      glow: 'shadow-[0_0_10px_rgba(244,63,94,0.08)]',
      dotColor: 'bg-rose-500',
      why: 'Detected 2 or more unique breaking change keywords (such as "remove", "breaking", "drop", "delete", "migration") in the commit history and PR titles.',
      remediation: 'To downgrade this to a Minor or Patch bump, you must preserve backwards compatibility. Do not delete public APIs, database columns, or endpoints. Instead: 1) Mark them as @deprecated, 2) Keep the existing code path active, and 3) Add a compatibility layer/wrapper to defer the breaking change to a later date.'
    },
    minor: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15',
      label: 'Minor Bump',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.08)]',
      dotColor: 'bg-amber-500',
      why: 'Detected exactly 1 breaking or structural change keyword (such as "config", "env", "schema", "auth") in the commit history or PR titles.',
      remediation: 'To downgrade this to a Patch bump, you must avoid adding any new features, public exports, or interface modifications. Limit your changes strictly to bug fixes, internal refactoring, test suite updates, or performance optimizations. A patch bump implies the public API surface remains identical.'
    },
    patch: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
      label: 'Patch Bump',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.08)]',
      dotColor: 'bg-emerald-500',
      why: 'Zero breaking or configuration-altering keywords were detected in the commits. The changes appear to be routine updates, refactors, or fixes.',
      remediation: 'This is already the lowest possible version bump under SemVer. No code adjustments are needed, as this release maintains complete backwards compatibility with zero new public-facing features.'
    }
  };

  const style = config[bump.type] || config.patch;

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto items-start select-none">
      
      {/* Interactive Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold select-none cursor-pointer transition-all duration-200 ${style.bg} ${style.glow}`}
        title="Click to view SemVer advice"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} animate-ping`} style={{ animationDuration: '3s' }} />
        <Sparkles size={11} className="shrink-0 text-amber-400/90" />
        <span className="text-slate-400 font-normal">Next:</span>
        <span className="font-mono px-1 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-900/40">{currentVersion}</span>
        <ArrowRight size={10} className="text-slate-500 shrink-0" />
        <span className="font-mono px-1 py-0.5 rounded bg-black/60 text-slate-200 border border-slate-900/50">{bump.version}</span>
        
        <span className="text-[9px] uppercase font-bold tracking-wider px-1 bg-black/20 rounded border border-white/5">
          {style.label}
        </span>
        
        <div className="border-l border-slate-800/60 pl-1.5 ml-0.5 text-slate-500 group-hover:text-slate-300 transition-colors">
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Expandable SemVer Advice Accordion */}
      {isOpen && (
        <div className="w-full max-w-md p-4 rounded-xl bg-slate-950 border border-amber-500/20 text-xs shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 z-10">
          
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-2.5">
            <BookOpen size={14} className="text-amber-400" />
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">GOAT SemVer Advice</h4>
          </div>

          <div className="space-y-3">
            {/* Why section */}
            <div>
              <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wide">Why this suggestion?</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed font-medium">
                {style.why}
              </p>
            </div>

            {/* Remediation section */}
            <div>
              <span className="font-bold text-amber-400 block uppercase text-[9px] tracking-wide">Minimum Code Remediation (To downgrade)</span>
              <p className="text-slate-400 mt-1 leading-relaxed border-l border-amber-500/20 pl-2.5">
                {style.remediation}
              </p>
            </div>
            
            <div className="text-[9px] text-slate-500 text-right italic pt-1.5 border-t border-slate-900">
              * Advice generated semantically based on your commit history.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
