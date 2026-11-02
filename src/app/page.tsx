import {
  ArrowDown,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  FlaskConical,
  GraduationCap,
  LibraryBig,
  Sparkles,
} from "lucide-react";
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import ResourceCard from "./components/ResourceCard";
import ResourceSearch from "./components/ResourceSearch";
import StudentAssignments from "./components/StudentAssignments";
import FeatureDirectory from "./components/FeatureDirectory";
import { getSessionUser } from "@/lib/auth";

const resourceTypes = [
  {
    title: "Notes & lectures",
    description: "Clear notes and lecture materials, organized by subject.",
    icon: BookOpen,
    href: "#notes",
    id: "notes",
    tone: "mint",
    count: "Study materials",
  },
  {
    title: "Question bank",
    description: "Past papers and model questions to help you prepare.",
    icon: FileQuestion,
    href: "#questions",
    id: "questions",
    tone: "lavender",
    count: "Practice smarter",
  },
  {
    title: "Syllabus",
    description: "Explore the complete BSc CSIT curriculum semester by semester.",
    icon: GraduationCap,
    href: "#syllabus",
    id: "syllabus",
    tone: "peach",
    count: "All 8 semesters",
  },
  {
    title: "Routine",
    description: "Keep class schedules and exam routines close at hand.",
    icon: CalendarDays,
    href: "#routine",
    id: "routine",
    tone: "blue",
    count: "Stay on schedule",
  },
];

const semesters = [
  "First semester",
  "Second semester",
  "Third semester",
  "Fourth semester",
  "Fifth semester",
  "Sixth semester",
  "Seventh semester",
  "Eighth semester",
];

const latestResources = [
  {
    type: "LECTURE NOTES",
    title: "Introduction to Information Technology",
    detail: "First semester · Computer Science",
    date: "Updated recently",
    icon: BookOpen,
    tone: "mint",
    href: "#notes",
  },
  {
    type: "PAST QUESTION",
    title: "Data Structures and Algorithms",
    detail: "Third semester · 2081",
    date: "Exam preparation",
    icon: FileQuestion,
    tone: "lavender",
    href: "#questions",
  },
  {
    type: "PRACTICAL FILE",
    title: "Database Management System",
    detail: "Fifth semester · Lab work",
    date: "Practical resource",
    icon: FlaskConical,
    tone: "peach",
    href: "#notes",
  },
];

