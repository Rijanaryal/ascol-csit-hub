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
in on another device or browser requires its own login; an existing session
will send the user directly to their dashboard instead of showing the login
form again.

## Portals

- Shared role-select signup: `/signup`.
- Students: `/student/login` and `/student/dashboard`.
- Teachers: `/teacher/login` and `/teacher/dashboard`.
- Teacher assignments are visible to signed-in students in the matching semester after publishing.
- After student login, the homepage displays a highlighted assignments card and the student's published assignments. The teacher login opens the assignment-management dashboard directly.
- The teacher portal opens directly to a focused assignment creation, upload, and publishing page; published assignments appear in the matching students' portal.

## Current scope

This release includes the responsive homepage, MongoDB-backed registration and
login, role-specific student/teacher dashboards, teacher assignment publishing,
and student access to published assignment files. Email verification, password
reset, teacher approval, and malware scanning are not included yet.

To show the ASCOL campus photo as the page background, place the image at
`public/ascol-campus.png`. A light overlay keeps text readable over the photo.
