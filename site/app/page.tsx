'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Layout from './components/Layout';

export default function Home() {
  const [secretText, setSecretText] = useState('');
  const [expiryDays, setExpiryDays] = useState(21);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!secretText.trim()) {
        throw new Error('Please enter a secret to share');
      }

      if (expiryDays < 1 || expiryDays > 365) {
        throw new Error('Expiry must be between 1 and 365 days');
      }

      const response = await fetch('/.netlify/functions/createSecret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretText,
          expires_in_days: expiryDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create secret');
      }

      const domain = window.location.origin;
      setGeneratedLink(`${domain}/secret/${data.key}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const resetForm = () => {
    setSecretText('');
    setGeneratedLink('');
    setCopied(false);
    setError('');
  };

  return (
    <Layout>
      <main className={styles.main}>
        {/* Header Block */}
        <header className={styles.header}>
          <div className={styles.titleContainer}>
            <svg className={styles.titleIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <h1 className={styles.title}>disapyr.link</h1>
          </div>
          <p className={styles.subtitle}>
            Securely share text via one-time links that vanish instantly after reading.
          </p>
        </header>

        {/* Dynamic Content Area */}
        <div className={styles.content}>
          {!generatedLink ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.textareaContainer}>
                <textarea
                  className={styles.textarea}
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  placeholder="Paste your sensitive data, passwords, or messages here..."
                  maxLength={10000}
                />
              </div>

              <div className={styles.expiryContainer}>
                <div className={styles.expiryHeader}>
                  <label htmlFor="expiryDays" className={styles.expiryLabel}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Expires After
                  </label>
                  <input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className={styles.expiryInput}
                  />
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 500 }}>days</span>
                </div>

                <div className={styles.expiryChips} role="group" aria-label="Quick expiry options">
                  {[1, 7, 14, 21].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExpiryDays(days)}
                      className={`${styles.chip} ${expiryDays === days ? styles.chipActive : ''}`}
                      aria-pressed={expiryDays === days}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.button}
                disabled={isLoading || !secretText.trim()}
              >
                {isLoading ? (
                  <div className={styles.loader}></div>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    Create Secure Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className={styles.resultBox}>
              <h2 className={styles.resultTitle}>Your Secret is Ready</h2>
              <p className={styles.resultSubtitle}>
                Copy the link below. It will permanently self-destruct after the first view.
              </p>

              <div className={styles.linkBox}>
                <div className={styles.linkUrl}>{generatedLink}</div>
                <button
                  onClick={handleCopy}
                  className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button onClick={resetForm} className={styles.secondaryButton}>
                Create another secret
              </button>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
