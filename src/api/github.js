/**
 * GitHub REST API utility functions
 */

/**
 * Parses a GitHub repository string or URL into owner and repo.
 * Supports formats:
 * - owner/repo
 * - http(s)://github.com/owner/repo
 * - http(s)://github.com/owner/repo.git
 */
export function parseRepoUrl(input) {
  if (!input) return null;
  const trimmed = input.trim();
  
  // Check if it's a URL
  if (trimmed.startsWith('http') || trimmed.startsWith('git@')) {
    try {
      // Remove .git suffix if present
      const cleanUrl = trimmed.replace(/\.git$/, '');
      const parts = cleanUrl.split('github.com/');
      if (parts.length > 1) {
        const pathParts = parts[1].split('/');
        if (pathParts.length >= 2) {
          return {
            owner: pathParts[0],
            repo: pathParts[1]
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse GitHub URL', e);
    }
  }
  
  // Fallback to owner/repo format
  const parts = trimmed.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return {
      owner: parts[0],
      repo: parts[1]
    };
  }
  
  return null;
}

/**
 * Creates headers for GitHub API requests, adding authorization if token is provided.
 */
function getHeaders(token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }
  return headers;
}

/**
 * Fetches the latest release or tag for a repository to understand the current version.
 */
export async function fetchLatestRelease(owner, repo, token = '') {
  const headers = getHeaders(token);
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    if (response.ok) {
      const data = await response.json();
      return data.tag_name || 'v1.0.0';
    }
  } catch (e) {
    console.warn('Failed to fetch latest release, trying tags...', e);
  }

  // Fallback to tags
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`, { headers });
    if (response.ok) {
      const tags = await response.json();
      if (tags && tags.length > 0) {
        return tags[0].name;
      }
    }
  } catch (e) {
    console.error('Failed to fetch tags', e);
  }

  return 'v1.0.0'; // Default fallback
}

/**
 * Fetches commits and closed PRs, links them, and calculates changes.
 * Handles rate limits elegantly by limiting detail fetches for unauthenticated requests.
 */
export async function fetchRepoData({ owner, repo, since, until, token = '' }) {
  const headers = getHeaders(token);
  
  // Format dates to ISO strings if they are Date objects
  const sinceIso = since instanceof Date ? since.toISOString() : since;
  const untilIso = until instanceof Date ? until.toISOString() : until;
  
  // 1. Fetch Commits in date range
  let commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  if (sinceIso) commitsUrl += `&since=${sinceIso}`;
  if (untilIso) commitsUrl += `&until=${untilIso}`;
  
  const commitsResponse = await fetch(commitsUrl, { headers });
  if (!commitsResponse.ok) {
    const errorData = await commitsResponse.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch commits: ${commitsResponse.statusText}`);
  }
  const rawCommits = await commitsResponse.json();

  // 2. Fetch Closed Pull Requests (we will filter by merge date client-side)
  // Fetching closed PRs allows us to link commits to PR details
  const prsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=100`;
  let rawPRs = [];
  try {
    const prsResponse = await fetch(prsUrl, { headers });
    if (prsResponse.ok) {
      rawPRs = await prsResponse.ok ? await prsResponse.json() : [];
    }
  } catch (e) {
    console.warn('Could not fetch pull requests, proceeding with commits only.', e);
  }

  // Filter PRs merged within our date range
  const mergedPRs = rawPRs.filter(pr => {
    if (!pr.merged_at) return false;
    const mergeDate = new Date(pr.merged_at);
    const startDate = sinceIso ? new Date(sinceIso) : null;
    const endDate = untilIso ? new Date(untilIso) : null;
    
    return (!startDate || mergeDate >= startDate) && (!endDate || mergeDate <= endDate);
  });

  // Map PRs by their merge_commit_sha for easy lookup
  const prMergeMap = {};
  const prNumberMap = {};
  mergedPRs.forEach(pr => {
    if (pr.merge_commit_sha) {
      prMergeMap[pr.merge_commit_sha] = pr;
    }
    prNumberMap[pr.number] = pr;
  });

  // 3. For each commit, resolve its details (files changed)
  // If we have a token, we can fetch details for more commits.
  // Without a token, we fetch details for at most 5 commits to avoid hitting the 60-request hourly rate limit.
  const hasToken = !!(token && token.trim());
  const maxDetailsToFetch = hasToken ? Math.min(rawCommits.length, 50) : Math.min(rawCommits.length, 5);
  
  const processedCommits = [];
  
  // We can fetch details concurrently
  const detailPromises = rawCommits.slice(0, maxDetailsToFetch).map(async (commit) => {
    try {
      const detailResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`, { headers });
      if (detailResponse.ok) {
        return await detailResponse.json();
      }
    } catch (e) {
      console.error(`Failed to fetch details for commit ${commit.sha}`, e);
    }
    return null;
  });
  
  const commitDetails = await Promise.all(detailPromises);
  const detailMap = {};
  commitDetails.forEach(detail => {
    if (detail) {
      detailMap[detail.sha] = detail;
    }
  });

  // Process and link all commits
  for (let i = 0; i < rawCommits.length; i++) {
    const c = rawCommits[i];
    const sha = c.sha;
    const message = c.commit.message;
    const author = c.author?.login || c.commit.author?.name || 'Unknown';
    const date = c.commit.author?.date;
    
    // Find associated PR
    let associatedPR = prMergeMap[sha] || null;
    let prNumber = associatedPR?.number || null;
    let prTitle = associatedPR?.title || null;
    
    // Fallback: Parse PR number from commit message (e.g. "Fix button style (#42)" or "Merge pull request #42 from...")
    if (!prNumber) {
      const mergePrMatch = message.match(/Merge pull request #(\d+)/i);
      const squashPrMatch = message.match(/\(#(\d+)\)(?:\s*|$)/);
      const prNumberStr = mergePrMatch ? mergePrMatch[1] : (squashPrMatch ? squashPrMatch[1] : null);
      
      if (prNumberStr) {
        const num = parseInt(prNumberStr, 10);
        associatedPR = prNumberMap[num] || null;
        prNumber = num;
        prTitle = associatedPR?.title || message.split('\n')[0].replace(/\(#\d+\)/, '').trim();
      }
    }

    // Determine files changed
    let filesChangedCount = 1; // Default fallback
    let files = [];
    
    const details = detailMap[sha];
    if (details) {
      filesChangedCount = details.files?.length || 0;
      files = (details.files || []).map(f => ({
        filename: f.filename,
        additions: f.additions,
        deletions: f.deletions,
        status: f.status
      }));
    } else {
      // If we didn't fetch details, try to estimate from commit message or just use default 1
      // (This applies for commits beyond the maxDetailsToFetch threshold)
      filesChangedCount = 1;
    }

    processedCommits.push({
      sha: sha.substring(0, 7),
      fullSha: sha,
      message: message.split('\n')[0], // Use first line as message
      fullMessage: message,
      author,
      date,
      prNumber,
      prTitle,
      filesChanged: filesChangedCount,
      files
    });
  }

  return {
    commits: processedCommits,
    mergedPRs: mergedPRs.map(pr => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login || 'Unknown',
      mergedAt: pr.merged_at,
      htmlUrl: pr.html_url,
      mergeCommitSha: pr.merge_commit_sha?.substring(0, 7) || null
    }))
  };
}
