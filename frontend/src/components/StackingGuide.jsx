import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ReactLenis } from "lenis/react";
import QuestionCard from "./QuestionCard";
import FormResults from "./FormResults";
import SearchBar from "./SearchBar";
import {
  COPY,
  QUESTIONS,
  START_QUESTION_ID,
  profileChips,
} from "../data/questions";
import { routeQuery } from "../data/queryRouter";

function rebuildProfile(answers, extraTags = {}) {
  const fromAnswers = Object.values(answers).reduce(
    (acc, option) => ({ ...acc, ...(option.tags || {}) }),
    {}
  );
  return { ...fromAnswers, ...extraTags };
}

/**
 * Search seeds a path into the stacking Q&A. Cards layer like the
 * ui-layouts Framer Stacking demo. Backtrack via back arrow, drag-right,
 * or Left Arrow key.
 */
export default function StackingGuide({ language, onLanguageChange }) {
  const t = COPY[language] || COPY.en;

  const [path, setPath] = useState([START_QUESTION_ID]);
  const [answers, setAnswers] = useState({});
  const [extraTags, setExtraTags] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [guideReady, setGuideReady] = useState(false);

  const cards = useMemo(
    () => path.map((id) => QUESTIONS[id]).filter(Boolean),
    [path]
  );

  const profile = useMemo(
    () => rebuildProfile(answers, extraTags),
    [answers, extraTags]
  );
  const chips = useMemo(() => profileChips(profile), [profile]);

  const canGoBack =
    showResults || path.length > 1 || Boolean(answers[path[0]]);

  const scrollToQuestions = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("questions")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 80);
    });
  };

  const handleSearch = useCallback((query) => {
    const routed = routeQuery(query);
    setPath(routed.path);
    setAnswers(routed.answers);
    setExtraTags(routed.extraTags || {});
    setShowResults(false);
    setGuideReady(true);
    scrollToQuestions();
  }, []);

  const handleSelect = useCallback(
    (questionId, option) => {
      if (answers[questionId]) return;

      setAnswers((prev) => ({ ...prev, [questionId]: option }));
      setGuideReady(true);

      if (option.next === "results") {
        setShowResults(true);
        requestAnimationFrame(() => {
          setTimeout(() => {
            document.getElementById("results")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 120);
        });
        return;
      }

      if (QUESTIONS[option.next]) {
        setPath((prev) =>
          prev.includes(option.next) ? prev : [...prev, option.next]
        );
      }
    },
    [answers]
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
        document.getElementById("questions")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    if (path.length <= 1) {
      if (answers[path[0]]) {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "ArrowLeft") return;
      if (e.target.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }
      if (!canGoBack) return;
      e.preventDefault();
      handleBack();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoBack, handleBack]);

  return (
    <ReactLenis root>
      <div className="guide">
        <header className="guide-top">
          <div className="guide-top__brand">{t.brand}</div>
          <button
            type="button"
            className="lang-toggle"
            onClick={() => onLanguageChange(language === "en" ? "fr" : "en")}
            title="Switch language / Changer de langue"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
        </header>

        <section className="hero">
          <div className="hero__atmosphere" aria-hidden>
            <div className="hero__stack-preview">
              <span style={{ background: "#0A4D68" }} />
              <span style={{ background: "#146C7A" }} />
              <span style={{ background: "#1B4F72" }} />
            </div>
          </div>
          <div className="hero__grid" aria-hidden />
          <div className="hero__content">
            <p className="hero__brand">{t.brand}</p>
            <h1 className="hero__title">
              {language === "fr"
                ? "Aide aux étudiants et EIA, sans le labyrinthe."
                : "Student Aid and EIA, without the maze."}
            </h1>
            <p className="hero__lede">{t.tagline}</p>
            <SearchBar language={language} copy={t} onSearch={handleSearch} />
          </div>
          {guideReady && (
            <a
              className="hero__scroll"
              href="#questions"
              aria-label={
                language === "fr" ? "Défiler vers le bas" : "Scroll for more"
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

                  return (
                    <QuestionCard
                      key={card.id}
                      i={i}
                      total={cards.length}
                      color={card.color}
                      accent={card.accent}
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
              key={`${language}-${JSON.stringify(profile)}`}
              profile={profile}
              language={language}
              onRestart={handleRestart}
            />
          </div>
        )}

        <footer className="guide-footer">
          <p>{t.brand}</p>
          <p>Manitoba · CanAI Garage 2026</p>
        </footer>
      </div>
    </ReactLenis>
  );
}
