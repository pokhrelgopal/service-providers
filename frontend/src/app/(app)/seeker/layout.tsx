import { SeekerMenu } from "@/components/seeker/seeker-menu";

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {children}
      {/* Persistent floating navigation — present on every seeker page. */}
      <SeekerMenu />
    </div>
  );
}
