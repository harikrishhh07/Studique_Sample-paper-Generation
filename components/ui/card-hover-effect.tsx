"use client"

import type React from "react"
import { cn } from "@/lib/utils"

// Strictly follow Studique website palette
const colors = {
  bg: "rgba(255, 255, 255, 0.05)",
  textPrimary: "#f5f5f7", 
  textSecondary: "#8e8e93",
  accentOrange: "#ff652f",
  hoverBg: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.15)",
  hoverBorder: "rgba(255, 255, 255, 0.25)",
}

export type FrostyLevel = "none" | "light" | "medium" | "heavy" | "intense";
export type RefractionMode = "light" | "dark" | "vibrant" | "subtle";
export type ElasticityLevel = "none" | "low" | "medium" | "high";
export type PaddingLevel = "none" | "small" | "medium" | "large";

export interface LiquidCardProps {
  children?: React.ReactNode;
  className?: string;
  frostyLevel?: FrostyLevel;
  refractionMode?: RefractionMode;
  elasticity?: ElasticityLevel;
  chromaticAberration?: boolean;
  paddingLevel?: PaddingLevel;
  disabled?: boolean;
  onClick?: () => void;
}

const frostyValues = {
  none: "blur(0px)",
  light: "blur(8px) saturate(120%)",
  medium: "blur(16px) saturate(140%)",
  heavy: "blur(24px) saturate(180%)",
  intense: "blur(40px) saturate(200%)",
};

const refractionValues = {
  light: "rgba(255, 255, 255, 0.1)",
  dark: "rgba(0, 0, 0, 0.2)",
  vibrant: "rgba(255, 255, 255, 0.05)",
  subtle: "rgba(255, 255, 255, 0.015)",
};

const paddingValues = {
  none: "p-0",
  small: "p-4 sm:p-5",
  medium: "p-4 sm:p-6 lg:p-8",
  large: "p-6 sm:p-8 lg:p-10",
};

const elasticityValues = {
  none: { hover: 1, tap: 1, stiffness: 0 },
  low: { hover: 1, tap: 0.99, stiffness: 400 },
  medium: { hover: 1, tap: 0.97, stiffness: 300 },
  high: { hover: 1, tap: 0.93, stiffness: 200 },
};

export const LiquidCard = ({
  children,
  className,
  frostyLevel = "medium",
  refractionMode = "vibrant",
  elasticity = "medium",
  chromaticAberration = false,
  paddingLevel = "medium",
  disabled = false,
  onClick,
}: LiquidCardProps) => {
  const tapScale =
    elasticity === "high" ? "active:scale-[0.93]" :
    elasticity === "medium" ? "active:scale-[0.97]" :
    elasticity === "low" ? "active:scale-[0.99]" : "";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative rounded-3xl w-full h-full overflow-hidden group transition-transform duration-300 will-change-transform",
        !disabled && tapScale,
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        paddingValues[paddingLevel],
        className
      )}
      style={{
        transform: "translateZ(0)", // Hardware acceleration for proper edge rendering
      }}
    >
      {/* Background Refraction Layer (stays standard, no background color shifting on hover unless explicitly defined below) */}
      <div
        className="absolute inset-0 z-0 transition-colors duration-300 group-hover:bg-[rgba(255,255,255,0.08)]"
        style={{
          backgroundColor: refractionValues[refractionMode],
          backdropFilter: frostyValues[frostyLevel],
          WebkitBackdropFilter: frostyValues[frostyLevel],
        }}
      />
      
      {/* Edge Lighting and Inner Shadow Layer */}
      <div 
        className="absolute inset-0 z-10 rounded-3xl pointer-events-none transition-all duration-300 border border-[rgba(255,255,255,0.15)] group-hover:border-[rgba(255,255,255,0.25)] group-hover:shadow-[inset_0_0_15px_rgba(255,101,47,0.1)]"
        style={{
          boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.25)`,
        }}
      />

      {/* Chromatic Aberration Layer (Edge only) */}
      {chromaticAberration && (
        <>
          <div className="absolute inset-0 z-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-screen" style={{ boxShadow: "inset 2px 0 6px rgba(255, 0, 0, 0.15)" }} />
          <div className="absolute inset-0 z-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-screen" style={{ boxShadow: "inset -2px 0 6px rgba(0, 255, 255, 0.15)" }} />
        </>
      )}

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};

export const Card = LiquidCard;

export const HoverEffect = ({
  items,
  className,
  suppressHydrationWarning,
}: {
  items: {
    id?: string
    title: string
    description: string
    longDescription?: string
    link?: string
    icon?: React.ComponentType<{ className?: string }>
    onClick?: () => void
    disabled?: boolean
    accentColor?: string
    customContent?: React.ReactNode
  }[]
  className?: string
  suppressHydrationWarning?: boolean
}) => {
  return (
    <div
      suppressHydrationWarning={suppressHydrationWarning}
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6", className)}
    >
      {items.map((item, idx) => (
        <div
          key={(item.id || item.title) + "-static"}
          className="relative block w-full h-full min-h-[120px] sm:min-h-[140px] lg:min-h-[170px]"
        >
          <LiquidCard 
            disabled={item.disabled} 
            onClick={item.onClick}
            frostyLevel="heavy"
            refractionMode="vibrant"
            elasticity="medium"
          >
            {item.customContent ? item.customContent : (
              <>
                {item.icon && (
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 transition-all duration-300"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {/* Strictly enforcing website palette orange for icons */}
                    <item.icon className={`text-lg md:text-xl ${item.disabled ? 'text-gray-500' : 'text-[#ff652f]'}`} />
                  </div>
                )}
                <CardTitle disabled={item.disabled}>{item.title}</CardTitle>
                <CardDescription 
                  disabled={item.disabled}
                  shortDescription={item.description} 
                  longDescription={item.longDescription} 
                />
              </>
            )}
          </LiquidCard>
        </div>
      ))}
    </div>
  )
}

export const CardTitle = ({
  className,
  children,
  disabled,
}: {
  className?: string
  children: React.ReactNode
  disabled?: boolean
}) => {
  return (
    <h4 
      className={cn("font-medium tracking-tight text-base sm:text-lg lg:text-xl mb-1 sm:mb-2", className)}
      style={{ color: disabled ? colors.textSecondary : colors.textPrimary }}
    >
      {children}
    </h4>
  )
}

export const CardDescription = ({
  className,
  shortDescription,
  longDescription,
  disabled,
}: {
  className?: string
  shortDescription: string
  longDescription?: string
  disabled?: boolean
}) => {
  return (
    <div className="flex-1 mt-1 lg:mt-2">
      <p 
        className={cn("lg:hidden leading-relaxed text-sm font-normal tracking-wide", className)}
        style={{ color: disabled ? "#555555" : colors.textSecondary }}
      >
        {shortDescription}
      </p>
      
      <p 
        className={cn("hidden lg:block leading-relaxed text-sm font-normal tracking-wide", className)}
        style={{ color: disabled ? "#555555" : colors.textSecondary }}
      >
        {longDescription || shortDescription}
      </p>
    </div>
  )
}