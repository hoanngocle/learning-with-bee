"use client";

import Link from "next/link";
import { homeContent, type Locale } from "../home-content";
import { useLocale } from "../site-shell";
import { alphabetPath, levelContent, levels } from "./level-content";
import { SelectionIcon } from "./selection-icon";
import styles from "./level-selection.module.css";

function LevelCard({
  level,
  locale,
}: {
  level: (typeof levels)[number];
  locale: Locale;
}) {
  const copy = levelContent[locale];
  const current = level.number === 1;
  const [subtitle, description] = level[locale];

  return (
    <article className={styles.card} data-level={level.number} aria-labelledby={`title-level-${level.number}`}>
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <span className={styles.levelBadge}>LEVEL {level.number}</span>
          {current ? (
            <span className={styles.current}>
              <span className={styles.statusDot} aria-hidden="true" />{copy.current}
            </span>
          ) : (
            <span className={styles.lock} role="img" aria-label={copy.locked}><SelectionIcon name="lock" /></span>
          )}
        </div>
        <div className={styles.emoji} aria-hidden="true">{level.emoji}</div>
        <h2 id={`title-level-${level.number}`} lang="en">{level.title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.description}>{description}</p>
      </div>
      {current ? (
        <Link className={styles.cardAction} href={alphabetPath}>
          <SelectionIcon name="play_circle" />{copy.start}
        </Link>
      ) : (
        <button className={styles.cardAction} type="button" aria-disabled="true" tabIndex={-1}>
          <SelectionIcon name="lock_open" />{copy.unlock}
        </button>
      )}
    </article>
  );
}

export function LevelSelection() {
  const locale = useLocale();
  const copy = levelContent[locale];

  return (
    <main className={styles.selection} aria-labelledby="selection-title">
      <nav className={styles.breadcrumb} aria-label={copy.breadcrumb}>
        <Link href="/" className={styles.back}>
          <SelectionIcon name="arrow_back" />
          {copy.back}
        </Link>
        <ol className={styles.trail}>
          <li><Link href="/">{homeContent[locale].home}</Link></li>
          <li aria-hidden="true">›</li>
          <li>Oxford Phonics World</li>
          <li aria-hidden="true">›</li>
          <li className={styles.count} aria-current="page">{copy.levelCount}</li>
        </ol>
      </nav>

      <div className={styles.intro}>
        <p className={styles.roadmap}><SelectionIcon name="auto_awesome" size={16} />{copy.badge}</p>
        <h1 id="selection-title">{copy.title}</h1>
      </div>

      <div className={styles.levelRows}>
        <div className={styles.firstRow}>
          {levels.slice(0, 3).map((level) => <LevelCard key={level.number} level={level} locale={locale} />)}
        </div>
        <div className={styles.secondRow}>
          {levels.slice(3).map((level) => <LevelCard key={level.number} level={level} locale={locale} />)}
        </div>
      </div>

    </main>
  );
}
