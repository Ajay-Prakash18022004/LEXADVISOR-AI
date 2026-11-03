import React, { useState, useRef, useEffect } from 'react';
import { askLegalQuestion } from '../api/chat';
import {
  Send,
  Sparkles,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Quote
} from 'lucide-react';

/**
 * Formats markdown-like text (bold, quotes, bullets, headings) into clean JSX elements
 */
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inBlockquote = false;
  let quoteBuffer = [];

  const flushQuote = (key) => {
    if (quoteBuffer.length > 0) {
      elements.push(
        <blockquote
          key={`quote-${key}`}
          style={{
            margin: '8px 0',
            padding: '8px 14px',
            borderLeft: '4px solid #0284c7',
            background: 'rgba(2, 132, 199, 0.07)',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: 'inherit'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0284c7', marginBottom: '2px', fontStyle: 'normal' }}>
            <Quote size={13} />
            <span>Document Verbatim Excerpt</span>
          </div>
          {quoteBuffer.map((ql, qi) => (
            <p key={qi} style={{ margin: '2px 0' }}>{ql}</p>
          ))}
        </blockquote>
      );
      quoteBuffer = [];
      inBlockquote = false;
    }
  };

  const parseInline = (lineStr) => {
    // Replace **text** with <strong>
    const parts = lineStr.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: 'var(--ink)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('>')) {
      inBlockquote = true;
      quoteBuffer.push(trimmed.replace(/^>\s*/, ''));
      return;
    }

    if (inBlockquote) {
      flushQuote(index);
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} style={{ height: '6px' }} />);
      return;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      const heading = trimmed.replace(/^#{2,3}\s+/, '');
      elements.push(
        <h4
          key={`h-${index}`}
          style={{
            margin: '10px 0 4px',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: 'var(--ink)'
          }}
        >
          {parseInline(heading)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bullet = trimmed.replace(/^[-*]\s+/, '');
      elements.push(
        <div
          key={`bullet-${index}`}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            margin: '3px 0 3px 6px',
            fontSize: '0.92rem'
          }}
        >
          <span style={{ color: '#0284c7', fontSize: '1rem', lineHeight: 1 }}>&bull;</span>
          <div>{parseInline(bullet)}</div>
        </div>
      );
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        elements.push(
          <div
            key={`num-${index}`}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              margin: '3px 0 3px 6px',
              fontSize: '0.92rem'
            }}
          >
            <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.85rem' }}>{match[1]}.</span>
            <div>{parseInline(match[2])}</div>
          </div>
        );
        return;
      }
    }

    elements.push(
      <p key={`p-${index}`} style={{ margin: '4px 0', fontSize: '0.92rem', lineHeight: 1.5 }}>
        {parseInline(trimmed)}
      </p>
    );
  });

  if (inBlockquote) {
    flushQuote('final');
  }

  return <div>{elements}</div>;
}

