import { createContext, useContext, useId } from "react";
import { ResponsiveContainer } from "recharts";

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  OptionHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export function cn(...values: Array<false | null | string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "icon" | "icon-sm" | "lg" | "sm";
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
};

export function Button({
  className,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        variant === "link" && "text-primary underline-offset-4 hover:underline",
        variant === "outline" &&
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        size === "default" && "h-9 px-4 py-2",
        size === "sm" && "h-8 rounded-md px-3 text-xs",
        size === "lg" && "h-10 rounded-md px-6",
        size === "icon" && "size-9",
        size === "icon-sm" && "size-8",
        className,
      )}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      type={type}
      {...props}
    />
  );
}

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function NativeSelectOption(props: OptionHTMLAttributes<HTMLOptionElement>) {
  return <option {...props} />;
}

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  max?: number;
  value?: number | null;
};

export function Progress({ className, max = 100, value = 0, ...props }: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value ?? 0, 0), safeMax) : 0;
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      {...props}
    >
      <div className="h-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
    </div>
  );
}

type ToggleGroupContextValue = {
  disabled: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue>({ disabled: false });

type ToggleGroupProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  size?: "default" | "sm";
  type: "single";
  value?: string;
};

export function ToggleGroup({
  children,
  className,
  disabled = false,
  onValueChange,
  role = "group",
  size = "default",
  type: _type,
  value,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ disabled, onValueChange, value }}>
      <div
        className={cn("group/toggle-group flex w-fit flex-row items-center rounded-md", className)}
        data-orientation="horizontal"
        data-size={size}
        data-slot="toggle-group"
        data-spacing="0"
        role={role}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
};

export function ToggleGroupItem({
  children,
  className,
  disabled,
  onClick,
  role = "radio",
  value,
  ...props
}: ToggleGroupItemProps) {
  const group = useContext(ToggleGroupContext);
  const pressed = group.value === value;
  const isDisabled = disabled ?? group.disabled;

  return (
    <button
      aria-checked={pressed}
      className={cn(
        "group/toggle inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-md bg-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted",
        className,
      )}
      data-slot="toggle-group-item"
      data-state={pressed ? "on" : "off"}
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !isDisabled) {
          group.onValueChange?.(pressed ? "" : value);
        }
      }}
      role={role}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        variant === "destructive" && "border-transparent bg-destructive text-white",
        variant === "outline" && "border-border text-foreground",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
        className,
      )}
      data-slot="badge"
      data-variant={variant}
      {...props}
    />
  );
}

function hasPaddingOverride(className: string | undefined): boolean {
  return Boolean(className?.split(/\s+/).some((token) => /^(?:p|px|py|pt|pr|pb|pl)-/.test(token)));
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group/card flex flex-col gap-3 overflow-hidden py-3.5 text-sm text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
      data-slot="card"
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group/card-header grid auto-rows-min items-start gap-1 px-3.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base leading-snug font-medium", className)}
      data-slot="card-title"
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(hasPaddingOverride(className) ? undefined : "px-3.5", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center border-t bg-muted/50 p-3.5", className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "onChange" | "type"
> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  checked = false,
  className,
  disabled = false,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  return (
    <input
      {...props}
      aria-checked={checked === "indeterminate" ? "mixed" : checked}
      checked={checked === true}
      className={cn("size-4 rounded border border-input accent-primary", className)}
      data-slot="checkbox"
      disabled={disabled}
      onChange={(event) => {
        if (!disabled) {
          onCheckedChange?.(event.currentTarget.checked);
        }
      }}
      type="checkbox"
    />
  );
}

type ItemProps = HTMLAttributes<HTMLDivElement> & {
  variant?: string;
};

export function Item({ className, variant, ...props }: ItemProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-start gap-3 rounded-lg border border-border p-3",
        className,
      )}
      data-slot="item"
      data-variant={variant}
      {...props}
    />
  );
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      data-slot="item-content"
      {...props}
    />
  );
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm leading-snug font-medium text-foreground", className)}
      data-slot="item-title"
      {...props}
    />
  );
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      data-slot="item-description"
      {...props}
    />
  );
}

const CHART_THEMES = { light: "", dark: ".dark" } as const;
const INITIAL_CHART_DIMENSION = { width: 320, height: 200 } as const;

export type ChartConfig = Record<
  string,
  {
    color?: string;
    label?: ReactNode;
    theme?: Record<string, string>;
  }
>;

export type ChartContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactElement;
  config: ChartConfig;
};

function ChartStyle({ config, id }: { config: ChartConfig; id: string }) {
  const colorConfig = Object.entries(config).filter(([, entry]) => entry.theme ?? entry.color);

  if (colorConfig.length === 0) {
    return null;
  }

  const css = Object.entries(CHART_THEMES)
    .map(([theme, prefix]) => {
      const variables = colorConfig
        .map(([key, entry]) => {
          const color = entry.theme?.[theme] ?? entry.color;
          return color ? `  --color-${key}: ${color};` : null;
        })
        .filter(Boolean)
        .join("\n");

      return `${prefix} [data-chart=${id}] {\n${variables}\n}`;
    })
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function ChartContainer({
  children,
  className,
  config,
  style,
  ...props
}: ChartContainerProps) {
  const uniqueId = useId();
  const chartId = `chart-${props.id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <div
      className={cn(
        "charts-container flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
        className,
      )}
      data-chart={chartId}
      data-slot="chart"
      style={style}
      {...props}
    >
      <ChartStyle config={config} id={chartId} />
      <ResponsiveContainer initialDimension={INITIAL_CHART_DIMENSION}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
