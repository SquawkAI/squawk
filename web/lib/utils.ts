import type { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


type ApiErrorBody = { error?: string; message?: string };
export function parseError(e: unknown): { message: string; status?: number } {
  // Axios
  if (typeof e === "object" && e && "isAxiosError" in e) {
    const ax = e as AxiosError<ApiErrorBody>;
    return {
      message: ax.response?.data?.error || ax.message || "Request failed.",
      status: ax.response?.status,
    };
  }

  // Custom `{ response: { status, data } }` shape
  if (
    typeof e === "object" &&
    e !== null &&
    "response" in e &&
    typeof (e).response === "object"
  ) {
    const resp = (e).response as { status?: number; data?: ApiErrorBody };
    return {
      message: resp?.data?.error || "Request failed.",
      status: resp?.status,
    };
  }

  // Native Error
  if (e instanceof Error) return { message: e.message };

  return { message: "Something went wrong." };
}
