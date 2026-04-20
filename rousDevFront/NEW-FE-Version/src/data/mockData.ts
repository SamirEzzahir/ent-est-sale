import type { Assignment, Course, EventItem, FileItem, Message, User } from '../types'

export const users: User[] = [
  { id: 'u1', name: 'Aya El Mansouri', email: 'aya@estsale.ma', role: 'student', faculty: 'Informatique', level: '2eme annee', avatar: 'AE' },
  { id: 'u2', name: 'Pr. Rachid Benaissa', email: 'r.benaissa@estsale.ma', role: 'teacher', faculty: 'Genie Logiciel', level: 'Responsable module', avatar: 'RB' },
  { id: 'u3', name: 'Admin EST Sale', email: 'admin@estsale.ma', role: 'admin', faculty: 'Direction', level: 'Administrateur', avatar: 'AD' },
]

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Architecture Microservices',
    teacher: 'Pr. Rachid Benaissa',
    code: 'GL-MICRO-401',
    credits: 5,
    category: 'Informatique',
    progress: 68,
    resources: [{ name: 'Chapitre 1.pdf', type: 'PDF', size: '2.1 MB' }, { name: 'TP Docker.zip', type: 'ZIP', size: '14.8 MB' }],
  },
  {
    id: 'c2',
    title: 'Developpement Frontend Moderne',
    teacher: 'Pr. Salma Idrissi',
    code: 'GL-FRONT-301',
    credits: 4,
    category: 'Web',
    progress: 82,
    resources: [{ name: 'React Guide.pdf', type: 'PDF', size: '1.4 MB' }, { name: 'UI Workshop.pptx', type: 'PPTX', size: '7.9 MB' }],
  },
]

export const files: FileItem[] = [
  { id: 'f1', name: 'Planning Semestre S4.pdf', category: 'Scolarite', owner: 'Administration', date: '2026-03-10', size: '840 KB' },
  { id: 'f2', name: 'Guide ENT Etudiant.pdf', category: 'Support', owner: 'Assistance ENT', date: '2026-02-24', size: '1.2 MB' },
  { id: 'f3', name: 'Sujet Projet Microservice.docx', category: 'Cours', owner: 'Pr. Benaissa', date: '2026-04-01', size: '410 KB' },
]

export const messages: Message[] = [
  { id: 'm1', from: 'Scolarite', subject: 'Mise a jour calendrier examens', preview: 'Le calendrier final est disponible sur votre espace.', date: 'Il y a 2h', unread: true },
  { id: 'm2', from: 'Pr. Idrissi', subject: 'Rendu mini-projet React', preview: 'Pensez a soumettre avant vendredi 18h.', date: 'Hier', unread: true },
  { id: 'm3', from: 'Assistance ENT', subject: 'Ticket #2048 resolu', preview: 'Votre demande d intervention a ete traitee.', date: 'Lundi', unread: false },
]

export const notifications = [
  { id: 'n1', label: 'Nouvelle note publiee en Frontend', type: 'info' },
  { id: 'n2', label: 'Deadline devoir Microservices demain', type: 'warning' },
  { id: 'n3', label: 'Maintenance ENT ce samedi 22h', type: 'neutral' },
]

export const events: EventItem[] = [
  { id: 'e1', title: 'Cours React Avance', date: '2026-04-17 09:00', type: 'course', location: 'Salle B12' },
  { id: 'e2', title: 'Examen Bases de Donnees', date: '2026-04-20 14:00', type: 'exam', location: 'Amphi 2' },
  { id: 'e3', title: 'Reunion Club IA', date: '2026-04-18 16:30', type: 'meeting', location: 'Lab Innovation' },
]

export const assignments: Assignment[] = [
  { id: 'a1', title: 'TP API Gateway', course: 'Architecture Microservices', dueDate: '2026-04-19', status: 'pending' },
  { id: 'a2', title: 'Prototype Dashboard ENT', course: 'Developpement Frontend Moderne', dueDate: '2026-04-16', status: 'submitted', grade: '17/20' },
  { id: 'a3', title: 'Analyse UML', course: 'Ingenierie Logicielle', dueDate: '2026-04-10', status: 'late' },
]

export const forumTopics = [
  { id: 't1', title: 'Conseils pour revision examen reseaux', author: 'Yassine A.', replies: 12, tag: 'Examens' },
  { id: 't2', title: 'Partage ressources React + TypeScript', author: 'Khadija M.', replies: 8, tag: 'Cours' },
  { id: 't3', title: 'Probleme acces wifi campus', author: 'Nabil R.', replies: 4, tag: 'Assistance' },
]

export const adminStats = [
  { label: 'Utilisateurs actifs', value: '2 483', trend: '+5.2%' },
  { label: 'Cours publies', value: '148', trend: '+2.1%' },
  { label: 'Tickets support', value: '93', trend: '-1.3%' },
  { label: 'Stockage utilise', value: '1.8 TB', trend: '+7.9%' },
]
