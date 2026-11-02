# ASCOL CSIT HUB

A student-led academic platform for BSc CSIT students at Amrit Science Campus,
Kathmandu.

## Getting started

Use Node.js 20.9 or newer.

```powershell
if (-not (Test-Path .env.local)) {
  Copy-Item .env.example .env.local
}
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before deployment, run
`npm run typecheck` and `npm run build`.

## Project decisions

- **Operating model:** Independent student project.
- **Registration:** Open to anyone.
- **Student accounts:** Register with email, password, and semester.
- **Teacher accounts:** Anyone may choose teacher registration; teacher accounts can publish assignments. Restrict teacher signup before public deployment if this is not intended.
- **Assignment files:** Up to 15 PDF/JPEG/PNG/WebP files per assignment, 50 MB each, stored in MongoDB GridFS.

## MongoDB and authentication setup

1. If `.env.local` does not already exist, copy `.env.example` to create it.
   The example URI connects to a local MongoDB server at `127.0.0.1:27017`;
   start the MongoDB service before running the app. For MongoDB Atlas or
   another server, replace `MONGODB_URI` with its connection string.
2. Optionally choose `MONGODB_DATABASE`.
3. Replace `AUTH_SECRET` with a private random value of at least 32 characters.
   Keep both values private; never commit `.env.local`.
4. Start the app with `npm run dev`. Register at `/signup`, choose Student or
   Teacher, then sign in from the matching portal.

The app creates the `users` and `assignments` collections as they are used.
Assignment PDFs and images are stored in the `assignment_files` GridFS bucket.
Passwords are hashed, and sessions use an HTTP-only, signed cookie.
Each browser stays signed in for seven days unless the user signs out. Signing
in on another device or browser requires its own login. The login portals stay
available while signed in, so you can switch accounts by signing in with
another account in the same browser.

## Portals

- Shared role-select signup: `/signup`.
- Students: `/student/login` and `/student/dashboard`.
- Teachers: `/teacher/login` and `/teacher/dashboard`.
- Teacher assignments are visible to signed-in students in the matching semester after publishing.
- After student login, the homepage displays a highlighted assignments card and the student's published assignments. The teacher login opens the assignment-management dashboard directly.
- The teacher portal opens directly to a focused assignment creation, upload, and publishing page; published assignments appear in the matching students' portal.
- Teacher assignment publishing uses a guided dashboard with a publishing checklist, assignment details, drag-and-drop file uploads, and a selected-file review. Student and teacher login pages stay role-specific; registration returns to the matching login page.

## Current scope

The `/hub` feature hub includes MongoDB-backed notes exchange and lab resources
(PDF/JPEG/PNG/WebP uploads up to 20 MB), bookmarks and ratings, multiple-choice
question practice, community posts, anonymous-to-the-feed doubts, opportunities,
campus events, lost-and-found notices, polls, resource verification actions,
and teacher-assignment links in the Semester Companion. The companion also
supports a personal weekly study goal and dated study/exam plan. Notes of the
Week surfaces recent notes with the most helpful community feedback. Learning
streaks and personal study plans are stored locally in the current browser and
are not synced between devices.

Teacher accounts can mark resources as teacher verified, but teacher signup is
currently open; this badge does not prove institutional approval. Anonymous
doubts hide the submitter's name from the public feed, while the entry retains
its author account internally. Email verification, password reset, teacher
approval, moderation tooling, and malware scanning are not included yet.

To show the ASCOL campus photo as the page background, place the image at
`public/ascol-campus.png`. A light overlay keeps text readable over the photo.