export default function ChatWindow({ activeDoc, loadingBrief, documentId }) {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize or update conversation whenever the active document changes
  useEffect(() => {
    if (activeDoc?.brief) {
      setMessages([
        {
          role: 'assistant',
          content: activeDoc.brief.welcome_message,
          isBrief: true
        }
      ]);
    } else if (activeDoc) {
      setMessages([
        {
          role: 'assistant',
          content: `I am actively analyzing **${activeDoc.filename || 'your uploaded document'}**. All answers are strictly grounded in this contract text. What would you like to verify?`
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I am your Proactive Legal Document Analyser. Please select or paste a contract above to begin strictly grounded analysis.'
        }
      ]);
    }
  }, [activeDoc?.filename, activeDoc?.text]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overrideQuery = null) => {
    const textToSend = (overrideQuery || query).trim();
    if (!textToSend || loading) return;

    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setLoading(true);

    const docId = activeDoc?.id || documentId || null;
    const docText = activeDoc?.text || null;

    try {
      const data = await askLegalQuestion(textToSend, docId, docText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Advisory generation error: ${err.message || 'Server communication issue'}. Please check your connection or backend status.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (activeDoc?.brief) {
      setMessages([
        {
          role: 'assistant',
          content: activeDoc.brief.welcome_message,
          isBrief: true
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat conversation reset. Ask any question strictly grounded in your active contract.'
        }
      ]);
    }
  };

  const dynamicQueries = activeDoc?.brief?.suggested_queries?.length > 0
    ? activeDoc.brief.suggested_queries
    : [
        'What rules are missing in my document?',
        'What exact steps should I take next?',
        'Can landlord evict without 15 days notice?',
        'Is my stamp duty valid under local state rules?'
      ];

  const brief = activeDoc?.brief;

  return (
    <article style={{ padding: '20px' }}>
      {/* Header with Title and Grounding Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Grounded Legal AI Assistant</h2>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={12} />
              Strictly Grounded
            </span>
          </div>
          <p className="note" style={{ margin: '3px 0 0', fontSize: '0.82rem' }}>
            Answers generated exclusively from your active contract excerpts. No generic solutions or hallucinations.
          </p>
        </div>

        <button
          type="button"
          className="sample-btn"
          onClick={handleResetChat}
          title="Reset conversation to initial document brief"
          style={{
            marginTop: 0,
            padding: '4px 10px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <RotateCcw size={13} />
          Reset Chat
        </button>
      </div>

      {/* Extracted Document Facts Strip */}
      {brief && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            fontSize: '0.78rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Rent</span>
            <strong style={{ color: 'var(--ink)' }}>{brief.rent || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Deposit</span>
            <strong style={{ color: 'var(--ink)' }}>{brief.deposit || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Notice Period</span>
            <strong style={{ color: 'var(--ink)' }}>{brief.notice_period || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Tenure</span>
            <strong style={{ color: 'var(--ink)' }}>{brief.duration || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>State / Court</span>
            <strong style={{ color: 'var(--ink)' }}>{brief.state || 'Local State'}</strong>
          </div>
        </div>
      )}

      {/* Immediate Critical Risk Alerts (if detected in the document) */}
      {brief?.key_alerts?.length > 0 && (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px 12px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#9f1239'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
            <AlertTriangle size={14} color="#e11d48" />
            <span>Proactive Vulnerability Alerts Detected in Active Agreement:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {brief.key_alerts.map((alert, i) => (
              <span
                key={i}
                style={{
                  background: '#ffe4e6',
                  color: '#9f1239',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #fecdd3'
                }}
              >
                &bull; {alert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading brief banner */}
      {loadingBrief && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg)',
            border: '1px dashed #0284c7',
            borderRadius: '6px',
            marginBottom: '10px',
            fontSize: '0.82rem',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} className="animate-spin" />
          Proactively extracting document facts, parties, financial terms, and missing clauses...
        </div>
      )}

      {/* Chat Messages Log */}
      <div
        className="chat-box"
        style={{
          height: '400px',
          overflowY: 'auto',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '14px',
          marginBottom: '12px',
          background: 'var(--card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-msg ${m.role}`}
            style={{
              maxWidth: m.role === 'user' ? '80%' : '90%',
              lineHeight: 1.5
            }}
          >
            {m.role === 'assistant' ? (
              <div>
                <FormattedMessage text={m.content} />
              </div>
            ) : (
              <div>{m.content}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-msg assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            Verifying contract clauses against Indian statutory principles...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Context-Aware Proactive Query Chips */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Sparkles size={13} color="#0284c7" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>
            Suggested Proactive Queries for This Document:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {dynamicQueries.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-btn"
              style={{
                fontSize: '0.76rem',
                padding: '4px 10px',
                borderRadius: '14px',
                marginTop: 0,
                background: 'var(--card)',
                borderColor: '#93c5fd',
                color: 'var(--ink)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleSend(chip)}
              disabled={loading}
              title="Click to ask this grounded question immediately"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '10px', marginTop: '14px' }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeDoc?.filename
              ? `Ask any question grounded strictly in ${activeDoc.filename}...`
              : 'Ask a question about this document...'
          }
          disabled={loading}
          style={{ flex: 1, padding: '10px 14px' }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            marginTop: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            whiteSpace: 'nowrap'
          }}
        >
          <Send size={15} />
          Ask AI
        </button>
      </form>
    </article>
  );
}
