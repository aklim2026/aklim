export type Role = 'admin' | 'utilisateur';
export type UserRole = Role;

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
  telephone?: string;
  motDePasse?: string;
  actif: boolean;
  createdat: string;
}

export interface Quartier {
  id: string;
  user_id: string;
  nom: string;
  ville: string;
  codePostal?: string;
  description?: string;
  nombreClients?: number;
  nombreInstallations?: number;
  createdat: string;
}

export interface Technicien {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  matricule: string;
  zone: string;
  statut: 'Actif' | 'En mission' | 'En congé' | 'Inactif';
  observation: string;
  totalClients?: number;
  totalClimatiseurs?: number;
  totalInterventions?: number;
  totalEncaisse?: number;
  createdat: string;
}

export type TypeClient = 'Standard' | 'Grande Surface';

export interface Client {
  id: string;
  user_id: string;
  nom: string;
  kinya: string; // Prénom / Kinya
  telephone: string;
  quartierid: string;
  quartiernom: string;
  adresse?: string;
  typeclient?: TypeClient;
  // Last / primary installation info for fast reference
  numerocontrole?: string;
  numerobon?: string;
  technicienid?: string;
  techniciennom?: string;
  climatiseurinfo?: string;
  prixtotal?: number;
  montantpayetotal?: number;
  observation?: string;
  dateinstallation?: string;
  createdat: string;
}

export type InstallationStatut =
  | 'Planifiée'
  | 'Affectée'
  | 'En cours'
  | 'Installée'
  | 'Contrôlée'
  | 'Annulée';

export type TypeClimatiseur =
  | 'Split Mural'
  | 'Multi-Split'
  | 'Cassette'
  | 'Gainable'
  | 'Console'
  | 'Armoire'
  | 'Autre';

export interface Installation {
  id: string;
  user_id: string;
  clientid: string;
  technicienid: string;
  clientnom?: string;
  clientkinya?: string;
  clienttelephone?: string;
  clientquartier?: string;
  techniciennom?: string;
  technicienmatricule?: string;
  dateinstallation: string;
  numerocontrole: string;
  numerobon: string;
  typeclimatiseur: TypeClimatiseur;
  marque: string;
  modele: string;
  puissance: string;
  quantite: number;
  prix: number;
  montantpaye: number;
  statut: InstallationStatut;
  typeclient?: TypeClient;
  tacherealisee: string;
  observation: string;
  createdat: string;
}

export type TypeIntervention =
  | 'Installation'
  | 'Mise en service'
  | 'Maintenance'
  | 'Entretien / Nettoyage'
  | 'Dépannage / SAV'
  | 'Recharge Gaz R410A/R32'
  | 'Contrôle'
  | 'Contrôle de conformité'
  | 'Diagnostic'
  | 'Réparation'
  | 'Déplacement / Désinstallation'
  | 'Autre';

export type InterventionStatut = 'Planifiée' | 'En cours' | 'Terminée' | 'Annulée';

export interface Intervention {
  id: string;
  user_id: string;
  clientid: string;
  technicienid: string;
  installationid?: string;
  clientnom?: string;
  clientkinya?: string;
  clienttelephone?: string;
  clientquartier?: string;
  techniciennom?: string;
  date: string;
  typeintervention: string;
  descriptiontache: string;
  cout?: number;
  observation?: string;
  statut: InterventionStatut;
  createdat: string;
}

export type ModePaiement = 'Espèces' | 'Virement' | 'Chèque' | 'Carte Bancaire' | 'Carte bancaire' | 'Virement bancaire' | 'Traite' | 'Autre';

export interface Paiement {
  id: string;
  user_id: string;
  clientid: string;
  technicienid: string;
  installationid?: string;
  clientnom?: string;
  clienttelephone?: string;
  techniciennom?: string;
  quartiernom?: string;
  numerobon?: string;
  montant: number;
  date: string;
  modepaiement: ModePaiement;
  observation?: string;
  createdat: string;
}

export interface TechnicienStats {
  technicien: Technicien;
  totalClientsVisites: number;
  totalClimatiseursInstalles: number;
  totalInterventions: number;
  montantTotalEncaisse: number;
  quartiersVisites: string[];
  clients: Client[];
  installations: Installation[];
  interventions: Intervention[];
  paiements: Paiement[];
}

export interface ClientFullDetails {
  client: Client;
  quartier?: Quartier;
  installations: Installation[];
  interventions: Intervention[];
  paiements: Paiement[];
  totalFacture: number;
  totalPaye: number;
  soldeRestant: number;
}

export interface DashboardStats {
  totalClients: number;
  totalTechniciens: number;
  totalClimatiseursInstalles: number;
  installationsEnCours: number;
  installationsTerminees: number;
  totalInterventions: number;
  totalEncaisse: number;
  soldeRestantTotal: number;
  
  installationsParTechnicien: { name: string; count: number; montant: number }[];
  clientsParQuartier: { name: string; count: number }[];
  installationsParMois: { month: string; count: number; montant: number }[];
  montantsEncaissesParMois: { month: string; montant: number }[];
  installationsParStatut: { name: string; value: number; color: string }[];
  interventionsParType: { name: string; value: number }[];
  topTechniciens: { nom: string; matricule: string; clients: number; clims: number; encaisse: number }[];
  recentInstallations: Installation[];
  recentInterventions: Intervention[];
  recentPaiements: Paiement[];
}

export interface RapportData {
  dateDebut: string;
  dateFin: string;
  stats: {
    totalClients: number;
    totalTechniciens: number;
    totalClimatiseursInstalles: number;
    totalInterventions: number;
    totalEncaisse: number;
    soldeRestantTotal: number;
  };
  parTechnicien: {
    nom: string;
    matricule: string;
    clients: number;
    clims: number;
    interventions: number;
    encaisse: number;
  }[];
  parQuartier: {
    nom: string;
    clients: number;
    installations: number;
    chiffreAffaires: number;
  }[];
}

export interface SearchResult {
  type: 'client' | 'technicien' | 'installation' | 'intervention' | 'paiement';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  meta: Record<string, any>;
}

export interface CompanySettings {
  id?: string;
  user_id: string;
  nomentreprise: string;
  slogan?: string;
  telephone?: string;
  telephoneentreprise?: string;
  email?: string;
  emailentreprise?: string;
  adresse?: string;
  adresseentreprise?: string;
  ville?: string;
  devise: string; // e.g. "DH"
  ice?: string;
  rc?: string;
  logourl?: string;
  modelecontroleprefix?: string;
  modelebonprefix?: string;
  mentionslegales?: string;
}

export type AppSettings = CompanySettings;
