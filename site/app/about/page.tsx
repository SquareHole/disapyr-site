'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>🔒 Security & Privacy</h1>
          <p className={styles.subtitle}>
            Learn how disapyr.link protects your sensitive information with enterprise-grade security
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🛡️ Our Security Promise</h2>
            <p className={styles.text}>
              disapyr.link is built with security as the foundation. We use military-grade encryption 
              and zero-knowledge architecture to ensure your secrets remain private and secure.
            </p>
            <div className={styles.highlights}>
              <div className={styles.highlight}>
                <span className={styles.icon}>🔐</span>
                <strong>AES-256-GCM Encryption</strong>
                <p>Your secrets are encrypted before storage using the same encryption standard trusted by governments and banks.</p>
              </div>
              <div className={styles.highlight}>
                <span className={styles.icon}>👁️</span>
                <strong>One-Time Access</strong>
                <p>Secrets are permanently deleted after being viewed once, ensuring no trace remains.</p>
              </div>
              <div className={styles.highlight}>
                <span className={styles.icon}>⏰</span>
                <strong>Automatic Expiration</strong>
                <p>All secrets expire after 21 days, even if never accessed, providing time-based security.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔧 How It Works</h2>
            <div className={styles.process}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Encryption</h3>
                  <p>Your text is encrypted using AES-256-GCM with a unique initialization vector before being stored.</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Secure Storage</h3>
                  <p>Only the encrypted data is stored in our database. The encryption key is kept separate and secure.</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>One-Time Retrieval</h3>
                  <p>When accessed, the secret is decrypted, displayed to the user, and permanently deleted from our servers.</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔍 Technical Details</h2>
            <div className={styles.techDetails}>
              <div className={styles.techItem}>
                <h3>Encryption Algorithm</h3>
                <p>AES-256-GCM (Galois/Counter Mode) provides both confidentiality and authenticity, ensuring data cannot be tampered with.</p>
              </div>
              <div className={styles.techItem}>
                <h3>Key Derivation</h3>
                <p>Encryption keys are derived using scrypt with salt, adding computational cost to prevent brute force attacks.</p>
              </div>
              <div className={styles.techItem}>
                <h3>Zero Knowledge</h3>
                <p>We cannot read your secrets. Even with database access, encrypted content is unreadable without the encryption key.</p>
              </div>
              <div className={styles.techItem}>
                <h3>Secure Deletion</h3>
                <p>After retrieval, secret content is overwritten with NULL values, making recovery impossible even from database backups.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>❓ Frequently Asked Questions</h2>
            <div className={styles.faq}>
              <div className={styles.faqItem}>
                <h3>Can you read my secrets?</h3>
                <p>No. Secrets are encrypted before storage, and we don't have access to the decryption keys in a way that would allow us to read your content.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>What happens if someone tries to access a secret multiple times?</h3>
                <p>Only the first access succeeds. After that, the secret is permanently deleted and subsequent attempts will receive a "not found" error.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>Are there any logs or tracking?</h3>
                <p>We only store metadata necessary for the service to function (creation time, expiration, access status). We don't track users or log secret content.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>What if I lose the link?</h3>
                <p>Unfortunately, there's no way to recover a lost link. This is by design - we don't store any information that could be used to regenerate or find your secret.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🏆 Trust & Transparency</h2>
            <div className={styles.trust}>
              <div className={styles.trustItem}>
                <span className={styles.icon}>🔓</span>
                <h3>Open Source Ready</h3>
                <p>Our security implementation follows industry best practices and is designed with transparency in mind.</p>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.icon}>🚫</span>
                <h3>No Tracking</h3>
                <p>We don't use analytics, tracking cookies, or any form of user monitoring. Your privacy is paramount.</p>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.icon}>⚡</span>
                <h3>Minimal Data</h3>
                <p>We only store what's absolutely necessary for the service to function, and delete everything as soon as possible.</p>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <Link href="/" className={styles.backLink}>
            ← Back to disapyr.link
          </Link>
        </div>
      </main>
    </div>
  );
}
