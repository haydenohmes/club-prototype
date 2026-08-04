import { getAllTeams, getOrganizationId, getSeasons } from '@/lib/actions/teams';
import type { TeamWithStats } from '@/lib/actions/teams';
import { getPrograms, getAllRegistrations, getAllAthleteSubmissions } from '@/lib/actions/programs';
import AssignmentsPageClient from './AssignmentsPageClient';

// Fall 2026 demo teams shown ONLY on this page — appended to the (empty) store teams so they appear
// in Assign Athletes without showing on the Teams page or Manage Teams.
const assignmentDemoTeams: TeamWithStats[] = [
  { id: 'tf26-1', title: 'U10 Timberline', sport: 'volleyball', gender: 'female', grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 1, birthdayFrom: '01/01/2016', birthdayTo: '12/31/2016' },
  { id: 'tf26-2', title: 'U11 Ridge',      sport: 'volleyball', gender: 'male',   grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 2, birthdayFrom: '01/01/2015', birthdayTo: '12/31/2015' },
  { id: 'tf26-3', title: 'U12 Summit',     sport: 'volleyball', gender: 'female', grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 1, birthdayFrom: '01/01/2014', birthdayTo: '12/31/2014' },
  { id: 'tf26-4', title: 'U14 Cascade',    sport: 'volleyball', gender: 'female', grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 2, birthdayFrom: '01/01/2012', birthdayTo: '12/31/2012' },
  { id: 'tf26-5', title: 'U16 Alpine',     sport: 'volleyball', gender: 'male',   grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 1, birthdayFrom: '01/01/2010', birthdayTo: '12/31/2010' },
  { id: 'tf26-6', title: 'U17 Mountain',   sport: 'volleyball', gender: 'female', grades: 'Fall', avatar: null, primaryColor: null, secondaryColor: null, status: 'draft', tier: null, seasonId: 'season-3', rosterCount: 0, maxRosterSize: 12, ageMin: null, ageMax: null, coachCount: 2, birthdayFrom: '01/01/2009', birthdayTo: '12/31/2009' },
];

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic';

interface AssignmentsPageProps {
  searchParams: Promise<{ season?: string; returnTo?: string }>;
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const organizationId = await getOrganizationId();

  // Sequential data fetching to avoid connection pool exhaustion.
  // Store teams are an empty clean slate; append the Assign-Athletes-only demo teams here so they
  // appear on this page without showing on the Teams page or Manage Teams.
  const teams = [...(organizationId ? await getAllTeams(organizationId) : []), ...assignmentDemoTeams];
  const seasons = organizationId ? await getSeasons(organizationId) : [];
  const programs = organizationId ? await getPrograms(organizationId) : [];
  const registrations = organizationId ? await getAllRegistrations(organizationId) : [];
  const athletes = organizationId ? await getAllAthleteSubmissions(organizationId) : [];
  
  // Use season from URL params; otherwise default to Fall 2026 (season-3) so Assign Athletes
  // opens on the teams the director builds for that season.
  const seasonFromUrl = params.season ? seasons.find(s => s.id === params.season) : null;
  const activeSeason = seasonFromUrl || seasons.find(s => s.id === 'season-3') || seasons.find(s => s.isActive) || seasons[0];

  return (
    <AssignmentsPageClient
      teams={teams}
      seasons={seasons}
      programs={programs}
      registrations={registrations}
      athletes={athletes}
      initialSeasonId={activeSeason?.id || ''}
      returnTo={params.returnTo}
    />
  );
}
