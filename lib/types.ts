export type UserRole =
  | 'super_admin'
  | 'club_admin'
  | 'sporting_director'
  | 'coach'
  | 'team_manager'
  | 'parent'
  | 'player'

export type TeamCategory =
  | 'Seniori'
  | 'U19'
  | 'U17'
  | 'U16'
  | 'U15'
  | 'U14'
  | 'U13'
  | 'U12'
  | 'U11'
  | 'U10'
  | 'U9'
  | 'U8'
  | 'U7'
  | 'U6'

export type CompetitionName =
  | 'SuperLiga'
  | 'Liga 2'
  | 'Liga 3'
  | 'Liga 3 PlayOff'
  | 'Liga 4'
  | 'Liga 5 / Judetean'
  | 'Liga de Tineret'
  | 'Liga Elitelor U17'
  | 'Liga Elitelor U16'
  | 'Liga Elitelor U15'
  | 'Liga Elitelor U14'
  | 'Liga Elitelor U13'
  | 'Campionat National U19'
  | 'Campionat National U17'
  | 'Campionat National U16'
  | 'Campionat National U15'
  | 'AJF'
  | 'Amical'

export type PlayerStatus =
  | 'activ'
  | 'accidentat'
  | 'suspendat'
  | 'transferat'
  | 'retras'

export type PaymentStatus = 'platit' | 'partial' | 'restant' | 'scutit'
export type ContributionType = 'donatie' | 'sponsorizare'
export type ContributionStatus = 'draft' | 'pending' | 'paid' | 'cancelled'
export type ContributionProvider = 'stripe' | 'manual'

export type MatchStatus = 'programat' | 'jucat' | 'amanat' | 'anulat'

export type AttendanceStatus =
  | 'prezent'
  | 'absent_motivat'
  | 'absent_nemotivat'
  | 'accidentat'

export interface Club {
  id: string
  name: string
  cui: string
  city: string
  county: string
  logoUrl?: string
  email: string
  phone: string
  address: string
  website: string
  socialMedia: string[]
  subscriptionStatus: 'trial' | 'active' | 'past_due'
  themeKey?: string
}

export interface Team {
  id: string
  clubId: string
  name: string
  category: TeamCategory
  competition: CompetitionName
  season: string
  headCoach: string
  assistantCoach: string
  teamManager: string
}

export interface Player {
  id: string
  clubId: string
  teamId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  position: string
  preferredFoot: 'drept' | 'stang' | 'ambele'
  height: number
  weight: number
  phone: string
  email: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  registrationNumber: string
  status: PlayerStatus
  medicalNotes: string
  coachNotes: string
  profileImageUrl?: string
  goals: number
  assists: number
  minutesPlayed: number
}

export interface Payment {
  id: string
  playerId: string
  month: string
  year: number
  dueAmount: number
  paidAmount: number
  status: PaymentStatus
  paidAt: string | null
  method: 'cash' | 'transfer_bancar' | 'card'
  notes: string
}

export interface Contribution {
  id: string
  clubId: string
  contributorName: string
  contributorEmail: string
  contributorPhone: string
  type: ContributionType
  amount: number
  status: ContributionStatus
  source: 'online' | 'manual'
  provider: ContributionProvider
  checkoutUrl: string
  externalCheckoutId: string
  sponsorCompany: string
  notes: string
  paidAt: string | null
}

export interface AttendanceSession {
  id: string
  teamId: string
  date: string
  hour: string
  location: string
  type: 'antrenament' | 'recuperare' | 'sedinta_video' | 'sala'
  attendanceRate: number
}

export interface Match {
  id: string
  teamId: string
  competition: CompetitionName
  round: string
  opponent: string
  venueType: 'acasa' | 'deplasare'
  date: string
  hour: string
  location: string
  teamScore: number | null
  opponentScore: number | null
  status: MatchStatus
  notes: string
}

export interface Suspension {
  id: string
  playerId: string
  matchId: string
  reason: 'cartonas_rosu' | 'cumul_galbene' | 'decizie_comisie' | 'disciplinar'
  rounds: number
  remainingRounds: number
  startDate: string
  status: 'activa' | 'expirata'
}

export interface ReportRow {
  title: string
  subtitle: string
  metric: string
}

export interface ActivityLogEntry {
  id: string
  area: string
  action: string
  entityLabel: string
  details: string
  createdAt: string
  actorName: string
  actorRole: string
}

export interface NotificationPreferenceSettings {
  emailEnabled: boolean
  paymentReminders: boolean
  matchReminders: boolean
  suspensionReminders: boolean
  attendanceReminders: boolean
}

export interface NotificationInboxItem {
  id: string
  notificationKey: string
  title: string
  description: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  href: string
  category: string
  isRead: boolean
  createdAt: string
}

export interface ReminderScheduleSettings {
  id?: string
  active: boolean
  frequency: 'daily' | 'weekdays' | 'weekly'
  hour: number
  minute: number
  channel: 'email'
  lastRunAt?: string | null
  nextRunLabel?: string
}
