"use client";

import Image from "next/image";
import Link from "next/link";
import motion from "./game-motion.module.css";
import { courses, homeContent, phonicsPath, type Locale } from "./home-content";
import { Icon } from "./material-icon";
import { useLocale } from "./site-shell";

type Content = (typeof homeContent)[Locale];
type Course = (typeof courses)[number];

const highlights = [
  { icon: "⭐" },
  { icon: "🎧", color: "text-sound" },
  { icon: "🎮", color: "text-play" },
];

function Hero({ content }: { content: Content }) {
  return (
    <section className="hero" aria-labelledby="welcome-title">
      <div className="page-width hero-inner">
        <div className="hero-copy">
          <div className="hero-sticker">
            <span className="text-xl" aria-hidden="true">🐝</span>
            <span>{content.heroBadge}</span>
            <span aria-hidden="true">✨</span>
            <span className="edition-pill">Kuromi Edition 💜</span>
          </div>
          <h1 id="welcome-title" className="hero-title">
            {content.welcome}<br />
            <span className="hero-title-brand">Learning With Bee!</span>{" "}
            <span className={`hero-star ${motion.bounce}`} aria-hidden="true">🌟</span>
          </h1>
          <ul className="hero-highlights">
            {highlights.map(({ icon, color }, index) => (
              <li key={icon} className={color}>
                <span aria-hidden="true">{icon}</span> {content.highlights[index]}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-art">
          <div className="hero-image">
            <Image
              src="/home/bee-and-kuromi.webp"
              alt={content.heroAlt}
              fill
              preload
              sizes="(max-width: 480px) 90vw, (max-width: 1023px) 416px, 480px"
              className="object-cover"
            />
          </div>
          <div className="art-sticker honey-sticker">
            <span className="text-2xl" aria-hidden="true">🍯</span>
            <div><small>{content.honeyTitle}</small>{content.honeyText}</div>
          </div>
          <div className="art-sticker kuromi-sticker">
            <span className="text-2xl" aria-hidden="true">🎀</span>
            <div><small>Kuromi Magic</small>{content.kuromiText}</div>
          </div>
          <span className={`levels-sticker ${motion.pulse}`}>✨ Level 1: A–Z Ready!</span>
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course, content }: { course: Course; content: Content }) {
  const copy = content.courses[course.id];
  const levelsId = course.id + "-levels";
  const isPhonics = course.id === "oxford-phonics-world";

  return (
    <article id={course.id} tabIndex={-1} className="course-card" data-theme={isPhonics ? "phonics" : "lets-go"}>
      <div className="course-sticker">
        <span aria-hidden="true">{course.emoji}</span> {copy.badge}
      </div>
      <div className="course-meta">
        <span className="course-category">
          <span className="accent-dot" aria-hidden="true" />
          {course.category}
        </span>
      </div>
      <h3 className="course-title">
        {course.title}
        {!isPhonics && <span className="text-2xl" aria-hidden="true">💜</span>}
      </h3>

      <div id={levelsId} tabIndex={-1} className="course-showcase">
        <div className="showcase-heading">
          <h4><span className="accent-dot" aria-hidden="true" />{copy.heading}</h4>
        </div>

        <figure className="course-image">
          <Image
            src={course.image}
            alt={copy.imageAlt}
            fill
            sizes="(max-width: 560px) 85vw, 440px"
            className="object-cover"
          />
          <figcaption>
            <span className="text-xl" aria-hidden="true">{isPhonics ? "🐝" : "🎶"}</span>
            {copy.caption}
          </figcaption>
        </figure>
      </div>

      <Link className="course-action" href={isPhonics ? phonicsPath : "#" + levelsId}>
        <span aria-hidden="true">{course.actionEmoji}</span>
        {copy.action}
        <Icon name="arrow_forward" />
      </Link>
    </article>
  );
}

export default function Home() {
  const content = homeContent[useLocale()];

  return (
    <main id="home">
      <Hero content={content} />
      <section id="lessons" tabIndex={-1} className="page-width courses" aria-labelledby="courses-title">
        <div className="courses-heading">
          <div className="courses-eyebrow">
            <span aria-hidden="true">✨</span> {content.courseBadge} <span aria-hidden="true">✨</span>
          </div>
          <h2 id="courses-title"><span aria-hidden="true">📚</span> {content.courseHeading}</h2>
        </div>
        <div className="course-grid">
          {courses.map((course) => <CourseCard key={course.id} course={course} content={content} />)}
        </div>
      </section>
    </main>
  );
}
