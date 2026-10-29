import { motion } from "motion/react";

const DRAG_THRESHOLD = 110;

/**
 * Overlay stacking card — same visual language as ui-layouts Framer Stacking
 * (scale + top offset + origin-top), driven by answer progress instead of scroll.
 * Top card supports back via button, drag-right, or parent keyboard handler.
 */
export default function QuestionCard({
  i,
  total,
  color,
  accent,
  title,
  prompt,
  options,
  selectedId,
  onSelect,
  onBack,
  canGoBack,
  backLabel,
  stepLabel,
  answeredLabel,
  scale,
  isTop,
  interactive,
}) {
  const isAnswered = Boolean(selectedId);

  return (
    <motion.div
      className={`stack-card${isTop ? " is-top" : " is-stacked"}${isTop && canGoBack ? " is-draggable" : ""}`}
      style={{
        backgroundColor: color,
        zIndex: i + 1,
        top: `calc(-5vh + ${i * 25}px)`,
        pointerEvents: isTop ? "auto" : "none",
      }}
      initial={{ opacity: 0, y: 64, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale }}
      exit={{ opacity: 0, x: 280, rotate: 10, transition: { duration: 0.28 } }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 30,
        mass: 0.85,
      }}
      drag={isTop && canGoBack ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.04, right: 0.7 }}
      dragDirectionLock
      onDragEnd={(_, info) => {
        if (!canGoBack) return;
        if (info.offset.x > DRAG_THRESHOLD || info.velocity.x > 550) {
          onBack?.();
        }
      }}
    >
      <div className="stack-card__meta">
        <div className="stack-card__meta-left">
          {canGoBack && isTop && (
            <button
              type="button"
              className="stack-card__back"
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
              aria-label={backLabel}
              title={backLabel}
            >
              ←
            </button>
          )}
          <span className="stack-card__step">
            {stepLabel} {i + 1}
            {total ? ` / ${total}` : ""}
          </span>
        </div>
        {isAnswered && (
          <span className="stack-card__badge" style={{ color: accent }}>
            {answeredLabel}
          </span>
        )}
      </div>

      <h2 className="stack-card__title">{title}</h2>
      <p className="stack-card__prompt">{prompt}</p>

      <div className="stack-card__options" role="group" aria-label={title}>
        {options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`stack-option${active ? " is-active" : ""}${isAnswered && !active ? " is-dimmed" : ""}`}
              style={
                active
                  ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}` }
                  : undefined
              }
              onClick={() => onSelect(opt)}
              disabled={!interactive || isAnswered}
              aria-pressed={active}
              tabIndex={interactive ? 0 : -1}
            >
              <span className="stack-option__label">{opt.label}</span>
              {active && (
                <span className="stack-option__check" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="stack-card__accent"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        aria-hidden
      />
    </motion.div>
  );
}
