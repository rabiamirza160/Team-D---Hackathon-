import { useCallback, useEffect, useState } from "react";
import { getChecklist } from "../api";
import {
  buildChecklistQuery,
  buildSituation,
  COPY,
} from "../data/questions";
import { faqsForProfile } from "../data/faq";
import ReadAloudButton from "./ReadAloudButton";
import ResultsChat from "./ResultsChat";

function ResultsSection({
  id,
  title,
  open,
  onToggle,
  children,
  badge,
  headerAction,
}) {
  return (
    <div className={`results-section${open ? " is-open" : ""}`}>
      <div className="results-section__bar">
        <button
          type="button"
          className="results-section__header"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
        >
          <span className="results-section__title">
            {title}
            {badge != null && badge !== "" && (
              <span className="results-section__badge">{badge}</span>
            )}
          </span>
        </button>

        {open && headerAction ? (
          <div className="results-section__header-action">{headerAction}</div>
        ) : null}

        <button
          type="button"
          className="results-section__chevron"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? "−" : "+"}
        </button>
      </div>

      {open && (
        <div className="results-section__body" id={id}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function FormResults({ profile, language, onRestart }) {
  const t = COPY[language] || COPY.en;
  const situation = buildSituation(profile, language);
  const checklistQuery = buildChecklistQuery(profile);
  const faqs = faqsForProfile(profile, language);

  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [openSection, setOpenSection] = useState("forms");
  const [chatSpeak, setChatSpeak] = useState({ text: "", language });

  const handleSpeakTargetChange = useCallback((target) => {
    setChatSpeak(target);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadForms() {
      setItems(null);
      setError(false);

      const attempts = [
        checklistQuery,
        profile?.program,
        profile?.topic && profile?.province
          ? `${profile.topic} ${profile.province}`
          : null,
        profile?.query,
        "Manitoba Student Aid",
        "Manitoba Employment and Income Assistance",
      ].filter(Boolean);

      try {
        // Checklist queries are always English profile tags. Sending language="fr"
        // makes the backend treat ambiguous English as French, "translate" via the
        // stub LLM into a placeholder string, and return zero search hits.
        for (const query of attempts) {
          const data = await getChecklist(query, "en");
          if (cancelled) return;
          const next = Array.isArray(data.items) ? data.items : [];
          if (next.length > 0) {
            setItems(next);
            setError(false);
            return;
          }
        }
        if (!cancelled) {
          setItems([]);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setItems([]);
        }
      }
    }

    loadForms();

    return () => {
      cancelled = true;
    };
  }, [checklistQuery, profile]);

  const loading = items === null;
  const formCount = items?.length ?? 0;

  const toggle = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <section className="results" aria-live="polite">
      <div className="results__panel">
        <p className="results__eyebrow">{t.profileLabel}</p>
        <h2 className="results__title">{t.nextStepsTitle}</h2>
        <p className="results__summary">{situation}</p>
        <div className="results__actions">
          <button type="button" className="results__restart" onClick={onRestart}>
            {t.restart}
          </button>
        </div>

        <div className="results-accordion">
          <ResultsSection
            id="results-forms"
            title={t.resultsTitle}
            badge={
              !loading && !error
                ? t.formsCount(formCount)
                : loading
                  ? "…"
                  : null
            }
            open={openSection === "forms"}
            onToggle={() => toggle("forms")}
          >
            {loading && <p className="results__status">{t.resultsLoading}</p>}
            {error && (
              <p className="results__status is-error">{t.resultsError}</p>
            )}
            {!loading && !error && items.length === 0 && (
              <p className="results__status">{t.resultsEmpty}</p>
            )}
            {!loading && !error && items.length > 0 && (
              <ul className="results__list">
                {items.map((item, index) => (
                  <li key={`${item.form}-${index}`} className="results__item">
                    <div className="results__item-body">
                      <span className="results__item-label">{t.task}</span>
                      <p className="results__item-task">{item.task}</p>
                      <span className="results__item-label">{t.form}</span>
                      <p className="results__item-form">{item.form}</p>
                    </div>
                    {item.url && (
                      <a
                        className="results__link"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.openLink}
                        <span aria-hidden> →</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ResultsSection>

          <ResultsSection
            id="results-faq"
            title={t.faqTitle}
            badge={String(faqs.length)}
            open={openSection === "faq"}
            onToggle={() => toggle("faq")}
          >
            <ul className="results-faq">
              {faqs.map((item) => (
                <li key={item.q} className="results-faq__item">
                  <h3 className="results-faq__q">{item.q}</h3>
                  <p className="results-faq__a">{item.a}</p>
                </li>
              ))}
            </ul>
          </ResultsSection>

          <ResultsSection
            id="results-chat"
            title={t.chatTitle}
            open={openSection === "chat"}
            onToggle={() => toggle("chat")}
            headerAction={
              chatSpeak.text ? (
                <ReadAloudButton
                  text={chatSpeak.text}
                  language={chatSpeak.language || language}
                />
              ) : null
            }
          >
            <ResultsChat
              key={language}
              language={language}
              copy={t}
              onSpeakTargetChange={handleSpeakTargetChange}
            />
          </ResultsSection>
        </div>
      </div>
    </section>
  );
}
