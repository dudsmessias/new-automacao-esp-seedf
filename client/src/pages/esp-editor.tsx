import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthHeader } from "@/components/AuthHeader";
import { InstitutionalButton } from "@/components/InstitutionalButton";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, FileText, CalendarIcon, Loader2, Download, Trash2, File as FileIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Selo } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthUser } from "@/lib/auth";

const tabs = [
  { id: "identificacao", label: "Identificação" },
  { id: "projetos", label: "Projetos" },
  { id: "descricao", label: "Descrição e Aplicação" },
  { id: "execucao", label: "Execução" },
  { id: "fichas", label: "Fichas de Referência" },
  { id: "recebimento", label: "Recebimento" },
  { id: "servicos", label: "Serviços Incluídos" },
  { id: "criterios", label: "Critérios de Medição" },
  { id: "legislacao", label: "Legislação e Referências" },
  { id: "anexos", label: "Anexos" },
  { id: "visualizar-pdf", label: "Visualizar PDF" },
  { id: "exportar", label: "Exportar" },
];

const espFormSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  titulo: z.string().min(1, "Título é obrigatório"),
  tipologia: z.string().min(1, "Tipologia é obrigatória"),
  revisao: z.string().min(1, "Revisão é obrigatória"),
  dataPublicacao: z.date({ required_error: "Data de publicação é obrigatória" }),
  cadernoId: z.string().optional(),
  selo: z.nativeEnum(Selo),
  visivel: z.boolean(),
  descricaoAplicacao: z.string().optional(),
  execucao: z.string().optional(),
  fichasReferencia: z.string().optional(),
  recebimento: z.string().optional(),
  servicosIncluidos: z.string().optional(),
  criteriosMedicao: z.string().optional(),
  legislacao: z.string().optional(),
  referencias: z.string().optional(),
  introduzirComponente: z.string().optional(),
  constituentesIds: z.array(z.string()).optional(),
  acessoriosIds: z.array(z.string()).optional(),
  acabamentosIds: z.array(z.string()).optional(),
  prototiposIds: z.array(z.string()).optional(),
  aplicacoesIds: z.array(z.string()).optional(),
  constituintesExecucaoIds: z.array(z.string()).optional(),
  fichasReferenciaIds: z.array(z.string()).optional(),
  fichasRecebimentoIds: z.array(z.string()).optional(),
});

type EspFormData = z.infer<typeof espFormSchema>;

