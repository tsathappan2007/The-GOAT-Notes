import React, { useState } from 'react';
import { Copy, Printer, Check, Terminal, Briefcase, Users, FileText } from 'lucide-react';
import EvidenceChip from './EvidenceChip';
import ToneSlider from './ToneSlider';

/**
 * ChangelogTabs Component
 * Manages the pill-style tab switcher and renders the changelog for the 4 target audiences.
 * Fully optimized for both Light and Dark theme displays.
 */
export default function ChangelogTabs({ 
  changelog, 
  owner, 
  repo, 
  customerTone, 
  onToneChange, 
  isToneLoading 
}) {
  const [activeTab, setActiveTab] = useState('developer');
  const [copied, setCopied] = useState(false);

  if (!changelog) return null;

  const tabs = [
    { id: 'developer', label: 'Developer', icon: <Terminal size={14} /> },
    { id: 'pm', label: 'PM / Internal', icon: <Briefcase size={14} /> },
    { id: 'customer', label: 'Customer', icon: <Users size={14} /> },
    { id: 'exec', label: 'Exec Brief', icon: <FileText size={14} /> }
  ];

  const formatEvidenceMd = (ev) => {
    if (!ev) return '';
    const parts = [];
    const hasRepo = owner && repo;
    
    if (ev.pr) {
      const prUrl = hasRepo ? `https://github.com/${owner}/${repo}/pull/${ev.pr}` : '';
      parts.push(prUrl ? `[PR #${ev.pr}](${prUrl})` : `PR #${ev.pr}`);
    }
    if (ev.commit) {
      const commitUrl = hasRepo ? `https://github.com/${owner}/${repo}/commit/${ev.commit}` : '';
      const shortSha = ev.commit.substring(0, 7);
      parts.push(commitUrl ? `[${shortSha}](${commitUrl})` : shortSha);
    }
    if (typeof ev.files === 'number') {
      parts.push(`${ev.files} file${ev.files === 1 ? '' : 's'}`);
    }
    
    return parts.length > 0 ? ` (${parts.join(' · ')})` : '';
  };

  const getTabMarkdown = () => {
    const repoInfo = owner && repo ? `## Release Notes for ${owner}/${repo}\n\n` : '## Release Notes\n\n';
    
    if (activeTab === 'exec') {
      return `${repoInfo}### Executive Brief\n\n${changelog.exec}`;
    }

    const bullets = changelog[activeTab] || [];
    let md = `${repoInfo}### ${activeTab === 'pm' ? 'PM / Internal' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Changelog\n\n`;
    
    bullets.forEach(b => {
      md += `- ${b.bullet}${formatEvidenceMd(b.evidence)}\n`;
    });

    return md;
  };

  const handleCopyMarkdown = async () => {
    const markdownText = getTabMarkdown();
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTabContent = () => {
    if (activeTab === 'exec') {
      return (
        <div className="py-6 px-2">
          <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic border-l-4 border-amber-500 pl-5 bg-slate-100/50 dark:bg-slate-900/15 py-4 rounded-r-lg">
            {changelog.exec}
          </p>
          <div className="mt-4 text-xs text-slate-500 italic">
            This Executive Brief is a business-focused synthesis of the release, compiled client-side.
          </div>
        </div>
      );
    }

    const bullets = changelog[activeTab] || [];

    if (bullets.length === 0) {
      return (
        <div className="py-8 text-center text-slate-500 text-sm">
          No changes found for this audience.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activeTab === 'customer' && (
          <div className="p-3 dark:bg-slate-900/30 bg-slate-50 border border-slate-200 dark:border-slate-800/60 rounded-xl mb-4">
            <ToneSlider 
              currentTone={customerTone} 
              onChange={onToneChange} 
              disabled={isToneLoading} 
            />
          </div>
        )}

        {isToneLoading && activeTab === 'customer' ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Regenerating in {customerTone} tone...</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {bullets.map((item, idx) => (
              <li key={idx} className="py-4 first:pt-1 last:pb-1 group">
                <div className="flex gap-2.5">
                  <span className="text-amber-500 font-bold text-sm mt-0.5 select-none">✦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-750 dark:text-slate-200 text-sm leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      {item.bullet}
                    </p>
                    <EvidenceChip 
                      evidence={item.evidence} 
                      owner={owner} 
                      repo={repo} 
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="dark:bg-slate-900/20 bg-white border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden print:border-0 print:bg-transparent transition-colors duration-200">
      
      {/* Top bar with tabs & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-900 p-4 gap-3 dark:bg-slate-900/40 bg-slate-50 print:hidden">
        {/* Tab triggers */}
        <div className="flex flex-wrap gap-1.5 dark:bg-black bg-slate-200 p-1 rounded-xl border border-slate-200 dark:border-slate-900 self-start sm:self-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold dark:bg-slate-900 bg-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            title="Copy current tab as Markdown"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold dark:bg-slate-900 bg-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Title */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 capitalize">
          {activeTab === 'pm' ? 'Product Manager / Internal' : activeTab} Release Notes
        </h1>
        {owner && repo && (
          <p className="text-sm text-slate-500 mt-1">
            Repository: github.com/{owner}/{repo}
          </p>
        )}
      </div>

      {/* Tab Panel Content */}
      <div className="p-5 sm:p-6 dark:bg-slate-900/10 bg-white print:p-0">
        {renderTabContent()}
      </div>
    </div>
  );
}
