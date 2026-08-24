import {
  User,
  Quartier,
  Technicien,
  Client,
  Installation,
  Intervention,
  Paiement,
  TechnicienStats,
  ClientFullDetails,
  DashboardStats,
  SearchResult,
  CompanySettings,
  RapportData,
} from '../types';
import { supabase } from '../lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;
    
    const { data: { user } } = await supabase!.auth.getUser();
    return user?.id || null;
  } catch (err) {
    return null;
  }
};

export const api = {
  // Auth (handled by Supabase SDK, but we keep the structure for compatibility if needed)
  login: async (email: string, password?: string) => {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password: password || '' });
    if (error) throw error;
    return { 
      user: {
        id: data.user.id,
        nom: data.user.user_metadata?.nom || data.user.email?.split('@')[0],
        email: data.user.email!,
        role: data.user.user_metadata?.role || 'utilisateur',
        actif: true,
        createdat: data.user.created_at
      } as User,
      token: data.session.access_token
    };
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const userId = await getUserId();
      if (!userId) {
        return {
          totalClients: 0, totalTechniciens: 0, totalClimatiseursInstalles: 0, installationsEnCours: 0,
          installationsTerminees: 0, totalInterventions: 0, totalEncaisse: 0, soldeRestantTotal: 0,
          installationsParTechnicien: [], clientsParQuartier: [], installationsParMois: [],
          montantsEncaissesParMois: [], installationsParStatut: [], interventionsParType: [],
          topTechniciens: [], recentInstallations: [], recentInterventions: [], recentPaiements: []
        };
      }
      
      const [
        { data: clients },
        { data: techs },
        { data: insts },
        { data: ints },
        { data: pays }
      ] = await Promise.all([
        supabase!.from('clients').select('*').eq('user_id', userId),
        supabase!.from('techniciens').select('*').eq('user_id', userId),
        supabase!.from('installations').select('*').eq('user_id', userId),
        supabase!.from('interventions').select('*').eq('user_id', userId),
        supabase!.from('paiements').select('*').eq('user_id', userId)
      ]);

      const filteredClients = clients || [];
      const filteredTechs = techs || [];
      const filteredInsts = (insts || []).map(i => ({ ...i, numerocontrat: i.numerocontrole }));
      const filteredInts = ints || [];
      const filteredPays = (pays || []).map(p => ({ ...p, numerocontrat: p.numerocontrole }));

      const totalEncaisse = filteredPays.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
      const totalFacture = filteredInsts.reduce((acc, i) => acc + (Number(i.prix) || 0), 0);

      const instsByTech = filteredTechs.map(t => ({
        name: `${t.prenom} ${t.nom}`,
        count: filteredInsts.filter(i => i.technicienid === t.id).length,
        montant: filteredInsts.filter(i => i.technicienid === t.id).reduce((acc, i) => acc + (Number(i.prix) || 0), 0)
      }));

      return {
        totalClients: filteredClients.length,
        totalTechniciens: filteredTechs.length,
        totalClimatiseursInstalles: filteredInsts.reduce((acc, i) => acc + (Number(i.quantite) || 1), 0),
        installationsEnCours: filteredInsts.filter(i => i.statut === 'En cours').length,
        installationsTerminees: filteredInsts.filter(i => i.statut === 'Installée' || i.statut === 'Contrôlée').length,
        totalInterventions: filteredInts.length,
        totalEncaisse,
        soldeRestantTotal: Math.max(0, totalFacture - totalEncaisse),
        installationsParTechnicien: instsByTech,
        clientsParQuartier: [],
        installationsParMois: [],
        montantsEncaissesParMois: [],
        installationsParStatut: [],
        interventionsParType: [],
        topTechniciens: [],
        recentInstallations: filteredInsts.slice(0, 5),
        recentInterventions: filteredInts.slice(0, 5),
        recentPaiements: filteredPays.slice(0, 5)
      };
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      return {
        totalClients: 0, totalTechniciens: 0, totalClimatiseursInstalles: 0, installationsEnCours: 0,
        installationsTerminees: 0, totalInterventions: 0, totalEncaisse: 0, soldeRestantTotal: 0,
        installationsParTechnicien: [], clientsParQuartier: [], installationsParMois: [],
        montantsEncaissesParMois: [], installationsParStatut: [], interventionsParType: [],
        topTechniciens: [], recentInstallations: [], recentInterventions: [], recentPaiements: []
      };
    }
  },

  // Search
  search: async (q: string): Promise<SearchResult[]> => {
    try {
      const userId = await getUserId();
      if (!userId) return [];
      const term = q.toLowerCase();
      
      const [
        { data: clients },
        { data: techs }
      ] = await Promise.all([
        supabase!.from('clients').select('*').eq('user_id', userId).ilike('nom', `%${term}%`),
        supabase!.from('techniciens').select('*').eq('user_id', userId).ilike('nom', `%${term}%`)
      ]);

      const results: SearchResult[] = [];
      clients?.forEach(c => results.push({
        type: 'client',
        id: c.id,
        title: `${c.kinya} ${c.nom}`,
        subtitle: c.telephone,
        meta: c
      }));
      techs?.forEach(t => results.push({
        type: 'technicien',
        id: t.id,
        title: `${t.prenom} ${t.nom}`,
        subtitle: t.matricule,
        meta: t
      }));

      return results;
    } catch (err) {
      return [];
    }
  },

  // Techniciens
  getTechniciens: async () => {
    try {
      const userId = await getUserId();
      if (!userId) return [];
      const { data, error } = await supabase!.from('techniciens').select('*').eq('user_id', userId);
      if (error) {
        console.error('Error fetching techniciens:', error);
        return [];
      }
      return (data || []) as Technicien[];
    } catch (err) {
      return [];
    }
  },
  getTechnicien: async (id: string) => {
    const { data, error } = await supabase!.from('techniciens').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Technicien;
  },
  getTechnicienStats: async (id: string): Promise<TechnicienStats> => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const [
      { data: tech },
      { data: insts },
      { data: ints },
      { data: pays }
    ] = await Promise.all([
      supabase!.from('techniciens').select('*').eq('id', id).single(),
      supabase!.from('installations').select('*').eq('technicienid', id),
      supabase!.from('interventions').select('*').eq('technicienid', id),
      supabase!.from('paiements').select('*').eq('technicienid', id)
    ]);

    return {
      technicien: tech,
      totalClientsVisites: new Set(insts?.map(i => i.clientid)).size,
      totalClimatiseursInstalles: insts?.reduce((acc, i) => acc + (Number(i.quantite) || 1), 0) || 0,
      totalInterventions: ints?.length || 0,
      montantTotalEncaisse: pays?.reduce((acc, p) => acc + (Number(p.montant) || 0), 0) || 0,
      quartiersVisites: Array.from(new Set(insts?.map(i => i.clientquartier).filter(Boolean))),
      clients: [],
      installations: insts || [],
      interventions: ints || [],
      paiements: pays || []
    } as TechnicienStats;
  },
  createTechnicien: async (tech: Partial<Technicien>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const { data, error } = await supabase!.from('techniciens').insert([{ ...tech, user_id: userId }]).select().single();
    if (error) throw error;
    return data as Technicien;
  },
  updateTechnicien: async (id: string, tech: Partial<Technicien>) => {
    const { data, error } = await supabase!.from('techniciens').update(tech).eq('id', id).select().single();
    if (error) throw error;
    return data as Technicien;
  },
  deleteTechnicien: async (id: string) => {
    const { error } = await supabase!.from('techniciens').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Clients
  getClients: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase!.from('clients').select('*').eq('user_id', userId).order('createdat', { ascending: false });
    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      numerocontrat: c.numerocontrole
    })) as Client[];
  },
  getClient: async (id: string) => {
    const { data, error } = await supabase!.from('clients').select('*').eq('id', id).single();
    if (error) throw error;
    return {
      ...data,
      numerocontrat: data.numerocontrole
    } as Client;
  },
  getClientFullDetails: async (id: string): Promise<ClientFullDetails> => {
    const [
      { data: client },
      { data: insts },
      { data: ints },
      { data: pays }
    ] = await Promise.all([
      supabase!.from('clients').select('*').eq('id', id).single(),
      supabase!.from('installations').select('*').eq('clientid', id),
      supabase!.from('interventions').select('*').eq('clientid', id),
      supabase!.from('paiements').select('*').eq('clientid', id)
    ]);

    const totalFacture = insts?.reduce((acc, i) => acc + (Number(i.prix) || 0), 0) || 0;
    const totalPaye = pays?.reduce((acc, p) => acc + (Number(p.montant) || 0), 0) || 0;

    return {
      client: {
        ...client,
        numerocontrat: client.numerocontrole
      },
      installations: (insts || []).map(i => ({ ...i, numerocontrat: i.numerocontrole })),
      interventions: ints || [],
      paiements: (pays || []).map(p => ({ ...p, numerocontrat: p.numerocontrole })),
      totalFacture,
      totalPaye,
      soldeRestant: Math.max(0, totalFacture - totalPaye)
    } as ClientFullDetails;
  },
  getClientDetails: async (id: string) => api.getClientFullDetails(id),
  createClient: async (client: Partial<Client>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    
    // Only send core fields that are guaranteed to be in the base schema
    // To avoid "column not found" errors for extended fields
    const coreClient = {
      nom: client.nom,
      kinya: client.kinya,
      telephone: client.telephone,
      quartierid: client.quartierid,
      quartiernom: client.quartiernom,
      adresse: client.adresse,
      typeclient: client.typeclient,
      user_id: userId
    };

    const { data, error } = await supabase!.from('clients').insert([coreClient]).select().single();
    if (error) throw error;
    return data as Client;
  },
  updateClient: async (id: string, client: Partial<Client>) => {
    // Only update core fields
    const coreUpdates: any = {};
    const allowed = ['nom', 'kinya', 'telephone', 'quartierid', 'quartiernom', 'adresse', 'typeclient'];
    allowed.forEach(key => {
      if ((client as any)[key] !== undefined) coreUpdates[key] = (client as any)[key];
    });

    const { data, error } = await supabase!.from('clients').update(coreUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as Client;
  },
  reglerSoldeClient: async (id: string, options: any) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const client = await api.getClient(id);
    const details = await api.getClientFullDetails(id);
    
    const montant = options.montant || details.soldeRestant;
    
    const { data: paiement, error } = await supabase!.from('paiements').insert([{
      user_id: userId,
      clientid: id,
      technicienid: options.technicienid || client.technicienid,
      montant: montant,
      date: options.date || new Date().toISOString().split('T')[0],
      modepaiement: options.modepaiement || 'Espèces',
      observation: options.observation || 'Règlement du solde',
    }]).select().single();

    if (error) throw error;

    return { 
      success: true, 
      paiement: paiement as Paiement, 
      nouveauSoldeRestant: Math.max(0, details.soldeRestant - montant) 
    };
  },
  deleteClient: async (id: string) => {
    const { error } = await supabase!.from('clients').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Installations
  getInstallations: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase!.from('installations').select('*').eq('user_id', userId).order('createdat', { ascending: false });
    if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      numerocontrat: i.numerocontrole
    })) as Installation[];
  },
  getInstallation: async (id: string) => {
    const { data, error } = await supabase!.from('installations').select('*').eq('id', id).single();
    if (error) throw error;
    return {
      ...data,
      numerocontrat: data.numerocontrole
    } as Installation;
  },
  createInstallation: async (inst: Partial<Installation>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    
    // Core fields only
    const coreInst = {
      clientid: inst.clientid,
      technicienid: inst.technicienid,
      dateinstallation: inst.dateinstallation,
      numerocontrole: inst.numerocontrat,
      numerobon: inst.numerobon,
      typeclimatiseur: inst.typeclimatiseur,
      marque: inst.marque,
      modele: inst.modele,
      puissance: inst.puissance,
      quantite: inst.quantite,
      prix: inst.prix,
      montantpaye: inst.montantpaye,
      statut: inst.statut,
      tacherealisee: inst.tacherealisee,
      prixtachesuppl: inst.prixtachesuppl,
      observation: inst.observation,
      user_id: userId
    };

    const { data, error } = await supabase!.from('installations').insert([coreInst]).select().single();
    if (error) throw error;
    return data as Installation;
  },
  updateinstallation: async (id: string, inst: Partial<Installation>) => {
    const coreUpdates: any = {};
    const allowed = [
      'clientid', 'technicienid', 'dateinstallation', 'numerocontrat', 'numerobon',
      'typeclimatiseur', 'marque', 'modele', 'puissance', 'quantite', 'prix',
      'montantpaye', 'statut', 'tacherealisee', 'prixtachesuppl', 'observation'
    ];
    allowed.forEach(key => {
      if ((inst as any)[key] !== undefined) {
        if (key === 'numerocontrat') {
          coreUpdates['numerocontrole'] = (inst as any)[key];
        } else {
          coreUpdates[key] = (inst as any)[key];
        }
      }
    });

    const { data, error } = await supabase!.from('installations').update(coreUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as Installation;
  },
  reglerSoldeInstallation: async (id: string, options: any) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const inst = await api.getInstallation(id);
    const solde = Math.max(0, inst.prix - (inst.montantpaye || 0));
    const montant = options.montant || solde;

    const { data: paiement, error } = await supabase!.from('paiements').insert([{
      user_id: userId,
      clientid: inst.clientid,
      installationid: id,
      technicienid: options.technicienid || inst.technicienid,
      montant: montant,
      date: options.date || new Date().toISOString().split('T')[0],
      modepaiement: options.modepaiement || 'Espèces',
      observation: options.observation || 'Règlement installation',
    }]).select().single();

    if (error) throw error;

    // Update installation montantpaye
    await supabase!.from('installations').update({
      montantpaye: (inst.montantpaye || 0) + montant
    }).eq('id', id);

    return { success: true, paiement: paiement as Paiement, soldeRestant: Math.max(0, solde - montant) };
  },
  deleteInstallation: async (id: string) => {
    const { error } = await supabase!.from('installations').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Interventions
  getInterventions: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase!.from('interventions').select('*').eq('user_id', userId).order('createdat', { ascending: false });
    if (error) throw error;
    return data as Intervention[];
  },
  getIntervention: async (id: string) => {
    const { data, error } = await supabase!.from('interventions').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Intervention;
  },
  createIntervention: async (inter: Partial<Intervention>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    
    const coreInter = {
      clientid: inter.clientid,
      technicienid: inter.technicienid,
      installationid: inter.installationid,
      date: inter.date,
      typeintervention: inter.typeintervention,
      descriptiontache: inter.descriptiontache,
      cout: inter.cout,
      observation: inter.observation,
      statut: inter.statut,
      user_id: userId
    };

    const { data, error } = await supabase!.from('interventions').insert([coreInter]).select().single();
    if (error) throw error;
    return data as Intervention;
  },
  updateIntervention: async (id: string, inter: Partial<Intervention>) => {
    const coreUpdates: any = {};
    const allowed = [
      'clientid', 'technicienid', 'installationid', 'date', 'typeintervention',
      'descriptiontache', 'cout', 'observation', 'statut'
    ];
    allowed.forEach(key => {
      if ((inter as any)[key] !== undefined) coreUpdates[key] = (inter as any)[key];
    });

    const { data, error } = await supabase!.from('interventions').update(coreUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as Intervention;
  },
  deleteIntervention: async (id: string) => {
    const { error } = await supabase!.from('interventions').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Paiements
  getPaiements: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase!.from('paiements').select('*').eq('user_id', userId).order('createdat', { ascending: false });
    if (error) throw error;
    return data as Paiement[];
  },
  getPaiement: async (id: string) => {
    const { data, error } = await supabase!.from('paiements').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Paiement;
  },
  createPaiement: async (paiement: Partial<Paiement>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    
    const corePaiement = {
      clientid: paiement.clientid,
      technicienid: paiement.technicienid,
      installationid: paiement.installationid,
      montant: paiement.montant,
      date: paiement.date,
      modepaiement: paiement.modepaiement,
      observation: paiement.observation,
      user_id: userId
    };

    const { data, error } = await supabase!.from('paiements').insert([corePaiement]).select().single();
    if (error) throw error;
    return data as Paiement;
  },
  updatePaiement: async (id: string, paiement: Partial<Paiement>) => {
    const coreUpdates: any = {};
    const allowed = [
      'clientid', 'technicienid', 'installationid', 'montant', 'date',
      'modepaiement', 'observation'
    ];
    allowed.forEach(key => {
      if ((paiement as any)[key] !== undefined) coreUpdates[key] = (paiement as any)[key];
    });

    const { data, error } = await supabase!.from('paiements').update(coreUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as Paiement;
  },
  deletePaiement: async (id: string) => {
    const { error } = await supabase!.from('paiements').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Quartiers
  getQuartiers: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase!.from('quartiers').select('*').eq('user_id', userId);
    if (error) throw error;
    return data as Quartier[];
  },
  createQuartier: async (q: Partial<Quartier>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const { data, error } = await supabase!.from('quartiers').insert([{ ...q, user_id: userId }]).select().single();
    if (error) throw error;
    return data as Quartier;
  },
  updateQuartier: async (id: string, q: Partial<Quartier>) => {
    const { data, error } = await supabase!.from('quartiers').update(q).eq('id', id).select().single();
    if (error) throw error;
    return data as Quartier;
  },
  deleteQuartier: async (id: string) => {
    const { error } = await supabase!.from('quartiers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Users
  getUsers: async () => {
    // Standard Supabase users are in auth.users, but we might have a public users/profiles table
    const { data, error } = await supabase!.from('profiles').select('*');
    if (error) return []; // Fallback if table doesn't exist
    return data as User[];
  },
  createUser: async (user: Partial<User>) => {
    const { data, error } = await supabase!.from('profiles').insert([user]).select().single();
    if (error) throw error;
    return data as User;
  },
  updateUser: async (id: string, user: Partial<User>) => {
    const { data, error } = await supabase!.from('profiles').update(user).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  },
  deleteUser: async (id: string) => {
    const { error } = await supabase!.from('profiles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Settings
  getSettings: async () => {
    try {
      const userId = await getUserId();
      if (!userId) return null;
      const { data, error } = await supabase!.from('settings').select('*').eq('user_id', userId).single();
      if (error) {
        // PGRST116: No rows found, PGRST205: Table missing
        if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
        throw error;
      }
      
      const settings = data as any;
      return {
        ...settings,
        modelecontratprefix: settings.modelecontroleprefix
      } as CompanySettings;
    } catch (err) {
      console.warn('Could not load settings from Supabase, using defaults:', err);
      return null;
    }
  },
  updateSettings: async (settings: Partial<CompanySettings>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Authentification requise');
    const existing = await api.getSettings();
    
    const dbSettings: any = { ...settings };
    if (dbSettings.modelecontratprefix) {
      dbSettings.modelecontroleprefix = dbSettings.modelecontratprefix;
      delete dbSettings.modelecontratprefix;
    }

    if (existing) {
      const { data, error } = await supabase!.from('settings').update(dbSettings).eq('user_id', userId).select().single();
      if (error) throw error;
      const result = data as any;
      return { ...result, modelecontratprefix: result.modelecontroleprefix } as CompanySettings;
    } else {
      const { data, error } = await supabase!.from('settings').insert([{ ...dbSettings, user_id: userId }]).select().single();
      if (error) throw error;
      const result = data as any;
      return { ...result, modelecontratprefix: result.modelecontroleprefix } as CompanySettings;
    }
  },

  // Rapports
  generateRapport: async (dateDebut: string, dateFin: string): Promise<RapportData> => {
    const [insts, ints, pays, techs, clients, quartiers] = await Promise.all([
      api.getInstallations(),
      api.getInterventions(),
      api.getPaiements(),
      api.getTechniciens(),
      api.getClients(),
      api.getQuartiers(),
    ]);

    const filteredInsts = insts.filter(i => {
      const d = i.dateinstallation || i.createdat.split('T')[0];
      return (!dateDebut || d >= dateDebut) && (!dateFin || d <= dateFin);
    });

    const filteredInts = ints.filter(i => {
      const d = i.date || i.createdat.split('T')[0];
      return (!dateDebut || d >= dateDebut) && (!dateFin || d <= dateFin);
    });

    const filteredPays = pays.filter(p => {
      const d = p.date || p.createdat.split('T')[0];
      return (!dateDebut || d >= dateDebut) && (!dateFin || d <= dateFin);
    });

    const totalClimatiseurs = filteredInsts.reduce((acc, i) => acc + (Number(i.quantite) || 1), 0);
    const totalFacture = filteredInsts.reduce((acc, i) => acc + (Number(i.prix) || 0), 0);
    const totalEncaisse = filteredPays.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
    const soldeRestantTotal = Math.max(0, totalFacture - totalEncaisse);

    return {
      dateDebut,
      dateFin,
      stats: {
        totalClients: clients.length,
        totalTechniciens: techs.length,
        totalClimatiseursInstalles: totalClimatiseurs,
        totalInterventions: filteredInts.length,
        totalEncaisse,
        soldeRestantTotal,
      },
      parTechnicien: techs.map(t => ({
        nom: `${t.prenom} ${t.nom}`,
        matricule: t.matricule,
        clients: new Set(filteredInsts.filter(i => i.technicienid === t.id).map(i => i.clientid)).size,
        clims: filteredInsts.filter(i => i.technicienid === t.id).reduce((sum, i) => sum + (Number(i.quantite) || 1), 0),
        interventions: filteredInts.filter(i => i.technicienid === t.id).length,
        encaisse: filteredPays.filter(p => p.technicienid === t.id).reduce((sum, p) => sum + (Number(p.montant) || 0), 0),
      })),
      parQuartier: quartiers.map(q => ({
        nom: q.nom,
        clients: clients.filter(c => c.quartiernom === q.nom).length,
        installations: filteredInsts.filter(i => i.clientquartier === q.nom).length,
        chiffreAffaires: filteredInsts.filter(i => i.clientquartier === q.nom).reduce((sum, i) => sum + (Number(i.prix) || 0), 0),
      })),
    };
  },

  resetDatabase: async () => {
    // Not applicable for Supabase without complex custom RPCs
    return { success: true, message: 'Database reset is not available in Supabase mode' };
  },
};

