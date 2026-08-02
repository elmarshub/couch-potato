export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_exists"
  | "weak_password"
  | "rate_limited"
  | "expired_link"
  | "validation"
  | "network"
  | "unknown";

export interface AuthFailure {
  code: AuthErrorCode;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
}

const MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "That email and password combination doesn't match our records.",
  email_not_confirmed: "Confirm your email address before signing in.",
  email_exists: "An account with this email already exists.",
  weak_password: "That password is too weak. Choose a stronger one.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
  expired_link: "This link has expired or was already used. Request a new one.",
  validation: "Check the highlighted fields and try again.",
  network: "We couldn't reach the server. Check your connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

interface SupabaseLikeError {
  code?: string;
  status?: number;
  message?: string;
}

export function mapAuthError(error: SupabaseLikeError): AuthFailure {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return {
      code: "invalid_credentials",
      message: MESSAGES.invalid_credentials,
      fieldErrors: { password: "Incorrect email or password" },
    };
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return { code: "email_not_confirmed", message: MESSAGES.email_not_confirmed };
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return {
      code: "email_exists",
      message: MESSAGES.email_exists,
      fieldErrors: { email: "This email is already registered" },
    };
  }

  if (code === "weak_password" || message.includes("password should be")) {
    return {
      code: "weak_password",
      message: MESSAGES.weak_password,
      fieldErrors: { password: "Choose a stronger password" },
    };
  }

  if (
    code === "same_password" ||
    message.includes("should be different from the old password")
  ) {
    return {
      code: "weak_password",
      message: "New password must be different from your current password.",
      fieldErrors: { password: "Choose a different password" },
    };
  }

  if (
    code === "session_not_found" ||
    message.includes("auth session missing") ||
    message.includes("session expired")
  ) {
    return { code: "expired_link", message: MESSAGES.expired_link };
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    error.status === 429 ||
    message.includes("rate limit")
  ) {
    return { code: "rate_limited", message: MESSAGES.rate_limited };
  }

  return { code: "unknown", message: error.message || MESSAGES.unknown };
}

export function authFailure(code: AuthErrorCode, message?: string): AuthFailure {
  return { code, message: message ?? MESSAGES[code] };
}
