"use client";
import { useEffect, useRef } from "react";

interface Level {
  price: number;
  label: string;
  color: string;
}

interface BitycleChartProps {
  symbol: string; // e.g. "BTC"
  levels?: Level[];
}

// Maps bare coin symbol to Bitycle format (binance_spot:XXXUSDT)
function toBitycleSymbol(symbol: string): string {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Already has exchange prefix
  if (s.includes(":")) return s;
  // Already ends with USDT/BTC/ETH/BUSD
  const quoteAssets = ["USDT", "BUSD", "USDC", "BTC", "ETH", "BNB"];
  const hasQuote = quoteAssets.some((q) => s.endsWith(q) && s.length > q.length);
  const market = hasQuote ? s : `${s}USDT`;
  return `binance_spot:${market}`;
}

declare global {
  interface Window {
    BitycleWidget?: Record<string, {
      addShape: (config: unknown) => void;
      subscribe: (key: string, handler: (payload: unknown) => void) => void;
    }>;
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadScript(onLoad: () => void) {
  if (scriptLoaded) { onLoad(); return; }
  callbacks.push(onLoad);
  if (scriptLoading) return;
  scriptLoading = true;
  const s = document.createElement("script");
  s.src = "https://widget.bitycle.com/static/script/index.js";
  s.async = true;
  s.onload = () => { scriptLoaded = true; callbacks.forEach((cb) => cb()); callbacks.length = 0; };
  document.head.appendChild(s);
}

export function BitycleChart({ symbol, levels = [] }: BitycleChartProps) {
  const widgetId = useRef(`bitycle-ac-${symbol}-${Math.random().toString(36).slice(2, 7)}`);
  const levelsRef = useRef(levels);
  levelsRef.current = levels;

  useEffect(() => {
    const id = widgetId.current;
    const bitycleSymbol = toBitycleSymbol(symbol);

    const config = {
      id,
      type: "ac",
      symbol: bitycleSymbol,
      style: "tradingview",
      datafeed_type: "general",
      interval: "1D",
      locale: "fa",
      mode: "dark",
    };

    function init() {
      // Inject per-widget config script
      const existing = document.getElementById(`script-${id}`);
      if (existing) existing.remove();

      const configScript = document.createElement("script");
      configScript.id = `script-${id}`;
      configScript.type = "text/javascript";
      configScript.innerHTML = JSON.stringify(config);
      document.head.appendChild(configScript);

      // Wait for widget instance to be available then draw levels
      let attempts = 0;
      const poll = setInterval(() => {
        const w = window.BitycleWidget?.[id];
        if (w) {
          clearInterval(poll);
          w.subscribe("chartReady", () => drawLevels(w, levelsRef.current));
        }
        if (++attempts > 50) clearInterval(poll);
      }, 200);
    }

    loadScript(init);

    return () => {
      document.getElementById(`script-${id}`)?.remove();
    };
  }, [symbol]);

  return (
    <div
      id={widgetId.current}
      style={{ width: "100%", height: "480px", minHeight: "420px" }}
      className="rounded-xl overflow-hidden"
    />
  );
}

function drawLevels(
  widget: { addShape: (c: unknown) => void },
  levels: Level[]
) {
  for (const level of levels) {
    widget.addShape({
      points: [{ price: level.price, time: 0 }],
      shapeObj: {
        shape: "horizontal_line",
        text: level.label,
        overrides: {
          showLabel: true,
          fontSize: 11,
          linewidth: 1,
          textcolor: level.color,
          linecolor: level.color,
          linestyle: 2,
        },
      },
      offset: 0,
      zoom: false,
    });
  }
}
