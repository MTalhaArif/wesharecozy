import { test, expect } from "@playwright/test";

// Full v1 vertical slice: sign up -> publish a listing (no phone-verification
// step -- removed as a product decision, 2026-08) -> find it on the district
// search page. Run against Firebase emulators only:
// `firebase emulators:exec "pnpm test:e2e"`.
test("sign up and publish a listing straight away, then find it in search", async ({ page }) => {
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[browser console] ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.log(`[browser pageerror] ${err}`));
  page.on("requestfailed", (req) =>
    console.log(`[browser requestfailed] ${req.url()} ${req.failure()?.errorText}`),
  );

  const uniqueSuffix = Date.now();
  const email = `test-${uniqueSuffix}@example.com`;

  await page.goto("/tr/signup");
  await page.getByLabel("Görünen ad").fill("Test Kullanıcı");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre").fill("password123");
  // Base UI's Checkbox renders both a visible span[role=checkbox] and a
  // hidden native input for form semantics; getByLabel matches both
  // ambiguously, so target the accessible checkbox role directly.
  await page.getByRole("checkbox", { name: /Kullanım Koşulları/ }).check();
  await page.getByRole("button", { name: "Hesap oluştur" }).click();

  // No phone-verification step -- signup lands on the home page, and
  // publishing works immediately for any signed-in user.
  await expect(page).toHaveURL(/\/tr\/?$/);
  await page.goto("/tr/listings/new");

  const listingTitle = `E2E test ilanı ${uniqueSuffix}`;
  // Explicitly select a district rather than relying on the Select's default
  // value -- Base UI's Select is not a native <select>, so it's driven via
  // role-based interaction (click trigger, click option).
  await page.getByRole("combobox", { name: "İlçe" }).click();
  await page.getByRole("option", { name: "Kadıköy" }).click();
  await page.getByLabel("Mahalle").fill("Moda");
  await page.getByLabel("Başlık (Türkçe)").fill(listingTitle);
  await page.getByLabel("Başlık (İngilizce)").fill(`E2E test listing ${uniqueSuffix}`);
  await page
    .getByLabel("Açıklama (Türkçe)")
    .fill("Bu ilan uçtan uca test için otomatik olarak oluşturuldu.");
  await page
    .getByLabel("Açıklama (İngilizce)")
    .fill("This listing was created automatically for an end-to-end test.");
  await page.getByLabel("Kira (kuruş)").fill("2500000");
  await page.getByLabel("Depozito (kuruş)").fill("2500000");
  await page.getByLabel("Oda sayısı").fill("2");

  await page
    .getByLabel("Depozito iade politikası")
    .fill("Depozito, çıkışta hasar kontrolünün ardından 7 gün içinde iade edilir.");
  await page.getByRole("combobox", { name: "Faturalar" }).click();
  await page.getByRole("option", { name: "Kısmen dahil" }).click();

  // Set an exact location by clicking the map; only the jittered pin ever
  // becomes public (see src/lib/geo/jitter.ts).
  await page.locator(".leaflet-container").click({ position: { x: 150, y: 100 } });

  await page.setInputFiles("#photos", {
    name: "test-photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "base64",
    ),
  });
  // EXIF stripping (Canvas re-encode) runs client-side and async on file
  // select; wait for the preview thumbnail before submitting.
  await page.locator(".grid-cols-4 img").first().waitFor();

  await page.getByRole("checkbox", { name: /İlan koşullarını okudum/ }).check();
  await page.getByRole("checkbox", { name: /%3'ünü WeShareCozy/ }).check();
  await page.getByRole("button", { name: "İlanı yayınla" }).click();

  // Excludes "new" specifically -- [^/]+ alone would also match /listings/new
  // itself, making the assertion pass without any real navigation happening.
  await expect(page).toHaveURL(/\/listings\/(?!new)[^/]+$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();

  await page.goto("/tr/search/kadikoy");
  await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();
});
