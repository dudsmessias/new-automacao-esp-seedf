import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { insertItemEspecificacaoSchema, CategoriaItem, SubcategoriaItem } from "@shared/schema";
import { useState, useEffect } from "react";

// Extend shared schema with validation
const itemFormSchema = insertItemEspecificacaoSchema.extend({
  titulo: z.string().min(1, "Título é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  subcategoria: z.string().min(1, "Subcategoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

// Mapeamento de subcategorias por categoria
const subcategoriasPorCategoria: Record<string, SubcategoriaItem[]> = {
  [CategoriaItem.DESCRICAO]: [
    SubcategoriaItem.ACESSORIOS,
    SubcategoriaItem.ACABAMENTOS,
    SubcategoriaItem.CONSTITUINTES,
    SubcategoriaItem.PROTOTIPO_COMERCIAL,
    SubcategoriaItem.TEXTO_GERAL,
  ],
  [CategoriaItem.FICHA_DE_REFERENCIA]: [
    SubcategoriaItem.CATALOGO_SERVICOS,
    SubcategoriaItem.TEXTO_GERAL,
  ],
  // As demais categorias não têm subcategorias definidas ainda
  [CategoriaItem.APLICACAO]: [],
  [CategoriaItem.EXECUCAO]: [],
  [CategoriaItem.RECEBIMENTO]: [],
  [CategoriaItem.SERVICOS_INCLUIDOS]: [],
  [CategoriaItem.CRITERIOS_MEDICAO]: [],
  [CategoriaItem.LEGISLACAO]: [],
  [CategoriaItem.REFERENCIA]: [],
};

export default function CriacaoItens() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subcategorias, setSubcategorias] = useState<SubcategoriaItem[]>([]);

  // Get user data
  const userDataStr = localStorage.getItem("esp_auth_user");
  const user = userDataStr ? JSON.parse(userDataStr) : null;

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      titulo: "",
      categoria: CategoriaItem.DESCRICAO,
      subcategoria: SubcategoriaItem.TEXTO_GERAL,
      descricao: "",
    },
  });

  // Watch categoria changes to update subcategorias
  const categoriaAtual = form.watch("categoria");
  
  useEffect(() => {
    if (categoriaAtual) {
      const novasSubcategorias = subcategoriasPorCategoria[categoriaAtual] || [];
      setSubcategorias(novasSubcategorias);
      
      // Se a categoria mudou e tem subcategorias disponíveis, define a primeira
      if (novasSubcategorias.length > 0) {
        form.setValue("subcategoria", novasSubcategorias[0]);
      }
    }
  }, [categoriaAtual, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("POST", "/api/itens-especificacao", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Item técnico criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/itens-especificacao"] });
      form.reset({
        titulo: "",
        categoria: CategoriaItem.DESCRICAO,
        subcategoria: SubcategoriaItem.TEXTO_GERAL,
        descricao: "",
      });
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
    form.reset({
      titulo: "",
      categoria: CategoriaItem.DESCRICAO,
      subcategoria: SubcategoriaItem.TEXTO_GERAL,
      descricao: "",
    });
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
              <form className="space-y-6 max-w-3xl">
                {/* Campo 1: Título do Item */}
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

                {/* Campo 2: Categoria */}
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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
                          {Object.values(CategoriaItem).map((categoria) => (
                            <SelectItem key={categoria} value={categoria}>
                              {categoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo 3: Subcategorias (dependente da categoria) */}
                <FormField
                  control={form.control}
                  name="subcategoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategorias *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={subcategorias.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-11"
                            data-testid="select-subcategoria"
                            aria-label="Campo de seleção. Escolha um item existente para referência."
                          >
                            <SelectValue 
                              placeholder={
                                subcategorias.length === 0 
                                  ? "Nenhuma subcategoria disponível para esta categoria" 
                                  : "Selecione a subcategoria"
                              } 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategorias.map((subcategoria) => (
                            <SelectItem key={subcategoria} value={subcategoria}>
                              {subcategoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo 4: Descrição (multilinha) */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Informe a descrição do item"
                          rows={6}
                          className="resize-y"
                          data-testid="textarea-descricao"
                          aria-label="Campo de texto. Informe a descrição do item."
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
