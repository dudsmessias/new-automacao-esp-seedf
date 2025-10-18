import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { PublicHeader } from "@/components/PublicHeader";
import { InstitutionalButton } from "@/components/InstitutionalButton";
import { PasswordInput } from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
  lembrar: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          senha: data.senha,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Credenciais inválidas");
      }

      // Save user and token to localStorage
      if (result.user) {
        localStorage.setItem("esp_auth_user", JSON.stringify(result.user));
      }
      if (result.token) {
        localStorage.setItem("esp_auth_token", result.token);
      }

      setLocation("/loading");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-institutional-blue flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-institutional-blue mb-6 text-center">
            Login
          </h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail institucional
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="usuario@seedf.df.gov.br"
                data-testid="input-email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="mt-1 focus-visible:ring-institutional-yellow"
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha
              </Label>
              <PasswordInput
                id="senha"
                {...register("senha")}
                data-testid="input-password"
                aria-required="true"
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? "senha-error" : undefined}
                className="mt-1 focus-visible:ring-institutional-yellow"
              />
              {errors.senha && (
                <p id="senha-error" className="text-sm text-destructive mt-1" role="alert">
                  {errors.senha.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="lembrar"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  data-testid="checkbox-remember"
                  aria-label="Lembrar-me"
                  className="focus-visible:ring-institutional-yellow"
                />
                <Label
                  htmlFor="lembrar"
                  className="text-sm font-normal cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>
              
              <Link
                href="/recover"
                className="text-institutional-blue hover:underline text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-institutional-blue focus-visible:ring-offset-2 rounded px-2 py-1"
                data-testid="link-recover"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <InstitutionalButton
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="button-login"
            >
              Entrar
            </InstitutionalButton>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/register"
              className="text-institutional-blue hover:underline text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-institutional-blue focus-visible:ring-offset-2 rounded px-2 py-1"
              data-testid="link-register"
            >
              Não tem uma conta? Registre-se
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
