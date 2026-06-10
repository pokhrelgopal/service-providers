import Link from "next/link";
import { Location, ShieldTick, Messages1, Star1 } from "iconsax-reactjs";

import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { FadeIn } from "@/components/shared/fade-in";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Location,
    title: "Discover nearby",
    body: "Find verified providers around you on a live map, sorted by distance.",
  },
  {
    icon: ShieldTick,
    title: "Verified providers",
    body: "Every provider is reviewed and approved by an admin before going live.",
  },
  {
    icon: Messages1,
    title: "Realtime chat",
    body: "Request a service and chat instantly once a provider accepts.",
  },
  {
    icon: Star1,
    title: "Ratings you trust",
    body: "Leave a rating and review after every completed engagement.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      {/* Hero */}
      <section className="bg-secondary/40">
        <Container className="py-24 sm:py-32">
          <FadeIn className="flex max-w-3xl flex-col items-start gap-6">
            <Eyebrow>Design baseline · Milestone 0</Eyebrow>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Find trusted service providers near you.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              A location-aware marketplace connecting seekers with verified
              local providers — discover them on a live map, request a service,
              and chat in realtime.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I&apos;m a provider</Link>
              </Button>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Feature cards */}
      <section>
        <Container className="py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Everything you need to get the job done"
            description="The shared design primitives below are ported from the logistics-pitch design system and reused across every milestone."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon size={20} variant="Bold" />
                    </span>
                    <CardTitle className="mt-3">{f.title}</CardTitle>
                    <CardDescription>{f.body}</CardDescription>
                  </CardHeader>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Primitive showcase — proves tokens + variants render correctly */}
      <section className="bg-muted/40">
        <Container className="py-20">
          <SectionHeading
            eyebrow="UI kit"
            title="Design primitives"
            description="The primary button is the glossy raised maroon CTA; cards use a soft neutral fill for separation — no borders or shadows."
          />
          <div className="mt-10 flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Approved</Badge>
              <Badge variant="success">Live</Badge>
              <Badge variant="warning">Pending review</Badge>
              <Badge variant="destructive">Rejected</Badge>
              <Badge variant="secondary">Seeker</Badge>
              <Badge variant="outline">Provider</Badge>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
