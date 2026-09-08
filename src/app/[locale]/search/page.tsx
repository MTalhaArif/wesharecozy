import { ListingSearchPage } from "@/components/listing-search-page";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const filters = await searchParams;

  return <ListingSearchPage locale={locale} filters={filters} />;
}
