"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { homeContent, phonicsPath, type Locale } from "./home-content";
import { Icon } from "./material-icon";

type Content = (typeof homeContent)[Locale];

const LocaleContext = createContext<Locale>("vi");

export function useLocale() {
  return useContext(LocaleContext);
}

function Header({
  content,
  locale,
  onLocaleChange,
}: {
  content: Content;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuNav = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const navLinks = [
    { label: content.home, href: "/", active: pathname === "/" },
    { label: "Oxford Phonics World", href: phonicsPath, active: pathname === phonicsPath },
    { label: "Let's Go", href: "/#lets-go" },
    { label: content.lessons, href: "/#lessons" },
  ];

  useEffect(() => {
    if (menuOpen) menuNav.current?.querySelector("a")?.focus();
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon"><Icon name="emoji_nature" /></span>
          <span className="brand-name">
            Learning With Bee
            <small>{content.subtitle}</small>
          </span>
          <span className="brand-edition">
            <span className="accent-dot" aria-hidden="true" />
            Kuromi &amp; Bee
          </span>
        </Link>

        <nav
          id="site-nav"
          ref={menuNav}
          className="site-nav"
          data-open={menuOpen}
          aria-label={content.navLabel}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menuOpen) {
              setMenuOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          {navLinks.map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={content.languageLabel}>
            <button type="button" aria-label="Tiếng Việt" aria-pressed={locale === "vi"} onClick={() => onLocaleChange("vi")}>
              VI
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" aria-label="English" aria-pressed={locale === "en"} onClick={() => onLocaleChange("en")}>
              EN
            </button>
          </div>
          <span className="profile-icon" aria-hidden="true"><Icon name="person" /></span>
          <button
            ref={menuButton}
            type="button"
            className="menu-toggle"
            aria-label={content.menuLabel}
            aria-controls="site-nav"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  const content = homeContent[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }

  return (
    <LocaleContext.Provider value={locale}>
      <Header content={content} locale={locale} onLocaleChange={changeLocale} />
      {children}
      <footer className="site-footer">
        <div className="page-width">
          <Link href="/" className="footer-brand"><span aria-hidden="true">🐝</span> Learning With Bee</Link>
          <p>{content.footer}</p>
          <small>© 2024 Learning With Bee. {content.copyright} <span aria-hidden="true">✨</span></small>
        </div>
      </footer>
    </LocaleContext.Provider>
  );
}
