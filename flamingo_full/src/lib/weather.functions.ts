import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export type DayForecast = {
  day: string;
  date?: string;
  high: number;
  low: number;
  condition: "sunny" | "warm" | "cloudy" | "rainy" | "cool" | "evening";
  emoji: string;
  sunset: string;
  rainChance: number;
};


function classify(typeText: string, highC: number): {
  condition: DayForecast["condition"];
  emoji: string;
} {
  const t = (typeText || "").toLowerCase();
  if (t.includes("rain") || t.includes("shower") || t.includes("thunder") || t.includes("snow")) {
    return { condition: "rainy", emoji: "🌧️" };
  }
  if (t.includes("cloud") || t.includes("overcast")) {
    return { condition: "cloudy", emoji: "⛅" };
  }
  if (t.includes("clear") || t.includes("sun")) {
    return highC >= 25
      ? { condition: "sunny", emoji: "☀️" }
      : { condition: "warm", emoji: "🌤️" };
  }
  if (highC <= 16) return { condition: "cool", emoji: "🌥️" };
  if (highC >= 25) return { condition: "sunny", emoji: "☀️" };
  return { condition: "warm", emoji: "🌤️" };
}

function fmtDay(iso: string, idx: number): string {
  if (idx === 0) return "Today";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function fmtTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

export const getBerlinForecast = createServerFn({ method: "GET" }).handler(async (): Promise<{
  forecast: DayForecast[];
  source: "google" | "fallback";
}> => {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  const fallback: DayForecast[] = [
    { day: "Today", date: "", high: 24, low: 16, condition: "warm", emoji: "🌤️", sunset: "21:10", rainChance: 10 },
    { day: "Fri", date: "", high: 26, low: 17, condition: "sunny", emoji: "☀️", sunset: "21:09", rainChance: 5 },
    { day: "Sat", date: "", high: 23, low: 15, condition: "cloudy", emoji: "⛅", sunset: "21:07", rainChance: 30 },
    { day: "Sun", date: "", high: 20, low: 14, condition: "rainy", emoji: "🌧️", sunset: "21:05", rainChance: 65 },
    { day: "Mon", date: "", high: 22, low: 14, condition: "cool", emoji: "🌥️", sunset: "21:03", rainChance: 25 },
  ];

  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
    return { forecast: fallback, source: "fallback" };
  }

  try {
    const url = `${GATEWAY_URL}/weather/v1/forecast/days:lookup?location.latitude=52.520008&location.longitude=13.404954&days=5`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    if (!res.ok) {
      console.error("Google Weather error", res.status, await res.text());
      return { forecast: fallback, source: "fallback" };
    }
    const data = await res.json() as {
      forecastDays?: Array<{
        interval?: { startTime?: string };
        displayDate?: { year: number; month: number; day: number };
        maxTemperature?: { degrees?: number };
        minTemperature?: { degrees?: number };
        daytimeForecast?: {
          weatherCondition?: { type?: string; description?: { text?: string } };
          precipitation?: { probability?: { percent?: number } };
        };
        sunEvents?: { sunsetTime?: string };
      }>;
    };
    const days = (data.forecastDays || []).slice(0, 5).map((d, i) => {
      const high = Math.round(d.maxTemperature?.degrees ?? 20);
      const low = Math.round(d.minTemperature?.degrees ?? 12);
      const typeText =
        d.daytimeForecast?.weatherCondition?.description?.text ||
        d.daytimeForecast?.weatherCondition?.type ||
        "";
      const { condition, emoji } = classify(typeText, high);
      const iso = d.interval?.startTime
        ?? (d.displayDate
          ? `${d.displayDate.year}-${String(d.displayDate.month).padStart(2, "0")}-${String(d.displayDate.day).padStart(2, "0")}`
          : "");
      return {
        day: fmtDay(iso, i),
        date: iso,
        high,
        low,
        condition,
        emoji,
        sunset: fmtTime(d.sunEvents?.sunsetTime || ""),
        rainChance: Math.round(d.daytimeForecast?.precipitation?.probability?.percent ?? 0),
      } satisfies DayForecast;
    });
    if (days.length === 0) return { forecast: fallback, source: "fallback" };
    return { forecast: days, source: "google" };
  } catch (e) {
    console.error("Weather fetch failed", e);
    return { forecast: fallback, source: "fallback" };
  }
});
