/**
 * URL Share utility with payload compression for short, clean URLs
 */

/**
 * Compresses the generated changelog payload by stripping out raw, heavy Git histories
 * (commits, raw PRs) and only keeping the compiled results.
 */
function compressPayload(data) {
  if (!data) return null;
  
  // If it's a comparison diff, we compress base/compare data
  if (data.diffMode) {
    return {
      diffMode: true,
      baseData: {
        owner: data.baseData?.owner,
        repo: data.baseData?.repo,
        since: data.baseData?.since,
        until: data.baseData?.until,
        // Keep only simplified commits list without files metadata
        commits: (data.baseData?.commits || []).map(c => ({
          sha: c.sha,
          fullSha: c.fullSha,
          message: c.message,
          author: c.author,
          prNumber: c.prNumber
        })),
        mergedPRs: data.baseData?.mergedPRs || []
      },
      compareData: {
        owner: data.compareData?.owner,
        repo: data.compareData?.repo,
        since: data.compareData?.since,
        until: data.compareData?.until,
        commits: (data.compareData?.commits || []).map(c => ({
          sha: c.sha,
          fullSha: c.fullSha,
          message: c.message,
          author: c.author,
          prNumber: c.prNumber
        })),
        mergedPRs: data.compareData?.mergedPRs || []
      }
    };
  }

  // For single repo mode, strip the heavy commits and raw PRs arrays
  return {
    owner: data.owner,
    repo: data.repo,
    since: data.since,
    until: data.until,
    diffMode: false,
    changelog: data.changelog, // Keep the compiled notes (essential)
    risk: data.risk ? {
      severity: data.risk.severity,
      confidence: data.risk.confidence,
      matchedKeywords: data.risk.matchedKeywords
    } : null,
    highlights: data.highlights, // Keep the top 5 highlights (short)
    currentVersion: data.currentVersion,
    customerTone: data.customerTone,
    activeView: data.activeView
  };
}

/**
 * Encodes compressed data into a UTF-8 safe base64 string.
 */
export function encodeShareData(data) {
  try {
    const compressed = compressPayload(data);
    const jsonString = JSON.stringify(compressed);
    const utf8String = unescape(encodeURIComponent(jsonString));
    const base64 = btoa(utf8String);
    return `share=${base64}`;
  } catch (e) {
    console.error('Failed to encode share data', e);
    return '';
  }
}

/**
 * Decodes a base64 string from the URL hash back into the original object.
 */
export function decodeShareData(hash) {
  if (!hash) return null;
  
  let cleanHash = hash;
  if (cleanHash.startsWith('#')) {
    cleanHash = cleanHash.substring(1);
  }
  
  if (!cleanHash.startsWith('share=')) {
    return null;
  }
  
  const base64 = cleanHash.substring(6);
  
  try {
    const decodedUtf8 = atob(base64);
    const jsonString = decodeURIComponent(escape(decodedUtf8));
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to decode share data from URL', e);
    return null;
  }
}

/**
 * Updates the window location hash with the compressed share data.
 */
export function updateUrlHash(data) {
  if (!data) {
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
    return;
  }
  
  const hashString = encodeShareData(data);
  if (hashString) {
    window.location.hash = hashString;
  }
}

/**
 * Reads and decodes the current window location hash.
 */
export function readUrlHash() {
  return decodeShareData(window.location.hash);
}
