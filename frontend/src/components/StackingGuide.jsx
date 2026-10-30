import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ReactLenis } from 'lenis/react';
import QuestionCard from './QuestionCard';
import FormResults from './FormResults';
import SearchBar from './SearchBar';
import {
  COPY,
  QUESTIONS,
  START_QUESTION_ID,
  profileChips,
} from '../data/questions';
import { detectLanguage } from '../api';
import { routeQuery } from '../data/queryRouter';

const HALLOWEEN_AUDIO_SRC = '/halloween-bg.mp3';
const HALLOWEEN_AUDIO_VOLUME = 0.22;
const BOO_AUDIO_SRC = '/boo.mp3';
const BOO_AUDIO_VOLUME = 0.55;
/** Chance to play boo.mp3 on each Halloween button click (not every / alternating). */
const BOO_TRIGGER_CHANCE = 0.2;
/** Clicks anywhere before the Halloween toggle appears. */
const HALLOWEEN_EASTER_EGG_CLICKS = 5;

function rebuildProfile(answers, extraTags = {}) {
  const fromAnswers = Object.values(answers).reduce(
    (acc, option) => ({ ...acc, ...(option.tags || {}) }),
    {},
  );
  return { ...fromAnswers, ...extraTags };
}

const HALLOWEEN_CARD_COLORS = [
  { color: "#3D1F14", accent: "#FF8C42" },
  { color: "#5C2D1E", accent: "#FFB347" },
  { color: "#2A1810", accent: "#E85D04" },
  { color: "#4A2818", accent: "#F48C06" },
  { color: "#3D2418", accent: "#FF8C42" },
  { color: "#1A0A12", accent: "#FFB347" },
  { color: "#5C2D1E", accent: "#E85D04" },
];

/**
 * Search seeds a path into the stacking Q&A. Cards layer like the
 * ui-layouts Framer Stacking demo. Backtrack via back arrow, drag-right,
 * or Left Arrow key.
 */
const HALLOWEEN_HEADER_BRAND = "🧟‍♂️";
const HALLOWEEN_FOOTER_BRAND = "🧛‍♀️";
const HALLOWEEN_HERO_BRAND = "👻 Boo-reaucracy 👻";

