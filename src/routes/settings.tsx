import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import {
  Settings,
  User,
  Building2,
  Sliders,
  Bell,
  Database,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, defaultWarehouseId, display, notifications, warehouses } = useDemoStore();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [defaultWh, setDefaultWh] = useState(defaultWarehouseId);

  // Display toggles
  const [compactTables, setCompactTables] = useState(display.compactTables);
  const [showTrendArrows, setShowTrendArrows] = useState(display.showTrendArrows);

  // Notification toggles
  const [lowStockAlerts, setLowStockAlerts] = useState(notifications.lowStockAlerts);
  const [shipmentAlerts, setShipmentAlerts] = useState(notifications.shipmentAlerts);
  const [dailyBriefing, setDailyBriefing] = useState(notifications.dailyBriefing);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    demoStore.updateProfile({ name, email, role });
    demoStore.setSelectedWarehouse(defaultWh);
    toast.success("Profile preferences updated");
  };

  const handleToggleDisplay = (field: "compactTables" | "showTrendArrows", val: boolean) => {
    if (field === "compactTables") setCompactTables(val);
    if (field === "showTrendArrows") setShowTrendArrows(val);
    demoStore.updateDisplay({ [field]: val });
    toast.success("Display preference saved");
  };

  const handleToggleNotification = (
    field: "lowStockAlerts" | "shipmentAlerts" | "dailyBriefing",
    val: boolean,
  ) => {
    if (field === "lowStockAlerts") setLowStockAlerts(val);
    if (field === "shipmentAlerts") setShipmentAlerts(val);
    if (field === "dailyBriefing") setDailyBriefing(val);
    demoStore.updateNotifications({ [field]: val });
    toast.success("Notification preference saved");
  };

  const handleResetData = () => {
    demoStore.resetDemoData();
    toast.success("Demo dataset reset to initial state");
  };

  return (
    <AppShell
      pageTitle="Settings & Preferences"
      breadcrumbs={[{ label: "EcoChain AI", href: "/overview" }, { label: "Settings" }]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Settings & Preferences</span>
            <Settings className="w-5 h-5 text-primary" />
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your demo workspace profile, default facilities, and interface preferences.
          </p>
        </div>

        {/* Demo Profile Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Operator Profile Information</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Simulation profile details displayed in the top navigation and audit logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="profName">Full Name</Label>
                  <Input id="profName" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profEmail">Email Address</Label>
                  <Input id="profEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profRole">Operational Role</Label>
                  <Input id="profRole" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1 sm:w-1/2">
                <Label>Default Facility View</Label>
                <Select value={defaultWh} onValueChange={setDefaultWh}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses (Network)</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Interface & Display Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Customize data presentation across tables and Bento cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">Compact Data Tables</div>
                <div className="text-muted-foreground">
                  Reduce row padding for dense operational scanning
                </div>
              </div>
              <Switch
                checked={compactTables}
                onCheckedChange={(val) => handleToggleDisplay("compactTables", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">Show Historical Trend Arrows</div>
                <div className="text-muted-foreground">
                  Display percentage trajectory indicators on KPI cards
                </div>
              </div>
              <Switch
                checked={showTrendArrows}
                onCheckedChange={(val) => handleToggleDisplay("showTrendArrows", val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Operational Notification Feeds</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure real-time event triggers for anomalies and warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">Low Stock & Reorder Triggers</div>
                <div className="text-muted-foreground">
                  Notify when SKU on-hand dips below safety minimum
                </div>
              </div>
              <Switch
                checked={lowStockAlerts}
                onCheckedChange={(val) => handleToggleNotification("lowStockAlerts", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">
                  Shipment Delay & Weather Exceptions
                </div>
                <div className="text-muted-foreground">
                  Notify immediately when in-flight carriers report delays
                </div>
              </div>
              <Switch
                checked={shipmentAlerts}
                onCheckedChange={(val) => handleToggleNotification("shipmentAlerts", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">
                  Daily Operations Intelligence Briefing
                </div>
                <div className="text-muted-foreground">
                  Generate simulated AI morning synthesis card
                </div>
              </div>
              <Switch
                checked={dailyBriefing}
                onCheckedChange={(val) => handleToggleNotification("dailyBriefing", val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Mode & Reset Demo Data */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>Data Engine & Demo Persistence</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Manage client-side localStorage simulation and factory reset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="space-y-0.5">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Frontend Demo Engine Active</span>
                </div>
                <div className="text-emerald-800 dark:text-emerald-300">
                  Modifications are preserved in browser storage. No server infrastructure required.
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                Standalone
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">Reset Demo Data</div>
                <div className="text-muted-foreground">
                  Restore all products, warehouses, shipments, and recommendations to original seed
                  values
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Seed</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Demo State?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will revert all created products, stock adjustments, transfers, and
                      shipment updates to their initial demo seed state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetData}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
