"use client";

import { useEffect, useState } from "react";
import type { Assignment } from "@/lib/assignment-types";

type StudentAssignmentsResponse = {
  assignments?: Assignment[];
  semester?: number;
  error?: string;
};

function readStoredIds(value: string | null) {
  if (!value) return new Set<string>();
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
    throw new Error("Saved assignment notifications could not be read. Clear this site's local storage and try again.");
  }
  return new Set<string>(parsed);
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [storageKeys, setStorageKeys] = useState<{ known: string; unread: string } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      try {
        const response = await fetch("/api/student/assignments", { cache: "no-store" });
        const result = (await response.json()) as StudentAssignmentsResponse;
        if (!response.ok) throw new Error(result.error ?? "Could not load assignments.");

        const nextAssignments = result.assignments ?? [];
        const semesterKey = String(result.semester ?? "unknown");
        const keys = {
          known: `ascol:student-assignments:known:${semesterKey}`,
          unread: `ascol:student-assignments:unread:${semesterKey}`,
        };
        const savedKnown = window.localStorage.getItem(keys.known);
        const knownIds = readStoredIds(savedKnown);
        const savedUnread = window.localStorage.getItem(keys.unread);
        const currentIds = new Set(nextAssignments.map((assignment) => assignment.id));
        const nextUnreadIds = new Set(
          [...readStoredIds(savedUnread)].filter((id) => currentIds.has(id)),
        );

        if (savedKnown !== null) {
          for (const assignment of nextAssignments) {
            if (!knownIds.has(assignment.id)) nextUnreadIds.add(assignment.id);
          }
        }

        for (const assignment of nextAssignments) knownIds.add(assignment.id);
        window.localStorage.setItem(keys.known, JSON.stringify([...knownIds]));
        window.localStorage.setItem(keys.unread, JSON.stringify([...nextUnreadIds]));

        if (active) {
          setAssignments(nextAssignments);
          setUnreadIds([...nextUnreadIds]);
          setStorageKeys(keys);
          setError("");
        }
      } catch (cause: unknown) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load assignments.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadAssignments();
    const refreshTimer = window.setInterval(() => void loadAssignments(), 30_000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  function markAllAsRead() {
    if (!storageKeys) return;
    try {
      window.localStorage.setItem(storageKeys.unread, JSON.stringify([]));
      setUnreadIds([]);
    } catch {
      setError("Could not save the notification status. Check your browser storage settings and try again.");
    }
  }

  if (isLoading) return <p className="dashboard-empty">Loading assignments…</p>;
  if (error && assignments.length === 0) return <p className="auth-error" role="alert">{error}</p>;
  if (assignments.length === 0) {
    return (
      <div className="student-empty-state">
        <h2>Nothing posted yet</h2>
        <p>Your teachers&apos; assignments will show up here when they publish them.</p>
      </div>
    );
  }

  const unreadAssignments = new Set(unreadIds);

  return (
    <>
      {error && <p className="auth-error" role="status">{error}</p>}
      {unreadIds.length > 0 && (
        <div className="student-assignment-notice" role="status" aria-live="polite">
          <span className="student-assignment-notice-dot" aria-hidden="true" />
          <span>
              <strong>
                {unreadIds.length} new {unreadIds.length === 1 ? "assignment" : "assignments"}
              </strong>{" "}
              published for your semester.
            </span>
            <button type="button" onClick={markAllAsRead}>Mark all as read</button>
        </div>
      )}
      <div className="student-assignment-summary">
        <span>
            {assignments.length} {assignments.length === 1 ? "assignment" : "assignments"} available
        </span>
        <span>Semester {assignments[0].semester} · newest first</span>
      </div>
      <div className="student-assignment-list">
        {assignments.map((assignment) => (
            <article
              className={`student-assignment-card${unreadAssignments.has(assignment.id) ? " student-assignment-card-unread" : ""}`}
              key={assignment.id}
            >
              <div className="student-assignment-heading">
                <div>
                  <p className="section-kicker">
                    {assignment.subject} · SEMESTER {assignment.semester}
                  </p>
                  <h2>{assignment.title}</h2>
                </div>
                <div className="student-assignment-meta">
                  {unreadAssignments.has(assignment.id) && (
                    <span className="student-assignment-new">New</span>
                  )}
                  <span className="assignment-teacher">By {assignment.teacherName}</span>
                </div>
              </div>
              {assignment.description && (
                <p className="assignment-description">{assignment.description}</p>
              )}
              <div className="assignment-file-list">
                {assignment.files.map((file) => (
                  <a
                    className="assignment-file-link"
                    href={`/api/assignments/${assignment.id}/files/${file.id}`}
                    key={file.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="assignment-file-kind">
                      {file.contentType === "application/pdf" ? "PDF" : "IMAGE"}
                    </span>
                    <span className="assignment-file-name">{file.name}</span>
                    <span className="assignment-file-size">{formatSize(file.size)}</span>
                  </a>
                ))}
              </div>
              <p className="assignment-posted">
                Published {new Date(assignment.publishedAt ?? assignment.createdAt).toLocaleDateString()}
                {assignment.dueDate
                  ? ` · Due ${new Date(assignment.dueDate).toLocaleString()}`
                  : ""}
              </p>
            </article>
        ))}
      </div>
    </>
  );
}
