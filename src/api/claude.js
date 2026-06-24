/**
 * AI Release Notes Generator Integration (Supports Anthropic & Groq)
 */

// Helper to clean and parse JSON from AI's response (handles markdown fences)
function parseAiJson(text) {
  if (!text) throw new Error("Empty response from AI writer");
  
  let cleaned = text.trim();
  
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from AI. Raw response:", text);
    throw new Error("AI returned an invalid JSON format. Please try again.");
  }
}

/**
 * System prompt for the full release notes generation.
 */
const FULL_SYSTEM_PROMPT = `You are a release documentation agent. Given a list of GitHub commits and PRs, generate structured release notes.

Return ONLY valid JSON with this exact shape:
{
  "developer": [{ "bullet": "string", "evidence": { "pr": "string or null", "commit": "string", "files": number } }],
  "pm": [{ "bullet": "string", "evidence": { "pr": "string or null", "commit": "string", "files": number } }],
  "customer": [{ "bullet": "string", "evidence": { "pr": "string or null", "commit": "string", "files": number } }],
  "exec": "5-line paragraph string summarizing the release for executives",
  "version_hint": "major | minor | patch"
}

Rules:
- Developer bullets: technical, include function/module names, link to commit SHAs
- PM bullets: focus on business impact, features shipped, bugs closed
- Customer bullets: plain English, no jargon, benefit-first language (Balanced tone by default)
- Exec: exactly 5 sentences, business value only, no technical terms
- Every bullet must derive its evidence from the actual input data. Set evidence.pr to the PR number (string, e.g. "42" or null if no PR), evidence.commit to the 7-character commit SHA, and evidence.files to the number of files changed.
- Output ONLY JSON. No markdown, no backticks, no explanation.`;

/**
 * Generates the full set of release notes for 4 audiences.
 * Automatically detects whether to use Anthropic or Groq based on API Key prefix.
 */
export async function generateReleaseNotes({ commits, prs, apiKey, endpoint = '' }) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the Settings panel.");
  }

  // Format data for the AI
  const formattedCommits = commits.map(c => 
    `- Commit ${c.sha}: "${c.message}" by ${c.author} on ${c.date ? c.date.split('T')[0] : 'N/A'} (${c.filesChanged} files changed)${c.prNumber ? ` [PR #${c.prNumber}]` : ''}`
  ).join('\n');

  const formattedPRs = prs.map(p => 
    `- PR #${p.number}: "${p.title}" by ${p.author} (Merged on ${p.mergedAt ? p.mergedAt.split('T')[0] : 'N/A'})${p.mergeCommitSha ? ` [Commit ${p.mergeCommitSha}]` : ''}`
  ).join('\n');

  const userPrompt = `Here are the commits and pull requests for this release:

COMMITS:
${formattedCommits || 'No commits in this range.'}

PULL REQUESTS:
${formattedPRs || 'No merged PRs in this range.'}

Generate the structured JSON release notes now.`;

  const isGroq = apiKey.trim().startsWith('gsk_');

  if (isGroq) {
    // --- GROQ API CALL ---
    const url = endpoint && endpoint.trim() 
      ? endpoint.trim() 
      : 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: FULL_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Groq API Error: ${response.statusText} (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch (e) {
        if (errText) errMsg += ` - ${errText}`;
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    const contentText = result.choices?.[0]?.message?.content;
    return parseAiJson(contentText);

  } else {
    // --- ANTHROPIC CLAUDE API CALL ---
    const url = endpoint && endpoint.trim() 
      ? endpoint.trim() 
      : 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: FULL_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Claude API Error: ${response.statusText} (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch (e) {
        if (errText) errMsg += ` - ${errText}`;
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    const contentText = result.content?.[0]?.text;
    return parseAiJson(contentText);
  }
}

/**
 * Regenerates only the Customer tab based on a tone setting.
 * Automatically detects whether to use Anthropic or Groq.
 */
export async function regenerateCustomerTone({ commits, prs, tone, apiKey, endpoint = '' }) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the Settings panel.");
  }

  // Format data for the AI
  const formattedCommits = commits.map(c => 
    `- Commit ${c.sha}: "${c.message}" by ${c.author} on ${c.date ? c.date.split('T')[0] : 'N/A'} (${c.filesChanged} files changed)${c.prNumber ? ` [PR #${c.prNumber}]` : ''}`
  ).join('\n');

  const formattedPRs = prs.map(p => 
    `- PR #${p.number}: "${p.title}" by ${p.author} (Merged on ${p.mergedAt ? p.mergedAt.split('T')[0] : 'N/A'})${p.mergeCommitSha ? ` [Commit ${p.mergeCommitSha}]` : ''}`
  ).join('\n');

  let toneInstruction = "";
  if (tone === "Non-technical") {
    toneInstruction = "Write for non-technical users. Avoid all developer terms, jargon, class/function names, and code. Use simple, benefit-driven language focusing on *what* this means for the user and *why* they should care.";
  } else if (tone === "Technical") {
    toneInstruction = "Write for a technical customer audience. You may include high-level technical terms, feature names, and brief architecture mentions, but still focus on customer benefits and functional changes rather than raw code changes.";
  } else {
    toneInstruction = "Write in a balanced, conversational tone. A blend of friendly benefit-first descriptions and clear, plain-English feature statements. Simple but informative.";
  }

  const systemPrompt = `You are a release documentation agent. Given a list of GitHub commits and PRs, generate the customer-facing release notes in a specific tone.

Tone Instruction: ${toneInstruction}

Return ONLY valid JSON containing an array of changelog bullet objects. The output must be a single JSON array (not an object) with this exact shape:
[
  { 
    "bullet": "string describing the customer benefit or feature in the requested tone", 
    "evidence": { 
      "pr": "string or null", 
      "commit": "string", 
      "files": number 
    } 
  }
]

Rules:
- Every bullet must derive its evidence from the actual input data. Set evidence.pr to the PR number (string, e.g. "42" or null if no PR), evidence.commit to the 7-character commit SHA, and evidence.files to the number of files changed.
- Output ONLY JSON. No markdown, no backticks, no explanation.`;

  const userPrompt = `Here are the commits and pull requests for this release:

COMMITS:
${formattedCommits || 'No commits.'}

PULL REQUESTS:
${formattedPRs || 'No merged PRs.'}

Generate the customer bullets array in a "${tone}" tone.`;

  const isGroq = apiKey.trim().startsWith('gsk_');

  if (isGroq) {
    // --- GROQ API CALL ---
    const url = endpoint && endpoint.trim() 
      ? endpoint.trim() 
      : 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Groq API Error: ${response.statusText} (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch (e) {
        if (errText) errMsg += ` - ${errText}`;
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    const contentText = result.choices?.[0]?.message?.content;
    return parseAiJson(contentText);

  } else {
    // --- ANTHROPIC CLAUDE API CALL ---
    const url = endpoint && endpoint.trim() 
      ? endpoint.trim() 
      : 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Claude API Error: ${response.statusText} (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch (e) {
        if (errText) errMsg += ` - ${errText}`;
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    const contentText = result.content?.[0]?.text;
    return parseAiJson(contentText);
  }
}
