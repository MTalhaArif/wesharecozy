const MAX_PHOTO_BYTES_TARGET = 500 * 1024;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];
const MAX_DIMENSION_PASSES = 5;
const DIMENSION_SCALE = 0.8;

function drawScaled(bitmap: ImageBitmap, scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) {
    throw new Error("Failed to encode image");
  }
  return blob;
}

// Re-encodes an image via <canvas>, which drops all EXIF metadata (including
// GPS tags) as a side effect -- a canvas only ever holds decoded pixel data,
// never the source file's metadata. Also compresses toward a 500KB cap: steps
// down JPEG quality first, then (if still too large at the quality floor)
// scales down the dimensions and retries. Best-effort -- returns the smallest
// result achieved even if an unusually detailed image can't quite fit under
// the cap within the bounded number of passes, rather than failing the upload.
export async function stripExif(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  let scale = 1;
  let smallest: Blob | null = null;

  for (let pass = 0; pass < MAX_DIMENSION_PASSES; pass++) {
    const canvas = drawScaled(bitmap, scale);
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (!smallest || blob.size < smallest.size) {
        smallest = blob;
      }
      if (blob.size <= MAX_PHOTO_BYTES_TARGET) {
        return finalize(blob, file.name);
      }
    }
    scale *= DIMENSION_SCALE;
  }

  if (!smallest) {
    throw new Error("Failed to compress image");
  }
  return finalize(smallest, file.name);
}

function finalize(blob: Blob, originalName: string): File {
  return new File([blob], originalName.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}
