"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  FileText,
  GraduationCap,
  Headphones,
  Paperclip,
  PencilLine,
  Send,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { Assignment } from "@/lib/assignment-types";

const maxFiles = 15;
const maxFileSize = 50 * 1024 * 1024;
const maxTotalSize = maxFiles * maxFileSize;
const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export default function AssignmentManager() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    setError("");
    const incomingFiles = Array.from(files);
    const invalidFile = incomingFiles.find(
      (file) => !acceptedTypes.has(file.type) || file.size > maxFileSize,
    );
    if (invalidFile) {
      setError("Files must be PDF, JPEG, PNG, or WebP, and each must be 50 MB or smaller.");
      return;
    }
    if (selectedFiles.length + incomingFiles.length > maxFiles) {
      setError(`Choose no more than ${maxFiles} files per assignment.`);
      return;
    }
    setSelectedFiles([...selectedFiles, ...incomingFiles]);
  }

  function removeFile(index: number) {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setProgress("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (selectedFiles.length === 0) {
      setError("Select at least one PDF or image to publish an assignment.");
      return;
    }
    if (selectedFiles.length > maxFiles) {
      setError(`Choose no more than ${maxFiles} files per assignment.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const createResponse = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          subject: formData.get("subject"),
          semester: Number(formData.get("semester")),
          description: formData.get("description"),
          dueDate: formData.get("dueDate")
            ? new Date(String(formData.get("dueDate"))).toISOString()
            : undefined,
        }),
      });
      const createResult = (await createResponse.json()) as {
        assignment?: Assignment;
        error?: string;
      };
      if (!createResponse.ok || !createResult.assignment) {
        throw new Error(createResult.error ?? "Could not create the assignment.");
      }

      const assignment = createResult.assignment;
      for (const [index, file] of selectedFiles.entries()) {
        setProgress(`Uploading file ${index + 1} of ${selectedFiles.length}: ${file.name}`);
        const uploadData = new FormData();
        uploadData.set("file", file);
        const uploadResponse = await fetch(
          `/api/teacher/assignments/${assignment.id}/files`,
          { method: "POST", body: uploadData },
        );
        const uploadResult = (await uploadResponse.json()) as { error?: string };
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error ?? `Could not upload ${file.name}.`);
        }
      }

      setProgress("Publishing assignment…");
      const publishResponse = await fetch(
        `/api/teacher/assignments/${assignment.id}/publish`,
        { method: "POST" },
      );
      const publishResult = (await publishResponse.json()) as { error?: string };
      if (!publishResponse.ok) {
        throw new Error(publishResult.error ?? "Could not publish the assignment.");
      }

      form.reset();
      setSelectedFiles([]);
      setError("");
      setProgress("Assignment published for students.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="teacher-assignment-publisher">
      <div className="teacher-assignment-heading">
        <div className="teacher-assignment-intro">
          <Link className="teacher-assignment-back" href="/">
            <ArrowRight size={15} aria-hidden="true" /> Back to ASCOL CSIT HUB
          </Link>
          <span className="teacher-assignment-title-icon"><FileText size={30} aria-hidden="true" /></span>
          <h1>Add and publish<br /><span>an assignment</span></h1>
          <p>Share assignments with your class. Students will get notified and can view the assignment in their portal.</p>
          <section className="publishing-checklist">
            <h2><ClipboardCheck size={18} aria-hidden="true" /> Publishing checklist</h2>
            <div><span><PencilLine size={17} /></span><p><strong>Add clear title and subject</strong><small>Helps students identify the assignment easily.</small></p></div>
            <div><span><FileText size={17} /></span><p><strong>Provide instructions (optional)</strong><small>Give detailed guidelines and requirements.</small></p></div>
            <div><span><CalendarDays size={17} /></span><p><strong>Set due date</strong><small>Choose a realistic submission deadline.</small></p></div>
            <div><span><Paperclip size={17} /></span><p><strong>Attach files</strong><small>Upload question files or reference materials.</small></p></div>
            <div><span><CheckCircle2 size={17} /></span><p><strong>Review and publish</strong><small>Check everything before publishing.</small></p></div>
          </section>
          <aside className="teacher-assignment-help">
            <span><Headphones size={20} aria-hidden="true" /></span>
            <div>
              <strong>Need help?</strong>
              <p>If you face any issues while publishing an assignment, contact the CSIT support team.</p>
              <span className="teacher-assignment-support-note">Reach out to your campus support team for help.</span>
            </div>
          </aside>
        </div>

        <section className="assignment-compose">
          <form
            className="assignment-form"
            onSubmit={createAssignment}
            onReset={() => {
              setSelectedFiles([]);
              setError("");
              setProgress("");
            }}
          >
            <label className="assignment-title-field">
              Assignment title <span className="required-mark">*</span>
              <span className="assignment-field-icon"><FileText size={17} aria-hidden="true" /><input name="title" placeholder="Enter assignment title" required minLength={3} maxLength={120} /></span>
            </label>
            <div className="assignment-form-row">
              <label>
                Subject <span className="required-mark">*</span>
                <span className="assignment-field-icon"><BookOpen size={17} aria-hidden="true" /><input name="subject" placeholder="Enter subject" required minLength={2} maxLength={100} /></span>
              </label>
              <label>
                Semester <span className="required-mark">*</span>
                <span className="assignment-field-icon"><GraduationCap size={18} aria-hidden="true" /><select name="semester" defaultValue="1">
                  {Array.from({ length: 8 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>Semester {index + 1}</option>
                  ))}
                </select></span>
              </label>
            </div>
            <label>
              Instructions <span className="label-optional">(optional)</span>
              <textarea name="description" rows={3} maxLength={2000} placeholder="Provide assignment details, instructions or guidelines…" />
            </label>
            <label>
              Due date <span className="label-optional">(optional)</span>
              <span className="assignment-field-icon"><CalendarDays size={17} aria-hidden="true" /><input name="dueDate" type="datetime-local" /></span>
            </label>
            <div className="assignment-file-field">
              <label>Assignment files <span className="required-mark">*</span></label>
              <input
                ref={fileInputRef}
                className="assignment-file-input-hidden"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  if (event.currentTarget.files) addFiles(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
              <div
                className={`assignment-dropzone${isDragging ? " assignment-dropzone-active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
                aria-label="Choose or drop assignment files"
              >
                <CloudUpload size={39} aria-hidden="true" />
                <p>Drag and drop files here or <strong>click to browse</strong></p>
                <small>PDF, JPEG, PNG, WebP · Up to 15 files · Max 50 MB each</small>
              </div>
              <div className="assignment-file-summary">
                <span><Paperclip size={15} aria-hidden="true" /> {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} attached</span>
                <span>{formatSize(selectedFiles.reduce((total, file) => total + file.size, 0))} / {formatSize(maxTotalSize)} used</span>
              </div>
              {selectedFiles.length > 0 && (
                <ul className="assignment-selected-files">
                  {selectedFiles.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${index}`}>
                      <FileText size={16} aria-hidden="true" />
                      <span><strong>{file.name}</strong><small>{formatSize(file.size)}</small></span>
                      <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><X size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {progress && <p className="upload-progress" role="status">{progress}</p>}
            <div className="assignment-form-actions">
              <button type="reset" className="assignment-cancel-button" disabled={isSubmitting}>Cancel</button>
              <button className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Uploading…" : "Publish assignment"}
                {isSubmitting ? <Check size={16} /> : <Send size={16} aria-hidden="true" />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
