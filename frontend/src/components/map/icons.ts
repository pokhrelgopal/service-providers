import L from "leaflet";

/** Maroon (or given color) map-pin div icon. */
function pinIcon(color: string, size = 32) {
  const h = size;
  const w = size * 0.75;
  return L.divIcon({
    className: "service-map-pin",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 18 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 0C4.03 0 0 4.03 0 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9z" fill="${color}"/>
      <circle cx="9" cy="9" r="3.2" fill="white"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 6],
  });
}

// lucide-react `Hand` icon, inlined as SVG (the marker is a Leaflet divIcon).
const HAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;

// Small white "already offered" tick badge (top-right of the hand marker).
const DONE_BADGE = `<span style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.3);"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;

/** Pulsing green "raised hand" marker for an incoming broadcast request.
 * When the provider has already offered, it carries a tick badge. */
function requestIcon(done: boolean) {
  return L.divIcon({
    className: "service-map-request",
    html: `<div style="position:relative;width:36px;height:36px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:#16a34a;animation:servio-ping 1.3s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#16a34a;box-shadow:0 1px 5px rgba(0,0,0,0.35);">${HAND_SVG}</span>
      ${done ? DONE_BADGE : ""}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

/** Expanding ripple shown under a seeker's pin while they're broadcasting. */
function rippleIcon() {
  return L.divIcon({
    className: "service-map-ripple",
    html: `<div style="position:relative;width:90px;height:90px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;opacity:0;animation:servio-ripple 2s ease-out infinite both;"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;opacity:0;animation:servio-ripple 2s ease-out infinite both;animation-delay:1s;"></span>
    </div>`,
    iconSize: [90, 90],
    iconAnchor: [45, 45],
  });
}

/** Service providers on the seeker's map: the helper avatar in a white,
 * rounded-xl tile so it reads clearly against the map. */
export const PROVIDER_ICON = L.divIcon({
  className: "service-map-helper",
  html: `<div style="position:relative;width:36px;height:36px;">
    <span style="position:absolute;inset:0;border-radius:9999px;background:#16a210;animation:servio-ping 1.3s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#16a34a80;box-shadow:0 2px 6px rgba(0,0,0,0.3);box-sizing:border-box;padding:7px;">
      <img src="/helper.png" style="width:100%;height:100%;display:block;" alt="" />
    </span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});
export const SEEKER_ICON = pinIcon("#2563eb", 28);
export const SELF_ICON = pinIcon("#760e28", 36);
export const REQUEST_ICON = requestIcon(false);
export const REQUEST_DONE_ICON = requestIcon(true);
export const RIPPLE_ICON = rippleIcon();
