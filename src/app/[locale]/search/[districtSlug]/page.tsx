import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDistrictById } from "@/lib/districts/get-districts";
import { searchListings } from "@/lib/listings/search-listings";
import {
  listingTypeSchema,
  genderPreferenceSchema,
  type ListingType,
  type GenderPreference,
} from "@/lib/schemas/listing-schema";
import { ListingCard } from "@/components/listing-card";

function parseListingType(value: string | undefined): ListingType | undefined {
  const parsed = listingTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function parseGenderPreference(value: string | undefined): GenderPreference | undefined {
  const parsed = genderPreferenceSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function DistrictSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ districtSlug: string; locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { districtSlug, locale } = await params;
  const filters = await searchParams;
  const district = await getDistrictById(districtSlug);
  if (!district) {
    notFound();
  }

  const type = parseListingType(filters.type);
  const genderPreference = parseGenderPreference(filters.gender);
  const minRentTry = parsePositiveInt(filters.minRent);
  const maxRentTry = parsePositiveInt(filters.maxRent);
  const roomCount = parsePositiveInt(filters.rooms);

  const [t, tType, tGender, listings] = await Promise.all([
    getTranslations("Search"),
    getTranslations("CreateListing.type"),
    getTranslations("CreateListing.genderPreference"),
    searchListings({
      districtIds: [districtSlug],
      listingTypes: type ? [type] : undefined,
      genderPreference,
      minRentKurus: minRentTry ? minRentTry * 100 : undefined,
      maxRentKurus: maxRentTry ? maxRentTry * 100 : undefined,
      roomCount,
      limit: 60,
    }),
  ]);
  const districtName = locale === "tr" ? district.nameTr : district.nameEn;
  const hasActiveFilters = Boolean(type || genderPreference || minRentTry || maxRentTry || roomCount);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title", { district: districtName })}</h1>

      <form
        method="get"
        className="bg-card grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-3 md:grid-cols-5 md:items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium">
            {t("filterType")}
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="">{t("filterAny")}</option>
            {listingTypeSchema.options.map((value) => (
              <option key={value} value={value}>
                {tType(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gender" className="text-sm font-medium">
            {t("filterGender")}
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={genderPreference ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="">{t("filterAny")}</option>
            {genderPreferenceSchema.options.map((value) => (
              <option key={value} value={value}>
                {tGender(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="minRent" className="text-sm font-medium">
            {t("filterMinRent")}
          </label>
          <input
            id="minRent"
            name="minRent"
            type="number"
            min={0}
            defaultValue={minRentTry ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxRent" className="text-sm font-medium">
            {t("filterMaxRent")}
          </label>
          <input
            id="maxRent"
            name="maxRent"
            type="number"
            min={0}
            defaultValue={maxRentTry ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rooms" className="text-sm font-medium">
            {t("filterRooms")}
          </label>
          <input
            id="rooms"
            name="rooms"
            type="number"
            min={1}
            defaultValue={roomCount ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3 sm:col-span-3 md:col-span-5">
          <button
            type="submit"
            className="bg-primary text-primary-foreground h-8 rounded-lg px-4 text-sm font-medium"
          >
            {t("filterApply")}
          </button>
          {hasActiveFilters && (
            <a href={`/${locale}/search/${districtSlug}`} className="text-muted-foreground text-sm underline">
              {t("filterClear")}
            </a>
          )}
        </div>
      </form>

      {listings.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
