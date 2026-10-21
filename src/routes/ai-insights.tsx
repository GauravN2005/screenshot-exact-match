import React, { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { dailySeries } from "@/lib/calc";
import {
  PriorityBadge,
  RecommendationCategoryBadge,
  RecommendationStatusBadge,
} from "@/components/StatusBadge";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Filter,
  Check,
  RotateCcw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import type {
  Priority,
  Recommendation,
  RecommendationCategory,
  RecommendationStatus,
} from "@/types";

export const Route = createFileRoute("/ai-insights")({
  component: AiInsightsPage,
});

function AiInsightsPage() {
  const { recommendations, products, warehouses, shipments } = useDemoStore();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecId, setSelectedRecId] = useState<string>(recommendations[0]?.id ?? "R001");

  // Rejection dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    "Operationally deferred for next fiscal quarter",
  );

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      const matchCat = categoryFilter === "all" ? true : r.category === categoryFilter;
      const matchPri = priorityFilter === "all" ? true : r.priority === priorityFilter;
      const matchStat = statusFilter === "all" ? true : r.status === statusFilter;
      return matchCat && matchPri && matchStat;
    });
  }, [recommendations, categoryFilter, priorityFilter, statusFilter]);

  const activeRec = recommendations.find((r) => r.id === selectedRecId) ?? recommendations[0];

  // Demand forecast chart series
  const forecastSeries = useMemo(() => {
    return dailySeries(`forecast-${activeRec?.id ?? "R001"}`, "30d", 85, 0.22).map((pt) => ({
      date: pt.date.slice(5),
      forecast: Math.round(pt.value),
      safetyBuffer: Math.round(pt.value * 1.25),
    }));
  }, [activeRec?.id]);

  // Actions
  const handleAccept = () => {
    if (!activeRec) return;
    demoStore.decideRecommendation(activeRec.id, "accepted", "Approved by Operations Manager");
    toast.success(`Recommendation accepted: ${activeRec.title}`);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRec) return;
    demoStore.decideRecommendation(activeRec.id, "rejected", rejectReason);
    toast.info(`Recommendation declined: ${activeRec.title}`);
    setRejectOpen(false);
  };

  const handleReview = () => {
    if (!activeRec) return;
    demoStore.decideRecommendation(
      activeRec.id,
      "review",
      "Flagged for weekly logistics review meeting",
    );
    toast.info(`Recommendation placed under review`);
  };

  return (
    <AppShell
      pageTitle="AI Insights"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "AI Insights" }]}
    >
      <div className="space-y-6">
        {/* Header & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>AI Insights & Decision Support</span>
              <BrainCircuit className="w-5 h-5 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Predictive risk assessments, demand alerts, and explainable replenishment guidance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Deterministic Rules Engine
            </span>
          </div>
        </div>

        {/* Disclaimer / Transparency Banner */}
        <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Transparency disclosure:</strong> All displayed
            forecasts and recommendations are generated using deterministic operational rule sets
            and historical variance algorithms. Connected enterprise LLM APIs may be plugged in to
            generate explanatory commentary without breaking core workflows.
          </p>
        </div>

        {/* Filters Card */}
        <Card className="p-4 border-border bg-card">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open Actions</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
                <SelectItem value="rejected">Declined</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="low_stock_risk">Stock Risk</SelectItem>
                <SelectItem value="excess_inventory">Excess Stock</SelectItem>
                <SelectItem value="demand_forecast">Demand Forecast</SelectItem>
                <SelectItem value="shipment_delay_risk">Delay Risk</SelectItem>
                <SelectItem value="stock_transfer">Transfer Suggestion</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-auto">
              Showing {filteredRecs.length} of {recommendations.length} recommendations
            </span>
          </div>
        </Card>

        {/* Two-Column Bento Layout: List on Left, Detail Panel on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recommendation List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredRecs.length === 0 ? (
              <Card className="p-8 text-center text-xs text-muted-foreground">
                No recommendations match the chosen filters.
              </Card>
            ) : (
              filteredRecs.map((rec) => {
                const isSelected = activeRec?.id === rec.id;
                return (
                  <Card
                    key={rec.id}
                    onClick={() => setSelectedRecId(rec.id)}
                    className={`p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? "border-primary ring-1 ring-primary bg-card shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/10"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PriorityBadge priority={rec.priority} />
                          <RecommendationCategoryBadge category={rec.category} />
                        </div>
                        <RecommendationStatusBadge status={rec.status} />
                      </div>

                      <h4 className="font-semibold text-xs text-foreground leading-snug line-clamp-2">
                        {rec.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <span>
                          Target: <strong>{rec.refLabel}</strong>
                        </span>
                        <span className="text-primary font-semibold">View details →</span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Recommendation Detail Panel (7 cols) */}
          {activeRec && (
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={activeRec.priority} />
                      <RecommendationCategoryBadge category={activeRec.category} />
                    </div>
                    <RecommendationStatusBadge status={activeRec.status} />
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {activeRec.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Target Reference:{" "}
                    <strong className="text-foreground">{activeRec.refLabel}</strong> • ID:{" "}
                    {activeRec.id}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                  {/* Decision Audit Note if decided */}
                  {activeRec.decidedAt && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Decision Record</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{activeRec.decisionNote}</p>
                    </div>
                  )}

                  {/* Why this recommendation was triggered */}
                  <div className="space-y-1">
                    <h5 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                      Operational Analysis & Root Cause
                    </h5>
                    <p className="text-foreground leading-relaxed">{activeRec.reason}</p>
                  </div>

                  {/* Supporting Data Grid */}
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                      Supporting Data Telemetry
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {activeRec.supportingData.map((d) => (
                        <div
                          key={d.label}
                          className="p-2.5 rounded-lg border border-border bg-muted/20 text-center"
                        >
                          <div className="text-[10px] text-muted-foreground uppercase">
                            {d.label}
                          </div>
                          <div className="font-bold text-foreground text-sm mt-0.5">{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1">
                    <h5 className="font-bold text-primary text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Prescribed Operational Action</span>
                    </h5>
                    <p className="text-foreground leading-relaxed">{activeRec.suggestedAction}</p>
                  </div>

                  {/* Estimated Impact & Assumptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Estimated Business Value
                      </span>
                      <p className="font-medium text-foreground text-xs">{activeRec.impact}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Modeling Assumptions
                      </span>
                      <p className="text-muted-foreground text-xs">{activeRec.impactAssumptions}</p>
                    </div>
                  </div>

                  {/* Forecast Simulation Chart */}
                  <div className="pt-2">
                    <h5 className="font-bold text-foreground text-xs mb-2">
                      30-Day Demand & Buffer Projection (Simulated)
                    </h5>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={forecastSeries}
                          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="oklch(0.923 0.008 151.9 / 0.5)"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: "#64748B" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#64748B" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              borderColor: "#334155",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="forecast"
                            stroke="#176B4D"
                            fill="#176B4D"
                            fillOpacity={0.2}
                            name="Forecast Demand"
                          />
                          <Area
                            type="monotone"
                            dataKey="safetyBuffer"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.08}
                            name="Buffer Level"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleAccept}
                        disabled={activeRec.status === "accepted"}
                        className="h-9 px-3 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Recommendation</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectOpen(true)}
                        disabled={activeRec.status === "rejected"}
                        className="h-9 px-3 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReview}
                        disabled={activeRec.status === "review"}
                        className="h-9 px-3 gap-1.5 text-xs border-border"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </Button>
                    </div>

                    {activeRec.refType === "product" && (
                      <Link
                        to="/inventory/$productId"
                        params={{ productId: activeRec.refId }}
                        className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Open item <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Dialog: Reject Recommendation */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Decline Recommendation</DialogTitle>
              <DialogDescription>
                Provide an operational rationale for declining {activeRec?.title}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="rejReason">Operational Justification</Label>
                <Input
                  id="rejReason"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Decline
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
