import { Check, X } from "lucide-react";
import { passwordChecks } from "../schemas";

export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {passwordChecks(password).map((check) => (
        <li
          key={check.label}
          className={`flex items-center gap-2 text-xs ${
            check.met ? "text-emerald-400" : "text-white/50"
          }`}
        >
          {check.met ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {check.label}
        </li>
      ))}
    </ul>
  );
}
