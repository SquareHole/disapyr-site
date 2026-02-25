import React from 'react';
import Link from 'next/link';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            disapyr.link
          </Link>

          <nav className={styles.navLinks} aria-label="Primary">
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
            <a
              href="https://github.com/SquareHole/disapyr-site"
              className={styles.navLink}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div className={styles.main}>
        {children}
      </div>

      <footer className={styles.footer}>
        <p>
          Your text is encrypted and automatically deleted after being viewed once. <br />
          <Link href="/about" className={styles.inlineLink}>Read how it works</Link>
        </p>
      </footer>
    </div>
  );
}
