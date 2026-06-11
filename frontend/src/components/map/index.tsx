"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

// Leaflet touches `window` on import, so the map is loaded client-side only.
export const ServiceMap = dynamic(
  () => import("./service-map").then((m) => m.ServiceMap),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full" />,
  },
);

export type { MapProvider, ServiceMapProps } from "./service-map";