const announcements = [
  {
    tag: "CAMPUS UPDATE",
    title: "Welcome to your new academic hub",
    date: "A place to learn and share",
    icon: Bell,
  },
  {
    tag: "GET INVOLVED",
    title: "Have a resource that helped you?",
    date: "Share it with your fellow students",
    icon: Sparkles,
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <>
      <Navbar loggedInRole={user?.role} />
      <main>
        <section className="hero-section" id="home">
          <div className="hero-container">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                MADE FOR ASCOL CSIT STUDENTS
              </div>
              <h1>
                Everything you need
                <br />
                for your <span>CSIT</span> journey.
              </h1>
              <p className="hero-description">
                Access notes, past questions, syllabus and a community that
                helps you learn, share and grow together.
              </p>
              <ResourceSearch />
              <div className="hero-links">
                <a className="button button-primary" href="#resources">
                  Explore resources <ArrowRight size={17} aria-hidden="true" />
                </a>
                <a className="text-link" href="#semesters">
                  Browse by semester <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
              <div className="student-proof">
                <div className="avatar-stack" aria-hidden="true">
                  <span>A</span>
                  <span>S</span>
                  <span>C</span>
                </div>
                <p>
                  <strong>Built by students,</strong> for the ASCOL CSIT
                  community
                </p>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-sun" />
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-note note-back">
                <div className="note-topline" />
                <span className="note-heading" />
                <span className="note-line" />
                <span className="note-line short" />
                <span className="note-highlight" />
                <span className="note-line" />
                <span className="note-line medium" />
              </div>
              <div className="art-note note-front">
                <div className="note-label">
                  <span className="note-icon">
                    <BookOpen size={15} aria-hidden="true" />
                  </span>
                  <span>YOUR STUDY SPACE</span>
                </div>
                <h2>Make room<br />for what&apos;s next.</h2>
                <p>Little by little, you&apos;re getting there.</p>
                <div className="note-progress">
                  <span />
                </div>
                <div className="note-foot">
                  <span>KEEP LEARNING</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </div>
              </div>
              <div className="floating-chip chip-one">
                <BookOpen size={17} aria-hidden="true" />
                <span>Study resources</span>
              </div>
              <div className="floating-chip chip-two">
                <CalendarDays size={17} aria-hidden="true" />
                <span>Semester 1–8</span>
              </div>
              <div className="art-sparkle sparkle-one">✳</div>
              <div className="art-sparkle sparkle-two">✳</div>
            </div>
          </div>
          <div className="hero-bottom">
            <span>AMRIT SCIENCE CAMPUS · KATHMANDU</span>
            <a href="#resources" aria-label="Scroll to resources">
              <ArrowDown size={16} aria-hidden="true" />
            </a>
            <span>LEARN · SHARE · GROW</span>
          </div>
        </section>

        {user?.role === "student" && (
          <section className="section student-assignments-home" id="assignments">
            <a className="assignment-glow-card" href="#my-assignments">
              <span className="assignment-glow-icon">
                <ClipboardList size={23} aria-hidden="true" />
              </span>
              <span className="assignment-glow-copy">
                <span className="section-kicker">STUDENT SPACE</span>
                <strong>Class assignments</strong>
                <span>Work from your teachers, organized in one place.</span>
              </span>
              <ArrowRight className="assignment-glow-arrow" size={21} aria-hidden="true" />
            </a>
            <div className="student-home-assignment-list" id="my-assignments">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">FROM YOUR TEACHERS</p>
                  <h2>Your assignments</h2>
                  <p className="section-description">
                    Published classwork and due dates for your semester.
                  </p>
                </div>
              </div>
              <StudentAssignments />
            </div>
          </section>
        )}

        <section className="section resources-section" id="resources">
          <div className="section-heading">
            <div>
              <p className="section-kicker">A GOOD PLACE TO START</p>
              <h2>What are you looking for?</h2>
              <p className="section-description">
                Find what you need for class, revision or your next big idea.
              </p>
            </div>
            <a className="subtle-link" href="#semesters">
              Everything, by semester <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="resource-grid">
            {resourceTypes.map((resource, index) => (
              <ResourceCard key={resource.title} {...resource} number={`0${index + 1}`} />
            ))}
          </div>
        </section>

        <section className="section home-feature-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">BUILT FOR STUDENT LIFE</p>
              <h2>More than a resource library.</h2>
              <p className="section-description">
                Plan your semester, practise questions, share notes and find your people.
              </p>
            </div>
            <a className="subtle-link" href="/hub">
              Explore all 15 features <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <FeatureDirectory compact />
        </section>

        <section className="semester-section" id="semesters">
          <div className="semester-inner">
            <div className="semester-copy">
              <p className="section-kicker semester-kicker">
                <span>YOUR</span>
                <span>FOUR-YEAR</span>
                <span>ROADMAP</span>
              </p>
              <h2>Pick up right<br />where you are.</h2>
              <p>
                Eight semesters, one growing library. Choose yours to find
                subjects and study materials that fit.
              </p>
              <a className="button button-light" href="#notes">
                Browse all semesters <ArrowRight size={16} aria-hidden="true" />
              </a>
              <span className="semester-aside">BSc CSIT · TU CURRICULUM</span>
            </div>
            <div className="semester-list">
              {semesters.map((semester, index) => (
                <a
                  className="semester-item"
                  href={index < 4 ? "#notes" : "#resources"}
                  key={semester}
                >
                  <span className="semester-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{semester}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section latest-section" id="notes">
          <div className="section-heading">
            <div>
              <p className="section-kicker">FRESH FROM THE LIBRARY</p>
              <h2>Recently added</h2>
              <p className="section-description">
                A few helpful things your community has been collecting.
              </p>
            </div>
            <a className="subtle-link" href="#questions">
              Explore the library <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="latest-grid">
            {latestResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <a className="latest-card" href={resource.href} key={resource.title}>
                  <div className={`latest-icon tone-${resource.tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="latest-type">{resource.type}</span>
                  <h3>{resource.title}</h3>
                  <p>{resource.detail}</p>
                  <div className="latest-meta">
                    <span>{resource.date}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="updates-section" id="notices">
          <div className="updates-inner">
            <div className="updates-intro">
              <p className="section-kicker">THE LATEST</p>
              <h2>A little in the loop<br />goes a long way.</h2>
              <p>
                Campus news, useful updates and ways to get involved with your
                student community.
              </p>
              <a className="subtle-link" href="#events">
                See what&apos;s happening <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="announcement-list">
              {announcements.map((announcement) => {
                const Icon = announcement.icon;
                return (
                  <a
                    className="announcement-card"
                    href="#events"
                    key={announcement.title}
                  >
                    <span className="announcement-icon">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="announcement-copy">
                      <span className="announcement-tag">{announcement.tag}</span>
                      <strong>{announcement.title}</strong>
                      <span>{announcement.date}</span>
                    </span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section community-section" id="events">
          <div className="community-card">
            <div className="community-icon">
              <LibraryBig size={23} aria-hidden="true" />
            </div>
            <div className="community-copy">
              <p className="section-kicker">BETTER, TOGETHER</p>
              <h2>Good notes are even better when shared.</h2>
              <p>
                This is a student-led space. Find something useful, share what
                you&apos;ve learned, and help the next person along.
              </p>
            </div>
            <a className="button button-primary" href="#contribute">
              Be part of it <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}