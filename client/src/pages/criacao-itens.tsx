import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-[#0361ad] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="text-white hover:bg-white/10"
              data-testid="button-voltar"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/90">GDF</span>
              <h1 className="text-lg font-bold text-white">
                Criação de Itens e Especificações Técnicas
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content Area (Left Column) */}
        <div className="flex flex-1 flex-col overflow-auto p-8">
          <div className="mx-auto max-w-4xl">
            <Form {...form}>
              <form className="space-y-6">
                {/* Título do Item */}
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
                          data-testid="input-titulo"
                          aria-label="Campo de texto. Digite o nome do item a ser criado."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoria */}
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

                {/* Código/Identificação (Referência) */}
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

                {/* Descrição Técnico */}
                <FormField
                  control={form.control}
                  name="descricaoTecnico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Técnico</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Informe a descrição do item"
                          rows={4}
                          data-testid="textarea-descricao"
                          aria-label="Campo de texto. Informe a descrição do item."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Especificações */}
                <FormField
                  control={form.control}
                  name="especificacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Digite as especificações técnicas do item"
                          rows={4}
                          data-testid="textarea-especificacoes"
                          aria-label="Campo de texto. Digite as especificações técnicas do item."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Características Técnicas */}
                <FormField
                  control={form.control}
                  name="caracteristicasTecnicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Características Técnicas</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Informe as características técnicas do item"
                          rows={4}
                          data-testid="textarea-caracteristicas"
                          aria-label="Campo de texto. Informe as características técnicas do item."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Normas e Referências Aplicáveis */}
                <FormField
                  control={form.control}
                  name="normasReferencias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Normas e Referências Aplicáveis</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Informe as normas e referências aplicáveis"
                          rows={4}
                          data-testid="textarea-normas"
                          aria-label="Campo de texto. Informe as normas e referências aplicáveis."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aplicação */}
                <FormField
                  control={form.control}
                  name="aplicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aplicação</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva a aplicação do item"
                          rows={4}
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
