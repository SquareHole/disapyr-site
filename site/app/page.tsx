'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsLoading(true);
    // TODO: Implement backend integration
    setTimeout(() => {
      setIsLoading(false);
      // Placeholder for future functionality
      alert('Backend integration coming soon!');
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>disapyr.link</h1>
        <p className={styles.subtitle}>
          Share text securely with one-time links that disappear after being viewed
        </p>
        
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
        </form>
        
        <footer className={styles.footer}>
          <p>
            Your text is encrypted and automatically deleted after being viewed once.
            <br />
            <a href="#" onClick={(e) => e.preventDefault()}>
              Learn more about our security
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
