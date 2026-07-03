/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";

import type { RecommendationRow, RecommendationCategory } from "@/lib/spots";

declare global {
  interface Window {
    google?: typeof google;
    __initFlamingoSpotsMap?: () => void;
  }
}

const SCRIPT_ID = "flamingo-gmaps-js";
const DEFAULT_CENTER = { lat: 51.5, lng: 8.5 }; // roughly between NL and Berlin

const CATEGORY_EMOJI: Record<RecommendationCategory, string> = {
  restaurant: "🍽️",
  café: "☕",
  bar: "🍸",
  activity: "🎯",
  sight: "📸",
  other: "✨",
};

const CATEGORY_COLOR: Record<RecommendationCategory, string> = {
  restaurant: "#ef6b53",
  café: "#c98a4b",
  bar: "#8b5cf6",
  activity: "#22c1a4",
  sight: "#2b8ae0",
  other: "#6b7280",
};

function loadMaps(): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if (window.google?.maps) return resolve(window.google);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const done = () =>
      window.google ? resolve(window.google) : reject(new Error("Google Maps failed to load"));

    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("script error")), { once: true });
      return;
    }

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error("Missing Google Maps browser key"));

    window.__initFlamingoSpotsMap = () => done();
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initFlamingoSpotsMap${
      channel ? `&channel=${channel}` : ""
    }`;
    s.onerror = () => reject(new Error("script error"));
    document.head.appendChild(s);
  });
}

export function SpotsMap({
  spots,
  highlightId,
  onSelect,
}: {
  spots: RecommendationRow[];
  highlightId?: string | null;
  onSelect?: (spot: RecommendationRow) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center: DEFAULT_CENTER,
          zoom: 6,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        infoRef.current = new google.maps.InfoWindow();
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const located = spots.filter(
      (s): s is RecommendationRow & { lat: number; lng: number } =>
        typeof s.lat === "number" && typeof s.lng === "number",
    );

    located.forEach((s) => {
      const marker = new google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map,
        title: s.name,
        label: { text: CATEGORY_EMOJI[s.category], fontSize: "16px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: "#ffffff",
          fillOpacity: 1,
          strokeColor: CATEGORY_COLOR[s.category],
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;padding:4px 6px;max-width:200px">
             <div style="font-weight:600;font-size:13px">${CATEGORY_EMOJI[s.category]} ${s.name}</div>
             <div style="font-size:11px;color:#6b7280">${s.category} · ${s.city}, ${s.region}</div>
           </div>`,
        );
        infoRef.current?.open({ map, anchor: marker });
        onSelect?.(s);
      });
      markersRef.current.push(marker);
    });

    if (located.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      located.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
      map.fitBounds(bounds, 48);
    } else if (located.length === 1) {
      map.setCenter({ lat: located[0].lat, lng: located[0].lng });
      map.setZoom(13);
    }
  }, [spots, onSelect]);

  useEffect(() => {
    if (!highlightId || !mapRef.current) return;
    const spot = spots.find((s) => s.id === highlightId);
    if (!spot || typeof spot.lat !== "number" || typeof spot.lng !== "number") return;
    mapRef.current.panTo({ lat: spot.lat, lng: spot.lng });
    mapRef.current.setZoom(14);
  }, [highlightId, spots]);

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
        Map unavailable: {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 shadow-card">
      <div ref={ref} className="h-[320px] w-full bg-secondary" />
    </div>
  );
}
