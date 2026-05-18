import { redirect } from 'next/navigation';

// Redirect legacy /providers/[slug] to the canonical /services/provider/[slug] path.
export default async function LegacyProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/services/provider/${slug}`);
}
