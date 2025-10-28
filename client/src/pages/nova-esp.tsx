import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/AuthHeader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

// Form schema for Nova ESP
const novaEspFormSchema = z.object({
  cadernosIds: z.array(z.string()).min(1, "Selecione pelo menos um caderno"),
});

type NovaEspFormData = z.infer<typeof novaEspFormSchema>;

export default function NovaEsp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data
  const userDataStr = localStorage.getItem("esp_auth_user");
  const user = userDataStr ? JSON.parse(userDataStr) : null;

  // Fetch available cadernos
  const { data: cadernosData, isLoading: isLoadingCadernos } = useQuery({
    queryKey: ["/api/cadernos"],
    enabled: !!user,
  });

  const form = useForm<NovaEspFormData>({
    resolver: zodResolver(novaEspFormSchema),
    defaultValues: {
      cadernosIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NovaEspFormData) => {
      const response = await apiRequest("POST", "/api/esp/nova", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sucesso",
        description: "Nova ESP criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/esp"] });
      
      // Navigate to the new ESP editor
      if (data?.esp?.id) {
        setLocation(`/esp/${data.esp.id}`);
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ESP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NovaEspFormData) => {
    createMutation.mutate(data);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/cadernos"] });
    form.reset({
      cadernosIds: [],
    });
    toast({
      title: "Atualizado",
      description: "Formulário limpo e dados recarregados",
    });
  };

  const handleOpenPDF = () => {
    toast({
      title: "Informação",
      description: "Salve a ESP primeiro para gerar o PDF",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthHeader />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
              aria-label="Voltar ao painel de controle"
              className="hover-elevate"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-black">Nova ESP</h1>
          </div>

          {/* Layout: Form area + Action buttons */}
          <div className="flex gap-6">
            {/* Main form area with scroll */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-6 max-h-[calc(100vh-200px)] overflow-auto">
              {/* Visual identifier - ESP box */}
              <div className="mb-6">
                <div 
                  className="inline-block px-6 py-2 rounded text-white font-bold text-lg"
                  style={{ backgroundColor: "#0361ad" }}
                >
                  ESP
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cadernosIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base font-semibold text-black">
                            Cadernos
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mt-1">
                            Selecione os cadernos que serão vinculados à nova ESP
                          </p>
                        </div>
                        
                        {isLoadingCadernos ? (
                          <div className="text-sm text-muted-foreground">
                            Carregando cadernos disponíveis...
                          </div>
                        ) : (cadernosData as any)?.cadernos && (cadernosData as any).cadernos.length > 0 ? (
                          <div className="space-y-3 border rounded-md p-4 max-h-96 overflow-auto">
                            {(cadernosData as any).cadernos.map((caderno: any) => (
                              <FormField
                                key={caderno.id}
                                control={form.control}
                                name="cadernosIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={caderno.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          data-testid={`checkbox-caderno-${caderno.id}`}
                                          checked={field.value?.includes(caderno.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, caderno.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== caderno.id
                                                  )
                                                );
                                          }}
                                          aria-label={`Selecionar caderno ${caderno.titulo}`}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-medium cursor-pointer">
                                          {caderno.titulo}
                                        </FormLabel>
                                        {caderno.descricao && (
                                          <p className="text-xs text-muted-foreground">
                                            {caderno.descricao}
                                          </p>
                                        )}
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground border rounded-md p-4">
                            Nenhum caderno disponível
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            {/* Action buttons - vertical on the right */}
            <div className="flex flex-col gap-3 w-48">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending}
                data-testid="button-save"
                className="gap-2 text-white hover:opacity-90 w-full justify-start"
                style={{ backgroundColor: "#000000" }}
                aria-label="Botão Salvar — cria a nova ESP com os cadernos selecionados"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              <Button
                onClick={handleRefresh}
                data-testid="button-refresh"
                className="gap-2 text-white hover:opacity-90 w-full justify-start"
                style={{ backgroundColor: "#000000" }}
                aria-label="Botão Atualizar — limpa o formulário e recarrega os dados"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button
                onClick={handleOpenPDF}
                disabled={true}
                data-testid="button-open-pdf"
                className="gap-2 text-white hover:opacity-90 w-full justify-start"
                style={{ backgroundColor: "#000000" }}
                aria-label="Botão Abrir PDF — disponível após salvar a ESP"
              >
                <FileText className="h-4 w-4" />
                Abrir PDF
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
