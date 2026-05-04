import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  objectif_revenu: string | null;
  created_at: string;
}

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

const LeadDetailDialog = ({ lead, onClose }: Props) => {
  if (!lead) return null;

  const fields = [
    { label: "Prénom", value: lead.prenom },
    { label: "Nom", value: lead.nom },
    { label: "Email", value: lead.email },
    { label: "Téléphone", value: lead.telephone || "Non renseigné" },
    { label: "Objectif de revenu", value: lead.objectif_revenu ? `${lead.objectif_revenu}€` : "Non renseigné" },
    { label: "Date d'inscription", value: new Date(lead.created_at).toLocaleString("fr-FR") },
  ];

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-primary">
            {lead.prenom} {lead.nom}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
              <p className="text-foreground">{f.value}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
