import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-label="Recurse home">
        <span className={styles.brandMark} aria-hidden="true">r.</span>
        <span>recurse</span>
      </a>
      <span className={styles.tagline}>MAKE IT STICK</span>
    </header>
  );
}
