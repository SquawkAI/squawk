"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const errorMessages: Record<string, string> = {
  OAuthSignin: "Could not connect to provider.",
  OAuthCallback: "OAuth callback failed.",
  OAuthCreateAccount: "Could not create account from provider.",
  EmailCreateAccount: "Email sign-in failed.",
  Callback: "Sign-in callback error.",
  SupabaseInsertFailed: "There was an issue creating your account. Please try again.",
  CredentialsSignin: "Invalid credentials.",
  default: "Something went wrong during sign-in.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = errorMessages[error ?? ""] || errorMessages.default;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Sign In</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Sign-in Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Insert your actual sign-in buttons here */}
        <div className="pt-4">
          {/* Example: <SignInWithGoogleButton /> */}
        </div>
      </div>
    </div>
  );
}
