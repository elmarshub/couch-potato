import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormAlertProps {
  tone: "error" | "success";
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function FormAlert({ tone, children, action }: FormAlertProps) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={`mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm ${
        isError
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-2">
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}
