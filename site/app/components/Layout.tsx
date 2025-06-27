import Link from 'next/link';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <div className={styles.logoIcon}>🔒</div>
            <h1 className={styles.title}>disapyr.link</h1>
          </div>
          <p className={styles.subtitle}>
            Share text securely with one-time links that disappear after being viewed
          </p>
        </div>
        {children}
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
