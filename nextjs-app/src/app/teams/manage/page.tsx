import { getAllTeams, getOrganizationId, getSeasons } from '@/lib/actions/teams';
import { getPrograms } from '@/lib/actions/programs';
import { maryvilleTeams } from '@/lib/mockHighSchoolData';
import ManageTeamsPageClient from './ManageTeamsPageClient';

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic';

interface ManageTeamsPageProps {
  searchParams: Promise<{ season?: string; workspace?: string; context?: string }>;
}

export default async function ManageTeamsPage({ searchParams }: ManageTeamsPageProps) {
  const params = await searchParams;
  const isHighSchool = params.workspace === 'highschool';
  const organizationId = await getOrganizationId();

  const seasons = organizationId ? await getSeasons(organizationId) : [];
  const programs = organizationId ? await getPrograms(organizationId) : [];

  // High school uses static mock data; club uses the mock store
  const teams = isHighSchool
    ? maryvilleTeams
    : organizationId ? await getAllTeams(organizationId) : [];

  // Use season from URL params. For the club, default to the empty Fall 2026
  // season (season-3) so Manage Teams opens on the "build teams" empty state.
  const seasonFromUrl = params.season ? seasons.find(s => s.id === params.season) : null;
  const clubDefaultSeason = !isHighSchool ? seasons.find(s => s.id === 'season-3') : undefined;
  const activeSeason = seasonFromUrl || clubDefaultSeason || seasons.find(s => s.isActive) || seasons[0];

  return (
    <ManageTeamsPageClient
      teams={teams}
      seasons={seasons}
      programs={programs}
      initialSeasonId={activeSeason?.id || ''}
      tryoutContext={params.context === 'tryout'}
    />
  );
}
