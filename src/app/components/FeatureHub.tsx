"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  CircleHelp,
  ClipboardCheck,
  FileQuestion,
  FlaskConical,
  Flame,
  MessagesSquare,
  NotebookPen,
  PackageSearch,
  Search,
  Star,
  Ticket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import FeatureDirectory from "@/app/components/FeatureDirectory";
import type { SessionUser } from "@/lib/auth";
import {
  campusFeatureDetails,
  campusFeatureTypes,
  type CampusEntry,
  type CampusFeatureType,
} from "@/lib/campus-features";
import LogoutButton from "@/app/components/LogoutButton";

const icons = {
  "semester-companion": CalendarDays,
  "notes-exchange": NotebookPen,
  "question-bank": FileQuestion,
  "csit-community": MessagesSquare,
  "learning-streaks": Flame,
  opportunities: BriefcaseBusiness,
  "smart-search": Search,
  "doubt-box": CircleHelp,
  "senior-connect": UsersRound,
  "notes-of-week": Star,
  "verified-resources": BadgeCheck,
  "lab-repository": FlaskConical,
  "tech-events": Ticket,
  "lost-found": PackageSearch,
  "campus-polls": ChartNoAxesColumn,
} as const;

type Props = {
  user: SessionUser | null;
  initialFeature?: string;
  initialSearch?: string;
};

type EntriesResponse = {
  entries?: CampusEntry[];
  error?: string;
};

const fileFeatureTypes = new Set<CampusFeatureType>(["notes-exchange", "lab-repository"]);
const semesterFeatureTypes = new Set<CampusFeatureType>([
  "notes-exchange",
  "verified-resources",
  "lab-repository",
  "smart-search",
]);
const dueDateFeatureTypes = new Set<CampusFeatureType>([
  "opportunities",
  "tech-events",
  "lost-found",
]);

function isFeatureType(value: string | undefined): value is CampusFeatureType {
  return campusFeatureTypes.some((type) => type === value);
}

function dateLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentStreak(days: string[], today: string) {
  const recorded = new Set(days);
  const cursor = new Date(`${today}T12:00:00`);
  if (!recorded.has(today)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (recorded.has(localDateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function emptyMessage(type: CampusFeatureType) {
  if (type === "doubt-box") return "No unanswered doubts yet. Be the first to ask.";
  if (type === "notes-exchange" || type === "lab-repository") {
    return "No resources have been shared here yet.";
  }
  if (type === "notes-of-week") return "No notes have been shared in the last seven days yet.";
  if (type === "verified-resources") return "No resources have been verified by a teacher yet.";
  if (type === "smart-search") return "Search by title, subject, semester, or a topic to find shared resources.";
  if (type === "campus-polls") return "No polls yet. Start one for your campus.";
  return "Nothing has been posted here yet. Start the conversation.";
}

export default function FeatureHub({ user, initialFeature, initialSearch = "" }: Props) {
  const [activeFeature, setActiveFeature] = useState<CampusFeatureType | null>(
    isFeatureType(initialFeature) ? initialFeature : null,
  );
  const [entries, setEntries] = useState<CampusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [semester, setSemester] = useState(user?.semester ? String(user.semester) : "");
  const [notice, setNotice] = useState("");
  const [streak, setStreak] = useState(0);
  const [streakDoneToday, setStreakDoneToday] = useState(false);

  const activeDetails = activeFeature ? campusFeatureDetails[activeFeature] : null;
  const ActiveIcon = activeFeature ? icons[activeFeature] : BookOpen;
  const sortedEntries = useMemo(() => {
    if (activeFeature === "notes-of-week") {
      return [...entries].sort((a, b) => b.helpfulCount - a.helpfulCount || b.createdAt.localeCompare(a.createdAt));
    }
    if (activeFeature === "verified-resources" && user?.role !== "teacher") {
      return entries.filter((entry) => entry.verified);
    }
    return entries;
  }, [activeFeature, entries, user?.role]);

  const loadEntries = useCallback(async () => {
    if (!activeFeature || activeFeature === "learning-streaks" || activeFeature === "semester-companion") return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: activeFeature });
      if (search.trim()) params.set("q", search.trim());
      if (semesterFeatureTypes.has(activeFeature) && semester) params.set("semester", semester);
      const response = await fetch(`/api/features?${params.toString()}`, { cache: "no-store" });
      const result = (await response.json()) as EntriesResponse;
      if (!response.ok) throw new Error(result.error ?? "Could not load this feature.");
      setEntries(result.entries ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this feature.");
    } finally {
      setLoading(false);
    }
  }, [activeFeature, search, semester]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (activeFeature !== "learning-streaks") return;
    try {
      const stored = window.localStorage.getItem("ascol:learning-streak");
      if (!stored) {
        setStreak(0);
        setStreakDoneToday(false);
        return;
      }
      const parsed = JSON.parse(stored) as { days?: string[] };
      const days = Array.isArray(parsed.days) ? parsed.days : [];
      const today = localDateKey();
      setStreakDoneToday(days.includes(today));
      setStreak(currentStreak(days, today));
    } catch {
      setError("Your saved learning streak could not be read. Clear this site's local storage and try again.");
    }
  }, [activeFeature]);

  function chooseFeature(type: CampusFeatureType | null) {
    setActiveFeature(type);
    setSearch("");
    setNotice("");
    const url = type ? `/hub?feature=${type}` : "/hub";
    window.history.replaceState(null, "", url);
  }

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFeature) return;
    setNotice("");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const options = String(data.get("options") ?? "")
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);
    const payload = {
      type: activeFeature,
      title: String(data.get("title") ?? ""),
      body: String(data.get("body") ?? ""),
      ...(data.get("subject") ? { subject: String(data.get("subject")) } : {}),
      ...(data.get("semester") ? { semester: Number(data.get("semester")) } : {}),
      ...(data.get("dueAt")
        ? { dueAt: new Date(String(data.get("dueAt"))).toISOString() }
        : {}),
      options,
      ...(data.get("correctIndex") !== null && data.get("correctIndex") !== ""
        ? { correctIndex: Number(data.get("correctIndex")) - 1 }
        : {}),
      anonymous: activeFeature === "doubt-box",
    };

    let postCreated = false;
    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { entry?: CampusEntry; error?: string };
      if (!response.ok || !result.entry) {
        throw new Error(result.error ?? "Could not publish your post.");
      }
      postCreated = true;

      const file = data.get("file");
      if (file instanceof File && file.size > 0) {
        const uploadData = new FormData();
        uploadData.set("file", file);
        const uploadResponse = await fetch(`/api/features/${result.entry.id}/file`, {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = (await uploadResponse.json()) as { error?: string };
        if (!uploadResponse.ok) {
          throw new Error(`Your post was created, but the file could not be uploaded: ${uploadResult.error ?? "try again."}`);
        }
      }
      form.reset();
      setNotice("Your post was shared.");
      await loadEntries();
    } catch (cause) {
      if (postCreated) await loadEntries();
      setError(cause instanceof Error ? cause.message : "Could not publish your post.");
    }
  }

  async function interact(entry: CampusEntry, action: Record<string, unknown>) {
    setError("");
    try {
      const response = await fetch(`/api/features/${entry.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result = (await response.json()) as { entry?: CampusEntry; error?: string };
      if (!response.ok || !result.entry) {
        throw new Error(result.error ?? "Could not update this post.");
      }
      setEntries((current) =>
        current.map((currentEntry) => currentEntry.id === result.entry?.id ? result.entry : currentEntry),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this post.");
    }
  }

  function recordStudyDay() {
    const today = localDateKey();
    const storageKey = "ascol:learning-streak";
    try {
      const saved = window.localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) as { days?: string[] } : {};
      const days = Array.isArray(parsed.days) ? [...new Set(parsed.days)] : [];
      if (!days.includes(today)) days.push(today);
      days.sort();
      window.localStorage.setItem(storageKey, JSON.stringify({ days }));
      setStreak(currentStreak(days, today));
      setStreakDoneToday(true);
    } catch {
      setError("Your study day could not be saved. Check your browser storage settings and try again.");
    }
  }

  return (
    <main className="feature-hub-page">
      <header className="dashboard-header feature-hub-header">
        <Link className="dashboard-brand" href="/">ASCOL <span>CSIT HUB</span></Link>
        <div className="feature-hub-header-actions">
          {user ? <LogoutButton /> : <Link className="button button-primary" href="/student/login">Sign in</Link>}
        </div>
      </header>

      <section className="feature-hub-welcome">
        <Link className="feature-hub-back" href="/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to home
        </Link>
        <p className="section-kicker">MADE FOR THE ASCOL CSIT COMMUNITY</p>
        <h1>{activeDetails?.title ?? "Your CSIT student hub"}</h1>
        <p>
          {activeDetails?.description ??
            "Keep your study resources, class conversations and campus opportunities together."}
        </p>
      </section>

      {!activeFeature ? (
        <section className="feature-hub-section">
          <div className="feature-hub-section-heading">
            <div>
              <p className="section-kicker">EXPLORE THE HUB</p>
              <h2>Tools for your CSIT journey</h2>
            </div>
            <span>15 student-focused features</span>
          </div>
          <FeatureDirectory />
        </section>
      ) : (
        <section className="feature-hub-workspace">
          <div className="feature-hub-toolbar">
            <button type="button" className="feature-back-button" onClick={() => chooseFeature(null)}>
              <ArrowLeft size={15} aria-hidden="true" /> All features
            </button>
            <div className="feature-hub-filters">
              {semesterFeatureTypes.has(activeFeature) && (
                <label>
                  Semester
                  <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                    <option value="">All semesters</option>
                    {Array.from({ length: 8 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>Semester {index + 1}</option>
                    ))}
                  </select>
                </label>
              )}
              {activeFeature !== "learning-streaks" && activeFeature !== "semester-companion" && (
                <form
                  className="feature-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void loadEntries();
                  }}
                >
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={activeFeature === "smart-search" ? "Search notes and resources" : "Search posts"}
                    aria-label="Search posts"
                  />
                </form>
              )}
            </div>
          </div>

          {activeFeature === "learning-streaks" ? (
            <section className="streak-panel">
              <span className="streak-icon"><Flame size={28} aria-hidden="true" /></span>
              <p className="section-kicker">YOUR PRIVATE STUDY TRACKER</p>
              <h2>{streak} {streak === 1 ? "study day" : "study days"} recorded</h2>
              <p>Build a steady habit at your own pace. Your streak is private to this browser.</p>
              <button
                type="button"
                className="button button-primary"
                onClick={recordStudyDay}
                disabled={streakDoneToday}
              >
                {streakDoneToday ? <><Check size={16} /> Today recorded</> : "Record a study day"}
              </button>
            </section>
          ) : activeFeature === "semester-companion" ? (
            <SemesterCompanion user={user} />
          ) : (
            <div className="feature-hub-columns">
              <section className="feature-feed-panel">
                <div className="feature-feed-heading">
                  <div>
                    <p className="section-kicker">
                      {activeFeature === "doubt-box"
                        ? "STUDENT QUESTIONS"
                        : activeFeature === "smart-search"
                          ? "SEARCH THE LIBRARY"
                          : "COMMUNITY SHARED"}
                    </p>
                    <h2>
                      {sortedEntries.length} {sortedEntries.length === 1 ? "post" : "posts"}
                    </h2>
                  </div>
                  <ActiveIcon size={22} aria-hidden="true" />
                </div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                {loading ? (
                  <p className="dashboard-empty">Loading…</p>
                ) : sortedEntries.length === 0 ? (
                  <div className="student-empty-state">
                    <h2>{search ? "No matches found" : "A good place to start"}</h2>
                    <p>{search ? "Try a different search or clear the semester filter." : emptyMessage(activeFeature)}</p>
                  </div>
                ) : (
                  <div className="feature-entry-list">
                    {sortedEntries.map((entry, index) => (
                      <article className="feature-entry" key={entry.id}>
                        <div className="feature-entry-top">
                          <div>
                            {entry.subject && (
                              <p className="section-kicker">
                                {entry.subject}{entry.semester ? ` · SEMESTER ${entry.semester}` : ""}
                              </p>
                            )}
                            <h3>{entry.title}</h3>
                          </div>
                          <div className="feature-entry-badges">
                            {entry.verified && <span className="feature-verified"><BadgeCheck size={13} /> Teacher verified</span>}
                            {entry.anonymous && <span className="feature-anonymous">Anonymous</span>}
                            {activeFeature === "notes-of-week" && index === 0 && <span className="feature-week-badge">Most helpful this week</span>}
                          </div>
                        </div>
                        <p className="feature-entry-body">{entry.body}</p>
                        {entry.options.length > 0 && activeFeature === "campus-polls" && (
                          <div className="feature-poll-options">
                            {entry.options.map((option, index) => (
                              <button
                                type="button"
                                key={`${entry.id}-${option}`}
                                className={entry.userVote === index ? "feature-poll-option feature-poll-option-selected" : "feature-poll-option"}
                                onClick={() => void interact(entry, { action: "vote", option: index })}
                                disabled={!user || entry.userVote !== undefined}
                              >
                                <span>{option}</span>
                                {entry.userVote !== undefined && entry.votes && <strong>{entry.votes[index] ?? 0}</strong>}
                              </button>
                            ))}
                          </div>
                        )}
                        {entry.options.length > 0 && entry.type === "question-bank" && (
                          <PracticeQuestion entry={entry} />
                        )}
                        {entry.file && (
                          <a
                            className="feature-download-link"
                            href={`/api/features/${entry.id}/file`}
                          >
                            <BookOpen size={15} aria-hidden="true" />
                            {entry.file.name}
                            <ArrowRight size={14} aria-hidden="true" />
                          </a>
                        )}
                        {entry.dueAt && (
                          <p className="feature-entry-due">
                            {activeFeature === "lost-found" ? "Posted" : "Date"} · {dateLabel(entry.dueAt)}
                          </p>
                        )}
                        <div className="feature-entry-footer">
                          <span>{entry.authorRole === "teacher" ? "Teacher" : entry.authorName} · {dateLabel(entry.createdAt)}</span>
                          <div className="feature-entry-actions">
                            {["notes-exchange", "lab-repository"].includes(entry.type) && (
                              <span className="feature-rating" aria-label={`${entry.rating?.toFixed(1) ?? "No"} out of 5 rating`}>
                                <Star size={14} fill="currentColor" />
                                {entry.rating?.toFixed(1) ?? "New"}
                              </span>
                            )}
                            {user && (
                              <button
                                type="button"
                                className={entry.bookmarked ? "feature-action feature-action-active" : "feature-action"}
                                onClick={() => void interact(entry, { action: "bookmark" })}
                                aria-label={entry.bookmarked ? "Remove bookmark" : "Bookmark post"}
                              >
                                <Bookmark size={14} /> {entry.bookmarked ? "Saved" : "Save"}
                              </button>
                            )}
                            {["csit-community", "doubt-box", "senior-connect", "notes-of-week"].includes(activeFeature) && user && (
                              <button type="button" className="feature-action" onClick={() => void interact(entry, { action: "helpful" })}>
                                <Check size={14} /> Helpful · {entry.helpfulCount}
                              </button>
                            )}
                            {activeFeature === "senior-connect" && user && (
                              <button type="button" className="feature-action" onClick={() => void interact(entry, { action: "interest" })}>
                                <UsersRound size={14} /> {entry.userInterested ? "Request sent" : "Connect"} · {entry.interestedCount}
                              </button>
                            )}
                            {activeFeature === "opportunities" && user && (
                              <button type="button" className="feature-action" onClick={() => void interact(entry, { action: "interest" })}>
                                {entry.userInterested ? "Interested" : "I’m interested"} · {entry.interestedCount}
                              </button>
                            )}
                            {user?.role === "teacher" &&
                              ["notes-exchange", "lab-repository", "question-bank", "verified-resources"].includes(entry.type) &&
                              <button type="button" className="feature-action" onClick={() => void interact(entry, { action: "verify" })}>
                                <BadgeCheck size={14} /> {entry.verified ? "Remove verification" : "Verify"}
                              </button>
                            }
                          </div>
                        </div>
                        {["notes-exchange", "lab-repository"].includes(entry.type) && user && (
                          <div className="feature-rate-row" aria-label="Rate this resource">
                            <span>Rate this resource</span>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                type="button"
                                key={value}
                                aria-label={`Rate ${value} out of 5`}
                                onClick={() => void interact(entry, { action: "rate", value })}
                              >
                                <Star size={14} fill={entry.rating && entry.rating >= value ? "currentColor" : "none"} />
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="feature-compose-panel">
                {activeFeature === "smart-search" ? (
                  <div className="feature-compose-form">
                    <p className="section-kicker">SEARCH THE LIBRARY</p>
                    <h2>Find a resource</h2>
                    <p>Search notes, lab resources, and practice questions by title, subject, or topic.</p>
                    <Link className="button button-primary" href="/hub?feature=notes-exchange">Share a resource <ArrowRight size={15} /></Link>
                  </div>
                ) : activeFeature === "notes-of-week" ? (
                  <div className="feature-compose-form">
                    <p className="section-kicker">COMMUNITY HIGHLIGHTS</p>
                    <h2>Share a useful note</h2>
                    <p>Upload notes in the Notes Exchange. Helpful contributions from the last seven days appear here.</p>
                    <Link className="button button-primary" href="/hub?feature=notes-exchange">Open Notes Exchange <ArrowRight size={15} /></Link>
                  </div>
                ) : user ? (
                  <form className="feature-compose-form" onSubmit={submitEntry}>
                    <p className="section-kicker">CONTRIBUTE</p>
                    <h2>{activeFeature === "doubt-box" ? "Ask a doubt" : activeFeature === "campus-polls" ? "Create a poll" : "Share with the hub"}</h2>
                    <label>
                      {activeFeature === "question-bank" ? "Question" : activeFeature === "campus-polls" ? "Poll question" : "Title"}
                      <input name="title" required minLength={3} maxLength={140} />
                    </label>
                    <label>
                      {activeFeature === "question-bank" ? "Explanation or topic" : activeFeature === "doubt-box" ? "Your question" : "Details"}
                      <textarea name="body" required minLength={4} maxLength={4000} rows={4} />
                    </label>
                    {semesterFeatureTypes.has(activeFeature) && (
                      <>
                        <label>
                          Subject
                          <input name="subject" required maxLength={100} />
                        </label>
                        <label>
                          Semester
                          <select name="semester" defaultValue={user.semester ?? ""} required>
                            <option value="" disabled>Select semester</option>
                            {Array.from({ length: 8 }, (_, index) => (
                              <option key={index + 1} value={index + 1}>Semester {index + 1}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                    {dueDateFeatureTypes.has(activeFeature) && (
                      <label>
                        {activeFeature === "lost-found" ? "Date noticed" : "Date"}
                        <input name="dueAt" type="datetime-local" />
                      </label>
                    )}
                    {(activeFeature === "campus-polls" || activeFeature === "question-bank") && (
                      <>
                        <label>
                          Choices (one per line)
                          <textarea name="options" rows={3} placeholder="First choice&#10;Second choice" required={activeFeature === "campus-polls"} />
                        </label>
                        {activeFeature === "question-bank" && (
                          <label>
                            Correct choice number
                            <input name="correctIndex" type="number" min={1} max={8} placeholder="For example, 2" />
                            <span className="auth-hint">Leave blank for a written question. Number choices starting from 1.</span>
                          </label>
                        )}
                      </>
                    )}
                    {fileFeatureTypes.has(activeFeature) && (
                      <label>
                        PDF or image
                        <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                        <span className="auth-hint">Up to 20 MB. The resource post can also be shared without a file.</span>
                      </label>
                    )}
                    {activeFeature === "doubt-box" && (
                      <p className="feature-anonymous-note">Your name is hidden from the student feed. Moderators may still see who submitted the question.</p>
                    )}
                    {activeFeature === "lost-found" && (
                      <p className="feature-anonymous-note">For your safety, do not include phone numbers, email addresses, or private details in a public post.</p>
                    )}
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    {notice && <p className="auth-success" role="status">{notice}</p>}
                    <button className="button button-primary feature-publish-button">
                      Share post <ArrowRight size={15} />
                    </button>
                  </form>
                ) : (
                  <div className="feature-signin-prompt">
                    <ActiveIcon size={24} aria-hidden="true" />
                    <h2>Join the conversation</h2>
                    <p>Sign in to share resources, ask questions and save useful posts.</p>
                    <Link className="button button-primary" href="/student/login">Student sign in</Link>
                    <Link className="feature-signup-link" href="/signup">Create an account</Link>
                  </div>
                )}
                <FeatureDirectory compact />
              </aside>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function PracticeQuestion({ entry }: { entry: CampusEntry }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function checkAnswer() {
    if (choice === null) return;
    setChecking(true);
    setError("");
    try {
      const response = await fetch(`/api/features/${entry.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", option: choice }),
      });
      const responseData = await response.json() as { correct?: boolean; explanation?: string; error?: string };
      if (!response.ok || responseData.correct === undefined) {
        throw new Error(responseData.error ?? "Could not check this answer.");
      }
      setResult({ correct: responseData.correct, explanation: responseData.explanation ?? "" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check this answer.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="practice-question">
      {entry.options.map((option, index) => (
        <label key={`${entry.id}-answer-${index}`}>
          <input
            type="radio"
            name={`answer-${entry.id}`}
            checked={choice === index}
            onChange={() => setChoice(index)}
            disabled={result !== null || checking}
          />
          <span>{option}</span>
        </label>
      ))}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {result ? (
        <p className="practice-answer">
          {result.correct ? "Correct!" : "Not quite."} {result.explanation}
        </p>
      ) : (
        <button type="button" disabled={choice === null || checking} onClick={() => void checkAnswer()}>
          {checking ? "Checking…" : "Check answer"}
        </button>
      )}
    </div>
  );
}

function SemesterCompanion({ user }: { user: SessionUser | null }) {
  const [assignments, setAssignments] = useState<Array<{ title: string; subject: string; dueDate?: string }>>([]);
  const [error, setError] = useState("");
  const [studyItems, setStudyItems] = useState<Array<{ id: string; title: string; dueAt: string; completed: boolean }>>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [planError, setPlanError] = useState("");
  const storageKey = `ascol:semester-plan:${user?.id ?? "guest"}`;

  useEffect(() => {
    if (!user || user.role !== "student") return;
    fetch("/api/student/assignments", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as {
          assignments?: Array<{ title: string; subject: string; dueDate?: string }>;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error ?? "Could not load assignments.");
        setAssignments(result.assignments ?? []);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load assignments."));
  }, [user]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setStudyItems([]);
        setWeeklyGoal(5);
        return;
      }
      const parsed = JSON.parse(saved) as {
        items?: Array<{ id?: unknown; title?: unknown; dueAt?: unknown; completed?: unknown }>;
        weeklyGoal?: unknown;
      };
      setStudyItems((parsed.items ?? []).filter(
        (item): item is { id: string; title: string; dueAt: string; completed: boolean } =>
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.dueAt === "string" &&
          typeof item.completed === "boolean",
      ));
      if (typeof parsed.weeklyGoal === "number" && parsed.weeklyGoal >= 1 && parsed.weeklyGoal <= 40) {
        setWeeklyGoal(parsed.weeklyGoal);
      }
    } catch {
      setPlanError("Your saved study plan could not be read. Clear this site's local storage and try again.");
    }
  }, [storageKey]);

  function saveStudyPlan(
    items: Array<{ id: string; title: string; dueAt: string; completed: boolean }>,
    goal = weeklyGoal,
  ) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ items, weeklyGoal: goal }));
      setStudyItems(items);
      setWeeklyGoal(goal);
      setPlanError("");
    } catch {
      setPlanError("Your study plan could not be saved. Check your browser storage settings and try again.");
    }
  }

  function addStudyItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("studyItem") ?? "").trim();
    const dueAt = String(data.get("studyItemDue") ?? "");
    if (title.length < 3 || !dueAt || Number.isNaN(new Date(dueAt).getTime())) {
      setPlanError("Add a task title and a valid date.");
      return;
    }
    saveStudyPlan(
      [...studyItems, { id: crypto.randomUUID(), title, dueAt: new Date(dueAt).toISOString(), completed: false }],
    );
    form.reset();
  }

  const nextAssignment = assignments.find((assignment) => assignment.dueDate);

  return (
    <div className="semester-companion">
      <section className="semester-companion-card semester-companion-card-primary">
        <span className="semester-companion-icon"><ClipboardCheck size={21} /></span>
        <p className="section-kicker">YOUR SEMESTER</p>
        <h2>{user?.semester ? `Semester ${user.semester}` : "Your study plan"}</h2>
        <p>{user?.semester ? "Your class resources and progress, in one place." : "Sign in as a student to see resources for your semester."}</p>
      </section>
      <section className="semester-companion-card">
        <p className="section-kicker">ASSIGNMENTS</p>
        <h2>{assignments.length} posted</h2>
        {error ? <p className="auth-error" role="alert">{error}</p> : (
          <p>{nextAssignment ? `Next due: ${nextAssignment.title} · ${nextAssignment.subject}` : "Published assignments will appear here."}</p>
        )}
        {user?.role === "student" && <Link href="/student/dashboard">Open assignments <ArrowRight size={14} /></Link>}
      </section>
      <section className="semester-companion-card">
        <p className="section-kicker">STUDY PLAN</p>
        <h2>Make room to learn</h2>
        <p>Set a weekly target and keep a personal list of study sessions and exam dates.</p>
        <label className="semester-weekly-goal">
          Weekly study goal
          <span>
            <input
              type="number"
              min={1}
              max={40}
              value={weeklyGoal}
              onChange={(event) => {
                const goal = Number(event.target.value);
                if (goal >= 1 && goal <= 40) saveStudyPlan(studyItems, goal);
                else setWeeklyGoal(goal);
              }}
              onBlur={() => {
                if (weeklyGoal < 1 || weeklyGoal > 40) saveStudyPlan(studyItems, 5);
              }}
            />
            hours / week
          </span>
        </label>
        <form className="semester-study-form" onSubmit={addStudyItem}>
          <input name="studyItem" required minLength={3} maxLength={120} placeholder="Study session or exam" aria-label="Study session or exam" />
          <input name="studyItemDue" type="datetime-local" required aria-label="Study session date" />
          <button type="submit">Add to plan</button>
        </form>
        {studyItems.length > 0 && (
          <p className="semester-plan-progress">
            {studyItems.filter((item) => item.completed).length} of {studyItems.length} planned items completed
          </p>
        )}
        {planError && <p className="auth-error" role="alert">{planError}</p>}
        {studyItems.length > 0 && (
          <ul className="semester-study-list">
            {studyItems.map((item) => (
              <li key={item.id} className={item.completed ? "semester-study-complete" : ""}>
                <button
                  type="button"
                  aria-label={item.completed ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                  onClick={() => saveStudyPlan(
                    studyItems.map((studyItem) =>
                      studyItem.id === item.id ? { ...studyItem, completed: !studyItem.completed } : studyItem,
                    ),
                  )}
                >
                  {item.completed ? <Check size={14} /> : <ClipboardCheck size={14} />}
                </button>
                <span><strong>{item.title}</strong><small>{dateLabel(item.dueAt)}</small></span>
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => saveStudyPlan(studyItems.filter((studyItem) => studyItem.id !== item.id))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link href="/hub?feature=learning-streaks">Open Learning Streaks <ArrowRight size={14} /></Link>
      </section>
      <section className="semester-companion-card">
        <p className="section-kicker">UPCOMING</p>
        <h2>Events & opportunities</h2>
        <p>Keep an eye on workshops, hackathons, internships and campus dates.</p>
        <div className="semester-companion-links">
          <Link href="/hub?feature=tech-events">Tech events</Link>
          <Link href="/hub?feature=opportunities">Opportunities</Link>
        </div>
      </section>
      <section className="semester-companion-card">
        <p className="section-kicker">STUDY RESOURCES</p>
        <h2>Find what you need</h2>
        <p>Browse shared material for your subject and semester.</p>
        <div className="semester-companion-links">
          <Link href="/hub?feature=notes-exchange">Notes</Link>
          <Link href="/hub?feature=question-bank">Question bank</Link>
          <Link href="/hub?feature=verified-resources">Verified</Link>
        </div>
      </section>
    </div>
  );
}
