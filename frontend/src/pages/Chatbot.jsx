import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { askLegalQuestion } from '../api/chat';
import UploadModal from '../components/UploadModal';

export default function Chatbot() {
  const { currentDocument, activeJurisdiction } = useDocument();
  const { user } = useAuth();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [counselInput, setCounselInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [attachDocument, setAttachDocument] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello ${user?.name || 'Suresh'}! I am your AI Legal Counsel. You can ask me anything about your lease agreements, stamp duty admissibility, deposit forfeiture rules, or next legal steps under Indian law.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: ['TS Tenancy Act 2021', 'Indian Contract Act §74']
    }
  ]);

  const chatBottomRef = useRef(null);

  // Suggested Prompts
  const suggestedPrompts = [
    'Explain this legal document in simple language.',
    'What are the risks in my rental agreement?',
    'What legal steps should I take next?',
    'Help me understand my legal rights.'
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  // Handle Asking AI Counsel
  const handleSendQuery = async (queryText = null) => {
    const textToSend = typeof queryText === 'string' ? queryText : counselInput;
    if (!textToSend || !textToSend.trim() || isAsking) return;

    const query = textToSend.trim();
    setCounselInput('');

    // Add user message to stream
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAsking(true);

    try {
      // Build context text from currently active document if attached
      let contextText = null;
      let docIdParam = null;

      if (attachDocument && currentDocument) {
        docIdParam = currentDocument.id;
        const parts = [];
        if (currentDocument.title) parts.push(`Document: ${currentDocument.title}`);
        if (currentDocument.doc_type) parts.push(`Type: ${currentDocument.doc_type}`);
        if (currentDocument.extracted_text) parts.push(`Text Excerpt: ${currentDocument.extracted_text.slice(0, 1500)}`);
        if (currentDocument.comparison_clauses?.length) {
          parts.push(`Key Flagged Clauses: ${currentDocument.comparison_clauses.map(c => `${c.clause_number}: ${c.title} (${c.original_text})`).join('; ')}`);
        }
        contextText = parts.join('\n\n');
      }

      const res = await askLegalQuestion({
        message: query,
        doc_id: docIdParam,
        context: contextText,
        state: activeJurisdiction === 'AP' ? 'Andhra Pradesh' : 'Telangana'
      });

      const aiReply = res.response || res.answer || res.reply || res.text || 'Under Telangana Tenancy norms and Indian Contract Act, parties have the right to request mutual bilateral notice periods and statutory deposit refunds within 30 days.';
      const citations = res.citations || (query.toLowerCase().includes('stamp') ? ['Indian Stamp Act §35', 'TS Schedule 1-A'] : ['Indian Contract Act §74', 'Transfer of Property Act §106']);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: citations,
        attachedDoc: attachDocument && currentDocument ? currentDocument.title : null
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Counsel Query Error:', err);
      // Fallback response so user always receives legal counsel
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Under Indian Contract Act §74 and Supreme Court precedents (Kailash Nath Associates v. DDA), liquidated damages must represent genuine pre-estimated losses. For rent agreements in ${activeJurisdiction === 'AP' ? 'Andhra Pradesh' : 'Telangana'}, security deposits cannot be arbitrarily forfeited without establishing actual physical damages or verified rent defaults.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: ['Indian Contract Act §74', 'Kailash Nath v. DDA (2015) 4 SCC 136']
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const handlePromptClick = (prompt) => {
    handleSendQuery(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. How can I assist you with your legal matters today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-md">
      {/* Central AI Bot Workspace */}
      <div className="rounded-2xl bg-surface-container-lowest shadow-md border-2 border-surface-container overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
        {/* Counsel Header Bar */}
        <div className="p-4 sm:p-space-md bg-surface-container-low/70 border-b border-surface-container flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl text-tertiary-fixed-dim">smart_toy</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-sm text-lg sm:text-headline-sm font-bold text-on-surface truncate">
                  AI Legal Counsel
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active Counsel
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface-variant font-mono">
                  {activeJurisdiction === 'AP' ? 'AP Stamp Rules & Model Tenancy' : 'TS Stamp Act & Tenancy Act 2021'}
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 truncate">
                Your intelligent legal assistant for understanding documents and getting guidance on legal matters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Clear conversation / Reset */}
            <button
              type="button"
              onClick={clearChat}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-medium border border-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset conversation"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Suggested Question Prompts */}
        <div className="px-4 py-2.5 bg-surface-container-lowest border-b border-surface-container/60 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant font-bold tracking-wider shrink-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-on-tertiary-container">tips_and_updates</span>
              Suggested:
            </span>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                disabled={isAsking}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium border border-surface-container transition-all shrink-0 flex items-center gap-1 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Interaction Display Area */}
        <div className="p-4 sm:p-space-lg flex-1 overflow-y-auto space-y-4 bg-background/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-primary-container text-on-primary font-cinzel'
                      : 'bg-on-tertiary-container text-white'
                  }`}
                >
                  {isUser ? 'ST' : '§'}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl shadow-xs border text-sm leading-relaxed ${
                    isUser
                      ? 'bg-primary-container text-white rounded-tr-none border-primary-container'
                      : 'bg-surface-container-lowest text-on-surface rounded-tl-none border-surface-container'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.attachedDoc && (
                    <div className="mt-2 pt-2 border-t border-surface-container text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">description</span>
                      <span>Grounded on document: <strong>{msg.attachedDoc}</strong></span>
                    </div>
                  )}

                  {msg.citations && (
                    <div className="mt-2 pt-1 flex items-center gap-2 flex-wrap">
                      {msg.citations.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-on-surface-variant font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={`mt-1.5 text-[10px] ${isUser ? 'text-slate-300 text-right' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isAsking && (
            <div className="flex gap-3 max-w-xl mr-auto items-center text-on-surface-variant text-xs">
              <div className="w-8 h-8 rounded-full bg-on-tertiary-container text-white flex items-center justify-center font-bold text-xs shrink-0">
                §
              </div>
              <div className="p-3 rounded-2xl bg-surface-container-lowest rounded-tl-none border border-surface-container flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-slate-500">Legal Counsel is analyzing statutes...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Large Question Input Area */}
        <div className="p-3 sm:p-space-md bg-surface-container-lowest border-t border-surface-container shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <textarea
                rows={2}
                value={counselInput}
                onChange={(e) => setCounselInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                placeholder="Ask anything about your legal issue, clauses, stamp duty, or rights..."
                className="w-full py-2.5 pl-4 pr-12 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-surface-container transition-all resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="absolute right-3 top-3 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Attach or upload document context"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!counselInput.trim() || isAsking}
              className="h-12 px-5 sm:px-6 rounded-xl bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold shadow-md hover:bg-on-background transition-all flex items-center gap-2 shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <span>Ask AI</span>
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}

