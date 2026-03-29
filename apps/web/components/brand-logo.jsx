import Image from "next/image";
import Link from "next/link";

function getClassName(parts) {
  return parts.filter(Boolean).join(" ");
}

export function BrandLogo({
  href = "/",
  variant = "full",
  size = "md",
  theme = "default",
  label = "The PATNA Initiative",
  showCopy = true,
}) {
  const className = getClassName([
    "brand-logo",
    `brand-logo-${variant}`,
    `brand-logo-${size}`,
    `brand-logo-${theme}`,
  ]);

  const content =
    variant === "mark" ? (
      <>
        <span className="brand-logo-mark">
          <Image
            alt=""
            aria-hidden="true"
            height={1200}
            priority
            src="/brand/patna-icon.png"
            width={1414}
          />
        </span>
        {showCopy ? (
          <span className="brand-logo-copy">
            <strong>{label}</strong>
          </span>
        ) : null}
      </>
    ) : (
      <Image
        alt={label}
        className="brand-logo-full-image"
        height={675}
        priority
        src="/brand/patna-wordmark.png"
        width={1200}
      />
    );

  return (
    <Link aria-label={label} className={className} href={href}>
      {content}
    </Link>
  );
}
