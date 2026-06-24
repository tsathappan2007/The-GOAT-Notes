import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, RefreshCw, Eye, Share2, ArrowRight, AlertTriangle, Check, Info, Lock, Sun, Moon, GitBranch, FileText, Calendar, BarChart3, LayoutDashboard } from 'lucide-react';

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

  // State: Settings & API Keys
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '');
  const [customEndpoint, setCustomEndpoint] = useState(() => localStorage.getItem('anthropic_custom_endpoint') || '');
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('github_pat') || '');

  // State: Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('goat_notes_theme');
    return saved ? saved === 'dark' : true;
  });

  // State: Loaders & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [isToneLoading, setIsToneLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerTone, setCustomerTone] = useState('Balanced');
  const [isSharedView, setIsSharedView] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Apply theme class to document body (fixes light mode background!)
  useEffect(() => {
    const body = window.document.body;
    if (isDarkMode) {
      body.classList.add('dark');
      localStorage.setItem('goat_notes_theme', 'dark');
    } else {
      body.classList.remove('dark');
      localStorage.setItem('goat_notes_theme', 'light');
    }
  }, [isDarkMode]);

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

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('anthropic_api_key', apiKey.trim());
    localStorage.setItem('anthropic_custom_endpoint', customEndpoint.trim());
    localStorage.setItem('github_pat', githubPat.trim());
    setShowSettings(false);
  };

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
      setError('An API Key is required to generate release notes. Please click the Settings gear in the top right to configure Groq or Claude.');
      setIsLoading(false);
      setShowSettings(true);
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
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl dark:bg-slate-950/40 bg-white/45 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 dark:text-amber-500/90 text-amber-600 transition-all cursor-pointer shadow-sm"
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl dark:bg-slate-950/40 bg-white/45 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 dark:text-amber-500/90 text-amber-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                title="Configure API keys and rate limits"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">API Settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
          
          {/* API Key Alert */}
          {!apiKey && !isSharedView && (
            <div className="p-4 rounded-2xl dark:bg-amber-950/10 bg-amber-500/5 border border-amber-500/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold uppercase tracking-wider dark:text-amber-300 text-amber-700">API Key Required</h4>
                  <p className="dark:text-slate-300 text-slate-700 mt-0.5">
                    An API Key is required to compile release notes. Insert your free **Groq Key** (`gsk_...`) or **Claude Key** under settings. Requests run securely on the client.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 dark:text-amber-300 text-amber-700 border border-amber-500/30 text-[10px] font-bold tracking-wide uppercase transition-all shrink-0 cursor-pointer"
              >
                Configure Key
              </button>
            </div>
          )}

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

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 p-4 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2 text-amber-605 dark:text-amber-400">
                  <Settings size={18} />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    API & Token Configuration
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
                
                {/* API Key */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>API Key (Groq or Claude)</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 font-bold">
                      <Lock size={10} /> LocalStorage
                    </span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste gsk_... (Groq) or sk-ant-... (Claude)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 text-xs focus:border-amber-500 outline-none font-medium"
                    required
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 leading-normal font-medium">
                    * Groq keys start with **`gsk_`** and are free. Claude keys start with **`sk-ant-`**.
                  </span>
                </div>

                {/* Custom API Endpoint */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>Custom API Endpoint (CORS Proxy)</span>
                    <span className="text-[9px] text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="e.g. https://your-cors-proxy.com/messages"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-750 text-xs focus:border-amber-500 outline-none font-mono"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    Bypasses browser CORS headers if calling Anthropic directly.
                  </span>
                </div>

                {/* GitHub PAT */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>GitHub Access Token (PAT)</span>
                    <span className="text-[9px] text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    placeholder="Paste ghp_..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 text-xs focus:border-amber-500 outline-none font-medium"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    Solves rate-limiting errors by increasing limits from 60 to 5000 requests/hr.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer transition-colors"
                  >
                    Save Settings
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-900 py-6 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-auto select-none uppercase tracking-widest">
          THE G.O.A.T. Notes · Compiled Client-Side · Private & Secure
        </footer>

      </div>
    </div>
  );
}
