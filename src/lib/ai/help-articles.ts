import type { HelpTopic, ChatLocale } from "@/lib/schemas/ai-schema";

export type HelpArticle = {
  title: string;
  body: string;
  keywords: string[];
};

// Curated FAQ corpus (~8 entries x 2 locales). A vector store for this many
// documents is unnecessary -- get_help_article resolves by an exact slug
// enum, not free-text retrieval. Kept as a TS module (not loose Markdown
// files read via fs at runtime) so content is guaranteed to be bundled into
// the /api/chat serverless function -- a dynamic fs.readFileSync path is not
// reliably traced by Vercel's build-time file tracer.
export const HELP_ARTICLES: Record<HelpTopic, Record<ChatLocale, HelpArticle>> = {
  "signup-consent": {
    en: {
      title: "Signing up and KVKK consent",
      keywords: ["signup", "register", "kvkk", "consent", "account"],
      body: "Creating a WeShareCozy account needs a display name, email, and password. During signup you'll tick a KVKK consent checkbox -- this records your consent to how WeShareCozy processes your personal data, with the exact wording version stored alongside your account so it stays auditable if the wording changes later. You can also set a gender preference for matching, used only for shared-flat/flatmate listings.",
    },
    tr: {
      title: "Kayıt olma ve KVKK onayı",
      keywords: ["kayıt", "hesap", "kvkk", "onay"],
      body: "WeShareCozy'de hesap oluşturmak için görünen ad, e-posta ve şifre gerekir. Kayıt sırasında bir KVKK onay kutusunu işaretlersiniz -- bu, kişisel verilerinizin nasıl işlendiğine dair onayınızı, metnin sürümüyle birlikte kaydeder. Ayrıca yalnızca paylaşımlı ev/ev arkadaşı ilanlarında kullanılan bir cinsiyet tercihi belirleyebilirsiniz.",
    },
  },
  "phone-verification": {
    en: {
      title: "Phone verification",
      keywords: ["phone", "otp", "verification", "code"],
      body: "You must verify a phone number before you can publish a listing. WeShareCozy sends a one-time code to confirm the number is real and reachable. Verification is required to publish, independent of anything the listing form itself shows.",
    },
    tr: {
      title: "Telefon doğrulama",
      keywords: ["telefon", "doğrulama", "kod", "otp"],
      body: "İlan yayınlayabilmek için önce bir telefon numarasını doğrulamanız gerekir. WeShareCozy, numaranın gerçek ve ulaşılabilir olduğunu onaylamak için tek kullanımlık bir kod gönderir. Doğrulama, ilan formunda gösterilenlerden bağımsız olarak yayınlamak için zorunludur.",
    },
  },
  "publishing-a-listing": {
    en: {
      title: "Publishing a listing",
      keywords: ["publish", "listing", "create", "post"],
      body: "To publish a listing you need a verified phone number and a signed-in, KVKK-consented account. Every listing must belong to a valid Istanbul district. Listing types are: a room in a shared flat, a whole flat sublet, a short-term sublet, or looking for a flatmate. Publishing includes a checkbox agreeing to pay WeShareCozy 3% commission on a successfully completed subrental. Up to 15 photos are allowed -- there's no size limit on what you select, since photos are compressed to under 1MB and stripped of location metadata automatically before upload. The exact address is never made public -- only the neighbourhood and an approximately-jittered map pin are shown.",
    },
    tr: {
      title: "İlan yayınlama",
      keywords: ["ilan", "yayınla", "oluştur"],
      body: "İlan yayınlamak için doğrulanmış bir telefon numarasına ve KVKK onayı vermiş, oturum açmış bir hesaba ihtiyacınız var. Her ilan geçerli bir İstanbul ilçesine ait olmalıdır. İlan türleri: paylaşımlı evde oda, tüm dairenin kiralanması, kısa dönem kiralama veya ev arkadaşı aranıyor. Yayınlama, başarıyla tamamlanan bir alt kiralama üzerinden WeShareCozy'ye %3 komisyon ödemeyi kabul eden bir onay kutusu içerir. En fazla 15 fotoğraf yükleyebilirsiniz -- seçtiğiniz dosyalarda boyut sınırı yoktur, çünkü fotoğraflar yükleme öncesinde otomatik olarak 1MB altına sıkıştırılır ve konum bilgisinden arındırılır. Tam adres asla herkese açık gösterilmez -- yalnızca mahalle ve yaklaşık olarak kaydırılmış bir harita imleci gösterilir.",
    },
  },
  "listing-expiry": {
    en: {
      title: "Listing expiry and reactivation",
      keywords: ["expiry", "expire", "reactivate", "30 days"],
      body: "A published listing expires 30 days after it was published. Expiry is computed from the publish date whenever the listing is viewed, not by a background job, so it can show as expired immediately at the 30-day mark. An expired listing stops appearing in search and its detail page; the owner can reactivate it from their listings dashboard.",
    },
    tr: {
      title: "İlan süresinin dolması ve yeniden aktifleştirme",
      keywords: ["süre", "dolma", "yeniden aktif", "30 gün"],
      body: "Yayınlanan bir ilan, yayınlanmasından 30 gün sonra süresi dolar. Süre dolumu, ilan her görüntülendiğinde yayın tarihinden hesaplanır, bir arka plan işiyle değil -- bu yüzden 30. günde hemen süresi dolmuş olarak görünebilir. Süresi dolan bir ilan aramada ve detay sayfasında görünmez olur; sahibi ilanlar panelinden yeniden aktifleştirebilir.",
    },
  },
  "district-search": {
    en: {
      title: "Searching by district",
      keywords: ["search", "district", "browse", "filter"],
      body: "WeShareCozy is Istanbul-only for now. Browse listings by district from the home page's district grid, or ask me to search specific districts, rent ranges, room counts, or listing types and I'll pull matching active listings for you.",
    },
    tr: {
      title: "İlçeye göre arama",
      keywords: ["arama", "ilçe", "filtre"],
      body: "WeShareCozy şu an yalnızca İstanbul içindir. Ana sayfadaki ilçe ızgarasından ilanlara göz atabilir, ya da bana belirli ilçeleri, kira aralıklarını, oda sayılarını veya ilan türlerini sorabilirsiniz -- eşleşen aktif ilanları sizin için bulurum.",
    },
  },
  "interest-request-flow": {
    en: {
      title: "Contacting a host",
      keywords: ["contact", "message", "interested", "interest request"],
      body: "WeShareCozy doesn't have direct messaging yet. To reach a host, submit the \"I'm interested\" form on the listing page with your name and email or phone -- no account needed. You'll get a private tracking link to follow the status. The host sees your contact info and can mark the request as a deal made or not interested; once a deal is made, both sides are prompted to leave a short rating.",
    },
    tr: {
      title: "Bir ev sahibiyle iletişime geçme",
      keywords: ["iletişim", "mesaj", "ilgileniyorum", "talep"],
      body: "WeShareCozy'de henüz doğrudan mesajlaşma yok. Bir ev sahibine ulaşmak için ilan sayfasındaki \"İlgileniyorum\" formunu adınız ve e-posta veya telefon numaranızla doldurun -- hesap gerekmez. Durumu takip etmek için özel bir bağlantı alırsınız. Ev sahibi iletişim bilgilerinizi görür ve talebi anlaşma sağlandı veya ilgilenmiyor olarak işaretleyebilir; anlaşma sağlandığında her iki taraftan da kısa bir değerlendirme bırakması istenir.",
    },
  },
  "safety-scam-warnings": {
    en: {
      title: "Staying safe and spotting scams",
      keywords: ["scam", "safety", "fraud", "deposit", "warning"],
      body: "WeShareCozy does not vet listings, hosts, or seekers. Never pay a deposit or any money before viewing a place in person, and be wary of anyone pushing you to move the conversation to WhatsApp or Telegram before you've seen it. A host or listing that pressures you to pay quickly, refuses a viewing, or claims to be \"verified\" by WeShareCozy is a red flag -- report it.",
    },
    tr: {
      title: "Güvende kalmak ve dolandırıcılığı fark etmek",
      keywords: ["dolandırıcılık", "güvenlik", "kapora", "uyarı"],
      body: "WeShareCozy ilanları, ev sahiplerini veya arayanları denetlemez. Bir yeri şahsen görmeden asla kapora veya herhangi bir ödeme yapmayın ve görmeden önce konuşmayı WhatsApp veya Telegram'a taşımak isteyen kişilere karşı dikkatli olun. Hızlıca ödeme yapmanız için baskı kuran, görüşmeyi reddeden veya WeShareCozy tarafından \"doğrulanmış\" olduğunu iddia eden bir ev sahibi ya da ilan bir uyarı işaretidir -- bunu bildirin.",
    },
  },
  "account-basics": {
    en: {
      title: "Account basics",
      keywords: ["account", "login", "sign in", "profile"],
      body: "Once signed up and phone-verified, you can publish listings and manage them from your listings dashboard, where you also see and respond to interest requests. If you're not signed in, I can still answer questions like this one, but searching listings and managing an account both need you to sign in first.",
    },
    tr: {
      title: "Hesap temelleri",
      keywords: ["hesap", "giriş", "profil"],
      body: "Kayıt olup telefon doğrulamasını tamamladıktan sonra ilan yayınlayabilir ve ilanlarım panelinden yönetebilirsiniz; burada gelen ilgi taleplerini de görüp yanıtlayabilirsiniz. Oturum açmadıysanız bunun gibi sorulara yine cevap verebilirim, ancak ilan aramak ve hesap yönetmek için önce giriş yapmanız gerekir.",
    },
  },
};

export function getHelpArticle(topic: HelpTopic, locale: ChatLocale): HelpArticle {
  return HELP_ARTICLES[topic][locale];
}
