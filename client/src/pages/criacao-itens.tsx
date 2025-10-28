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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertItemEspecificacaoSchema } from "@shared/schema";

// Extend shared schema with validation
const itemFormSchema = insertItemEspecificacaoSchema.extend({
  titulo: z.string().min(1, "Título é obrigatório"),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

const categoriaLabels: Record<string, string> = {
  ELETRICA: "Elétrica",
  HIDROSSANITARIO: "Hidrossanitário",
  ACABAMENTOS: "Acabamentos",
  ESTRUTURA: "Estrutura",
  OUTROS: "Outros",
};

export default function CriacaoItens() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data
  const userDataStr = localStorage.getItem("esp_auth_user");
  const user = userDataStr ? JSON.parse(userDataStr) : null;

  // Fetch existing items for reference
  const { data: itensData } = useQuery<{ itens: any[] }>({
    queryKey: ["/api/itens-especificacao"],
  });

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      titulo: "",
      categoria: "OUTROS",
      codigoReferencia: undefined,
      descricaoTecnico: undefined,
      especificacoes: undefined,
      caracteristicasTecnicas: undefined,
      normasReferencias: undefined,
      aplicacao: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("/api/itens-especificacao", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Item técnico criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/itens-especificacao"] });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar item técnico",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    form.handleSubmit((data) => {
      createMutation.mutate(data);
    })();
  };

  const handleRefresh = () => {
    form.reset();
  };

  const handleLogout = () => {
    localStorage.removeItem("esp_auth_user");
    localStorage.removeItem("esp_auth_token");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header padrão do sistema */}
      <AuthHeader
        userName={user?.nome || ""}
        userRole={user?.perfil || ""}
        onLogout={handleLogout}
      />

      {/* Breadcrumb / Navigation */}
      <div className="border-b bg-card px-6 py-3">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="gap-2 text-sm"
          data-testid="button-voltar"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content Area (Left Column) - Scrollable */}
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">
              Criação de Itens e Especificações Técnicas
            </h1>

            <Form {...form}>
              <form className="space-y-6">
                {/* Row 1: Título (full width) e Categoria */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Item *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Digite o nome do item a ser criado"
                            className="h-11"
                            data-testid="input-titulo"
                            aria-label="Campo de texto. Digite o nome do item a ser criado."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="h-11"
                              data-testid="select-categoria"
                              aria-label="Campo de seleção. Escolha a categoria do item."
                            >
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoriaLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Código/Identificação (full width) */}
                <FormField
                  control={form.control}
                  name="codigoReferencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código/Identificação (Referência)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-11"
                            data-testid="select-codigo-referencia"
                            aria-label="Campo de seleção. Escolha um item existente para referência."
                          >
                            <SelectValue placeholder="Selecione um item existente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itensData?.itens && itensData.itens.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum item disponível
                            </SelectItem>
                          ) : (
                            itensData?.itens?.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.titulo} ({categoriaLabels[item.categoria]})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 3: Descrição Técnico e Especificações */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="descricaoTecnico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Técnico</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Informe a descrição do item"
                            rows={6}
                            data-testid="textarea-descricao"
                            aria-label="Campo de texto. Informe a descrição do item."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="especificacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especificações</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Digite as especificações técnicas do item"
                            rows={6}
                            data-testid="textarea-especificacoes"
                            aria-label="Campo de texto. Digite as especificações técnicas do item."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 4: Características Técnicas e Normas e Referências */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="caracteristicasTecnicas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Características Técnicas</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Informe as características técnicas do item"
                            rows={6}
                            data-testid="textarea-caracteristicas"
                            aria-label="Campo de texto. Informe as características técnicas do item."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="normasReferencias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Normas e Referências Aplicáveis</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Informe as normas e referências aplicáveis"
                            rows={6}
                            data-testid="textarea-normas"
                            aria-label="Campo de texto. Informe as normas e referências aplicáveis."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 5: Aplicação (full width) */}
                <FormField
                  control={form.control}
                  name="aplicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aplicação</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Descreva a aplicação do item"
                          rows={6}
                          data-testid="textarea-aplicacao"
                          aria-label="Campo de texto. Descreva a aplicação do item."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        {/* Action Buttons (Right Column) */}
        <div className="flex w-48 flex-col gap-3 border-l bg-card p-4">
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-black text-white hover:bg-black/90"
            data-testid="button-save"
            aria-label="Botão Salvar — grava o item técnico"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="bg-black text-white hover:bg-black/90"
            data-testid="button-refresh"
            aria-label="Botão Atualizar — recarrega os campos"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>

          <Button
            variant="outline"
            className="bg-black text-white hover:bg-black/90"
            data-testid="button-open-pdf"
            aria-label="Botão Abrir PDF — gera ou abre o arquivo PDF"
          >
            <FileText className="mr-2 h-4 w-4" />
            Abrir PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
