"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { routes } from "@/lib/routes";

const AUTH_PATHS: string[] = [
  routes.login,
  routes.signup,
  routes.forgotPassword,
  routes.resetPassword,
];

export function AppToaster() {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (isAuthPage) {
    return (
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(20, 20, 20, 0.95)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
          },
          success: { iconTheme: { primary: "#e50914", secondary: "#fff" } },
        }}
      />
    );
  }

  return (
    <Toaster
      position="top-right"
      toastOptions={{ duration: 4000, className: "!mt-20" }}
    />
  );
}
