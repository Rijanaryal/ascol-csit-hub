"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Mail,
  UsersRound,
} from "lucide-react";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  role?: "student" | "teacher";
  mode: "login" | "signup";
  registered?: boolean;
  selectableRole?: boolean;
};

export default function AuthForm({
  role: initialRole = "student",
  mode,
  registered = false,
  selectableRole = false,
}: AuthFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);
  const isSignup = mode === "signup";
  const home = role === "teacher" ? "/teacher/dashboard" : "/";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role,
      ...(role === "student"
        ? { semester: Number(formData.get("semester")) }
        : {}),
    };

    try {
      const response = await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not complete the request. Please try again.");
        return;
      }
      if (isSignup) {
        router.replace(`/${role}/login?registered=1`);
      } else {
        setIsLoginSuccessful(true);
        window.setTimeout(() => window.location.replace(home), 850);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const campusHighlights =
    role === "student"
      ? [
          {
            icon: BookOpen,
            title: "Your study space",
            description: "Access notes, questions, syllabus and more — all in one place.",
          },
          {
            icon: UsersRound,
            title: "Learn together",
            description: "Join a community of CSIT students and grow together.",
          },
          {
            icon: ClipboardCheck,
            title: "Stay organized",
            description: "Keep track of assignments and your semester.",
          },
        ]
      : [
          {
            icon: ClipboardCheck,
            title: "Your teaching space",
            description: "Create and manage class assignments in one place.",
          },
          {
            icon: BookOpen,
            title: "Share class resources",
            description: "Publish materials for students in the right semester.",
          },
          {
            icon: UsersRound,
            title: "Support learning",
            description: "Help students stay organized and keep up with classwork.",
          },
        ];

  return (
    <div className={isSignup ? undefined : "auth-login-layout"}>
      {!isSignup && isLoginSuccessful && (
        <div className="auth-login-success-toast" role="status" aria-live="polite">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>Signed in successfully. Taking you to your space…</span>
        </div>
      )}
      <section className={`auth-card${isSignup ? "" : " auth-card-login"}`}>
        <span className={`auth-role-mark auth-role-${role}`}>
          {role === "student" ? "STUDENT PORTAL" : "TEACHER PORTAL"}
        </span>
        <h1>{isSignup ? "Create your account" : "Welcome back!"}</h1>
        <p className="auth-intro">
          {isSignup
            ? `Join ASCOL CSIT HUB as a ${role}.`
            : role === "student"
              ? "Sign in to your student space and continue your learning journey."
              : "Sign in to manage your classes and assignments."}
        </p>
        {!isSignup && <span className="auth-accent-rule" aria-hidden="true" />}
        {registered && !isSignup && (
          <p className="auth-success" role="status">
            Account created. Sign in with your email and password.
          </p>
        )}
        {isSignup && role === "teacher" && (
          <p className="teacher-access-note">
            Teacher accounts can publish assignments that are visible to signed-in students.
          </p>
        )}

        <form className="auth-form" method="post" onSubmit={submit}>
          {selectableRole && (
            <fieldset className="role-picker">
              <legend>{isSignup ? "I am registering as a" : "Sign in as a"}</legend>
              <div className="role-picker-options">
                <button
                  type="button"
                  className={`role-option${role === "student" ? " role-option-active role-option-student" : ""}`}
                  aria-pressed={role === "student"}
                  onClick={() => setRole("student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`role-option${role === "teacher" ? " role-option-active role-option-teacher" : ""}`}
                  aria-pressed={role === "teacher"}
                  onClick={() => setRole("teacher")}
                >
                  Teacher
                </button>
              </div>
            </fieldset>
          )}
          {isSignup && (
            <label>
              Full name
              <input autoComplete="name" name="name" required minLength={2} maxLength={80} />
            </label>
          )}
          <label>
            Email address
            {isSignup ? (
              <input
                autoComplete="email"
                name="email"
                type="email"
                required
                maxLength={254}
              />
            ) : (
              <span className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Mail size={17} aria-hidden="true" />
                </span>
                <input
                  autoComplete="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  maxLength={254}
                />
              </span>
            )}
          </label>
          {isSignup && role === "student" && (
            <label>
              Current semester
              <select name="semester" defaultValue="" required>
                <option value="" disabled>
                  Select your semester
                </option>
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Semester {index + 1}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Password
            {isSignup ? (
              <input
                autoComplete="new-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
              />
            ) : (
              <span className="auth-input-wrap">
                <span className="auth-input-icon">
                  <LockKeyhole size={17} aria-hidden="true" />
                </span>
                <input
                  autoComplete="current-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  minLength={1}
                  maxLength={72}
                />
              </span>
            )}
            {isSignup && <span className="auth-hint">Use at least 8 characters.</span>}
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button-primary auth-submit"
            disabled={isSubmitting || isLoginSuccessful}
          >
            {isSubmitting
              ? "Please wait…"
              : isLoginSuccessful
                ? "Signed in successfully"
                : isSignup
                  ? `Create ${role} account`
                  : `Sign in as ${role}`}
            {!isSignup &&
              (isLoginSuccessful ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <ArrowRight size={17} aria-hidden="true" />
              ))}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to ASCOL CSIT HUB?"}{" "}
          <Link href={`/${role}/${isSignup ? "login" : "signup"}`}>
            {isSignup ? "Sign in" : "Create account"}
          </Link>
        </p>
      </section>
      {!isSignup && (
        <aside className="auth-campus-aside" aria-label={`${role} portal information`}>
          <p className="auth-campus-label">ASCOL CSIT HUB</p>
          <h2>{role === "student" ? "A good place to keep learning." : "A simpler way to manage classwork."}</h2>
          <div className="auth-campus-highlights">
            {campusHighlights.map(({ icon: Icon, title, description }) => (
              <div className="auth-campus-highlight" key={title}>
                <span className="auth-campus-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="auth-campus-location">AMRIT SCIENCE CAMPUS · KATHMANDU</p>
        </aside>
      )}
    </div>
  );
}
