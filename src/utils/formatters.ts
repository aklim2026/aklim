export function formatCurrency(amount: number | undefined | null, currency = 'DH'): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return `0 ${currency}`;
  const num = Number(amount);
  const isInt = Number.isInteger(num);
  const formatted = isInt ? num.toFixed(0) : num.toFixed(2);
  const parts = formatted.split('.');
  // Use standard ASCII space \x20 to prevent jsPDF Unicode narrow-space glyph corruption (/ instead of space)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts.join('.')} ${currency}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(statut: string): string {
  switch (statut) {
    case 'Contrôlée':
    case 'Terminée':
    case 'Actif':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    case 'Installée':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
    case 'En cours':
    case 'En mission':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    case 'Affectée':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20';
    case 'Planifiée':
      return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20';
    case 'En congé':
      return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20';
    case 'Annulée':
    case 'Inactif':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-600/20';
  }
}

export function generateNumeroContrat(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `CONT-${year}-${rand}`;
}

export function generateNumeroBon(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BON-${rand}`;
}
