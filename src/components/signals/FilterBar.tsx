"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedFilters {
  symbol: string;
  direction: string;
  sort: "latest" | "popular";
  minConfidence: number;
}

export const DEFAULT_FILTERS: FeedFilters = {
  symbol: "",
  direction: "",
  sort: "latest",
  minConfidence: 0,
};

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FeedFilters;
  onChange: (f: FeedFilters) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const active =
    !!filters.symbol || !!filters.direction || filters.sort !== "latest" || filters.minConfidence > 0;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/3">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm text-white/70"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters & Sort
          {active && <Badge className="text-xs">active</Badge>}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <div className={cn("px-4 pb-4 space-y-4", !expanded && "hidden md:block")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Symbol</label>
            <Input
              placeholder="BTC"
              value={filters.symbol}
              onChange={(e) => onChange({ ...filters, symbol: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Direction</label>
            <select
              className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={filters.direction}
              onChange={(e) => onChange({ ...filters, direction: e.target.value })}
            >
              <option value="">Any</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
              <option value="NEUTRAL">NEUTRAL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Sort</label>
            <select
              className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as "latest" | "popular" })}
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Min confidence</label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={filters.minConfidence || ""}
              onChange={(e) =>
                onChange({ ...filters, minConfidence: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
