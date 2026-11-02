import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

type ResourceCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone: string;
  count: string;
  number: string;
  id: string;
};

export default function ResourceCard({
  title,
  description,
  icon: Icon,
  href,
  tone,
  count,
  number,
  id,
}: ResourceCardProps) {
  return (
    <a className="resource-card" href={href} id={id}>
      <div className="resource-card-top">
        <span className={`resource-icon tone-${tone}`}>
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="resource-number">{number}</span>
      </div>
      <div className="resource-card-copy">
        <span className="resource-count">{count}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className="resource-arrow" aria-hidden="true">
        <ArrowUpRight size={17} />
      </span>
    </a>
  );
}