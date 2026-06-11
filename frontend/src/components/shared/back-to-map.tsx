import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** "← Back to map" link shown on inner pages (seeker → /seeker, provider →
 * /dashboard). */
export function BackToMap({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
    >
      <ArrowLeft size={16} />
      Back to map
    </Link>
  );
}
