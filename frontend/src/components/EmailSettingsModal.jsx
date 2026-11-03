import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function EmailSettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [appPassword, setAppPassword] = useState('');
  const [result, setResult] = useState(null); // { type: 'success' | 'error', message: '' }

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await client.get('/advocates/email-status');
      setStatusData(res.data);
    } catch (e) {
      console.error('Failed to load email status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    setResult(null);

    try {
      const payload = {
        email: 'sureshtakur194@gmail.com',
        smtp_password: appPassword.trim() || undefined
      };
      const res = await client.post('/advocates/send-test-email', payload);
      if (res.data.delivered) {
        setResult({
          type: 'success',
          message: res.data.message || '✅ Test email successfully sent to sureshtakur194@gmail.com! Please check your Gmail inbox or spam.'
        });
        fetchStatus();
      } else {
        setResult({
          type: 'error',
          message: res.data.message || 'SMTP Authentication failed. Please verify your 16-character App Password.'
        });
      }
    } catch (err) {
      setResult({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to send test email.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full border border-surface-container shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-primary">mail</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Email Alert System &amp; Gmail Setup</h2>
              <p className="text-xs text-on-surface-variant">Live consultation notifications to sureshtakur194@gmail.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Why Normal Passwords Fail Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
              <span>Why Normal Passwords (like &quot;bhanu@12345&quot;) Do Not Work</span>
            </div>
            <p className="leading-relaxed">
              Google permanently disabled normal passwords for third-party email apps in <strong>May 2022</strong>. When an app connects with your standard password, Google automatically rejects and closes the connection.
            </p>
            <p className="leading-relaxed font-semibold">
              To send real emails to your inbox, Google requires a free <strong>16-character App Password</strong>.
            </p>
          </div>

          {/* 3 Step Instruction Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5 text-xs text-on-surface">
            <div className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>How to generate your 16-character App Password (in 60 seconds):</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-on-surface-variant leading-relaxed">
              <li>
                Open Google App Passwords:{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-primary underline inline-flex items-center gap-0.5 hover:text-on-background"
                >
                  myaccount.google.com/apppasswords
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>{' '}
                <em>(Make sure 2-Step Verification is turned ON).</em>
              </li>
              <li>
                In the <strong>App name</strong> field, type <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono font-bold text-on-surface">LexAdvisor</code> and click <strong>Create</strong>.
              </li>
              <li>
                Google will display a 16-letter code in a yellow box (e.g. <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-amber-900 font-bold">abcd efgh ijkl mnop</code>). Copy it and paste it below.
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Enter 16-Character Google App Password:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="e.g. qdli wosa refh qgch"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface font-mono text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Target delivery recipient: <strong className="text-on-surface">sureshtakur194@gmail.com</strong>
              </p>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed ${
                  result.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-800 dark:text-red-200 border border-red-500/30'
                }`}
              >
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                  {result.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span className="flex-1 font-medium">{result.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={testing}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-on-background text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {testing ? 'hourglass_top' : 'send'}
                </span>
                <span>{testing ? 'Verifying with Gmail...' : 'Save & Send Live Test Email'}</span>
              </button>
            </div>
          </form>

          {/* Recent Dispatches Audit Log */}
          {statusData?.recent_dispatches && statusData.recent_dispatches.length > 0 && (
            <div className="pt-3 border-t border-surface-container space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Recent Email Dispatch Logs (Last {statusData.recent_dispatches.length}):
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {statusData.recent_dispatches.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate max-w-[280px]">
                      <span className="font-semibold text-on-surface">{log.advocate_name}</span>
                      <span className="text-on-surface-variant"> · {log.subject}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {log.status || 'QUEUED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

