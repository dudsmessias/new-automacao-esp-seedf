import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { clearAuthUser, saveAuthUser } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthState = "checking" | "authenticated" | "redirecting" | "error";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  const checkAuth = useCallback(async () => {
    setAuthState("checking");
    setErrorMessage("");

    // Always verify with backend (don't trust localStorage alone)
    try {
      const token = localStorage.getItem("esp_auth_token");
      
      if (!token) {
        clearAuthUser();
        setAuthState("redirecting");
        setTimeout(() => setLocation("/login"), 100);
        return;
      }

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Unauthorized - clear session and redirect
        clearAuthUser();
        localStorage.removeItem("esp_auth_token");
        setAuthState("redirecting");
        setTimeout(() => setLocation("/login"), 100);
        return;
      }

      if (!response.ok) {
        // Server error - show error but don't redirect yet
        setErrorMessage(`Erro de servidor (${response.status}). Clique para tentar novamente.`);
        setAuthState("error");
        return;
      }

      // Success - save user data and mark as authenticated
      const data = await response.json();
      if (data.user) {
        saveAuthUser(data.user);
      }
      setAuthState("authenticated");
    } catch (error) {
      // Network error - show error but keep session
      console.error("Auth check failed:", error);
      setErrorMessage("Erro de conexão. Clique para tentar novamente.");
      setAuthState("error");
    }
  }, [setLocation]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, retryTrigger]);

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-institutional-blue flex items-center justify-center">
        <div className="text-white text-xl">Verificando autenticação...</div>
      </div>
    );
  }

  if (authState === "redirecting") {
    return (
      <div className="min-h-screen bg-institutional-blue flex items-center justify-center">
        <div className="text-white text-xl">Redirecionando para login...</div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="min-h-screen bg-institutional-blue flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white text-xl">{errorMessage}</div>
          <button
            onClick={() => setRetryTrigger(prev => prev + 1)}
            className="px-6 py-2 bg-institutional-yellow text-black font-semibold rounded hover:opacity-90"
          >
            Tentar Novamente
          </button>
          <div>
            <button
              onClick={() => {
                clearAuthUser();
                setLocation("/login");
              }}
              className="text-white underline"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
