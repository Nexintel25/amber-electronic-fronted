/** Shrinks a camera photo to a small JPEG data URL so it can be stored on the phone or sent inline as `file_url`. */
export function compressImage(file: File, maxSide = 720, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(src);
      resolve(cv.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("bad image"));
    };
    img.src = src;
  });
}
