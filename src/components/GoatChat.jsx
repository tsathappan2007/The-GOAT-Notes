import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle } from 'lucide-react';

/**
 * GoatChat Component
 * A floating, conversational AI chatbot widget ("Ask GOAT AI").
 * Dynamically seeded with context about the current repo, commits, PRs, risk, and changelog.
 * Uses the saved Groq or Anthropic API key to answer user queries.
 */
export default function GoatChat({ 
  owner, 
  repo, 
  since, 
  until, 
  commits = [], 
  prs = [], 
  changelog, 
  risk, 
  highlights = [],
  apiKey,
  customEndpoint
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi! I'm GOAT AI, your repository release notes assistant. Ask me anything about this release, the semantic impact scores, risk levels, or how the app works!" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Construct the rich context prompt for the AI assistant
  const getSystemPrompt = () => {
    const commitsSummary = commits.map(c => `- ${c.sha}: ${c.message} (Impact: ${c.impactScore} pts, Author: ${c.author})`).slice(0, 15).join('\n');
    const prsSummary = prs.map(p => `- PR #${p.number}: ${p.title}`).slice(0, 10).join('\n');
    
    let notesSummary = 'None generated yet.';
    if (changelog) {
      notesSummary = `
- Developer: ${changelog.developer?.map(b => b.bullet).slice(0, 3).join('; ')}
- PM: ${changelog.pm?.map(b => b.bullet).slice(0, 3).join('; ')}
- Customer: ${changelog.customer?.map(b => b.bullet).slice(0, 3).join('; ')}
- Exec: ${changelog.exec || 'N/A'}
      `;
    }

    return `You are "GOAT AI", a helpful, intelligent AI assistant inside "THE G.O.A.T. Notes" web application.
You answer questions about the current release notes, commits, pull requests, semantic impact scores, risk radar, and version bumps.

Here is the context of the current active repository on screen:
- Repository: ${owner && repo ? `${owner}/${repo}` : 'None loaded yet'}
- Analysis Date Range: ${since || 'N/A'} to ${until || 'N/A'}
- Risk Assessment: ${risk ? `Severity: ${risk.severity}, Confidence: ${risk.confidence}%, Keywords: ${risk.matchedKeywords?.join(', ')}` : 'N/A'}
- Top 3 Commits by Impact: ${highlights?.slice(0,3).map(h => `${h.sha} (${h.impactScore} pts): ${h.message}`).join(', ') || 'N/A'}

COMMITS SCANNED (First 15):
${commitsSummary || 'No commits loaded.'}

MERGED PRs (First 10):
${prsSummary || 'No pull requests.'}

AI GENERATED RELEASE NOTES (Snippet):
${notesSummary}

Instructions:
1. Be concise, helpful, and friendly. Answer tech questions technically and customer questions simply.
2. Keep answers short (under 3-4 sentences if possible) because you are displayed in a compact chat window.
3. If no API key or repository data is loaded yet, kindly remind the user to configure their API key and generate a changelog.
4. Do NOT refer to yourself as Claude or LLaMA unless asked. You are "GOAT AI".`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setChatError('');
    
    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I need an API key to answer your questions. Please configure your Groq or Anthropic API key by clicking 'API Settings' in the top right." 
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const isGroq = apiKey.trim().startsWith('gsk_');
      const systemPrompt = getSystemPrompt();

      // Build message payload for API
      // We map roles from 'assistant' to 'assistant' / 'user' to 'user'
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let responseText = '';

      if (isGroq) {
        // Groq API Call
        const url = customEndpoint && customEndpoint.trim() 
          ? customEndpoint.trim() 
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
              ...apiMessages
            ],
            temperature: 0.5,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          throw new Error(`Groq Error: ${response.statusText} (${response.status})`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

      } else {
        // Anthropic API Call
        const url = customEndpoint && customEndpoint.trim() 
          ? customEndpoint.trim() 
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
            max_tokens: 500,
            system: systemPrompt,
            messages: apiMessages,
            temperature: 0.5
          })
        });

        if (!response.ok) {
          throw new Error(`Claude Error: ${response.statusText} (${response.status})`);
        }
        const data = await response.json();
        responseText = data.content?.[0]?.text || "I'm sorry, I couldn't process that request.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

    } catch (err) {
      console.error(err);
      setChatError(err.message || 'Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oops! I encountered an error communicating with the AI server. Please verify your API key and network connection." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="print:hidden">
      
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-black shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 group border border-amber-300/30"
      >
        <MessageSquare size={20} className="stroke-[2.5]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] whitespace-nowrap font-bold text-xs uppercase tracking-wider transition-all duration-300">
          Ask GOAT AI
        </span>
      </button>

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] h-[450px] max-w-[calc(100vw-2rem)] bg-slate-950 border border-amber-500/20 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-900 px-4 py-3 bg-slate-950 select-none">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Ask GOAT AI
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 dark:bg-black/40 bg-slate-900/5 custom-scrollbar">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div 
                  key={idx} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-black font-medium rounded-br-none shadow-sm'
                        : 'dark:bg-slate-900 bg-white border border-slate-200 dark:border-slate-900 text-slate-300 dark:text-slate-300 rounded-bl-none shadow-inner'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="dark:bg-slate-900 bg-white border border-slate-200 dark:border-slate-900 text-slate-500 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-medium text-[10px] uppercase tracking-wider text-slate-500">GOAT is thinking</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {chatError && (
              <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={12} className="shrink-0" />
                <span>{chatError}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form 
            onSubmit={handleSendMessage} 
            className="border-t border-slate-900 p-3 bg-slate-950 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about risk, scoring, commits..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:opacity-50 text-black shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Send size={14} className="stroke-[2.5]" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
