import { createContext, useContext } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  OptionHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ResponsiveContainer } from "recharts";

export function cn(...values: Array<false | null | string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "icon" | "icon-sm" | "lg" | "sm";
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
};

export function Button({ className, size = "default", type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        variant === "link" && "text-primary underline-offset-4 hover:underline",
        variant === "outline" && "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        size === "default" && "h-9 px-4 py-2",
        size === "sm" && "h-8 rounded-md px-3 text-xs",
        size === "lg" && "h-10 rounded-md px-6",
        size === "icon" && "size-9",
        size === "icon-sm" && "size-8",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
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

export function ToggleGroup({ children, className, disabled = false, onValueChange, size: _size, type: _type, value, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ disabled, onValueChange, value }}>
      <div className={cn("inline-flex items-center rounded-md border border-border bg-background p-0.5", className)} {...props}>
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
};

export function ToggleGroupItem({ children, className, disabled, onClick, value, ...props }: ToggleGroupItemProps) {
  const group = useContext(ToggleGroupContext);
  const pressed = group.value === value;

  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-7 items-center justify-center rounded px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        pressed && "bg-accent text-accent-foreground",
        className,
      )}
      disabled={disabled ?? group.disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          group.onValueChange?.(pressed ? "" : value);
        }
      }}
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
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange" | "type"> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ checked = false, className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <input
      aria-checked={checked === "indeterminate" ? "mixed" : checked}
      checked={checked === true}
      className={cn("size-4 rounded border border-input accent-primary", className)}
      onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
      type="checkbox"
      {...props}
    />
  );
}

export function Item({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start gap-3 rounded-lg border border-border p-3", className)} {...props} />;
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 flex-1 space-y-1", className)} {...props} />;
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

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

export function ChartContainer({ children, className, config, style, ...props }: ChartContainerProps) {
  const chartVariables: Record<string, string> = {};

  for (const [key, entry] of Object.entries(config)) {
    if (entry.color) {
      chartVariables[`--color-${key}`] = entry.color;
    }
  }

  return (
    <div
      className={cn("charts-container min-h-32 w-full text-xs", className)}
      style={{ ...(chartVariables as CSSProperties), ...style }}
      {...props}
    >
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
