import * as React from "react";
import { cn } from "@/lib/utils"; // conditional class helper

const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-3 overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress };
