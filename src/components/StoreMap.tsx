"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's broken default icon paths in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom SVG pin icons ──────────────────────────────────────
function makePinIcon(color: string, size: number) {
  const h = Math.round(size * 1.43);
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 5.25 2.9 9.83 7.18 12.27L14 40l6.82-13.73C25.1 23.83 28 19.25 28 14 28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5.5" fill="white"/>
    </svg>`,
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -(h + 4)],
  });
}

const DEFAULT_ICON = makePinIcon("#C8820A", 22);
const ACTIVE_ICON  = makePinIcon("#ef4444", 32);

export interface MapStore {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

// Vietnam bounding box — immutable initial position for MapContainer
const VIETNAM_BOUNDS: [[number, number], [number, number]] = [
  [8.18,  102.14],
  [23.39, 109.46],
];

// ── Single controller handles ALL map movement ────────────────
function MapController({
  stores,
  activeId,
}: {
  stores: MapStore[];
  activeId: string | null;
}) {
  const map = useMap();
  const ready = useRef(false);

  useEffect(() => {
    if (activeId !== null) {
      // Fly to the selected store
      const store = stores.find((s) => s.id === activeId);
      if (!store) return;
      map.flyTo([store.lat, store.lng], 16, { duration: 0.75 });
      return;
    }

    // No store selected — fit all visible stores
    if (stores.length === 0) return;
    const bounds = L.latLngBounds(
      stores.map((s) => [s.lat, s.lng] as [number, number])
    );

    if (!ready.current) {
      // First paint: skip animation so map doesn't jitter on load
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          map.fitBounds(bounds, { padding: [52, 52], maxZoom: 13, animate: false });
          ready.current = true;
        })
      );
    } else {
      // City filter changed or store deselected — animate
      map.fitBounds(bounds, { padding: [52, 52], maxZoom: 13 });
    }
  }, [map, activeId, stores]);

  return null;
}

// ── Main component ────────────────────────────────────────────
export default function StoreMap({
  stores,
  activeId,
  onSelect,
}: {
  stores: MapStore[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      bounds={VIETNAM_BOUNDS}
      boundsOptions={{ padding: [20, 20] }}
      className="w-full h-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController stores={stores} activeId={activeId} />

      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.lat, store.lng]}
          icon={store.id === activeId ? ACTIVE_ICON : DEFAULT_ICON}
          eventHandlers={{ click: () => onSelect(store.id) }}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: 190 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#3B1F0A", fontSize: 13 }}>
                {store.name}
              </p>
              <p style={{ margin: "0 0 2px", color: "#666", fontSize: 12 }}>{store.address}</p>
              <p style={{ margin: "0 0 4px", color: "#888", fontSize: 11 }}>{store.hours}</p>
              <p style={{ margin: 0, color: "#C8820A", fontSize: 12, fontWeight: 600 }}>{store.phone}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
