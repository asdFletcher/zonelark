"use client";

export async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1920;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) {
        const scale = MAX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
      }
      const avg = sum / (d.length / 4);
      if (avg < 100) {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] * 1.4 + 20);
          d[i + 1] = Math.min(255, d[i + 1] * 1.4 + 20);
          d[i + 2] = Math.min(255, d[i + 2] * 1.4 + 20);
        }
        ctx.putImageData(id, 0, 0);
      }
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.92);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
