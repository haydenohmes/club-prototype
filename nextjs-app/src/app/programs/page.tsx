import { Suspense } from 'react';
import { getPrograms, getOrganizationId } from '@/lib/actions/programs';
import ProgramsPageClient from './ProgramsPageClient';

export default async function ProgramsPage() {
  const organizationId = await getOrganizationId();
  const programs = organizationId ? await getPrograms(organizationId) : [];

  return (
    <Suspense fallback={null}>
      <ProgramsPageClient programs={programs} />
    </Suspense>
  );
}
