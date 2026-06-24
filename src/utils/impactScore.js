/**
 * Semantic Impact Scoring utility for commits
 */

// Keyword definitions
const SECURITY_KEYWORDS = ['auth', 'security', 'login', 'oauth', 'token', 'session', 'permission', 'sign-in', 'sign-out', 'jwt'];
const API_KEYWORDS = ['api', 'schema', 'db', 'sql', 'graphql', 'prisma', 'migration', 'route', 'endpoint', 'controller'];
const CONFIG_KEYWORDS = ['config', 'env', 'package.json', 'webpack', 'vite', 'eslint', 'tsconfig', '.gitignore', 'docker', 'yml', 'yaml'];
const TEST_KEYWORDS = ['test', 'spec', 'mock', 'jest', 'vitest', 'cypress'];

/**
 * Calculates the impact score for a single file name.
 */
export function getFileScore(filename) {
  const name = filename.toLowerCase();
  
  // Test files: 0.5 pts (matched first so "auth.test.js" is classified as a test, not an auth file)
  if (TEST_KEYWORDS.some(kw => name.includes(kw))) {
    return 0.5;
  }
  
  // Auth/Security files: 3 pts
  if (SECURITY_KEYWORDS.some(kw => name.includes(kw))) {
    return 3;
  }
  
  // API/Schema files: 2 pts
  if (API_KEYWORDS.some(kw => name.includes(kw))) {
    return 2;
  }
  
  // Config/Env files: 2 pts
  if (CONFIG_KEYWORDS.some(kw => name.includes(kw))) {
    return 2;
  }
  
  // Everything else: 1 pt
  return 1;
}

/**
 * Estimates the impact score of a commit from its message when file details are unavailable.
 */
function estimateScoreFromMessage(message) {
  const msg = message.toLowerCase();
  
  if (TEST_KEYWORDS.some(kw => msg.includes(kw))) {
    return 0.5;
  }
  if (SECURITY_KEYWORDS.some(kw => msg.includes(kw))) {
    return 3.0;
  }
  if (API_KEYWORDS.some(kw => msg.includes(kw))) {
    return 2.0;
  }
  if (CONFIG_KEYWORDS.some(kw => msg.includes(kw))) {
    return 2.0;
  }
  
  return 1.0; // Default
}

/**
 * Calculates the impact score for each commit and returns the top 5 highest-impact commits.
 */
export function calculateImpactScores(commits = []) {
  const scoredCommits = commits.map(commit => {
    let score = 0;
    let breakdown = { security: 0, api: 0, config: 0, test: 0, other: 0 };
    let method = 'message_estimation';

    if (commit.files && commit.files.length > 0) {
      method = 'file_analysis';
      commit.files.forEach(file => {
        const fileScore = getFileScore(file.filename);
        score += fileScore;
        
        // Track breakdown for visualization tooltips if needed
        if (fileScore === 0.5) breakdown.test++;
        else if (fileScore === 3) breakdown.security++;
        else if (fileScore === 2) {
          // Check which category it matched
          const name = file.filename.toLowerCase();
          if (API_KEYWORDS.some(kw => name.includes(kw))) breakdown.api++;
          else breakdown.config++;
        } else breakdown.other++;
      });
      
      // If a commit has a massive number of files, we apply a logarithmic scaling 
      // to keep scores readable on a chart while still indicating high impact.
      // E.g. a commit modifying 200 files shouldn't have a score of 200.
      if (commit.files.length > 10) {
        // Keep the original score for the first 10 files, and scale the rest logarithmically.
        const baseFiles = commit.files.slice(0, 10);
        let baseScore = baseFiles.reduce((sum, f) => sum + getFileScore(f.filename), 0);
        const extraFilesCount = commit.files.length - 10;
        const extraScore = Math.log10(extraFilesCount + 1) * 2;
        score = parseFloat((baseScore + extraScore).toFixed(1));
      }
    } else {
      // Fallback to commit message estimation
      score = estimateScoreFromMessage(commit.message || '');
    }

    return {
      ...commit,
      impactScore: parseFloat(score.toFixed(1)),
      scoringMethod: method,
      breakdown
    };
  });

  // Sort by impact score descending
  const sorted = [...scoredCommits].sort((a, b) => b.impactScore - a.impactScore);
  
  // Return top 5
  const top5 = sorted.slice(0, 5);

  return {
    allScoredCommits: scoredCommits,
    top5Commits: top5
  };
}
