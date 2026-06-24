/**
 * Risk Radar analysis utility
 */

/**
 * Scans commits and PRs for specific risk keywords and returns a severity rating and confidence percentage.
 * Keywords: remove, deprecate, breaking, migration, schema, auth, env, config, drop, delete
 * 
 * Severity:
 * - High (red): 2+ unique keywords matched
 * - Medium (yellow): 1 unique keyword matched
 * - Low (green): 0 keywords matched
 */
export function calculateRisk(commits = [], prs = []) {
  const keywords = ['remove', 'deprecate', 'breaking', 'migration', 'schema', 'auth', 'env', 'config', 'drop', 'delete'];
  const matchedKeywords = new Set();
  
  const flaggedCommits = [];
  const flaggedPRs = [];

  // Helper to scan text and track matches
  const scanText = (text, item, list) => {
    if (!text) return;
    const lowerText = text.toLowerCase();
    let hasMatch = false;
    
    keywords.forEach(keyword => {
      // Use word boundaries or simple substring check
      // Substring check is safer for commit messages (e.g. "auth-related", "deprecation")
      if (lowerText.includes(keyword)) {
        matchedKeywords.add(keyword);
        hasMatch = true;
      }
    });
    
    if (hasMatch) {
      list.push(item);
    }
  };

  // Scan all commits
  commits.forEach(commit => {
    const textToScan = `${commit.message} ${commit.fullMessage || ''}`;
    scanText(textToScan, commit, flaggedCommits);
  });

  // Scan all PRs
  prs.forEach(pr => {
    scanText(pr.title, pr, flaggedPRs);
  });

  const uniqueMatchCount = matchedKeywords.size;
  let severity = 'Low';
  if (uniqueMatchCount >= 2) {
    severity = 'High';
  } else if (uniqueMatchCount === 1) {
    severity = 'Medium';
  }

  // Calculate confidence level
  // - If no data is analyzed, confidence is 0.
  // - Baseline confidence is 80% if there is at least 1 commit.
  // - Increases based on commit volume (+0.5% per commit up to +15%).
  // - Increases if we have rich file details (+4% if files metadata is present).
  let confidence = 0;
  if (commits.length > 0) {
    const commitWeight = Math.min(15, commits.length * 0.5);
    const hasFileDetails = commits.some(c => c.files && c.files.length > 0);
    const fileWeight = hasFileDetails ? 4 : 0;
    confidence = Math.round(80 + commitWeight + fileWeight);
    confidence = Math.min(99, confidence); // Cap at 99%
  }

  return {
    severity, // 'High' | 'Medium' | 'Low'
    confidence, // e.g. 92
    matchedKeywords: Array.from(matchedKeywords),
    flaggedCommits,
    flaggedPRs,
    totalScannedCommits: commits.length,
    totalScannedPRs: prs.length
  };
}

/**
 * Suggests a version bump based on the risk analysis result.
 * - High risk → Major bump
 * - Medium risk → Minor bump
 * - Low risk → Patch bump
 * 
 * If a current version tag is provided (e.g., "v1.2.3"), it computes the suggested next version string.
 */
export function suggestVersionBump(severity, currentVersion = 'v1.0.0') {
  // Normalize current version
  let isVPrefixed = currentVersion.toLowerCase().startsWith('v');
  let cleanVer = currentVersion.replace(/^v/i, '');
  
  // Split into major, minor, patch
  let parts = cleanVer.split('.').map(x => parseInt(x, 10));
  if (parts.length < 3 || parts.some(isNaN)) {
    parts = [1, 0, 0]; // Fallback
  }
  
  let [major, minor, patch] = parts;
  let bumpType = 'patch';
  
  if (severity === 'High') {
    major += 1;
    minor = 0;
    patch = 0;
    bumpType = 'major';
  } else if (severity === 'Medium') {
    minor += 1;
    patch = 0;
    bumpType = 'minor';
  } else {
    patch += 1;
    bumpType = 'patch';
  }
  
  const bumpedVersion = `${isVPrefixed ? 'v' : ''}${major}.${minor}.${patch}`;
  
  return {
    type: bumpType, // 'major' | 'minor' | 'patch'
    version: bumpedVersion // e.g., 'v2.0.0'
  };
}
