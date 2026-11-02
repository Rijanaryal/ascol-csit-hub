"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import CampusEmblem from "./CampusEmblem";

const navigation = [
  ["Student Hub", "/hub"],
  ["Notes", "#notes"],
  ["Syllabus", "#syllabus"],
  ["Question bank", "#questions"],
  ["Notices", "#notices"],
  ["Community", "#contribute"],
];

export default function Navbar({
  loggedInRole,
}: {
  loggedInRole?: "student" | "teacher";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isStudentLoggedIn = loggedInRole === "student";

  return (
    <header className="site-header">
      <nav className="nav-container" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="ASCOL CSIT HUB home">
          <span className="brand-mark">
            <CampusEmblem />
          </span>
          <span className="brand-name">
            <strong>Amrit Campus - CSIT</strong>
            <span>ASCOL CSIT HUB · TRIBHUVAN UNIVERSITY</span>
            <span className="brand-location">THAMEL, KATHMANDU</span>
          </span>
        </a>
        <div className={`nav-links${menuOpen ? " nav-links-open" : ""}`}>
          {navigation.map(([label, href]) => (
            <a href={href} key={label} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          {isStudentLoggedIn ? (
            <a className="mobile-login" href="/teacher/login" onClick={() => setMenuOpen(false)}>
              Teacher log in
            </a>
          ) : (
            <>
              <a className="mobile-login" href="/student/login" onClick={() => setMenuOpen(false)}>
                Student log in
              </a>
              <a className="mobile-login" href="/teacher/login" onClick={() => setMenuOpen(false)}>
                Teacher log in
              </a>
              <a className="mobile-login" href="/signup" onClick={() => setMenuOpen(false)}>
                Sign up as student or teacher
              </a>
            </>
          )}
        </div>
        <div className="nav-auth-actions">
          {isStudentLoggedIn ? (
            <a className="nav-cta" href="/teacher/login">
              Teacher log in
            </a>
          ) : (
            <>
              <div className="nav-login-menu">
                <span
                  className="nav-cta"
                  tabIndex={0}
                  aria-haspopup="true"
                  aria-label="Choose a login portal"
                >
                  Log in
                </span>
                <div className="nav-login-options">
                  <a href="/student/login">
                    <span>Student</span>
                    <span>Log in to your study space</span>
                  </a>
                  <a href="/teacher/login">
                    <span>Teacher</span>
                    <span>Manage class assignments</span>
                  </a>
                </div>
              </div>
              <a className="nav-signup" href="/signup">
                Sign up
              </a>
            </>
          )}
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
    </header>
  );
}