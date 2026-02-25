'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import Layout from '../../components/Layout';

interface SecretData {
  key: string;
  secret: string;
  retrieved_at: string;
}

export default function SecretPage() {
  const params = useParams();
  const key = params.key as string;

  const [secretData, setSecretData] = useState<SecretData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!key) return;

    const fetchSecret = async () => {
      try {
        const response = await fetch(`/.netlify/functions/getSecret?key=${encodeURIComponent(key)}`);
        const data = await response.json();

        if (!response.ok) {
          const message = (data && (data.error as string)) || '';
          if (response.status === 404) {
            setError('This secret was not found or has already been viewed.');
          } else if (response.status === 410) {
            setError('This secret has expired.');
          } else if (response.status === 500) {
            setError(message || 'A server error occurred. Please try again later.');
          } else {
            setError(message || 'An unexpected error occurred.');
          }
          return;
        }

        setSecretData(data);
      } catch (err) {
        setError('Failed to load secret. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchSecret().then(r => { });
  }, [key]);

  const handleCopySecret = async () => {
    if (!secretData) return;

    try {
      await navigator.clipboard.writeText(secretData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy secret:', err);
    }
  };

  const handleCreateNew = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.main}>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Decrypting link...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={`${styles.main} ${styles.card}`}>
            <div className={styles.errorContainer}>
              <div className={styles.errorIconWrapper}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h1 className={styles.title}>Unavailable</h1>
                <p className={styles.subtitle}>{error}</p>
              </div>
              <div className={styles.errorInfo}>
                <p className={styles.errorInfoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Secrets can only be viewed once
                </p>
                <p className={styles.errorInfoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Secrets expire automatically
                </p>
              </div>
              <div className={styles.actions}>
                <button onClick={handleCreateNew} className={styles.primaryButton}>
                  Create a New Secret
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={`${styles.main} ${styles.card}`}>
          <div className={styles.secretContainer}>
            <div className={styles.headerBlock}>
              <h1 className={styles.title}>
                <svg className={styles.titleIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                Secret Retrieved
              </h1>
              <p className={styles.subtitle}>
                This secret has been fetched and is no longer accessible via this link.
              </p>
            </div>

            <div className={styles.secretBox}>
              <div className={styles.secretContent}>
                {secretData?.secret}
              </div>
              <button
                onClick={handleCopySecret}
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              >
                {copied ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Copy Secret
                  </>
                )}
              </button>
            </div>

            <div className={styles.warningBanner}>
              <svg className={styles.warningIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <p className={styles.warningContent}>
                <strong>Warning</strong>
                This secret has been permanently deleted from our servers. Please ensure you have copied or saved it before closing this window.
              </p>
            </div>

            <div className={styles.actions}>
              <button onClick={handleCreateNew} className={styles.secondaryButton}>
                Create Another Secret
              </button>
            </div>

            <div className={styles.info}>
              <p className={styles.timestamp}>
                Retrieved • {new Date(secretData?.retrieved_at || '').toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
