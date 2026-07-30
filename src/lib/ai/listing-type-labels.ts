import type { ListingType } from "@/lib/schemas/listing-schema";
import type { ChatLocale } from "@/lib/schemas/ai-schema";

// Mirrors messages/{en,tr}.json's CreateListing.type labels. The model was
// mistranslating the raw enum string when relaying it to users (e.g.
// WHOLE_FLAT_SUBLET read out as "Room in shared flat") -- returning the same
// human-readable label the rest of the UI already shows removes the
// guesswork entirely instead of trusting the model to translate it.
const LISTING_TYPE_LABELS: Record<ListingType, Record<ChatLocale, string>> = {
  ROOM_IN_SHARED_FLAT: { en: "Room in a shared flat", tr: "Paylaşımlı evde oda" },
  WHOLE_FLAT_SUBLET: { en: "Whole flat sublet", tr: "Evin tamamı kirasında kiralama" },
  SHORT_TERM_SUBLET: { en: "Short-term sublet", tr: "Kısa süreli kirasında kiralama" },
  FLATMATE_WANTED: { en: "Flatmate wanted", tr: "Ev arkadaşı aranıyor" },
};

export function listingTypeLabel(type: ListingType, locale: ChatLocale): string {
  return LISTING_TYPE_LABELS[type][locale];
}
