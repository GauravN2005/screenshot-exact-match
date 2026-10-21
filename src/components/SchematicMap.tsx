import React, { useState } from "react";
import type { RoutePoint } from "@/lib/calc";
import type { Warehouse } from "@/types";
import { DESTINATIONS } from "@/data/seed";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Navigation, Sparkles } from "lucide-react";

interface SchematicMapProps {
  warehouses: Warehouse[];
  originWarehouseId: string;
  destination: string;
  destinationPoint: RoutePoint;
  stops: string[];
  activeView: "suggested" | "current";
  onToggleView?: (view: "suggested" | "current") => void;
  className?: string;
}

export function SchematicMap({
  warehouses,
  originWarehouseId,
  destination,
  destinationPoint,
  stops,
  activeView,
  onToggleView,
  className,
}: SchematicMapProps) {
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    type: "origin" | "destination" | "stop" | "facility";
    x: number;
    y: number;
  } | null>(null);

  const originWh = warehouses.find((w) => w.id === originWarehouseId) ?? warehouses[0];
  const originPoint: RoutePoint = originWh
    ? { x: originWh.mapX, y: originWh.mapY }
    : { x: 58, y: 70 };

  const stopPoints = stops
    .map((name) => {
      const dest = DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase());
      const wh = warehouses.find(
        (w) =>
          w.city.toLowerCase() === name.toLowerCase() ||
          w.name.toLowerCase() === name.toLowerCase(),
      );
      if (dest) return { name: dest.name, x: dest.x, y: dest.y };
      if (wh) return { name: wh.city, x: wh.mapX, y: wh.mapY };
      return null;
    })
    .filter((p): p is { name: string; x: number; y: number } => Boolean(p));

  // Current route points: Origin -> Stops in order -> Destination
  const currentPathPoints = [
    originPoint,
    ...stopPoints.map((s) => ({ x: s.x, y: s.y })),
    destinationPoint,
  ];

  // Suggested optimized route: sorted / direct corridor
  const sortedStops = [...stopPoints].sort((a, b) => {
    const distA = Math.hypot(a.x - originPoint.x, a.y - originPoint.y);
    const distB = Math.hypot(b.x - originPoint.x, b.y - originPoint.y);
    return distA - distB;
  });
  const suggestedPathPoints = [
    originPoint,
    ...sortedStops.map((s) => ({ x: s.x, y: s.y })),
    destinationPoint,
  ];

  const buildPathString = (points: RoutePoint[], smooth = false): string => {
    if (points.length < 2) return "";
    const p0 = points[0];
    if (!p0) return "";
    let d = `M ${p0.x} ${p0.y}`;

    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      if (!curr || !prev) continue;
      if (smooth) {
        const cx = (prev.x + curr.x) / 2;
        const cy = (prev.y + curr.y) / 2 - 2; // subtle curvature
        d += ` Q ${cx} ${cy} ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }
    return d;
  };

  const currentPathD = buildPathString(currentPathPoints, false);
  const suggestedPathD = buildPathString(suggestedPathPoints, true);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-slate-950 text-slate-100 overflow-hidden flex flex-col select-none",
        className,
      )}
    >
      {/* Map Header / View Switcher */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="glass-panel bg-slate-900/90 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 text-xs flex items-center gap-2 pointer-events-auto shadow-lg backdrop-blur">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">Network Route Corridor</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">• India Operations</span>
        </div>

        {onToggleView && (
          <div className="glass-panel bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 flex items-center gap-1 pointer-events-auto shadow-lg backdrop-blur text-xs">
            <button
              type="button"
              onClick={() => onToggleView("suggested")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5",
                activeView === "suggested"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Sparkles className="w-3 h-3 text-emerald-200" />
              Suggested AI
            </button>
            <button
              type="button"
              onClick={() => onToggleView("current")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all",
                activeView === "current"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Current Baseline
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full aspect-[4/3] sm:aspect-[16/10] relative flex items-center justify-center p-2 sm:p-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full max-h-[520px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="schematicGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="0.5"
              />
            </pattern>

            {/* Gradients */}
            <linearGradient id="suggestedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="100" height="100" fill="url(#schematicGrid)" />

          {/* Schematic Subcontinent Landmass Silhouette */}
          <path
            d="M 52 14 L 62 16 L 70 24 L 84 32 L 95 44 L 88 56 L 80 65 L 75 80 L 62 92 L 54 84 L 50 72 L 32 64 L 22 56 L 24 42 L 34 32 L 44 20 Z"
            fill="rgba(16, 185, 129, 0.03)"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />

          {/* Major Inter-Hub Network Lines */}
          <g stroke="rgba(255, 255, 255, 0.07)" strokeWidth="0.5">
            <line x1="56" y1="20" x2="20" y2="58" />
            <line x1="56" y1="20" x2="58" y2="70" />
            <line x1="20" y1="58" x2="58" y2="70" />
            <line x1="58" y1="70" x2="76" y2="80" />
            <line x1="56" y1="20" x2="76" y2="80" />
          </g>

          {/* Current Route Path (Rendered if view is 'current' or as faint baseline) */}
          <path
            d={currentPathD}
            fill="none"
            stroke={activeView === "current" ? "#F59E0B" : "rgba(245, 158, 11, 0.25)"}
            strokeWidth={activeView === "current" ? 1.5 : 1}
            strokeDasharray="2.5 1.5"
            strokeLinecap="round"
          />

          {/* Suggested Route Path (Rendered if view is 'suggested' or secondary) */}
          <path
            d={suggestedPathD}
            fill="none"
            stroke={
              activeView === "suggested" ? "url(#suggestedGradient)" : "rgba(16, 185, 129, 0.25)"
            }
            strokeWidth={activeView === "suggested" ? 2.2 : 1}
            strokeLinecap="round"
            filter={activeView === "suggested" ? "url(#glow)" : undefined}
          />

          {/* All Destination Nodes (Grey dots) */}
          {DESTINATIONS.map((d) => {
            const isDestination = d.name.toLowerCase() === destination.toLowerCase();
            const isStop = stops.some((s) => s.toLowerCase() === d.name.toLowerCase());
            if (isDestination || isStop) return null;

            return (
              <g
                key={d.name}
                className="cursor-pointer transition-opacity opacity-40 hover:opacity-100"
                onMouseEnter={() =>
                  setHoveredNode({ name: d.name, type: "facility", x: d.x, y: d.y })
                }
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx={d.x} cy={d.y} r="1.2" fill="#64748B" />
                <text
                  x={d.x + 2}
                  y={d.y + 0.8}
                  fill="#94A3B8"
                  fontSize="2.2"
                  fontFamily="sans-serif"
                >
                  {d.name}
                </text>
              </g>
            );
          })}

          {/* Warehouses (Facilities) */}
          {warehouses.map((wh) => {
            const isOrigin = wh.id === originWarehouseId;
            return (
              <g
                key={wh.id}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredNode({
                    name: `${wh.name} (${wh.code})`,
                    type: isOrigin ? "origin" : "facility",
                    x: wh.mapX,
                    y: wh.mapY,
                  })
                }
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Pulsing ring for origin */}
                {isOrigin && (
                  <circle
                    cx={wh.mapX}
                    cy={wh.mapY}
                    r="4.5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="0.8"
                    opacity="0.6"
                  >
                    <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
                    <animate
                      attributeName="opacity"
                      values="0.8;0.1;0.8"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={wh.mapX}
                  cy={wh.mapY}
                  r={isOrigin ? 2.8 : 2}
                  fill={isOrigin ? "#10B981" : "#0284C7"}
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
                <text
                  x={wh.mapX}
                  y={wh.mapY - 3.5}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="2.4"
                  fontWeight="bold"
                >
                  {wh.code}
                </text>
              </g>
            );
          })}

          {/* Intermediate Stops */}
          {stopPoints.map((s, idx) => (
            <g
              key={s.name}
              className="cursor-pointer"
              onMouseEnter={() =>
                setHoveredNode({ name: `Stop ${idx + 1}: ${s.name}`, type: "stop", x: s.x, y: s.y })
              }
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle cx={s.x} cy={s.y} r="2.2" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="0.6" />
              <text
                x={s.x}
                y={s.y + 0.8}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="1.8"
                fontWeight="bold"
              >
                {idx + 1}
              </text>
            </g>
          ))}

          {/* Final Destination Node */}
          <g
            className="cursor-pointer"
            onMouseEnter={() =>
              setHoveredNode({
                name: `Destination: ${destination}`,
                type: "destination",
                x: destinationPoint.x,
                y: destinationPoint.y,
              })
            }
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle
              cx={destinationPoint.x}
              cy={destinationPoint.y}
              r="4.2"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="0.8"
              opacity="0.7"
            >
              <animate attributeName="r" values="3;5.5;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={destinationPoint.x}
              cy={destinationPoint.y}
              r="2.8"
              fill="#0284C7"
              stroke="#FFFFFF"
              strokeWidth="0.6"
            />
            <text
              x={destinationPoint.x}
              y={destinationPoint.y - 3.5}
              textAnchor="middle"
              fill="#38BDF8"
              fontSize="2.4"
              fontWeight="bold"
            >
              {destination}
            </text>
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-2.5 py-1 bg-slate-900/95 border border-slate-700 rounded-md text-[11px] font-semibold text-slate-200 shadow-xl backdrop-blur"
            style={{
              left: `${hoveredNode.x}%`,
              top: `${hoveredNode.y}%`,
            }}
          >
            {hoveredNode.name}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="p-3 border-t border-slate-900 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Origin Facility</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            <span>Destination</span>
          </div>
          {stops.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
              <span>Stops ({stops.length})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block" />
            <span className="text-emerald-400 font-medium">AI Route (Optimized)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-amber-400 inline-block" />
            <span className="text-amber-400">Baseline Route</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          Schematic visualization • Simulated corridor
        </div>
      </div>
    </div>
  );
}
