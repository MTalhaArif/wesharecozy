import { ListingSearchPage } from "@/components/listing-search-page";

export default async function DistrictSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ districtSlug: string; locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { districtSlug, locale } = await params;
  const filters = await searchParams;

  return <ListingSearchPage locale={locale} filters={filters} fixedDistrictId={districtSlug} />;
}
