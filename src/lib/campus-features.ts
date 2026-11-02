export const campusFeatureTypes = [
  "semester-companion",
  "notes-exchange",
  "question-bank",
  "csit-community",
  "learning-streaks",
  "opportunities",
  "smart-search",
  "doubt-box",
  "senior-connect",
  "notes-of-week",
  "verified-resources",
  "lab-repository",
  "tech-events",
  "lost-found",
  "campus-polls",
] as const;

export type CampusFeatureType = (typeof campusFeatureTypes)[number];

export type CampusEntry = {
  id: string;
  type: CampusFeatureType;
  title: string;
  body: string;
  subject?: string;
  semester?: number;
  tags: string[];
  dueAt?: string;
  options: string[];
  authorName: string;
  authorRole: "student" | "teacher";
  anonymous: boolean;
  verified: boolean;
  createdAt: string;
  bookmarked: boolean;
  rating?: number;
  votes?: number[];
  userVote?: number;
  helpfulCount: number;
  interestedCount: number;
  userInterested: boolean;
  completed: boolean;
  file?: {
    id: string;
    name: string;
    contentType: string;
    size: number;
  };
};

export const campusFeatureDetails: Record<
  CampusFeatureType,
  { title: string; description: string; icon: string }
> = {
  "semester-companion": {
    title: "Semester Companion",
    description: "See your classwork, study goals and important dates together.",
    icon: "CalendarDays",
  },
  "notes-exchange": {
    title: "Student Notes Exchange",
    description: "Share, find, bookmark and rate notes by subject and semester.",
    icon: "NotebookPen",
  },
  "question-bank": {
    title: "Question Bank 2.0",
    description: "Practice topic questions and student-made multiple-choice quizzes.",
    icon: "FileQuestion",
  },
  "csit-community": {
    title: "CSIT Community",
    description: "Discuss class topics, programming questions and student projects.",
    icon: "MessagesSquare",
  },
  "learning-streaks": {
    title: "Learning Streaks",
    description: "Keep a private record of study days and personal milestones.",
    icon: "Flame",
  },
  opportunities: {
    title: "Internship & Project Board",
    description: "Share student projects, internships, hackathons and opportunities.",
    icon: "BriefcaseBusiness",
  },
  "smart-search": {
    title: "Smart Resource Search",
    description: "Search the shared notes, questions and study resources in one place.",
    icon: "Search",
  },
  "doubt-box": {
    title: "Anonymous Doubt Box",
    description: "Ask academic questions without showing your name to other students.",
    icon: "CircleHelp",
  },
  "senior-connect": {
    title: "Senior Connect",
    description: "Ask for guidance and volunteer to help fellow CSIT students.",
    icon: "UsersRound",
  },
  "notes-of-week": {
    title: "Notes of the Week",
    description: "Find useful student-contributed notes selected by the community.",
    icon: "Star",
  },
  "verified-resources": {
    title: "Resource Verification",
    description: "Find teacher-reviewed notes and study resources.",
    icon: "BadgeCheck",
  },
  "lab-repository": {
    title: "Lab Repository",
    description: "Organize practical files and lab reports by subject and semester.",
    icon: "FlaskConical",
  },
  "tech-events": {
    title: "Tech Events",
    description: "Discover workshops, hackathons, talks and campus competitions.",
    icon: "Ticket",
  },
  "lost-found": {
    title: "Lost & Found",
    description: "Post campus lost-item notices without publishing personal contact details.",
    icon: "PackageSearch",
  },
  "campus-polls": {
    title: "Campus Polls",
    description: "Create quick student polls and see results after voting.",
    icon: "ChartNoAxesColumn",
  },
};
