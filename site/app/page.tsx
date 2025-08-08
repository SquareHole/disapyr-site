'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Layout from './components/Layout';

export default function Home() {
  const [text, setText] = useState('');
  const [expiryDays, setExpiryDays] = useState(21);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add form validation
    if (!text.trim()) {
      setError('Please enter text to create a secure link');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setGeneratedLink('');
    
    try {
      const response = await fetch('/.netlify/functions/createSecret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: text, expiryDays: expiryDays }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = (data && (data.error as string)) || '';
        if (response.status === 400) {
          setError(message || 'Invalid input. Please check your secret and expiry days.');
        } else if (response.status === 500) {
          setError(message || 'A server error occurred. Please try again later.');
        } else {
          setError(message || 'An unexpected error occurred.');
        }
        return;
      }

      // Generate the full URL for the secret
      const baseUrl = window.location.origin;
      const secretUrl = `${baseUrl}/secret/${data.key}`;
      setGeneratedLink(secretUrl);
      
      // Clear the text input after successful creation
      setText('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCreateAnother = () => {
    setGeneratedLink('');
    setError('');
    setCopySuccess(false);
  };

  return (
    <Layout>
        {!generatedLink ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.textareaContainer}>
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here... It will be shared via a secure one-time link that expires after being viewed."
                maxLength={10000}
              />
            </div>

            <div className={styles.expiryContainer}>
              <label htmlFor="expiryDays" className={styles.expiryLabel}>
                Expires after (days):
              </label>
              <input
                id="expiryDays"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 365))}
                className={styles.expiryInput}
              />
              <span className={styles.expiryHint}>Between 1 and 365 days</span>
            </div>
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Link...' : 'Create Secure Link'}
            </button>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className={styles.successContainer}>
            <h2 className={styles.successTitle}>Link Created Successfully!</h2>
            <p className={styles.successSubtitle}>
              Your secure link is ready. Share it with anyone - it will disappear after being viewed once.
            </p>
            
            <div className={styles.linkContainer}>
              <input
                type="text"
                value={generatedLink}
                readOnly
                className={styles.linkInput}
              />
              <button
                onClick={handleCopyLink}
                className={styles.copyButton}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className={styles.linkInfo}>
              <p>🔒 This link expires in {expiryDays} {expiryDays === 1 ? 'day' : 'days'}</p>
              <p>👁️ Can only be viewed once</p>
            </div>
            
            <button
              onClick={handleCreateAnother}
              className={styles.secondaryButton}
            >
              Create Another Link
            </button>
          </div>
        )}
        
        {/* Toast notification for copy success */}
        {copySuccess && (
          <div className={styles.toast}>
            ✅ Link copied to clipboard!
          </div>
        )}
    </Layout>
  );
}
