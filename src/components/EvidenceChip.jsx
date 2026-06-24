import React from 'react';
import { GitPullRequest, GitCommit, FileText } from 'lucide-react';

/**
 * EvidenceChip Component
 * Renders small, premium, interactive metadata tags linking to the original commit and PR on GitHub.
 */
export default function EvidenceChip({ evidence, owner, repo }) {
  if (!evidence) return null;
  
  const { pr, commit, files } = evidence;
  
  // Format the commit SHA to be 7 characters
  const shortCommit = commit ? (commit.length > 7 ? commit.substring(0, 7) : commit) : '';
  
  // Construct URLs
  const hasRepo = owner && repo;
  const prUrl = hasRepo && pr ? `https://github.com/${owner}/${repo}/pull/${pr}` : null;
  const commitUrl = hasRepo && commit ? `https://github.com/${owner}/${repo}/commit/${commit}` : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-400 select-none">
      <span className="text-slate-500 mr-0.5">Evidence:</span>
      
      {pr && (
        prUrl ? (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-900/30 font-medium"
            title="View Pull Request on GitHub"
          >
            <GitPullRequest size={11} className="shrink-0" />
            <span>PR #{pr}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/20 text-indigo-400 border border-indigo-900/10 font-medium">
            <GitPullRequest size={11} className="shrink-0" />
            <span>PR #{pr}</span>
          </span>
        )
      )}
      
      {commit && (
        commitUrl ? (
          <a
            href={commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-200 transition-all border border-slate-800 font-mono"
            title="View Commit on GitHub"
          >
            <GitCommit size={11} className="shrink-0" />
            <span>{shortCommit}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/50 text-slate-400 border border-slate-850 font-mono">
            <GitCommit size={11} className="shrink-0" />
            <span>{shortCommit}</span>
          </span>
        )
      )}
      
      {typeof files === 'number' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/30 text-slate-400 border border-slate-850">
          <FileText size={11} className="shrink-0" />
          <span>{files} {files === 1 ? 'file' : 'files'} changed</span>
        </span>
      )}
    </div>
  );
}
