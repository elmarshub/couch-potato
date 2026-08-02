"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useUpdateProfile } from "@/features/auth/queries";
import { ApiError } from "@/lib/http";
import { AvatarPicker } from "@/components/profile/avatar-picker";

interface ProfileFormProps {
  user: {
    name?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [submitting, setSubmitting] = useState(false);
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const originalName = (user.name ?? "").trim();
  const trimmedName = name.trim();
  const hasChanges = trimmedName.length > 0 && trimmedName !== originalName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trimmedName;

    if (trimmed === originalName) {
      toast("No changes to save", { icon: "ℹ️" });
      return;
    }
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      await updateProfile({ name: trimmed });
      toast.success("Profile updated successfully");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>Update your display name and avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Avatar</Label>
          <AvatarPicker />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2 items-center ">
            <Button
              type="submit"
              disabled={submitting || !hasChanges}
              className={`bg-red-600 hover:bg-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                submitting ? "opacity-80" : ""
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Profile"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
