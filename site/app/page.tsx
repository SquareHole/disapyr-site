'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError('');
    setGeneratedLink('');
    
    try {
      const response = await fetch('/.netlify/functions/createSecret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create secret');
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
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>disapyr.link</h1>
        <p className={styles.subtitle}>
          Share text securely with one-time links that disappear after being viewed
        </p>
        
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
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={!text.trim() || isLoading}
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
              <p>🔒 This link expires in 21 days</p>
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
        
        <footer className={styles.footer}>
          <p>
            Your text is encrypted and automatically deleted after being viewed once.
            <br />
            <Link href="/about">
              Learn more about our security
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
