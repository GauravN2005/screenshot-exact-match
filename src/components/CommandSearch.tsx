import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Truck,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  MapPin,
  LayoutDashboard,
  Sparkles,
  Leaf,
  FileBarChart,
  Settings,
} from "lucide-react";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const navigate = useNavigate();
  const { products, shipments, warehouses, alerts } = useDemoStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search products, tracking IDs, warehouses, or routes..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation pages */}
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/overview" }))}>
            <LayoutDashboard className="w-4 h-4 mr-2 text-primary" />
            <span>Operations Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/inventory" }))}>
            <Boxes className="w-4 h-4 mr-2 text-primary" />
            <span>Inventory Management</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/shipments" }))}>
            <Truck className="w-4 h-4 mr-2 text-primary" />
            <span>Shipment Tracking</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/route-planner" }))}>
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            <span>Smart Route Planner</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/ai-insights" }))}>
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            <span>AI Insights & Decision Support</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/sustainability" }))}>
            <Leaf className="w-4 h-4 mr-2 text-primary" />
            <span>Sustainability & Carbon Impact</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/reports" }))}>
            <FileBarChart className="w-4 h-4 mr-2 text-primary" />
            <span>Reports & Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate({ to: "/settings" }))}>
            <Settings className="w-4 h-4 mr-2 text-primary" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Products */}
        <CommandGroup heading="Products & SKUs">
          {products.slice(0, 6).map((product) => (
            <CommandItem
              key={product.id}
              value={`${product.name} ${product.sku} ${product.category}`}
              onSelect={() =>
                handleSelect(() =>
                  navigate({ to: "/inventory/$productId", params: { productId: product.id } }),
                )
              }
            >
              <Boxes className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium text-foreground">{product.name}</span>
                <span className="text-xs text-muted-foreground">{product.sku}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Shipments */}
        <CommandGroup heading="Active Shipments">
          {shipments.slice(0, 5).map((s) => (
            <CommandItem
              key={s.id}
              value={`${s.trackingId} ${s.orderRef} ${s.destination} ${s.carrier}`}
              onSelect={() =>
                handleSelect(() =>
                  navigate({ to: "/shipments/$shipmentId", params: { shipmentId: s.id } }),
                )
              }
            >
              <Truck className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium text-foreground">{s.trackingId}</span>
                <span className="text-xs text-muted-foreground">
                  → {s.destination} ({s.status})
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Warehouses */}
        <CommandGroup heading="Warehouses">
          {warehouses.map((w) => (
            <CommandItem
              key={w.id}
              value={`${w.name} ${w.city} ${w.code}`}
              onSelect={() => handleSelect(() => navigate({ to: "/inventory" }))}
            >
              <WarehouseIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium text-foreground">
                  {w.name} ({w.code})
                </span>
                <span className="text-xs text-muted-foreground">{w.city}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Priority Alerts */}
        <CommandGroup heading="Priority Alerts">
          {alerts
            .filter((a) => !a.resolved)
            .slice(0, 4)
            .map((alert) => (
              <CommandItem
                key={alert.id}
                value={`${alert.title} ${alert.message}`}
                onSelect={() =>
                  handleSelect(() => {
                    if (alert.refType === "product") {
                      navigate({ to: "/inventory/$productId", params: { productId: alert.refId } });
                    } else {
                      navigate({
                        to: "/shipments/$shipmentId",
                        params: { shipmentId: alert.refId },
                      });
                    }
                  })
                }
              >
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground text-xs">{alert.title}</span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {alert.message}
                  </span>
                </div>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
