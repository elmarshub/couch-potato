"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AVATAR_PRESETS } from "@/lib/avatar-presets";
import { useUpdateProfile } from "@/features/auth/queries";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/utils";

export function AvatarPicker() {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { mutateAsync: updateProfile } = useUpdateProfile();

  async function handleSelect(presetId: string) {
    setPendingId(presetId);
    try {
      await updateProfile({ avatarPreset: presetId });
      toast.success("Avatar updated");
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to update avatar";
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-sm font-medium text-red-500 hover:underline"
      >
        {open ? "Cancel" : "Change avatar"}
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap gap-3">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={pendingId !== null}
              onClick={() => handleSelect(preset.id)}
              aria-label={`Use ${preset.id.replace("-", " ")} avatar`}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center cursor-pointer rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50",
                pendingId === preset.id && "animate-pulse",
              )}
              style={{ backgroundColor: preset.background }}
            >
              <preset.icon className="h-6 w-6 text-white" strokeWidth={2} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
