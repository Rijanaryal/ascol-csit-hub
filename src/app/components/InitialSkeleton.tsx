export default function InitialSkeleton() {
  return (
    <div className="initial-skeleton" role="status" aria-label="Loading ASCOL CSIT HUB">
      <div className="skeleton-header">
        <span className="skeleton-logo" />
        <span className="skeleton-brand">
          <span />
          <span />
        </span>
        <span className="skeleton-links" />
        <span className="skeleton-action" />
      </div>
      <div className="skeleton-content">
        <span className="skeleton-kicker" />
        <span className="skeleton-title" />
        <span className="skeleton-title skeleton-title-short" />
        <span className="skeleton-copy" />
        <span className="skeleton-search" />
        <div className="skeleton-cards">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
