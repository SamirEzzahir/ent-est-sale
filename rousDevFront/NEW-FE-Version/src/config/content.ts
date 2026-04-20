export const entContent = {
  branding: {
    appName: 'ENT EST Sale',
    tagline: 'Plateforme numerique',
    workspaceLabel: 'Architecture micro-services modulaire',
    logoPath: '/logo-est-sale.png',
  },
  dashboard: {
    pageTitle: 'Bonjour, bienvenue sur votre ENT',
    noticeTitle: 'Projet ENT 2025-2026',
    noticeText: "Espace numerique de travail aligne sur l'architecture micro-services de l'EST Sale.",
    tabs: ['Vue globale', 'Pedagogie', 'Micro-services', 'IA Ollama'],
    summaryCards: [
      { label: 'Utilisateurs actifs', value: '2 483', badge: '+5.2%', badgeType: 'success' as const },
      { label: 'Cours en ligne', value: '148', badge: 'Modules publies', badgeType: 'info' as const },
      { label: 'Tickets support', value: '93', badge: 'Niveau normal', badgeType: 'warning' as const },
      { label: 'Fichiers MinIO', value: '1.8 TB', badge: 'Stockage ENT', badgeType: 'info' as const },
    ],
    widgets: ['Messagerie', 'Notes', 'Calendrier des examens', "Demande d'intervention", 'Cours en ligne', 'Assistance ENT'],
    microservices: [
      { name: 'Core Auth', details: 'Authentification OAuth2/Keycloak et JWT', status: 'Actif' },
      { name: 'Ajout de Fichiers', details: 'Depot enseignant + metadata Cassandra + stockage MinIO', status: 'Actif' },
      { name: 'Telechargement', details: 'Consultation et telechargement securise des cours', status: 'Actif' },
      { name: 'Administration', details: 'Gestion des utilisateurs, roles et droits', status: 'Actif' },
    ],
    technologies: ['React', 'FastAPI', 'Cassandra', 'MinIO', 'Keycloak', 'Docker', 'Kubernetes', 'Ollama / Llama 3'],
  },
}
