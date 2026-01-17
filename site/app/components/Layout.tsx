import Link from 'next/link';
import LockIcon from './LockIcon';
import styles from './Layout.module.css';
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <LockIcon className={styles.logoIcon} />
            <span className={styles.brandText}>disapyr.link</span>
          </Link>
          <nav className={styles.navLinks} aria-label="Primary">
            <Link href="/about" className={styles.navLink}>About</Link>
            <a href="https://github.com/SquareHole/disapyr-site" className={styles.navLink} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </header>

      <main className={styles.main}> 
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <LockIcon className={styles.logoIcon} />
            <h1 className={styles.title}>disapyr.link</h1>
          </div>
          <p className={styles.subtitle}>
            Share text securely with one‑time links that disappear after being viewed
          </p>
        </div>
        <div className={styles.content}>{children}</div>
        <footer className={styles.footer}>
          <p>
            Your text is encrypted and automatically deleted after being viewed once. {" "}
            <Link href="/about" className={styles.inlineLink}>Learn more</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
