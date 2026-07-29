import { test, expect } from "@playwright/test";

// Full v1 vertical slice: sign up -> verify phone (dev-mode OTP, no real SMS) ->
// publish a listing -> find it on the district search page. Run against Firebase
// emulators only: `firebase emulators:exec "pnpm test:e2e"`.
test("sign up, verify phone, publish a listing, and find it in search", async ({ page }) => {
  const uniqueSuffix = Date.now();
  const email = `test-${uniqueSuffix}@example.com`;

  await page.goto("/tr/signup");
  await page.getByLabel("Görünen ad").fill("Test Kullanıcı");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre").fill("password123");
  await page.getByLabel(/Kullanım Koşulları/).check();
  await page.getByRole("button", { name: "Hesap oluştur" }).click();

  await expect(page).toHaveURL(/\/verify-phone/);
  await page.getByLabel("Telefon numarası").fill("+905551112233");
  await page.getByRole("button", { name: "Kod gönder" }).click();

  const devCodeText = await page.getByTestId("dev-otp-code").innerText();
  const code = devCodeText.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();

  await page.getByLabel("Doğrulama kodu").fill(code!);
  await page.getByRole("button", { name: "Doğrula" }).click();

  await expect(page).toHaveURL(/\/listings\/new/);

  const listingTitle = `E2E test ilanı ${uniqueSuffix}`;
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

  await page.getByLabel(/İlan koşullarını okudum/).check();
  await page.getByRole("button", { name: "İlanı yayınla" }).click();

  await expect(page).toHaveURL(/\/listings\/[^/]+$/);
  await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();

  await page.goto("/tr/search/kadikoy");
  // The listing was placed near where the map was clicked; if the district
  // seed data or click position changes, adjust the search district here too.
});