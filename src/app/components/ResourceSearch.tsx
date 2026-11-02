"use client";

import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import CampusEmblem from "./CampusEmblem";

const searchableSections = [
  { title: "Notes & lectures", keywords: "notes lecture materials study", href: "#notes" },
  { title: "Question bank", keywords: "past papers questions exams practice", href: "#questions" },
  { title: "Syllabus", keywords: "curriculum subjects semester 1 2 3 4 5 6 7 8", href: "#syllabus" },
  { title: "Class & exam routine", keywords: "schedule class exam routine", href: "#routine" },
  { title: "Notices & announcements", keywords: "campus news updates notices", href: "#notices" },
  { title: "Student community", keywords: "community contribute share", href: "#contribute" },
];

export default function ResourceSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return searchableSections.filter(({ title, keywords }) =>
      `${title} ${keywords}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <div className="search-wrap">
      <label className="search-box">
        <Search size={19} aria-hidden="true" />
        <span className="sr-only">Search academic resources</span>
        <input
          type="search"
          placeholder="Try “past questions” or “notes”…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
            if (event.key === "Enter" && results[0]) {
              window.location.hash = results[0].href;
              setIsOpen(false);
            }
          }}
          aria-expanded={isOpen}
          aria-controls="search-results"
        />
        <span className="search-shortcut">↵</span>
      </label>
      {isOpen && (
        <div className="search-results">
          <div className="search-results-brand">
            <CampusEmblem />
            <span>ASCOL CSIT HUB</span>
          </div>
          <div id="search-results" role="listbox">
            {!query.trim() ? (
              <p>Search notes, questions, syllabus and more.</p>
            ) : results.length ? (
              results.map((result) => (
                <a
                  href={result.href}
                  key={result.title}
                  role="option"
                  aria-selected="false"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{result.title}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              ))
            ) : (
              <p>No matching sections yet. Try “notes”, “questions” or “routine”.</p>
            )}
          </div>
        </div>
      )}
      <p className="search-hint">
        <span>POPULAR:</span> notes <i /> past questions <i /> semester 1
      </p>
    </div>
  );
}
