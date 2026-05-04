import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, Search, Users } from "lucide-react";
import LeadDetailDialog from "@/components/LeadDetailDialog";

interface Lead {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  objectif_revenu: string | null;
  created_at: string;
}

const OBJECTIF_OPTIONS = [
  { label: "Tous", value: "all" },
  { label: "500€", value: "500" },
  { label: "1 000€", value: "1000" },
  { label: "3 000€", value: "3000" },
  { label: "10K+", value: "10000+" },
];

const Admin = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchLeads();
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredLeads = leads.filter((lead) => {
    const matchFilter = filter === "all" || lead.objectif_revenu === filter;
    const matchSearch =
      search === "" ||
      lead.prenom.toLowerCase().includes(search.toLowerCase()) ||
      lead.nom.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const exportCSV = () => {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Objectif", "Date"];
    const rows = filteredLeads.map((l) => [
      l.prenom,
      l.nom,
      l.email,
      l.telephone || "",
      l.objectif_revenu || "",
      new Date(l.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-light text-primary">⚡ DropDigital</h1>
          <span className="text-xs text-muted-foreground tracking-widest uppercase border border-border px-2 py-0.5 rounded">Admin</span>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-semibold text-foreground">{leads.length}</p>
                <p className="text-sm text-muted-foreground">Total leads</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-3xl font-semibold text-foreground">{leads.filter((l) => l.objectif_revenu === "10000+").length}</p>
            <p className="text-sm text-muted-foreground">Objectif 10K+</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-3xl font-semibold text-foreground">
              {leads.length > 0 ? new Date(leads[0]?.created_at).toLocaleDateString("fr-FR") : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Dernier lead</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {OBJECTIF_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border text-foreground w-56"
              />
            </div>
            <Button onClick={exportCSV} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prénom</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Objectif</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">Chargement...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">Aucun lead trouvé</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-foreground font-medium">{lead.prenom}</td>
                      <td className="px-4 py-3 text-foreground">{lead.nom}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.telephone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary border border-primary/20">
                          {lead.objectif_revenu ? `${lead.objectif_revenu}€` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LeadDetailDialog lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
};

export default Admin;
