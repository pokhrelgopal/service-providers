"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import type L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { env } from "@/lib/env";
import {
  PROVIDER_ICON,
  SEEKER_ICON,
  SELF_ICON,
  REQUEST_ICON,
  REQUEST_DONE_ICON,
  RIPPLE_ICON,
} from "./icons";
import { Routing } from "./routing";

const TILE_URL =
  env.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export interface MapProvider {
  id: string;
  latitude: number;
  longitude: number;
  name: string | null;
  onSelect?: () => void;
}

export interface MapRequest {
  id: string;
  latitude: number;
  longitude: number;
  /** Provider has already offered to help → show a tick badge. */
  responded?: boolean;
  onSelect?: () => void;
}

export interface ServiceMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  /** Draggable pin (seeker published location). */
  pin?: [number, number];
  onPinChange?: (lat: number, lng: number) => void;
  /** Read-only single marker (provider's own exact location). */
  selfMarker?: [number, number];
  /** Expanding ripple at this point (seeker broadcasting). */
  ripple?: [number, number];
  /** Provider markers for discovery. */
  providers?: MapProvider[];
  /** Broadcast request markers (raised hands) for the provider's map. */
  requests?: MapRequest[];
  /** Destination marker (e.g. the seeker the provider is heading to). */
  destinationMarker?: [number, number];
  /** Draw a road route between two points (provider → seeker). */
  route?: { from: [number, number]; to: [number, number] };
  /** Show the built-in zoom buttons (default true). */
  zoomControl?: boolean;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function ServiceMap({
  center,
  zoom = 14,
  className,
  pin,
  onPinChange,
  selfMarker,
  ripple,
  providers,
  requests,
  destinationMarker,
  route,
  zoomControl = true,
}: ServiceMapProps) {
  const providerMarkers = useMemo(
    () => providers?.filter((p) => p.latitude != null && p.longitude != null),
    [providers],
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      zoomControl={zoomControl}
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <Recenter center={center} />
      <TileLayer
        url={TILE_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {ripple && (
        <Marker
          position={ripple}
          icon={RIPPLE_ICON}
          interactive={false}
          keyboard={false}
        />
      )}

      {route && <Routing from={route.from} to={route.to} />}

      {destinationMarker && (
        <Marker position={destinationMarker} icon={SEEKER_ICON}>
          <Popup>Seeker&apos;s location</Popup>
        </Marker>
      )}

      {selfMarker && <Marker position={selfMarker} icon={SELF_ICON} />}

      {pin && (
        <Marker
          position={pin}
          icon={SEEKER_ICON}
          draggable={!!onPinChange}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onPinChange?.(lat, lng);
            },
          }}
        >
          <Popup closeButton={false}>Your location — drag to adjust</Popup>
        </Marker>
      )}

      {providerMarkers?.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={PROVIDER_ICON}
          eventHandlers={{ click: () => p.onSelect?.() }}
        />
      ))}

      {requests?.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={r.responded ? REQUEST_DONE_ICON : REQUEST_ICON}
          eventHandlers={{ click: () => r.onSelect?.() }}
        />
      ))}
    </MapContainer>
  );
}
