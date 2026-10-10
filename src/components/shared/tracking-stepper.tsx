import { cn } from "@/lib/utils";
import { TrackingStage } from "@/services/tracking";
import { Check, Clock, CircleDot } from "lucide-react";

interface TrackingStepperProps {
  stages: TrackingStage[];
}

export function TrackingStepper({ stages }: TrackingStepperProps) {
  return (
    <div className="w-full py-4">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-muted -z-0" />

        {stages.map((stage, idx) => {
          const isDone = stage.state === "done";
          const isActive = stage.state === "active";
          const isPending = stage.state === "pending";

          return (
            <div
              key={stage.name}
              className="flex flex-col items-center relative z-10 bg-background/80 px-2"
            >
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center border-2 transition-all shadow-xs",
                  isDone && "bg-emerald-600 border-emerald-600 text-white",
                  isActive && "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-5" />
                ) : isActive ? (
                  <CircleDot className="size-5" />
                ) : (
                  <span className="text-xs font-semibold">{idx + 1}</span>
                )}
              </div>

              <span
                className={cn(
                  "mt-2 text-xs font-semibold text-center whitespace-nowrap",
                  isDone && "text-emerald-600 dark:text-emerald-400 font-bold",
                  isActive && "text-blue-600 dark:text-blue-400 font-bold",
                  isPending && "text-muted-foreground"
                )}
              >
                {stage.name}
              </span>

              <span className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                {stage.state}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="md:hidden flex flex-col space-y-4 pl-2 border-l-2 border-border ml-4">
        {stages.map((stage, idx) => {
          const isDone = stage.state === "done";
          const isActive = stage.state === "active";
          const isPending = stage.state === "pending";

          return (
            <div key={stage.name} className="flex items-start gap-3 relative -left-[17px]">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center border-2 transition-all bg-background shrink-0",
                  isDone && "bg-emerald-600 border-emerald-600 text-white",
                  isActive && "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : isActive ? (
                  <CircleDot className="size-4" />
                ) : (
                  <span className="text-[11px] font-semibold">{idx + 1}</span>
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isDone && "text-emerald-600 dark:text-emerald-400",
                    isActive && "text-blue-600 dark:text-blue-400 font-bold",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">
                  Status: {stage.state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
