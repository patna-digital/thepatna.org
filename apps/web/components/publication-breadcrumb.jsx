import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PublicationBreadcrumb({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="publication-breadcrumb">
      {crumbs.map((crumb, i) => (
        <span className="publication-breadcrumb-item" key={i}>
          {i > 0 && (
            <ChevronRight aria-hidden="true" className="publication-breadcrumb-sep" size={12} />
          )}
          {crumb.href ? (
            <Link href={crumb.href}>{crumb.label}</Link>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
