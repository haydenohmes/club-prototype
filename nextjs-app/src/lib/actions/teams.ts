'use server';

import { revalidatePath } from 'next/cache';

export interface TeamWithStats {
  id: string;
  title: string;
  sport: string;
  gender: string;
  grades: string | null;
  avatar: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  status: string;
  tier: 'free' | 'performance' | null;
  seasonId: string | null;
  rosterCount: number;
  maxRosterSize: number | null;
  ageMin: number | null;
  ageMax: number | null;
  coachCount: number;
  birthdayFrom: string | null;
  birthdayTo: string | null;
  assignedCount?: number;
  invitedCount?: number;
  acceptedCount?: number;
  declinedCount?: number;
  paidCount?: number;
}

export interface CreateTeamInput {
  title: string;
  seasonId: string;
}

export interface CreateTeamResult {
  success: boolean;
  team?: { id: string; title: string };
  error?: string;
}

export interface UpdateTeamInput {
  id: string;
  title?: string;
  sport?: string;
  gender?: string;
  grades?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  seasonId?: string | null;
  avatar?: string | null;
  status?: string;
  tier?: 'free' | 'performance' | null;
}

export interface UpdateTeamResult {
  success: boolean;
  error?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockTeamStore: TeamWithStats[] | undefined;
  // eslint-disable-next-line no-var
  var __mockTeamStoreVersion: number | undefined;
}

// Bump this any time the seed data changes — forces re-init on next hot reload
const MOCK_STORE_VERSION = 25;

