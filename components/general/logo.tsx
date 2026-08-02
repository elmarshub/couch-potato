import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
}

export function Logo({ className, textClassName }: LogoProps) {
  return (
    <span
      className={cn(
        "font-logo text-2xl tracking-wide text-[#E50914] uppercase",
        className,
        textClassName
      )}
    >
      Couch Potato
    </span>
  );
}
