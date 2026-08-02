import Link from "next/link";
import { Logo } from "@/components/general/logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: {
    prompt: string;
    linkLabel: string;
    href: string;
  };
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="glass-panel rounded-2xl p-8 shadow-2xl">
      <div className="mb-8 flex items-center justify-center">
        <Link href="/" aria-label="Go to home page" className="transition-opacity hover:opacity-80">
          <Logo textClassName="text-3xl" />
        </Link>
      </div>

      <div className="mb-6 text-center">
        <h1 className="mb-1 text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>

      {children}

      <p className="mt-6 text-center text-sm text-white/60">
        {footer.prompt}{" "}
        <Link
          href={footer.href}
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
