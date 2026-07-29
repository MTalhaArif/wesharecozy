// Re-encodes an image via <canvas>, which drops all EXIF metadata (including
// GPS tags) as a side effect — a canvas only ever holds decoded pixel data,
// never the source file's metadata. Runs client-side, before upload.
export async function stripExif(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  context.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) {
    throw new Error("Failed to re-encode image");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}