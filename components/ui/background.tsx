import { cn } from "@/lib/utils";
import React from "react";

export default function Background() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0f0f0f] overflow-hidden">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(rgba(40,40,40,1)_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0f0f0f] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,#0f0f0f)]"></div>
    </div>
  );
}