// Base team shapes — reused across seasons
const BASE_TEAMS = [
  { n: 1,  title: '10 Mountain',   gender: 'female', grades: 'Spring', coachCount: 5, rosterCount: 12, birthdayFrom: '01/01/2016', birthdayTo: '12/31/2016' },
  { n: 2,  title: '10 Timberline', gender: 'male',   grades: 'Winter', coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2016', birthdayTo: '12/31/2016' },
  { n: 3,  title: '10 Peak',       gender: 'female', grades: 'Winter', coachCount: 7, rosterCount: 12, birthdayFrom: '01/01/2016', birthdayTo: '12/31/2016' },
  { n: 4,  title: '11 Mountain',   gender: 'female', grades: 'Winter', coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2015', birthdayTo: '12/31/2015' },
  { n: 5,  title: '11 Timberline', gender: 'female', grades: 'Fall',   coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2015', birthdayTo: '12/31/2015' },
  { n: 6,  title: '11 Peak',       gender: 'male',   grades: 'Spring', coachCount: 2, rosterCount: 12, birthdayFrom: '01/01/2015', birthdayTo: '12/31/2015' },
  { n: 7,  title: '12 Mountain',   gender: 'female', grades: 'Spring', coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2014', birthdayTo: '12/31/2014' },
  { n: 8,  title: '12 Timberline', gender: 'male',   grades: 'Spring', coachCount: 1, rosterCount: 12, birthdayFrom: '01/01/2014', birthdayTo: '12/31/2014' },
  { n: 9,  title: '12 Peak',       gender: 'female', grades: 'Winter', coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2014', birthdayTo: '12/31/2014' },
  { n: 10, title: '13 Mountain',   gender: 'male',   grades: 'Winter', coachCount: 4, rosterCount: 12, birthdayFrom: '01/01/2013', birthdayTo: '12/31/2013' },
];

// Varied but deterministic roster counts for archived seasons — offset by seed per season
const ROSTER_VARIANCE = [0, -1, -3, -2, 0, -4, -1, -2, -3, -1];

// Deterministic offsets for athlete-status mock counts
const ASSIGNED_VARIANCE   = [12, 12, 10, 11, 12, 8,  12, 9,  10, 11];
const INVITED_VARIANCE    = [14, 15, 13, 14, 16, 11, 15, 12, 14, 13];
const ACCEPTED_VARIANCE   = [9,  10, 8,  9,  11, 7,  10, 8,  9,  9 ];
const DECLINED_VARIANCE   = [2,  2,  3,  2,  1,  2,  2,  2,  3,  2 ];
const PAID_VARIANCE       = [7,  8,  6,  7,  9,  5,  8,  6,  7,  7 ];

function makeTeams(seasonId: string, status: string, prefix: string, seed = 0): TeamWithStats[] {
  return BASE_TEAMS.map((t, i) => {
    const idx = (i + seed) % 10;
    const roster = status === 'archived'
      ? Math.max(6, t.rosterCount + ROSTER_VARIANCE[idx])
      : t.rosterCount;
    return {
      id: `${prefix}-${t.n}`,
      title: t.title,
      sport: 'volleyball',
      gender: t.gender,
      grades: t.grades,
      avatar: null, primaryColor: null, secondaryColor: null,
      status,
      tier: null,
      seasonId,
      rosterCount: roster,
      maxRosterSize: 12,
      ageMin: null, ageMax: null,
      coachCount: t.coachCount,
      birthdayFrom: t.birthdayFrom,
      birthdayTo: t.birthdayTo,
      assignedCount: status === 'draft' ? 0 : ASSIGNED_VARIANCE[idx],
      invitedCount:  status === 'draft' ? 0 : INVITED_VARIANCE[idx],
      acceptedCount: status === 'draft' ? 0 : ACCEPTED_VARIANCE[idx],
      declinedCount: status === 'draft' ? 0 : DECLINED_VARIANCE[idx],
      paidCount:     status === 'draft' ? 0 : PAID_VARIANCE[idx],
    };
  });
}

// Elevation Volleyball Club teams — clean slate. The shared store is empty so the Teams page and
// Manage Teams read as "no teams". The Assign Athletes demo teams live in `assignmentDemoTeams` below.
if (!global.__mockTeamStore || global.__mockTeamStoreVersion !== MOCK_STORE_VERSION) {
global.__mockTeamStore = [];
global.__mockTeamStoreVersion = MOCK_STORE_VERSION;
}
const mockTeamStore = global.__mockTeamStore!;

export async function updateTeam(input: UpdateTeamInput): Promise<UpdateTeamResult> {
  const team = mockTeamStore.find(t => t.id === input.id);
  if (!team) return { success: false, error: 'Team not found' };
  if (input.title !== undefined) team.title = input.title;
  if (input.sport !== undefined) team.sport = input.sport;
  if (input.gender !== undefined) team.gender = input.gender;
  if (input.grades !== undefined) team.grades = input.grades ?? null;
  if (input.ageMin !== undefined) team.ageMin = input.ageMin ?? null;
  if (input.ageMax !== undefined) team.ageMax = input.ageMax ?? null;
  if (input.primaryColor !== undefined) team.primaryColor = input.primaryColor ?? null;
  if (input.secondaryColor !== undefined) team.secondaryColor = input.secondaryColor ?? null;
  if (input.seasonId !== undefined) team.seasonId = input.seasonId ?? null;
  if (input.avatar !== undefined) team.avatar = input.avatar ?? null;
  if (input.status !== undefined) team.status = input.status;
  if (input.tier !== undefined) team.tier = input.tier;
  return { success: true };
}

export async function createTeam(input: CreateTeamInput): Promise<CreateTeamResult> {
  const id = crypto.randomUUID();
  mockTeamStore.push({
    id,
    title: input.title,
    sport: 'volleyball',
    gender: 'female',
    grades: null,
    avatar: null,
    primaryColor: null,
    secondaryColor: null,
    status: 'draft',
    tier: null,
    seasonId: input.seasonId,
    rosterCount: 0,
    maxRosterSize: null,
    ageMin: null,
    ageMax: null,
    coachCount: 0,
    birthdayFrom: null,
    birthdayTo: null,
    assignedCount: 0,
    invitedCount: 0,
    acceptedCount: 0,
    declinedCount: 0,
    paidCount: 0,
  });
  revalidatePath('/teams');
  revalidatePath('/', 'layout');
  return { success: true, team: { id, title: input.title } };
}

export async function getAllTeams(_organizationId: string): Promise<TeamWithStats[]> {
  return [...mockTeamStore];
}

export async function getTeamById(teamId: string): Promise<TeamWithStats | null> {
  return mockTeamStore.find(t => t.id === teamId) ?? null;
}

export async function getTeamsBySeason(_organizationId: string, _seasonId: string): Promise<TeamWithStats[]> {
  return [];
}

export async function getProvisionedTeams(_organizationId: string): Promise<TeamWithStats[]> {
  return [];
}

export async function getOrganizationId(): Promise<string | null> {
  return 'org-1';
}

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar: string | null;
  teamRoles: string[];
}

export async function getStaffUsers(_organizationId: string): Promise<StaffUser[]> {
  return [];
}

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
}

export async function getSeasons(_organizationId: string): Promise<Season[]> {
  return [
    { id: 'season-1',       name: 'Fall 2024',   isActive: false },
    { id: 'season-current', name: 'Spring 2025', isActive: false },
    { id: 'season-active',  name: 'Fall 2025',   isActive: false },
    { id: 'season-2',       name: 'Spring 2026', isActive: true  },
    { id: 'season-3',       name: 'Fall 2026',   isActive: false },
    { id: 'season-4',       name: 'Spring 2027', isActive: false },
  ];
}

export interface CopyOptions {
  name: boolean;
  colors: boolean;
  avatar: boolean;
  sport: boolean;
  gender: boolean;
  grade: boolean;
}

export interface CopyTeamsInput {
  sourceTeamIds: string[];
  targetSeasonId: string;
  copyOptions: CopyOptions;
}

export interface CopyTeamsResult {
  success: boolean;
  copiedCount?: number;
  teams?: TeamWithStats[];
  error?: string;
}

export async function copyTeams(input: CopyTeamsInput): Promise<CopyTeamsResult> {
  const newTeams: TeamWithStats[] = input.sourceTeamIds.flatMap((sourceId, index) => {
    const source = mockTeamStore.find(t => t.id === sourceId);
    if (!source) return [];
    const tier: 'free' | 'performance' = index % 3 === 1 ? 'performance' : 'free';
    return [{
      id: crypto.randomUUID(),
      title: source.title,
      sport: source.sport,
      gender: source.gender,
      grades: input.copyOptions.grade ? source.grades : null,
      avatar: input.copyOptions.avatar ? source.avatar : null,
      primaryColor: input.copyOptions.colors ? source.primaryColor : null,
      secondaryColor: input.copyOptions.colors ? source.secondaryColor : null,
      status: 'draft',
      tier,
      seasonId: input.targetSeasonId,
      rosterCount: 0,
      maxRosterSize: source.maxRosterSize,
      ageMin: source.ageMin,
      ageMax: source.ageMax,
      coachCount: source.coachCount,
      birthdayFrom: source.birthdayFrom,
      birthdayTo: source.birthdayTo,
    }];
  });
  mockTeamStore.push(...newTeams);
  revalidatePath('/teams');
  revalidatePath('/', 'layout');
  return { success: true, copiedCount: newTeams.length, teams: newTeams };
}

export interface ArchiveTeamsResult {
  success: boolean;
  error?: string;
}

export async function archiveTeams(teamIds: string[]): Promise<ArchiveTeamsResult> {
  const idSet = new Set(teamIds);
  mockTeamStore.forEach(t => {
    if (idSet.has(t.id)) t.status = 'archived';
  });
  revalidatePath('/teams');
  revalidatePath('/', 'layout');
  return { success: true };
}

export interface DeleteTeamsResult {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export async function deleteTeams(teamIds: string[]): Promise<DeleteTeamsResult> {
  const idSet = new Set(teamIds);
  const before = mockTeamStore.length;
  mockTeamStore.splice(0, mockTeamStore.length, ...mockTeamStore.filter(t => !idSet.has(t.id)));
  revalidatePath('/teams');
  return { success: true, deletedCount: before - mockTeamStore.length };
}

export async function revalidateTeamsData() {
  revalidatePath('/teams');
  revalidatePath('/teams/manage');
}

export interface AssignAthletesInput {
  teamId: string;
  submissionIds: string[];
}

export interface AssignAthletesResult {
  success: boolean;
  assignedCount?: number;
  error?: string;
}

export async function assignAthletesToTeam(input: AssignAthletesInput): Promise<AssignAthletesResult> {
  revalidatePath('/teams');
  revalidatePath('/teams/assignments');
  return { success: true, assignedCount: input.submissionIds.length };
}

export async function unassignAthleteFromTeam(_teamId: string, _submissionId: string): Promise<{ success: boolean; error?: string }> {
  revalidatePath('/teams');
  revalidatePath('/teams/assignments');
  return { success: true };
}

export interface RosterAthlete {
  id: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  gender: string;
  grade: number;
  teamId: string;
  teamName: string;
  teamAvatar: string | null;
  teamSeasonId: string | null;
  primaryContact: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
}

export async function getAthletesOnProvisionedTeams(_organizationId: string): Promise<RosterAthlete[]> {
  return [];
}
