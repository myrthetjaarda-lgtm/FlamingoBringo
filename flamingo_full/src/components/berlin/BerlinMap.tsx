/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";

import { SPOTS, SPOT_COORDS, BERLIN_CENTER, type Spot } from "@/data/berlin";

declare global {
  interface Window {
    google?: typeof google;
    __initFlamingoMap?: () => void;
  }
}

const SCRIPT_ID = "flamingo-gmaps-js";

function loadMaps(): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if (window.google?.maps) return resolve(window.google);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const done = () => window.google ? resolve(window.google) : reject(new Error("Google Maps failed to load"));

    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("script error")), { once: true });
      return;
    }

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error("Missing Google Maps browser key"));

    window.__initFlamingoMap = () => done();
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initFlamingoMap${
      channel ? `&channel=${channel}` : ""
    }`;
    s.onerror = () => reject(new Error("script error"));
    document.head.appendChild(s);
  });
}

export function BerlinMap({
  spots = SPOTS,
  highlightId,
  onSelect,
}: {
  spots?: Spot[];
  highlightId?: string | null;
  onSelect?: (spot: Spot) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // init once
  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center: BERLIN_CENTER,
          zoom: 11,
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

  // render markers when spots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    spots.forEach((s) => {
      const c = SPOT_COORDS[s.id];
      if (!c) return;
      const marker = new google.maps.Marker({
        position: c,
        map,
        title: s.name,
        label: { text: s.emoji, fontSize: "18px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: "#ffffff",
          fillOpacity: 1,
          strokeColor: "#ef6b53",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;padding:4px 6px;max-width:200px">
             <div style="font-weight:600;font-size:13px">${s.emoji} ${s.name}</div>
             <div style="font-size:11px;color:#6b7280">${s.category} · ${s.neighborhood}</div>
           </div>`,
        );
        infoRef.current?.open({ map, anchor: marker });
        onSelect?.(s);
      });
      markersRef.current.push(marker);
    });
  }, [spots, onSelect]);

  // pan to highlight
  useEffect(() => {
    if (!highlightId || !mapRef.current) return;
    const c = SPOT_COORDS[highlightId];
    if (!c) return;
    mapRef.current.panTo(c);
    mapRef.current.setZoom(14);
  }, [highlightId]);

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
        Map unavailable: {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 shadow-card">
      <div ref={ref} className="h-[260px] w-full bg-secondary" />
    </div>
  );
}
