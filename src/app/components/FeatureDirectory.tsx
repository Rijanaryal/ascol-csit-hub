import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumn,
  CircleHelp,
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
import { campusFeatureDetails, campusFeatureTypes } from "@/lib/campus-features";

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

export default function FeatureDirectory({
  compact = false,
}: {
  compact?: boolean;
}) {
  const featuredTypes = compact
    ? campusFeatureTypes.filter((type) =>
        ["semester-companion", "notes-exchange", "question-bank", "csit-community", "opportunities", "tech-events"].includes(type),
      )
    : campusFeatureTypes;

  return (
    <div className={`campus-feature-grid${compact ? " campus-feature-grid-compact" : ""}`}>
      {featuredTypes.map((type) => {
        const Icon = icons[type];
        const feature = campusFeatureDetails[type];
        return (
          <Link className="campus-feature-card" href={`/hub?feature=${type}`} key={type}>
            <span className="campus-feature-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="campus-feature-card-title">{feature.title}</span>
            <span className="campus-feature-card-description">{feature.description}</span>
          </Link>
        );
      })}
    </div>
  );
}
