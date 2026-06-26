import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Eye, Share2, ArrowRight, AlertTriangle, Check, Info, GitBranch, FileText, Calendar, BarChart3, LayoutDashboard, Trophy, Users, GraduationCap, X } from 'lucide-react';

// API & Utilities
import { fetchRepoData, fetchLatestRelease } from './api/github';
import { generateReleaseNotes, regenerateCustomerTone } from './api/claude';
import { calculateRisk } from './utils/riskRadar';
import { calculateImpactScores } from './utils/impactScore';
import { updateUrlHash, readUrlHash } from './utils/shareUrl';

// Components
import RepoInput from './components/RepoInput';
import RiskBadge from './components/RiskBadge';
import VersionPill from './components/VersionPill';
import ImpactChart from './components/ImpactChart';
import ChangelogTabs from './components/ChangelogTabs';
import DiffView from './components/DiffView';
import TimelineView from './components/TimelineView';
import GoatChat from './components/GoatChat';
import PrintReport from './components/PrintReport';

// Branding
import GoatLogo from './assets/GoatLogo';

export default function App() {
  // State: Core Data
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  
  const [commits, setCommits] = useState([]);
  const [prs, setPrs] = useState([]);
  const [changelog, setChangelog] = useState(null);
  const [risk, setRisk] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [currentVersion, setCurrentVersion] = useState('v1.0.0');

  // State: Main navigation sub-bar ('dashboard' | 'reports' | 'timeline' | 'diff')
  const [activeTab, setActiveTab] = useState('dashboard');

  // State: Diff Mode Data
  const [diffMode, setDiffMode] = useState(false);
  const [baseData, setBaseData] = useState(null);
  const [compareData, setCompareData] = useState(null);

  // API Keys & Credentials loaded from environment variables (.env)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const customEndpoint = import.meta.env.VITE_CUSTOM_ENDPOINT || '';
  const githubPat = import.meta.env.VITE_GITHUB_PAT || '';

  // Theme: Constant dark mode


  // State: Loaders & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [isToneLoading, setIsToneLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerTone, setCustomerTone] = useState('Balanced');
  const [isSharedView, setIsSharedView] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Apply theme class to document body
  useEffect(() => {
    window.document.body.classList.add('dark');
    localStorage.setItem('goat_notes_theme', 'dark');
  }, []);

  // Load shared URL hash state on mount
  useEffect(() => {
    const sharedData = readUrlHash();
    if (sharedData) {
      setIsSharedView(true);
      
      // Restore states
      setOwner(sharedData.owner || '');
      setRepo(sharedData.repo || '');
      setSince(sharedData.since || '');
      setUntil(sharedData.until || '');
      
      if (sharedData.diffMode) {
        setDiffMode(true);
        setBaseData(sharedData.baseData);
        setCompareData(sharedData.compareData);
        setActiveTab('diff');
      } else {
        setDiffMode(false);
        setCommits(sharedData.commits || []);
        setPrs(sharedData.prs || []);
        setChangelog(sharedData.changelog || null);
        setRisk(sharedData.risk || null);
        setHighlights(sharedData.highlights || []);
        setCurrentVersion(sharedData.currentVersion || 'v1.0.0');
        setCustomerTone(sharedData.customerTone || 'Balanced');
        
        // If a specific view was active, restore it
        if (sharedData.activeTab) {
          setActiveTab(sharedData.activeTab);
        } else {
          setActiveTab('dashboard');
        }
      }
    }
  }, []);



  // Workflow: Full Release Notes Generation
  const handleGenerate = async ({ owner: o, repo: r, since: s, until: u }) => {
    setIsLoading(true);
    setError('');
    setChangelog(null);
    setRisk(null);
    setHighlights([]);
    setDiffMode(false);
    setIsSharedView(false);
    setActiveTab('dashboard'); // Default to dashboard on load
    
    // Clear hash
    updateUrlHash(null);

    if (!apiKey) {
      setError('An API Key is required to generate release notes. Please configure the VITE_ANTHROPIC_API_KEY environment variable in your .env file.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch latest release tag
      let tag = 'v1.0.0';
      try {
        tag = await fetchLatestRelease(o, r, githubPat);
      } catch (e) {
        console.warn("Couldn't fetch latest tag. Defaulting to v1.0.0", e);
      }
      setCurrentVersion(tag);

      // 2. Fetch commits and closed pull requests
      const data = await fetchRepoData({
        owner: o,
        repo: r,
        since: s,
        until: u,
        token: githubPat
      });

      if (data.commits.length === 0) {
        throw new Error(`No commits found for ${o}/${r} in the selected date range. Try choosing a wider date range.`);
      }

      // 3. Run semantic impact scoring
      const scoringResult = calculateImpactScores(data.commits);
      const topCommits = scoringResult.top5Commits;
      
      // 4. Run risk radar
      const riskResult = calculateRisk(data.commits, data.mergedPRs);

      // 5. Query AI for structured release notes
      const notes = await generateReleaseNotes({
        commits: data.commits,
        prs: data.mergedPRs,
        apiKey,
        endpoint: customEndpoint
      });

      // 6. Save states
      setOwner(o);
      setRepo(r);
      setSince(s);
      setUntil(u);
      setCommits(data.commits);
      setPrs(data.mergedPRs);
      setRisk(riskResult);
      setHighlights(topCommits);
      setChangelog(notes);
      setCustomerTone('Balanced');

      // 7. Update URL hash for sharing (compresses automatically)
      const sharePayload = {
        owner: o,
        repo: r,
        since: s,
        until: u,
        diffMode: false,
        changelog: notes,
        risk: riskResult,
        highlights: topCommits,
        currentVersion: tag,
        customerTone: 'Balanced',
        activeTab: 'dashboard'
      };
      updateUrlHash(sharePayload);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Workflow: Tone change re-summarizer
  const handleToneChange = async (newTone) => {
    if (!changelog || isToneLoading) return;
    
    setCustomerTone(newTone);
    setIsToneLoading(true);
    setError('');

    try {
      const rewrittenCustomerBullets = await regenerateCustomerTone({
        commits,
        prs,
        tone: newTone,
        apiKey,
        endpoint: customEndpoint
      });

      const updatedChangelog = {
        ...changelog,
        customer: rewrittenCustomerBullets
      };
      setChangelog(updatedChangelog);

      // Update URL hash
      const sharePayload = {
        owner,
        repo,
        since,
        until,
        diffMode: false,
        changelog: updatedChangelog,
        risk,
        highlights,
        currentVersion,
        customerTone: newTone,
        activeTab
      };
      updateUrlHash(sharePayload);

    } catch (err) {
      console.error(err);
      setError(`Failed to rewrite tone: ${err.message}`);
    } finally {
      setIsToneLoading(false);
    }
  };

  // Workflow: Compare Diff Mode
  const handleGenerateDiff = async ({ base, compare }) => {
    setIsLoading(true);
    setError('');
    setChangelog(null);
    setRisk(null);
    setHighlights([]);
    setDiffMode(true);
    setIsSharedView(false);
    setActiveTab('diff');
    
    // Clear hash
    updateUrlHash(null);

    try {
      const baseResult = await fetchRepoData({
        owner: base.owner,
        repo: base.repo,
        since: base.since,
        until: base.until,
        token: githubPat
      });

      const compareResult = await fetchRepoData({
        owner: compare.owner,
        repo: compare.repo,
        since: compare.since,
        until: compare.until,
        token: githubPat
      });

      const basePayload = {
        commits: baseResult.commits,
        mergedPRs: baseResult.mergedPRs,
        owner: base.owner,
        repo: base.repo,
        since: base.since,
        until: base.until
      };

      const comparePayload = {
        commits: compareResult.commits,
        mergedPRs: compareResult.mergedPRs,
        owner: compare.owner,
        repo: compare.repo,
        since: compare.since,
        until: compare.until
      };

      setBaseData(basePayload);
      setCompareData(comparePayload);

      // Update URL hash
      const sharePayload = {
        diffMode: true,
        baseData: basePayload,
        compareData: comparePayload
      };
      updateUrlHash(sharePayload);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate comparison. Please check repository names and date ranges.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Share link
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  // Reset View
  const handleReset = () => {
    setChangelog(null);
    setRisk(null);
    setHighlights([]);
    setBaseData(null);
    setCompareData(null);
    setDiffMode(false);
    setIsSharedView(false);
    setActiveTab('dashboard');
    updateUrlHash(null);
  };

  return (
    <div className="min-h-screen flex flex-col antialiased font-sans transition-colors duration-300 print:bg-white print:text-black">
      
      {/* 100% Professional Print Document Package (Only visible during physical printing / PDF export) */}
      <PrintReport 
        changelog={changelog}
        owner={owner}
        repo={repo}
        since={since}
        until={until}
        risk={risk}
        highlights={highlights}
        currentVersion={currentVersion}
      />

      {/* Screen Interface (Hidden when printing!) */}
      <div className="flex-grow flex flex-col print:hidden">
        
        {/* Top Navigation Header (Liquid Glass) */}
        <header className="liquid-glass border-b sticky top-0 z-40 select-none">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoatLogo className="w-9 h-9" size={36} />
              <div>
                <h1 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>THE G.O.A.T. Notes</span>
                </h1>
                <p className="text-[9px] dark:text-amber-500/90 text-amber-600 font-bold tracking-widest uppercase">Premium AI Release Intel</p>
              </div>
            </div>

            {/* Right Header Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider dark:bg-slate-900/85 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 cursor-pointer transition-all shadow-sm"
              >
                <Trophy size={11} className="text-amber-500 animate-pulse" />
                <span>About Project</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
          
          {/* API Key Warning is handled globally when action is triggered */}

          {/* Shared View Info banner */}
          {isSharedView && (
            <div className="p-3 rounded-xl dark:bg-slate-950/30 bg-slate-50 border border-slate-200 dark:border-slate-900 text-xs flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2 text-amber-650 dark:text-amber-500">
                <Eye size={14} />
                <span className="font-semibold">Viewing shared release record. Click Reset to construct a new changelog.</span>
              </div>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              >
                Reset View
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50/5 dark:bg-rose-950/10 border border-rose-500/20 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 select-none">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold uppercase tracking-wider dark:text-rose-300 text-rose-700">Execution Error</h4>
                <p className="dark:text-slate-300 text-slate-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Repo Input configurator */}
          {!isSharedView && (
            <RepoInput 
              onGenerate={handleGenerate}
              onGenerateDiff={handleGenerateDiff}
              isLoading={isLoading}
            />
          )}

          {/* Global loader */}
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-4 select-none">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-900 rounded-full" />
                <div className="absolute top-0 w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-slate-800 dark:text-slate-200 font-semibold text-sm">Analyzing Repository Activity...</h4>
                <p className="text-xs text-slate-500">
                  Compiling commits, closed pull requests, and file deltas from GitHub.
                </p>
              </div>
            </div>
          )}

          {/* Single Repo Output View */}
          {!isLoading && !diffMode && changelog && (
            <div className="space-y-6">
              
              {/* Header Title & Share metadata */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-4 select-none">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {owner}/{repo}
                    </h2>
                    
                    {/* Version bump suggestions */}
                    {risk && (
                      <VersionPill 
                        severity={risk.severity} 
                        currentVersion={currentVersion} 
                      />
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium font-mono">
                    Analysis Period: {since} to {until} · {commits.length} commits scanned
                  </p>
                </div>

                {/* Share Link */}
                <button
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-pointer transition-all shadow-sm shrink-0"
                >
                  {shareCopied ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span>Copied Share Link!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Share Record</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sub-Navigation Bar (Liquid Glass) - Eliminates Cluttered Screens */}
              <div className="liquid-glass p-1 rounded-2xl border flex flex-wrap gap-1 select-none">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'text-slate-500 dark:text-slate-455 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'text-slate-500 dark:text-slate-455 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <FileText size={14} />
                  <span>Audience Reports</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'text-slate-500 dark:text-slate-455 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <Calendar size={14} />
                  <span>GOAT Timeline</span>
                </button>
              </div>

              {/* Dynamic View Panel (Renders the selected nav component) */}
              <div className="transition-all duration-300">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Risk Badge card */}
                    {risk && <RiskBadge risk={risk} />}

                    {/* Impact chart card */}
                    {highlights.length > 0 && (
                      <ImpactChart 
                        topCommits={highlights} 
                        owner={owner} 
                        repo={repo} 
                      />
                    )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <ChangelogTabs 
                    changelog={changelog}
                    owner={owner}
                    repo={repo}
                    customerTone={customerTone}
                    onToneChange={handleToneChange}
                    isToneLoading={isToneLoading}
                  />
                )}

                {activeTab === 'timeline' && (
                  <TimelineView 
                    commits={commits}
                    prs={prs}
                    owner={owner}
                    repo={repo}
                  />
                )}
              </div>

            </div>
          )}

          {/* Diff Mode Output View */}
          {!isLoading && diffMode && (baseData || compareData) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-4 select-none">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Release Comparison Diff</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                      Diff Mode
                    </span>
                  </h2>
                  <p className="text-xs text-slate-555 font-medium mt-1">
                    Comparing baseline {baseData?.owner}/{baseData?.repo} to target {compareData?.owner}/{compareData?.repo}
                  </p>
                </div>

                <button
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-pointer transition-all shrink-0"
                >
                  {shareCopied ? (
                    <>
                      <Check size={14} className="text-emerald-555" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Share Comparison</span>
                    </>
                  )}
                </button>
              </div>

              <DiffView 
                baseData={baseData} 
                compareData={compareData} 
              />
            </div>
          )}

        </main>

        {/* Floating Chatbot Assistant */}
        <GoatChat 
          owner={owner}
          repo={repo}
          since={since}
          until={until}
          commits={commits}
          prs={prs}
          changelog={changelog}
          risk={risk}
          highlights={highlights}
          apiKey={apiKey}
          customEndpoint={customEndpoint}
        />

        {/* Settings Modal removed as configuration is managed via environment variables (.env) */}

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-900 py-8 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-auto select-none uppercase tracking-widest flex flex-col items-center gap-2">
          <div>THE G.O.A.T. Notes · Compiled Client-Side · Private & Secure</div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-550 normal-case tracking-normal text-[11px] font-medium">
            <span>Built for the</span>
            <span className="text-amber-500 font-bold uppercase tracking-wider text-[10px]">Agentic BNB Hackathon</span>
            <span>(2nd Runner Up) by</span>
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="text-amber-500 hover:text-amber-400 underline font-bold cursor-pointer transition-colors"
            >
              CIT IT Sophomores
            </button>
          </div>
        </footer>

        {/* About Modal */}
        {isAboutOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none transition-all duration-300">
            <div className="bg-slate-950/90 border border-slate-800 dark:border-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-t-amber-500/45 animate-in fade-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              {/* Trophy Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                  <Trophy size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-lg text-white uppercase tracking-wider">THE G.O.A.T. Notes</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
                      Second Runner Up
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Agentic BNB Hackathon
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed mb-6 text-left">
                <p>
                  THE G.O.A.T. Notes is a premium client-side AI agent designed to automatically synthesize comprehensive release changelogs from repository activity.
                </p>
                <p>
                  Earning the <span className="text-amber-400 font-semibold">Second Runner Up</span> award, this application was built for the <span className="text-slate-100 font-semibold">Agentic BNB Hackathon</span> conducted by the <span className="text-slate-200 font-semibold">Department of Information Technology at Chennai Institute of Technology (CIT)</span>.
                </p>
              </div>

              {/* Team Section */}
              <div className="border-t border-slate-900 pt-5 space-y-4 text-left">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <Users size={12} className="text-amber-500" />
                  <span>Meet the Developers</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Sathappan */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900/80 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550 dark:text-amber-400 text-xs font-black">
                        S
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">Sathappan T</h4>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Sophomore · IT Department</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
                      Team Leader
                    </span>
                  </div>

                  {/* Suhail Akthar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900/80 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550 dark:text-amber-400 text-xs font-black">
                        SA
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">Suhail Akthar S M</h4>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Sophomore · IT Department</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-slate-850 border border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
                      Teammate
                    </span>
                  </div>

                  {/* Hariharan */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900/80 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550 dark:text-amber-400 text-xs font-black">
                        H
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">Hariharan R</h4>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Sophomore · IT Department</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-slate-850 border border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
                      Teammate
                    </span>
                  </div>
                </div>
              </div>

              {/* CIT Affiliation Footer */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest border-t border-slate-900 pt-4">
                <GraduationCap size={12} className="text-amber-500" />
                <span>Chennai Institute of Technology</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
