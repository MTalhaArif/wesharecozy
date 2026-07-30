"use client"; // File input, browser Canvas API (EXIF stripping), and local preview state

import { useState } from "react";
import { useTranslations } from "next-intl";
import { stripExif } from "@/lib/images/strip-exif";
import { MAX_LISTING_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/schemas/listing-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sanity guard on the ORIGINAL file only, before compression even runs --
// prevents createImageBitmap() from hanging the browser on something
// pathological (a multi-hundred-MB export). Every normal phone/DSLR photo
// is well under this; it is not the "too large" limit users actually hit.
const MAX_ORIGINAL_PHOTO_BYTES = 30 * 1024 * 1024;

export function PhotoUpload({ onChange }: { onChange: (files: File[]) => void }) {
  const t = useTranslations("CreateListing");
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    setError(null);
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (files.length > MAX_LISTING_PHOTOS) {
      setError(t("tooManyPhotos", { max: MAX_LISTING_PHOTOS }));
      return;
    }
    const pathological = files.find((file) => file.size > MAX_ORIGINAL_PHOTO_BYTES);
    if (pathological) {
      setError(t("photoTooLargeToProcess", { name: pathological.name }));
      return;
    }

    // Every file gets compressed regardless of its original size -- a
    // several-MB phone photo is the normal case, not an error. stripExif()
    // targets 500KB and is best-effort for unusually detailed images.
    const stripped = await Promise.all(files.map(stripExif));

    const stillOversized = stripped.find((file) => file.size > MAX_PHOTO_BYTES);
    if (stillOversized) {
      setError(t("photoTooLarge", { name: stillOversized.name }));
      return;
    }

    setPreviews(stripped.map((file) => URL.createObjectURL(file)));
    onChange(stripped);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="photos">{t("photosLabel")}</Label>
      <Input
        id="photos"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't handle object URLs
            <img key={src} src={src} alt="" className="aspect-square rounded-md object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}