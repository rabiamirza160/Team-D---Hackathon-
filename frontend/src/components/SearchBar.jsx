import { useState } from "react";
import { SEARCH_SUGGESTIONS } from "../data/queryRouter";

export default function SearchBar({ language, copy, onSearch, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const suggestions = SEARCH_SUGGESTIONS[language] || SEARCH_SUGGESTIONS.en;

  const submit = (text) => {
    const q = (text ?? value).trim();
    if (!q) return;
    setValue(q);
    onSearch(q);
  };

  return (
    <div className="search-bar">
      <form
        className="search-bar__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="visually-hidden" htmlFor="guide-search">
          {copy.searchPlaceholder}
        </label>
        <input
          id="guide-search"
          className="search-bar__input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
        />
        <button
          className="search-bar__submit"
          type="submit"
          aria-label={copy.searchSubmit}
          title={copy.searchSubmit}
        >
          <svg
            className="search-bar__icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
            <path
              d="M20 20L16.5 16.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>

      <div className="search-bar__suggestions">
        <span className="search-bar__hint">{copy.searchHint}</span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="search-bar__chip"
            onClick={() => submit(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
