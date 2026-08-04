import AthleteDetailPageClient from './AthleteDetailPageClient';

export default function RegistrantDetailPage({
  params,
}: {
  params: { id: string; registrantId: string };
}) {
  return <AthleteDetailPageClient programId={params.id} registrantId={params.registrantId} />;
}
