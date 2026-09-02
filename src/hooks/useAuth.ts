import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authService, AuthResponse, LoginRequest } from "../lib/auth-service";
import { buildVerifyEmailUrl } from "../lib/email-verification";
import { userService } from "../lib/user-service";

interface ApiErrorBody {
  message?: string | string[];
  code?: string;
  email?: string;
}

function extractErrorMessage(error: AxiosError<ApiErrorBody> | null): string {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(". ");
  }
  return message || "Authentication failed";
}

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await userService.getMe();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isAuthenticated = !!user;

  const loginMutation = useMutation<
    AuthResponse,
    AxiosError<ApiErrorBody>,
    LoginRequest
  >({
    mutationFn: (data) => authService.login(data),
    onSuccess: (data) => {
      queryClient.clear();

      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(
        `Welcome back, ${data.user?.firstName || data.user?.profile?.firstName || "Legacy Builder"}!`,
      );
      try {
        const sp = new URLSearchParams(window.location.search);
        const next = sp.get("next") || "/";
        window.location.replace(next);
      } catch {
        window.location.replace("/");
      }
    },
    onError: async (error, variables) => {
      const errorMessage = extractErrorMessage(error);
      const errorCode = error.response?.data?.code;
      const email = error.response?.data?.email || variables.email;

      if (
        errorCode === "EMAIL_NOT_VERIFIED" ||
        errorMessage.toLowerCase().includes("not verified")
      ) {
        try {
          if (email) {
            await authService.resendVerificationEmail(email);
            toast.success(
              "A fresh verification code has been sent to your email.",
            );
          }
        } catch (resendError) {
          const resendMessage = extractErrorMessage(
            resendError as AxiosError<ApiErrorBody>,
          );
          toast.error(resendMessage);
        }

        const sp = new URLSearchParams(window.location.search);
        const next = sp.get("next") || "/";
        window.location.replace(
          buildVerifyEmailUrl({
            email,
            next,
          }),
        );
        return;
      }

      if (errorMessage.toLowerCase().includes("mfa code required")) {
        return;
      }

      toast.error(errorMessage);
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local user view even when the server session has expired.
    }
    queryClient.clear();
    queryClient.setQueryData(["me"], null);
    toast.success("Securely signed out");
    window.location.replace("/login");
  };

  return {
    user: user?.user || user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    refetchUser: refetch,
  };
}
