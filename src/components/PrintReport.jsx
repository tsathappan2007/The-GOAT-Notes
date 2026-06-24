import React from 'react';
import { suggestVersionBump } from '../utils/riskRadar';

/**
 * PrintReport Component
 * A print-only component (hidden print:block) that formats a multi-page, 
 * professional release documentation package when printing/saving to PDF.
 */
export default function PrintReport({ 
  changelog, 
  owner, 
  repo, 
  since, 
  until, 
  risk, 
  highlights = [], 
  currentVersion = 'v1.0.0' 
}) {
  if (!changelog) return null;

  const bump = risk ? suggestVersionBump(risk.severity, currentVersion) : null;
  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="hidden print:block text-black bg-white p-8 font-sans w-full max-w-[21cm] mx-auto min-h-screen">
      
      {/* PAGE 1: COVER SHEET */}
      <div className="flex flex-col justify-between h-[27.5cm] border-4 border-double border-amber-600/30 p-8 mb-[2cm] break-after-page">
        
        {/* Header Branding */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center justify-center border-2 border-amber-600 p-3 rounded-full mb-4">
            {/* Minimalist Goat SVG representation for print */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="48" height="48" fill="none" stroke="#b45309" strokeWidth="2">
              <path d="M 32 35 C 30 30, 25 25, 20 28 C 15 31, 18 38, 22 42 C 26 46, 32 48, 32 52 C 32 56, 28 60, 26 65 C 24 70, 28 75, 33 78 C 38 81, 44 80, 48 76 C 52 72, 53 66, 56 62 C 59 58, 65 55, 72 52 C 79 49, 82 43, 80 38 C 78 33, 72 32, 66 35 C 60 38, 54 42, 48 40 C 42 38, 38 32, 32 35 Z" fill="#fef3c7" />
              <path d="M 40 32 C 36 24, 30 18, 20 18 C 26 15, 34 14, 42 20 C 48 24, 52 30, 52 38" fill="none" strokeWidth="4" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase text-amber-900">THE G.O.A.T. Notes</h1>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Official Release Intel &amp; Metrics Package</p>
        </div>

        {/* Repository Subject */}
        <div className="text-center my-12">
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Target Repository</span>
          <h2 className="text-4xl font-extrabold tracking-tight mt-1 text-slate-900">{owner}/{repo}</h2>
          <p className="text-sm font-mono text-slate-600 mt-2">
            Analysis Period: {since} to {until}
          </p>
        </div>

        {/* Metadata Table (SemVer & Risk) */}
        <div className="bg-slate-50 border border-slate-250 p-6 rounded-xl space-y-4 mx-4">
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
            <div className="px-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Suggested Release version</span>
              {bump && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-slate-850">{currentVersion}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-mono font-black text-xl text-amber-900">{bump.version}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-amber-100 border border-amber-200 rounded text-amber-800">
                    {bump.type}
                  </span>
                </div>
              )}
            </div>
            
            <div className="px-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Stability Risk Assessment</span>
              {risk && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`font-bold text-lg uppercase ${
                    risk.severity === 'High' ? 'text-rose-700' : risk.severity === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {risk.severity} Risk
                  </span>
                  <span className="text-slate-400 font-mono text-sm">({risk.confidence}% Confidence)</span>
                </div>
              )}
            </div>
          </div>
          
          {/* SemVer Advice description */}
          {bump && (
            <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wide block mb-0.5">SemVer Remediation Advice:</span>
              {bump.type === 'major' 
                ? 'A Major bump is suggested due to breaking changes. To downgrade, avoid removing public classes/APIs; mark them as @deprecated instead and preserve their functions.' 
                : bump.type === 'minor'
                  ? 'A Minor bump is suggested due to config or schema updates. To downgrade, ensure no new features or exports are added. Keep commits strictly focused on bug fixes.'
                  : 'Stable patch release. All changes maintain complete backwards compatibility.'}
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-8 border-t border-slate-100 pt-6">
          Compiled on {todayStr} · Client-Side Cryptographic Summary
        </div>

      </div>

      {/* PAGE 2: EXECUTIVE BRIEF & SEMANTIC IMPACT HIGHLIGHTS */}
      <div className="h-[27.5cm] flex flex-col justify-between py-6 mb-[2cm] break-after-page">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-6">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">THE G.O.A.T. Notes · Section 1</span>
            <span className="text-xs font-mono text-slate-500">{owner}/{repo}</span>
          </div>

          {/* Executive Summary */}
          <div className="space-y-3.5 mb-10">
            <h3 className="text-lg font-bold uppercase tracking-wider text-amber-900 border-l-3 border-amber-600 pl-3">
              Executive Brief
            </h3>
            <p className="text-base text-slate-800 leading-relaxed font-serif italic bg-slate-50 border border-slate-200 p-5 rounded-lg">
              {changelog.exec}
            </p>
          </div>

          {/* Semantic Impact Highlights */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold uppercase tracking-wider text-amber-900 border-l-3 border-amber-600 pl-3">
              Semantic Impact Analysis
            </h3>
            <p className="text-xs text-slate-500">
              The highest-scoring commits in the release date range, ranked semantically by their files impacted (Security = 3, API/Schema = 2, Config = 2, Test = 0.5, Other = 1).
            </p>
            
            {/* Table of Top Commits */}
            <table className="w-full text-left border-collapse border border-slate-200 mt-2">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-16">Rank</th>
                  <th className="p-3 border-r border-slate-200 w-24">Commit</th>
                  <th className="p-3 border-r border-slate-200">Commit Message</th>
                  <th className="p-3 border-r border-slate-200 w-28">Author</th>
                  <th className="p-3 w-20 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {highlights.slice(0, 5).map((commit, idx) => (
                  <tr key={commit.fullSha} className="hover:bg-slate-50/50">
                    <td className="p-3 border-r border-slate-200 font-bold text-slate-500">#{idx + 1}</td>
                    <td className="p-3 border-r border-slate-200 font-mono font-semibold text-amber-900">{commit.sha}</td>
                    <td className="p-3 border-r border-slate-200 font-medium text-slate-800 truncate max-w-xs">{commit.message}</td>
                    <td className="p-3 border-r border-slate-200 text-slate-600">{commit.author}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{commit.impactScore} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page Footer */}
        <div className="text-center text-[9px] font-mono text-slate-400 border-t border-slate-150 pt-4 flex justify-between">
          <span>{todayStr}</span>
          <span>THE G.O.A.T. Notes Report Package</span>
          <span>Page 2</span>
        </div>
      </div>

      {/* PAGE 3: DETAILED AUDIENCE CHANGELOGS */}
      <div className="flex flex-col justify-between py-6 min-h-[27.5cm]">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-6">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">THE G.O.A.T. Notes · Section 2</span>
            <span className="text-xs font-mono text-slate-500">{owner}/{repo}</span>
          </div>

          {/* Developer Changelog */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold tracking-wider text-amber-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>I. Developer Changelog (Technical)</span>
              <span className="text-slate-400 font-normal text-[10px] lowercase italic">for engineering teams</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-850 pl-4 list-disc marker:text-slate-400 leading-relaxed">
              {(changelog.developer || []).map((item, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{item.bullet}</span>
                  {item.evidence && (
                    <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                      (PR #{item.evidence.pr || 'N/A'} · {item.evidence.commit?.substring(0,7)} · {item.evidence.files} files)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* PM Changelog */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold tracking-wider text-amber-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>II. Product Manager Changelog (Business Value)</span>
              <span className="text-slate-400 font-normal text-[10px] lowercase italic">for product &amp; QA teams</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-850 pl-4 list-disc marker:text-slate-400 leading-relaxed">
              {(changelog.pm || []).map((item, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{item.bullet}</span>
                  {item.evidence && (
                    <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                      ({item.evidence.commit?.substring(0,7)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Changelog */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold tracking-wider text-amber-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>III. Customer Changelog (Plain English)</span>
              <span className="text-slate-400 font-normal text-[10px] lowercase italic">for users &amp; support teams</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-850 pl-4 list-disc marker:text-slate-400 leading-relaxed">
              {(changelog.customer || []).map((item, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{item.bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Page Footer */}
        <div className="text-center text-[9px] font-mono text-slate-400 border-t border-slate-150 pt-4 mt-12 flex justify-between">
          <span>{todayStr}</span>
          <span>THE G.O.A.T. Notes Report Package</span>
          <span>Page 3</span>
        </div>
      </div>

    </div>
  );
}
