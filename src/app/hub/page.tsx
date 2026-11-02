import FeatureHub from "@/app/components/FeatureHub";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string; q?: string }>;
}) {
  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  return <FeatureHub user={user} initialFeature={params.feature} initialSearch={params.q} />;
}
