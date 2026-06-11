import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SeekerPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Link
        href="/seeker"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 hover:bg-neutral-50"
      >
        <ArrowLeft size={16} />
        Back to map
      </Link>
    </div>
  );
}
