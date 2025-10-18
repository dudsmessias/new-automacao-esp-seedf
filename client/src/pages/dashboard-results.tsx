import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthHeader } from "@/components/AuthHeader";
import { InstitutionalButton } from "@/components/InstitutionalButton";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Mock data - will be replaced with real data
const mockDocuments = [
  {
    id: "1",
    codigo: "ESP-001",
    titulo: "Especificação de Pintura",
    autor: "João Silva",
    data: "15/10/2025",
    status: "APROVADO"
  },
  {
    id: "2",
    codigo: "ESP-002",
    titulo: "Especificação de Alvenaria",
    autor: "Maria Santos",
    data: "10/10/2025",
    status: "EM_ANDAMENTO"
  },
  {
    id: "3",
    codigo: "ESP-003",
    titulo: "Especificação de Instalações Elétricas",
    autor: "Pedro Costa",
    data: "05/10/2025",
    status: "OBSOLETO"
  },
];

const statusConfig = {
  APROVADO: { label: "Aprovado", variant: "default" as const },
  EM_ANDAMENTO: { label: "Em andamento", variant: "secondary" as const },
  OBSOLETO: { label: "Obsoleto", variant: "outline" as const },
};

export default function DashboardResults() {
  const [, setLocation] = useLocation();
  const user = JSON.parse(localStorage.getItem("esp_auth_user") || "{}");

  // Fetch ESPs from API
  const { data: espsData, isLoading: isLoadingEsps } = useQuery({
    queryKey: ["/api", "esp"],
    queryFn: async () => {
      const response = await fetch("/api/esp", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch ESPs");
      return response.json();
    },
    enabled: !!user.id,
  });

  const esps = espsData?.esps || [];

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuthHeader
        userName={user.nome}
        userRole={user.perfil}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Documentos ESP Encontrados</h1>
          <p className="text-muted-foreground">
            {isLoadingEsps ? "Carregando..." : `${esps.length} documento(s) encontrado(s)`}
          </p>
        </div>

        {isLoadingEsps ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando ESPs...</p>
          </div>
        ) : esps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma ESP encontrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-4 pr-4">
              {esps.map((doc: any) => (
              <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold" data-testid={`text-title-${doc.id}`}>
                          {doc.codigo}
                        </h3>
                        <Badge variant={doc.visivel ? "default" : "outline"}>
                          {doc.visivel ? "Visível" : "Oculto"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground" data-testid={`text-description-${doc.id}`}>
                        {doc.titulo}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span data-testid={`text-author-${doc.id}`}>
                          <strong>Autor:</strong> {doc.autor?.nome || "N/A"}
                        </span>
                        <span data-testid={`text-date-${doc.id}`}>
                          <strong>Data:</strong> {new Date(doc.dataPublicacao).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        data-testid={`button-view-${doc.id}`}
                        aria-label={`Visualizar ${doc.codigo}`}
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        data-testid={`button-edit-${doc.id}`}
                        aria-label={`Editar ${doc.codigo}`}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        data-testid={`button-download-${doc.id}`}
                        aria-label={`Baixar PDF de ${doc.codigo}`}
                      >
                        <Download className="h-4 w-4" />
                        Baixar PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