export default function EspEditor() {
  const [, params] = useRoute("/esp/:id/:tab?");
  const espId = params?.id;
  const urlTab = params?.tab || "identificacao";
  const [activeTab, setActiveTab] = useState(urlTab);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getAuthUser();
  const [numConstituintesExecucao, setNumConstituintesExecucao] = useState(5);
  const [numFichasReferencia, setNumFichasReferencia] = useState(1);
  const [numFichasRecebimento, setNumFichasRecebimento] = useState(1);

  // Sync active tab with URL
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  // Determine if creating new ESP
  const isNewEsp = espId === "novo";

  // Fetch cadernos for creating new ESP
  const { data: cadernosData } = useQuery({
    queryKey: ["/api/cadernos"],
    queryFn: async () => {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch("/api/cadernos", {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao carregar cadernos");
      return response.json();
    },
    enabled: isNewEsp,
  });

  // Fetch ESP data (skip if creating new)
  const { data: esp, isLoading, error } = useQuery({
    queryKey: ["/api/esp", espId],
    queryFn: async () => {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/esp/${espId}`, {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao carregar ESP");
      return response.json();
    },
    enabled: !!espId && !isNewEsp,
  });

  // Fetch Fichas de Recebimento catalog data
  const { data: fichasRecebimentoData } = useQuery({
    queryKey: ["/api/catalog/fichas-recebimento"],
    queryFn: async () => {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch("/api/catalog/fichas-recebimento", {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao carregar fichas de recebimento");
      return response.json();
    },
  });

  // Form setup
  const form = useForm<EspFormData>({
    resolver: zodResolver(espFormSchema),
    defaultValues: {
      codigo: "",
      titulo: "",
      tipologia: "",
      revisao: "",
      selo: Selo.NENHUM,
      visivel: true,
      descricaoAplicacao: "",
      execucao: "",
      fichasReferencia: "",
      recebimento: "",
      servicosIncluidos: "",
      criteriosMedicao: "",
      legislacao: "",
      referencias: "",
      introduzirComponente: "",
      constituentesIds: [],
      acessoriosIds: [],
      acabamentosIds: [],
      prototiposIds: [],
      aplicacoesIds: [],
      constituintesExecucaoIds: [],
      fichasReferenciaIds: [],
      fichasRecebimentoIds: [],
    },
  });

  // Update form when ESP data loads
  useEffect(() => {
    if (esp) {
      console.log("ESP data loaded, populating form:", esp);
      form.reset({
        codigo: esp.codigo || "",
        titulo: esp.titulo || "",
        tipologia: esp.tipologia || "",
        revisao: esp.revisao || "",
        dataPublicacao: esp.dataPublicacao ? new Date(esp.dataPublicacao) : undefined,
        selo: esp.selo || Selo.NENHUM,
        visivel: esp.visivel ?? true,
        descricaoAplicacao: esp.descricaoAplicacao || "",
        execucao: esp.execucao || "",
        fichasReferencia: esp.fichasReferencia || "",
        recebimento: esp.recebimento || "",
        servicosIncluidos: esp.servicosIncluidos || "",
        criteriosMedicao: esp.criteriosMedicao || "",
        legislacao: esp.legislacao || "",
        referencias: esp.referencias || "",
        introduzirComponente: esp.introduzirComponente || "",
        constituentesIds: esp.constituentesIds || [],
        acessoriosIds: esp.acessoriosIds || [],
        acabamentosIds: esp.acabamentosIds || [],
        prototiposIds: esp.prototiposIds || [],
        aplicacoesIds: esp.aplicacoesIds || [],
        constituintesExecucaoIds: esp.constituintesExecucaoIds || [],
        fichasReferenciaIds: esp.fichasReferenciaIds || [],
        fichasRecebimentoIds: esp.fichasRecebimentoIds || [],
      }, { keepDefaultValues: false });
      
      // Sync UI state with loaded data
      const execucaoIds = esp.constituintesExecucaoIds || [];
      const fichasIds = esp.fichasReferenciaIds || [];
      const recebimentoIds = esp.fichasRecebimentoIds || [];
      setNumConstituintesExecucao(Math.max(5, execucaoIds.length));
      setNumFichasReferencia(Math.max(1, fichasIds.length));
      setNumFichasRecebimento(Math.max(1, recebimentoIds.length));
    }
  }, [esp]);

  // Create/Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EspFormData) => {
      const token = localStorage.getItem("esp_auth_token");
      const url = isNewEsp ? "/api/esp" : `/api/esp/${espId}`;
      const method = isNewEsp ? "POST" : "PATCH";
      
      // For new ESP, ensure cadernoId is set
      let bodyData = { ...data };
      if (isNewEsp && !bodyData.cadernoId && cadernosData?.cadernos?.[0]?.id) {
        bodyData.cadernoId = cadernosData.cadernos[0].id;
      }
      
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Erro ao ${isNewEsp ? "criar" : "atualizar"} ESP`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/esp", espId] });
      queryClient.invalidateQueries({ queryKey: ["/api/esp"] });
      
      if (isNewEsp && data.esp?.id) {
        // Redirect to the newly created ESP
        setLocation(`/esp/${data.esp.id}/identificacao`);
      }
      
      toast({
        title: isNewEsp ? "ESP criada" : "ESP atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao atualizar ESP",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("esp_auth_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      localStorage.removeItem("esp_auth_user");
      localStorage.removeItem("esp_auth_token");
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("esp_auth_user");
      localStorage.removeItem("esp_auth_token");
      setLocation("/login");
    }
  };

  const handleSave = () => {
    form.handleSubmit((data) => {
      updateMutation.mutate(data);
    })();
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Fetch uploaded files for this ESP (skip if creating new)
  const { data: filesData } = useQuery<{ files: any[] }>({
    queryKey: ["/api/files", espId, "files"],
    queryFn: async () => {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/files/${espId}/files`, {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Erro ao carregar arquivos");
      return response.json();
    },
    enabled: !!espId && !isNewEsp,
  });

  useEffect(() => {
    if (filesData?.files) {
      setUploadedFiles(filesData.files);
    }
  }, [filesData]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      if (espId) {
        formData.append("espId", espId);
      }
      files.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch("/api/files/upload", {
        method: "POST",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const data = await response.json();

      toast({
        title: "Upload concluído",
        description: `${data.files.length} arquivo(s) enviado(s) com sucesso.`,
      });

      // Refresh file list
      queryClient.invalidateQueries({ queryKey: ["/api/files", espId, "files"] });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Não foi possível enviar os arquivos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/files/${fileId}/download`, {
        method: "GET",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Erro ao baixar arquivo");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Arquivo baixado",
        description: `"${filename}" foi baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Deseja realmente excluir "${filename}"?`)) return;

    try {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Erro ao deletar arquivo");

      toast({
        title: "Arquivo excluído",
        description: `"${filename}" foi excluído com sucesso.`,
      });

      // Refresh file list
      queryClient.invalidateQueries({ queryKey: ["/api/files", espId, "files"] });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/export/pdf/${espId}`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      
      if (!response.ok) throw new Error("Erro ao exportar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${esp?.codigo || "ESP"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF exportado",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportDOCX = async () => {
    try {
      const token = localStorage.getItem("esp_auth_token");
      const response = await fetch(`/api/export/docx/${espId}`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      
      if (!response.ok) throw new Error("Erro ao exportar DOCX");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${esp?.codigo || "ESP"}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "DOCX exportado",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o DOCX",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-institutional-blue" />
          <p className="text-muted-foreground">Carregando ESP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Erro ao carregar ESP</p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar para Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuthHeader
        userName={user?.nome || ""}
        userRole={user?.perfil || ""}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex">
        {/* Sidebar with Tabs */}
        <aside className="w-64 bg-card border-r p-4 overflow-y-auto">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          
          <nav className="space-y-1" role="navigation" aria-label="Seções da ESP">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setLocation(`/esp/${espId}/${tab.id}`);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-md text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-institutional-yellow",
                  activeTab === tab.id
                    ? "bg-institutional-yellow text-black font-medium"
                    : "hover:bg-muted"
                )}
                data-testid={`tab-${tab.id}`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "identificacao" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Identificação</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="tipologia">Tipologia</Label>
                    <Input
                      id="tipologia"
                      data-testid="input-tipologia"
                      className="mt-1"
                      placeholder="Ex: Edificação"
                      value={form.watch("tipologia") || ""}
                      onChange={(e) => form.setValue("tipologia", e.target.value)}
                    />
                    {form.formState.errors.tipologia && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.tipologia.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="codigo">ID do componente</Label>
                    <Input
                      id="codigo"
                      data-testid="input-codigo"
                      className="mt-1"
                      placeholder="ESP-XXX"
                      value={form.watch("codigo") || ""}
                      onChange={(e) => form.setValue("codigo", e.target.value)}
                    />
                    {form.formState.errors.codigo && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.codigo.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="revisao">Revisão</Label>
                    <Input
                      id="revisao"
                      data-testid="input-revisao"
                      className="mt-1"
                      placeholder="v1.0"
                      value={form.watch("revisao") || ""}
                      onChange={(e) => form.setValue("revisao", e.target.value)}
                    />
                    {form.formState.errors.revisao && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.revisao.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="data-publicacao">Data de Publicação</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="data-publicacao"
                          variant="outline"
                          className={cn(
                            "w-full mt-1 justify-start text-left font-normal",
                            !form.watch("dataPublicacao") && "text-muted-foreground"
                          )}
                          data-testid="button-date-publicacao"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("dataPublicacao") ? format(form.watch("dataPublicacao"), "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("dataPublicacao")}
                          onSelect={(date) => form.setValue("dataPublicacao", date as Date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.dataPublicacao && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.dataPublicacao.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="autor">Autor</Label>
                    <Input
                      id="autor"
                      data-testid="input-autor"
                      className="mt-1"
                      value={user?.nome || ""}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="selo">Selo</Label>
                    <Select
                      value={form.watch("selo")}
                      onValueChange={(value) => form.setValue("selo", value as Selo)}
                    >
                      <SelectTrigger
                        id="selo"
                        className="mt-1"
                        data-testid="select-selo"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Selo.NENHUM}>Nenhum</SelectItem>
                        <SelectItem value={Selo.AMBIENTAL}>Ambiental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switch
                      id="visivel"
                      checked={form.watch("visivel")}
                      onCheckedChange={(checked) => form.setValue("visivel", checked)}
                      data-testid="switch-visivel"
                    />
                    <Label htmlFor="visivel" className="cursor-pointer">
                      ESP visível
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    data-testid="input-titulo"
                    className="mt-1"
                    placeholder="Título da ESP"
                    value={form.watch("titulo") || ""}
                    onChange={(e) => form.setValue("titulo", e.target.value)}
                  />
                  {form.formState.errors.titulo && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.titulo.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "projetos" && (
              <div className="h-full flex flex-col">
                {/* Header com botões de ação */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold">Projetos</h1>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      data-testid="button-save-projetos"
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/files", espId, "files"] })}
                      data-testid="button-refresh-projetos"
                      className="gap-2"
                      disabled={isNewEsp}
                    >
                      <Loader2 className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      data-testid="button-open-pdf-projetos"
                      className="gap-2"
                      disabled={isNewEsp}
                    >
                      <FileText className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>

                {/* Aviso para ESP nova */}
                {isNewEsp && (
                  <div className="mb-6 p-4 bg-institutional-yellow/20 border border-institutional-yellow rounded-lg">
                    <p className="text-sm text-black font-medium">
                      ⚠️ Salve a ESP primeiro na aba "Identificação" antes de fazer upload de arquivos de projeto.
                    </p>
                  </div>
                )}

                {/* Área de upload customizada */}
                <div className="flex-1 space-y-6">
                  {/* Aviso superior */}
                  <p className="text-sm text-black">
                    Insira o arquivo já formatado conforme dimensões recomendadas em cartilha.
                  </p>

                  {/* Dropzone customizada */}
                  <div
                    onDragOver={(e) => {
                      if (!isNewEsp) {
                        e.preventDefault();
                        e.currentTarget.classList.add("ring-4", "ring-institutional-yellow");
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!isNewEsp) {
                        e.preventDefault();
                        e.currentTarget.classList.remove("ring-4", "ring-institutional-yellow");
                      }
                    }}
                    onDrop={(e) => {
                      if (!isNewEsp) {
                        e.preventDefault();
                        e.currentTarget.classList.remove("ring-4", "ring-institutional-yellow");
                        const files = Array.from(e.dataTransfer.files);
                        handleFilesSelected(files);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isNewEsp && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        document.getElementById('file-upload-projetos')?.click();
                      }
                    }}
                    className={cn(
                      "relative rounded-lg transition-all",
                      !isNewEsp && "focus-within:ring-4 focus-within:ring-institutional-yellow"
                    )}
                    data-testid="upload-area-projetos"
                    role="button"
                    tabIndex={isNewEsp ? -1 : 0}
                    aria-label="Área de upload. Clique para selecionar arquivos de projeto."
                    aria-disabled={isNewEsp}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf,.docx"
                      multiple
                      onChange={(e) => {
                        if (!isNewEsp && e.target.files) {
                          const files = Array.from(e.target.files);
                          handleFilesSelected(files);
                        }
                      }}
                      className="hidden"
                      id="file-upload-projetos"
                      data-testid="input-file-projetos"
                      aria-label="Selecionar arquivos de projeto"
                      disabled={isNewEsp}
                    />
                    
                    <label
                      htmlFor="file-upload-projetos"
                      className={cn(
                        "block rounded-lg p-12 text-center",
                        isNewEsp ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      )}
                      style={{ backgroundColor: "#0361ad" }}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-black font-medium text-lg">Selecionar Arquivos</p>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ffffff" }}>
                          <span className="text-5xl font-light" style={{ color: "#0361ad" }}>+</span>
                        </div>
                        <p className="text-black font-medium text-lg">Inserir Imagem</p>
                      </div>
                    </label>
                  </div>

                  {/* Texto de arrastar e soltar */}
                  <p className="text-sm text-center text-black">
                    ou arraste e solte os arquivos aqui
                  </p>

                  {/* Loading state */}
                  {isUploading && (
                    <div className="flex items-center gap-2 p-4 bg-institutional-blue/10 border border-institutional-blue rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-institutional-blue" />
                      <span className="text-sm text-institutional-blue">Fazendo upload...</span>
                    </div>
                  )}

                  {/* Lista de arquivos com scroll */}
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Arquivos do Projeto ({uploadedFiles.length})</h2>
                    {uploadedFiles.length === 0 ? (
                      <div className="border rounded-lg p-8 text-center text-muted-foreground">
                        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum arquivo de projeto anexado ainda</p>
                        <p className="text-sm mt-1">Faça upload de arquivos usando a área acima</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2 pr-2" data-testid="files-list-projetos">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-institutional-blue transition-colors"
                            data-testid={`file-item-${file.id}`}
                          >
                            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" data-testid={`file-name-${file.id}`}>
                                {file.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.tipo} • {(file.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadFile(file.id, file.filename)}
                                data-testid={`button-download-${file.id}`}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Baixar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteFile(file.id, file.filename)}
                                data-testid={`button-delete-${file.id}`}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "descricao" && (
              <div className="h-full flex flex-col">
                {/* Header com botões de ação */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-black">Descrição e Aplicação</h1>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      data-testid="button-save-descricao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => {
                        // Recarregar dados da ESP
                        queryClient.invalidateQueries({ queryKey: ["/api/esp", espId] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/constituintes"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/acessorios"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/acabamentos"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/prototipos"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/aplicacoes"] });
                        toast({ title: "Dados atualizados" });
                      }}
                      data-testid="button-refresh-descricao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <Loader2 className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isNewEsp}
                      data-testid="button-open-pdf-descricao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <FileText className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>

                {/* Área principal do formulário com scroll */}
                <div className="flex-1 overflow-auto max-w-4xl space-y-6 pr-4">
                  {/* Campo: Introduzir componente */}
                  <div>
                    <Label htmlFor="introduzir-componente" className="text-black">
                      Introduzir componente
                    </Label>
                    <Input
                      id="introduzir-componente"
                      data-testid="input-introduzir-componente"
                      className="mt-1 bg-white text-black border-gray-300"
                      placeholder="Descreva o componente..."
                      aria-label="Campo de texto. Introduza o componente."
                      {...form.register("introduzirComponente")}
                    />
                  </div>

                  {/* Select Box: Constituintes */}
                  <div>
                    <Label htmlFor="constituintes" className="text-black">
                      Constituintes
                    </Label>
                    <Select
                      defaultValue=""
                      onValueChange={(value) => {
                        // TODO: Handle multi-select (store in array)
                        console.log("Constituinte selected:", value);
                      }}
                    >
                      <SelectTrigger
                        id="constituintes"
                        data-testid="select-constituintes"
                        className="mt-1 bg-white text-black border-gray-300"
                        aria-label="Campo de seleção. Escolha os constituintes do componente."
                      >
                        <SelectValue placeholder="Escolha os constituintes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp-loading">Carregando...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Box: Acessórios */}
                  <div>
                    <Label htmlFor="acessorios" className="text-black">
                      Acessórios
                    </Label>
                    <Select
                      defaultValue=""
                      onValueChange={(value) => {
                        console.log("Acessório selected:", value);
                      }}
                    >
                      <SelectTrigger
                        id="acessorios"
                        data-testid="select-acessorios"
                        className="mt-1 bg-white text-black border-gray-300"
                        aria-label="Campo de seleção. Escolha os acessórios."
                      >
                        <SelectValue placeholder="Escolha os acessórios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp-loading">Carregando...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Box: Acabamentos */}
                  <div>
                    <Label htmlFor="acabamentos" className="text-black">
                      Acabamentos
                    </Label>
                    <Select
                      defaultValue=""
                      onValueChange={(value) => {
                        console.log("Acabamento selected:", value);
                      }}
                    >
                      <SelectTrigger
                        id="acabamentos"
                        data-testid="select-acabamentos"
                        className="mt-1 bg-white text-black border-gray-300"
                        aria-label="Campo de seleção. Escolha o tipo de acabamento."
                      >
                        <SelectValue placeholder="Escolha o acabamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp-loading">Carregando...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Box: Protótipo Comercial */}
                  <div>
                    <Label htmlFor="prototipo-comercial" className="text-black">
                      Protótipo Comercial
                    </Label>
                    <Select
                      defaultValue=""
                      onValueChange={(value) => {
                        console.log("Protótipo comercial selected:", value);
                      }}
                    >
                      <SelectTrigger
                        id="prototipo-comercial"
                        data-testid="select-prototipo-comercial"
                        className="mt-1 bg-white text-black border-gray-300"
                        aria-label="Campo de seleção. Escolha o protótipo comercial."
                      >
                        <SelectValue placeholder="Escolha o protótipo comercial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp-loading">Carregando...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Box: Aplicações */}
                  <div>
                    <Label htmlFor="aplicacoes" className="text-black">
                      Aplicações
                    </Label>
                    <Select
                      defaultValue=""
                      onValueChange={(value) => {
                        console.log("Aplicação selected:", value);
                      }}
                    >
                      <SelectTrigger
                        id="aplicacoes"
                        data-testid="select-aplicacoes"
                        className="mt-1 bg-white text-black border-gray-300"
                        aria-label="Campo de seleção. Escolha a aplicação do componente."
                      >
                        <SelectValue placeholder="Escolha a aplicação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp-loading">Carregando...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "execucao" && (
              <div className="h-full flex flex-col">
                {/* Header com botões de ação */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-black">Execução</h1>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      data-testid="button-save-execucao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/esp", espId] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/constituintes"] });
                        toast({ title: "Dados atualizados" });
                      }}
                      data-testid="button-refresh-execucao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <Loader2 className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isNewEsp}
                      data-testid="button-open-pdf-execucao"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                    >
                      <FileText className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>

                {/* Área principal do formulário com scroll */}
                <div className="flex-1 overflow-auto max-w-4xl space-y-6 pr-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione os itens de controle técnico da execução. Use o botão "+" para adicionar mais constituintes.
                  </p>

                  {/* Lista dinâmica de constituintes */}
                  {Array.from({ length: numConstituintesExecucao }).map((_, index) => {
                    const currentConstituintes = form.watch("constituintesExecucaoIds") || [];
                    return (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Label htmlFor={`constituinte-${index}`} className="text-black">
                            Constituinte {index + 1}
                          </Label>
                          <Select
                            value={currentConstituintes[index] || ""}
                            onValueChange={(value) => {
                              const updated = [...currentConstituintes];
                              updated[index] = value;
                              form.setValue("constituintesExecucaoIds", updated, { shouldDirty: true });
                            }}
                          >
                            <SelectTrigger
                              id={`constituinte-${index}`}
                              data-testid={`select-constituinte-execucao-${index}`}
                              className="mt-1 bg-white text-black border-gray-300"
                              aria-label={`Campo de seleção. Escolha o ${index === 0 ? 'primeiro' : index === 1 ? 'segundo' : index === 2 ? 'terceiro' : index === 3 ? 'quarto' : index === 4 ? 'quinto' : (index + 1) + 'º'} item de controle de execução.`}
                            >
                              <SelectValue placeholder={`Escolha o constituinte ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="temp-loading">Carregando...</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {index >= 5 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentConstituintes = form.getValues("constituintesExecucaoIds") || [];
                              const updated = currentConstituintes.filter((_, i) => i !== index);
                              form.setValue("constituintesExecucaoIds", updated, { shouldDirty: true });
                              setNumConstituintesExecucao(prev => prev - 1);
                            }}
                            className="mt-7"
                            data-testid={`button-remove-constituinte-${index}`}
                            aria-label={`Remover constituinte ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Botão para adicionar novo constituinte */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNumConstituintesExecucao(prev => prev + 1);
                      const current = form.getValues("constituintesExecucaoIds") || [];
                      form.setValue("constituintesExecucaoIds", [...current, ""], { shouldDirty: true });
                    }}
                    className="gap-2"
                    data-testid="button-add-constituinte-execucao"
                    aria-label="Adicionar novo constituinte de execução"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Constituinte
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "fichas" && (
              <div className="flex flex-col h-full">
                {/* Cabeçalho com título e botões de ação */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h1 className="text-2xl font-bold text-black">Fichas de Referência</h1>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      data-testid="button-save-fichas"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Salvar — grava os arquivos enviados."
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/esp", espId] });
                        toast({ title: "Dados atualizados" });
                      }}
                      data-testid="button-refresh-fichas"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Atualizar — recarregar as listas de banco de dados."
                    >
                      <Loader2 className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isNewEsp}
                      data-testid="button-open-pdf-fichas"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Abrir PDF — gera ou abre o arquivo PDF da ESP."
                    >
                      <FileText className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>

                {/* Área principal do formulário com scroll */}
                <div className="flex-1 overflow-auto max-w-4xl space-y-6 pr-4 mt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione os itens de outros catálogos que deseja relacionar. Use o botão "+" para adicionar mais itens.
                  </p>

                  {/* Lista dinâmica de itens de fichas de referência */}
                  {Array.from({ length: numFichasReferencia }).map((_, index) => {
                    const currentFichas = form.watch("fichasReferenciaIds") || [];
                    return (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Label htmlFor={`ficha-${index}`} className="text-black">
                            Item {index + 1}
                          </Label>
                          <Select
                            value={currentFichas[index] || ""}
                            onValueChange={(value) => {
                              const updated = [...currentFichas];
                              updated[index] = value;
                              form.setValue("fichasReferenciaIds", updated, { shouldDirty: true });
                            }}
                          >
                            <SelectTrigger
                              id={`ficha-${index}`}
                              data-testid={`select-ficha-referencia-${index}`}
                              className="mt-1 bg-white text-black border-gray-300"
                              aria-label="Campo de seleção. Escolha o item que quer relacionar"
                            >
                              <SelectValue placeholder={`Escolha o item ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="temp-loading">Carregando...</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {index >= 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentFichas = form.getValues("fichasReferenciaIds") || [];
                              const updated = currentFichas.filter((_, i) => i !== index);
                              form.setValue("fichasReferenciaIds", updated, { shouldDirty: true });
                              setNumFichasReferencia(prev => prev - 1);
                            }}
                            className="mt-7"
                            data-testid={`button-remove-ficha-${index}`}
                            aria-label={`Remover item ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Botão para adicionar novo item */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNumFichasReferencia(prev => prev + 1);
                      const current = form.getValues("fichasReferenciaIds") || [];
                      form.setValue("fichasReferenciaIds", [...current, ""], { shouldDirty: true });
                    }}
                    className="gap-2"
                    data-testid="button-add-ficha-referencia"
                    aria-label="Adicionar novo item de ficha de referência"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "recebimento" && (
              <div className="h-full flex flex-col">
                {/* Header com botões de ação */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-black">Recebimento</h1>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      data-testid="button-save-recebimento"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Salvar — grava os arquivos enviados."
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/esp", espId] });
                        queryClient.invalidateQueries({ queryKey: ["/api/catalog/fichas-recebimento"] });
                        toast({ title: "Dados atualizados" });
                      }}
                      data-testid="button-refresh-recebimento"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Atualizar — recarregar as listas de banco de dados."
                    >
                      <Loader2 className="h-4 w-4" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isNewEsp}
                      data-testid="button-open-pdf-recebimento"
                      className="gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: "#000000" }}
                      aria-label="Botão Abrir PDF — gera ou abre o arquivo PDF da ESP."
                    >
                      <FileText className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>

                {/* Área principal do formulário com scroll */}
                <div className="flex-1 overflow-auto max-w-4xl space-y-6 pr-4">
                  {/* Select Boxes dinâmicos para Fichas de Recebimento */}
                  {Array.from({ length: numFichasRecebimento }).map((_, index) => {
                    const fichasRecebimentoIds = form.watch("fichasRecebimentoIds") || [];
                    return (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`ficha-recebimento-${index}`} className="text-black">
                            Ficha {index + 1}
                          </Label>
                          <Select
                            value={fichasRecebimentoIds[index] || ""}
                            onValueChange={(value) => {
                              const current = form.getValues("fichasRecebimentoIds") || [];
                              const updated = [...current];
                              updated[index] = value;
                              form.setValue("fichasRecebimentoIds", updated, { shouldDirty: true });
                            }}
                          >
                            <SelectTrigger 
                              id={`ficha-recebimento-${index}`}
                              className="mt-1"
                              data-testid={`select-ficha-recebimento-${index}`}
                              aria-label="Campo de seleção. Escolha a ficha de recebimento vinculada ao componente."
                            >
                              <SelectValue placeholder={`Escolha a ficha ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {fichasRecebimentoData?.fichasRecebimento?.map((ficha: { id: string; nome: string }) => (
                                <SelectItem key={ficha.id} value={ficha.id}>
                                  {ficha.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {index >= 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setNumFichasRecebimento(prev => prev - 1);
                              const current = form.getValues("fichasRecebimentoIds") || [];
                              form.setValue("fichasRecebimentoIds", current.filter((_, i) => i !== index), { shouldDirty: true });
                            }}
                            className="gap-2 text-destructive hover:text-destructive"
                            data-testid={`button-remove-ficha-recebimento-${index}`}
                            aria-label={`Remover ficha ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Botão para adicionar nova ficha */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNumFichasRecebimento(prev => prev + 1);
                      const current = form.getValues("fichasRecebimentoIds") || [];
                      form.setValue("fichasRecebimentoIds", [...current, ""], { shouldDirty: true });
                    }}
                    className="gap-2"
                    data-testid="button-add-ficha-recebimento"
                    aria-label="Adicionar nova ficha de recebimento"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Ficha
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "servicos" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Serviços Incluídos</h1>
                <div>
                  <Label htmlFor="servicos-incluidos">Conteúdo</Label>
                  <Textarea
                    id="servicos-incluidos"
                    data-testid="textarea-servicos"
                    className="mt-1 min-h-[300px]"
                    placeholder="Liste os serviços incluídos..."
                    {...form.register("servicosIncluidos")}
                  />
                </div>
              </div>
            )}

            {activeTab === "criterios" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Critérios de Medição</h1>
                <div>
                  <Label htmlFor="criterios-medicao">Conteúdo</Label>
                  <Textarea
                    id="criterios-medicao"
                    data-testid="textarea-criterios"
                    className="mt-1 min-h-[300px]"
                    placeholder="Descreva os critérios de medição..."
                    {...form.register("criteriosMedicao")}
                  />
                </div>
              </div>
            )}

            {activeTab === "legislacao" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Legislação e Referências</h1>
                <div>
                  <Label htmlFor="legislacao">Legislação</Label>
                  <Textarea
                    id="legislacao"
                    data-testid="textarea-legislacao"
                    className="mt-1 min-h-[200px]"
                    placeholder="Legislação aplicável..."
                    {...form.register("legislacao")}
                  />
                </div>
                <div>
                  <Label htmlFor="referencias">Referências</Label>
                  <Textarea
                    id="referencias"
                    data-testid="textarea-referencias"
                    className="mt-1 min-h-[200px]"
                    placeholder="Referências bibliográficas..."
                    {...form.register("referencias")}
                  />
                </div>
              </div>
            )}

            {activeTab === "anexos" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Anexos</h1>
                <p className="text-muted-foreground">
                  Faça upload de arquivos anexos (imagens, PDF, DOCX)
                </p>
                
                {isUploading && (
                  <div className="flex items-center gap-2 p-4 bg-institutional-blue/10 border border-institutional-blue rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-institutional-blue" />
                    <span className="text-sm text-institutional-blue">Fazendo upload...</span>
                  </div>
                )}
                
                <UploadDropzone onFilesSelected={handleFilesSelected} />
                
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3">Arquivos anexados ({uploadedFiles.length})</h2>
                  {uploadedFiles.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                      <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum arquivo anexado ainda</p>
                      <p className="text-sm mt-1">Faça upload de arquivos usando a área acima</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-institutional-blue transition-colors"
                          data-testid={`file-item-${file.id}`}
                        >
                          <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" data-testid={`file-name-${file.id}`}>
                              {file.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.tipo} • {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(file.id, file.filename)}
                              data-testid={`button-download-${file.id}`}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Baixar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id, file.filename)}
                              data-testid={`button-delete-${file.id}`}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "visualizar-pdf" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Visualizar PDF</h1>
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Pré-visualização do PDF será exibida aqui</p>
                  <p className="text-sm mt-2">Recurso em desenvolvimento</p>
                </div>
              </div>
            )}

            {activeTab === "exportar" && (
              <div className="max-w-4xl space-y-6">
                <h1 className="text-2xl font-bold">Exportar</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-8 text-center space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold">Exportar como PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Gere um documento PDF formatado
                    </p>
                    <InstitutionalButton
                      variant="primary"
                      onClick={handleExportPDF}
                      data-testid="button-export-pdf"
                    >
                      Exportar PDF
                    </InstitutionalButton>
                  </div>
                  
                  <div className="border rounded-lg p-8 text-center space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold">Exportar como DOCX</h3>
                    <p className="text-sm text-muted-foreground">
                      Gere um documento Word editável
                    </p>
                    <InstitutionalButton
                      variant="primary"
                      onClick={handleExportDOCX}
                      data-testid="button-export-docx"
                    >
                      Exportar DOCX
                    </InstitutionalButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed on the right */}
          <div className="border-t p-4 bg-card">
            <div className="max-w-4xl flex justify-end gap-3">
              <InstitutionalButton
                variant="secondary"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="gap-2"
                data-testid="button-save"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </InstitutionalButton>
              
              <InstitutionalButton
                variant="primary"
                onClick={handleExportPDF}
                className="gap-2"
                data-testid="button-open-pdf"
              >
                <FileText className="h-4 w-4" />
                Abrir PDF
              </InstitutionalButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