export default function StackingGuide({ language, onLanguageChange }) {
  const t = COPY[language] || COPY.en;

  const [path, setPath] = useState([START_QUESTION_ID]);
  const [answers, setAnswers] = useState({});
  const [extraTags, setExtraTags] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [guideReady, setGuideReady] = useState(false);
  const [halloween, setHalloween] = useState(false);
  const [halloweenUnlocked, setHalloweenUnlocked] = useState(false);
  const halloweenAudioRef = useRef(null);
  const easterEggClicksRef = useRef(0);
  const headerBrand = halloween ? HALLOWEEN_HEADER_BRAND : t.brand;
  const heroBrand = halloween ? HALLOWEEN_HERO_BRAND : t.brand;
  const footerBrand = halloween ? HALLOWEEN_FOOTER_BRAND : t.brand;

  const maybePlayBoo = useCallback(() => {
    if (Math.random() >= BOO_TRIGGER_CHANCE) return;
    // Fresh one-shot inside the click handler (user gesture) is more
    // reliable than a preloaded ref that React Strict Mode can tear down.
    const boo = new Audio(BOO_AUDIO_SRC);
    boo.volume = BOO_AUDIO_VOLUME;
    void boo.play();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      halloween ? "halloween" : "default"
    );
    return () => {
      document.documentElement.setAttribute("data-theme", "default");
    };
  }, [halloween]);

  useEffect(() => {
    const audio = new Audio(HALLOWEEN_AUDIO_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = HALLOWEEN_AUDIO_VOLUME;
    halloweenAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      halloweenAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = halloweenAudioRef.current;
    if (!audio) return;

    if (halloween) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay can fail if the browser blocks it; the theme toggle
        // click usually counts as a user gesture, so this is a soft fallback.
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [halloween]);

  // Easter egg: reveal Halloween toggle after N clicks anywhere
  useEffect(() => {
    if (halloweenUnlocked) return;

    const onPointerDown = () => {
      easterEggClicksRef.current += 1;
      if (easterEggClicksRef.current >= HALLOWEEN_EASTER_EGG_CLICKS) {
        setHalloweenUnlocked(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [halloweenUnlocked]);

  // Random boo on any click while Halloween theme is active
  useEffect(() => {
    if (!halloween) return;

    const onPointerDown = () => {
      maybePlayBoo();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [halloween, maybePlayBoo]);

  const cards = useMemo(
    () => path.map((id) => QUESTIONS[id]).filter(Boolean),
    [path],
  );

  const profile = useMemo(
    () => rebuildProfile(answers, extraTags),
    [answers, extraTags],
  );
  const chips = useMemo(() => profileChips(profile), [profile]);

  const canGoBack =
    showResults ||
    path.length > 1 ||
    Boolean(answers[path[0]]) ||
    // Search already chose Student Aid / EIA — allow backing into that chooser
    (Boolean(answers.need) && path[0] !== START_QUESTION_ID);

  const scrollToQuestions = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById('questions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 80);
    });
  };

  const handleSearch = useCallback(
    async (query) => {
      // Switch EN/FR from the search text so follow-ups, forms, FAQ, and chat match
      try {
        const detected = await detectLanguage(query, language);
        if (detected?.language === 'en' || detected?.language === 'fr') {
          onLanguageChange(detected.language);
        }
      } catch {
        // Keep the current UI language if detection fails
      }

      const routed = routeQuery(query);
      setPath(routed.path);
      setAnswers(routed.answers);
      setExtraTags(routed.extraTags || {});
      setShowResults(false);
      setGuideReady(true);
      scrollToQuestions();
    },
    [language, onLanguageChange],
  );

  const handleSelect = useCallback(
    (questionId, option) => {
      if (answers[questionId]) return;

      setAnswers((prev) => ({ ...prev, [questionId]: option }));
      setGuideReady(true);

      if (option.next === 'results') {
        setShowResults(true);
        requestAnimationFrame(() => {
          setTimeout(() => {
            document.getElementById('results')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 120);
        });
        return;
      }

      if (QUESTIONS[option.next]) {
        setPath((prev) =>
          prev.includes(option.next) ? prev : [...prev, option.next],
        );
      }
    },
    [answers],
  );

  const handleBack = useCallback(() => {
    if (showResults) {
      const lastId = path[path.length - 1];
      setShowResults(false);
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[lastId];
        return next;
      });
      requestAnimationFrame(() => {
        document.getElementById('questions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
      return;
    }

    if (path.length <= 1) {
      const currentId = path[0];
      if (answers[currentId]) {
        setAnswers((prev) => {
          const next = { ...prev };
          delete next[currentId];
          return next;
        });
        return;
      }
      // Undo search-seeded topic and let them pick Student Aid vs EIA
      if (answers.need && currentId !== START_QUESTION_ID) {
        setPath([START_QUESTION_ID]);
        setAnswers({});
      }
      return;
    }

    const prevId = path[path.length - 2];
    setPath((prev) => prev.slice(0, -1));
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[prevId];
      return next;
    });
  }, [showResults, path, answers]);

  const handleRestart = () => {
    setPath([START_QUESTION_ID]);
    setAnswers({});
    setExtraTags({});
    setShowResults(false);
    setGuideReady(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'ArrowLeft') return;
      if (e.target.closest('input, textarea, select, [contenteditable=true]')) {
        return;
      }
      if (!canGoBack) return;
      e.preventDefault();
      handleBack();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canGoBack, handleBack]);

  return (
    <ReactLenis root>
      <div className="guide">
        <header className="guide-top">
          <div className="guide-top__brand">{headerBrand}</div>
          <div className="guide-top__actions">
            {halloweenUnlocked && (
              <button
                type="button"
                className={`theme-toggle${halloween ? " is-active" : ""}`}
                onClick={() => setHalloween((on) => !on)}
                title={
                  language === "fr"
                    ? halloween
                      ? "Revenir au thème normal"
                      : "Thème Halloween"
                    : halloween
                      ? "Back to normal theme"
                      : "Halloween theme"
                }
                aria-pressed={halloween}
              >
                {halloween ? "🎃" : "🪦"}
              </button>
            )}
            <button
              type="button"
              className="lang-toggle"
              onClick={() => onLanguageChange(language === "en" ? "fr" : "en")}
              title="Switch language / Changer de langue"
            >
              {language === "en" ? "FR" : "EN"}
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero__grid" aria-hidden />
          <div className="hero__content">
            <p className="hero__brand">{heroBrand}</p>
            <h1 className="hero__title">
              {language === 'fr'
                ? 'Aide aux étudiants et EIA, sans le labyrinthe.'
                : 'Student Aid and EIA made simple.'}
            </h1>
            <p className="hero__lede">{t.tagline}</p>
            <SearchBar language={language} copy={t} onSearch={handleSearch} />
          </div>
          {guideReady && (
            <a
              className="hero__scroll"
              href="#questions"
              aria-label={
                language === 'fr' ? 'Défiler vers le bas' : 'Scroll for more'
              }
            >
              <span className="hero__scroll-arrow" aria-hidden>
                ↓
              </span>
            </a>
          )}
        </section>

        {guideReady && (
          <section id="questions" className="stack-stage">
            <div className="stack-stage__frame">
              <AnimatePresence initial={false}>
                {cards.map((card, i) => {
                  const locale = card[language] || card.en;
                  const targetScale = 1 - (cards.length - 1 - i) * 0.05;
                  const selected = answers[card.id];
                  const isTop = i === cards.length - 1;
                  const themeColors = halloween
                    ? HALLOWEEN_CARD_COLORS[i % HALLOWEEN_CARD_COLORS.length]
                    : null;

                  return (
                    <QuestionCard
                      key={card.id}
                      i={i}
                      total={cards.length}
                      color={themeColors?.color || card.color}
                      accent={themeColors?.accent || card.accent}
                      title={locale.title}
                      prompt={locale.prompt}
                      options={locale.options}
                      selectedId={selected?.id}
                      onSelect={(opt) => handleSelect(card.id, opt)}
                      onBack={handleBack}
                      canGoBack={canGoBack && isTop}
                      backLabel={t.back}
                      stepLabel={t.stepLabel}
                      answeredLabel={t.answered}
                      scale={targetScale}
                      isTop={isTop}
                      interactive={isTop && !showResults && !selected}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {chips.length > 0 && (
          <aside className="profile-strip" aria-label={t.profileLabel}>
            <span className="profile-strip__label">{t.profileLabel}</span>
            <ul className="profile-strip__chips">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <strong>{chip.key}</strong> {chip.value}
                </li>
              ))}
            </ul>
          </aside>
        )}

        {showResults && (
          <div id="results">
            <FormResults
              key={JSON.stringify(profile)}
              profile={profile}
              language={language}
              onRestart={handleRestart}
            />
          </div>
        )}

        <footer className="guide-footer">
          <p>{footerBrand}</p>
          <p>Manitoba · CanAI Garage 2026</p>
        </footer>
      </div>
    </ReactLenis>
  );
}
