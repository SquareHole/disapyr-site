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

    fetchSecret().then(r => {});
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
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Retrieving your secret...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Secret Not Available</h1>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorInfo}>
            <p>🔒 Secrets can only be viewed once</p>
            <p>⏰ Secrets expire after 21 days</p>
          </div>
          <button onClick={handleCreateNew} className={styles.button}>
            Create a New Secret
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className={styles.secretContainer}>
          <h1 className={styles.title}>🔓 Secret Retrieved</h1>
          <p className={styles.subtitle}>
            This secret has been retrieved and is no longer accessible via this link.
          </p>
          
          <div className={styles.secretBox}>
            <div className={styles.secretContent}>
              {secretData?.secret}
            </div>
            <button 
              onClick={handleCopySecret}
              className={styles.copyButton}
            >
              {copied ? 'Copied!' : 'Copy Secret'}
            </button>
          </div>

          <div className={styles.warningBox}>
            <p>⚠️ <strong>Important:</strong> This secret has been permanently deleted from our servers. Make sure to save it now if you need it later.</p>
          </div>

          <div className={styles.actions}>
            <button onClick={handleCreateNew} className={styles.secondaryButton}>
              Create Another Secret
            </button>
          </div>

          <div className={styles.info}>
            <p className={styles.timestamp}>
              Retrieved on: {new Date(secretData?.retrieved_at || '').toLocaleString()}
            </p>
          </div>
        </div>
    </Layout>
  );
}
