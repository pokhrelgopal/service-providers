"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import { env } from "@/lib/env";

/** Draws a road route between two points (Leaflet Routing Machine / OSRM).
 * Markers are suppressed — ServiceMap renders its own. */
export function Routing({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);

  // Create the control once; tear it down defensively (LRM's onRemove can race
  // a map that's already unmounting → null layer access).
  useEffect(() => {
    const control = L.Routing.control({
      waypoints: [],
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: "#760e28", weight: 5, opacity: 0.85 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: () => null as unknown as L.Marker,
      ...(env.NEXT_PUBLIC_OSRM_URL
        ? { router: L.Routing.osrmv1({ serviceUrl: env.NEXT_PUBLIC_OSRM_URL }) }
        : {}),
    } as L.Routing.RoutingControlOptions).addTo(map);
    controlRef.current = control;

    return () => {
      controlRef.current = null;
      try {
        map.removeControl(control);
      } catch {
        // LRM teardown race — safe to ignore.
      }
    };
  }, [map]);

  // Update the route when the endpoints actually change (not on every render).
  useEffect(() => {
    controlRef.current?.setWaypoints([
      L.latLng(from[0], from[1]),
      L.latLng(to[0], to[1]),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from[0], from[1], to[0], to[1]]);

  return null;
}
