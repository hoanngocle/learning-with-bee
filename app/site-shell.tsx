"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { homeContent, phonicsPath, type Locale } from "./home-content";
import { Icon } from "./material-icon";
import { logOut } from "./login/actions";

type Content = (typeof homeContent)[Locale];

const LocaleContext = createContext<Locale>("vi");

export function useLocale() {
  return useContext(LocaleContext);
}

export function AccountButton({ signedIn }: { signedIn: boolean }) {
  const locale = useLocale();
  if (signedIn) {
    const label = locale === "vi" ? "Đăng xuất" : "Log out";
    return (
      <form action={logOut}>
        <button className="profile-icon account-logout" type="submit" aria-label={label}>
          <Icon name="logout" /><span>{label}</span>
        </button>
      </form>
    );
  }

  const label = locale === "vi" ? "Đăng nhập" : "Log in";
  return (
    <Link className="profile-icon" href="/login" aria-label={label}>
      <Icon name="person" /><span className="account-label">{label}</span>
    </Link>
  );
}

function Header({
  content,
  locale,
  onLocaleChange,
  accountControls,
}: {
  content: Content;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  accountControls: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuNav = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const navLinks = [
    { label: "Oxford Phonics World", href: phonicsPath, active: pathname.startsWith(`${phonicsPath}/`) },
    { label: "Let's Go", href: "/#lets-go" },
    { label: locale === "vi" ? "Thành tích" : "Achievements", href: "/achivement" },
    { label: locale === "vi" ? "Xếp hạng" : "Leaderboard", href: "/bangxephang" },
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
              aria-current={pathname === href ? "page" : active ? "location" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mobile-account-link" onClick={() => setMenuOpen(false)}>{accountControls}</div>
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
          <div className="desktop-account">{accountControls}</div>
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

export function SiteShell({ children, accountControls }: { children: ReactNode; accountControls: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  const pathname = usePathname();
  const content = homeContent[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }

  return (
    <LocaleContext.Provider value={locale}>
      {pathname !== "/login" && <Header content={content} locale={locale} onLocaleChange={changeLocale} accountControls={accountControls} />}
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
