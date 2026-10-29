import { useEffect, useState } from "react";
import { getChecklist } from "../api";
import { buildSituation, COPY } from "../data/questions";
import ReadAloudButton from "./ReadAloudButton";

export default function FormResults({ profile, language, onRestart }) {
  const t = COPY[language] || COPY.en;
  const situation = buildSituation(profile, language);
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getChecklist(situation)
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [situation]);

  const loading = items === null;

  return (
    <section className="results" aria-live="polite">
      <div className="results__panel">
        <p className="results__eyebrow">{t.profileLabel}</p>
        <h2 className="results__title">{t.resultsTitle}</h2>
        <p className="results__summary">{situation}</p>
        <div className="results__actions">
          <ReadAloudButton text={situation} language={language} />
          <button type="button" className="results__restart" onClick={onRestart}>
            {t.restart}
          </button>
        </div>

        {loading && <p className="results__status">{t.resultsLoading}</p>}

        {error && <p className="results__status is-error">{t.resultsError}</p>}

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
      </div>
    </section>
  );
}
