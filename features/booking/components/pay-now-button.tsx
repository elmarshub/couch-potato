"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useCreateCheckoutMutation } from "../queries";
import { ApiError } from "@/lib/http";

interface PayNowButtonProps {
  bookingId: string;
}

export function PayNowButton({ bookingId }: PayNowButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const checkoutMutation = useCreateCheckoutMutation();

  const handleClick = async () => {
    setIsRedirecting(true);
    try {
      const { checkoutUrl } = await checkoutMutation.mutateAsync(bookingId);
      window.location.href = checkoutUrl;
    } catch (error) {
      setIsRedirecting(false);
      const message =
        error instanceof ApiError ? error.message : "Failed to start checkout";
      toast.error(message);
    }
  };

  return (
    <Button
      size="sm"
      className="bg-red-600 hover:bg-red-700 cursor-pointer"
      onClick={handleClick}
      disabled={isRedirecting}
    >
      {isRedirecting ? "Redirecting..." : "Pay now"}

    </Button>
  );
}
