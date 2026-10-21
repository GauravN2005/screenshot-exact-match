import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useDemoStore, demoStore } from "@/hooks/use-demo-store";
import { Bell, CheckCheck, ExternalLink, X } from "lucide-react";
import { SeverityBadge } from "@/components/StatusBadge";
import { Link } from "@tanstack/react-router";

export function NotificationPopover() {
  const { alerts } = useDemoStore();
  const unreadAlerts = alerts.filter((a) => !a.resolved);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-lg border-border hover:bg-accent/80 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4 text-foreground" />
          {unreadAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
              {unreadAlerts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 glass-panel shadow-2xl rounded-xl overflow-hidden border-border"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-foreground">Operational Alerts</h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {unreadAlerts.length} active
            </span>
          </div>
          {unreadAlerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                unreadAlerts.forEach((a) => demoStore.dismissAlert(a.id));
              }}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {unreadAlerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No active operational alerts. Everything running smoothly.
            </div>
          ) : (
            unreadAlerts.map((alert) => {
              const targetRoute =
                alert.refType === "product"
                  ? `/inventory/${alert.refId}`
                  : `/shipments/${alert.refId}`;

              return (
                <div
                  key={alert.id}
                  className="p-3.5 hover:bg-muted/30 transition-colors group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <Link
                          to={targetRoute}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          View item <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute top-3 right-3 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                      onClick={() => demoStore.dismissAlert(alert.id)}
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
