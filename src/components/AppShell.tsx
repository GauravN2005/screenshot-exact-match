import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import {
  Boxes,
  Truck,
  MapPin,
  Sparkles,
  Leaf,
  FileBarChart,
  Settings,
  LayoutDashboard,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Database,
  Building2,
  User,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationPopover } from "./NotificationPopover";
import { CommandSearch } from "./CommandSearch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const NAV_ITEMS = [
  { label: "Overview", to: "/overview", icon: LayoutDashboard },
  { label: "Inventory", to: "/inventory", icon: Boxes },
  { label: "Shipments", to: "/shipments", icon: Truck },
  { label: "Route Planner", to: "/route-planner", icon: MapPin },
  { label: "AI Insights", to: "/ai-insights", icon: Sparkles },
  { label: "Sustainability", to: "/sustainability", icon: Leaf },
  { label: "Reports", to: "/reports", icon: FileBarChart },
];

export function AppShell({ children, pageTitle, breadcrumbs }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { warehouses, selectedWarehouseId, profile } = useDemoStore();

  const currentPath = location.pathname;

  const handleResetData = () => {
    demoStore.resetDemoData();
    toast.success("Demo dataset reset to initial state");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30 select-none",
            collapsed ? "w-18" : "w-64",
          )}
        >
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-4 border-b border-border/80 justify-between">
            <Link
              to="/overview"
              className={cn(
                "flex items-center gap-2.5 overflow-hidden transition-all duration-200",
                collapsed ? "justify-center w-full" : "",
              )}
            >
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shrink-0">
                <Leaf className="w-5 h-5 text-emerald-200" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground text-base">
                    <span>EcoChain</span>
                    <span className="text-primary text-xs px-1.5 py-0.2 rounded bg-primary/10 uppercase tracking-wider font-extrabold">
                      AI
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Smart Supply Chain
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.to ||
                (item.to !== "/overview" && currentPath.startsWith(item.to));

              const linkNode = (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                    collapsed ? "justify-center px-0" : "",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkNode;
            })}
          </nav>

          {/* Sidebar Footer with Settings & Collapse Toggle */}
          <div className="p-3 border-t border-border/80 space-y-1">
            {(() => {
              const isActive = currentPath === "/settings";
              const settingsLink = (
                <Link
                  to="/settings"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                    collapsed ? "justify-center px-0" : "",
                  )}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                  </Tooltip>
                );
              }

              return settingsLink;
            })()}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs py-2 mt-1",
                collapsed ? "justify-center px-0" : "justify-between px-3",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {!collapsed && <span>Collapse Sidebar</span>}
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </aside>

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Persistent Top Navigation Bar */}
          <header className="h-16 border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Page Title/Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden h-9 w-9 shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-sidebar flex flex-col">
                  <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        <Leaf className="w-4 h-4 text-emerald-200" />
                      </div>
                      <span className="font-bold text-foreground text-base">EcoChain AI</span>
                    </div>
                  </div>
                  <nav className="flex-1 py-4 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        currentPath === item.to ||
                        (item.to !== "/overview" && currentPath.startsWith(item.to));
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    <div className="pt-2 mt-2 border-t border-border">
                      <Link
                        to="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>

              {/* Title / Breadcrumb */}
              <div className="flex flex-col min-w-0">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={idx}>
                        {crumb.href ? (
                          <Link to={crumb.href} className="hover:underline">
                            {crumb.label}
                          </Link>
                        ) : (
                          <span>{crumb.label}</span>
                        )}
                        {idx < breadcrumbs.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <h1 className="text-lg font-bold text-foreground truncate tracking-tight">
                  {pageTitle ?? "EcoChain AI"}
                </h1>
              </div>
            </div>

            {/* Right: Search, Warehouse Selector, Notifications, Mode Indicator, User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Global Search Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground border-border bg-background/50 hover:bg-accent/50 w-52 justify-between"
              >
                <div className="flex items-center gap-2 text-xs">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search records...</span>
                </div>
                <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden h-9 w-9 text-muted-foreground"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Warehouse Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 border-border text-xs font-medium bg-background"
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden sm:inline">
                      {selectedWarehouseId === "all"
                        ? "All Warehouses"
                        : (warehouses.find((w) => w.id === selectedWarehouseId)?.name ??
                          "Warehouse")}
                    </span>
                    <span className="sm:hidden">
                      {selectedWarehouseId === "all"
                        ? "All"
                        : (warehouses.find((w) => w.id === selectedWarehouseId)?.code ?? "WH")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Filter by Facility
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => demoStore.setSelectedWarehouse("all")}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>All Warehouses (Network)</span>
                    {selectedWarehouseId === "all" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {warehouses.map((wh) => (
                    <DropdownMenuItem
                      key={wh.id}
                      onClick={() => demoStore.setSelectedWarehouse(wh.id)}
                      className="flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-foreground">{wh.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {wh.city} ({wh.code})
                        </div>
                      </div>
                      {selectedWarehouseId === wh.id && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications Popover */}
              <NotificationPopover />

              {/* Data Mode Indicator */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Demo Mode</span>
              </div>

              {/* User Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-2 pl-2 pr-2.5 rounded-lg hover:bg-accent"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {profile.name.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-foreground leading-none">
                        {profile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {profile.role}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">{profile.name}</p>
                    <p className="text-[11px] text-muted-foreground">{profile.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 text-xs">
                      <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Preferences & Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleResetData}
                    className="flex items-center gap-2 text-xs text-rose-600 focus:text-rose-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo State</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>

        {/* Global Command Search Dialog */}
        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}
