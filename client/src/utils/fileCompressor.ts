/**
 * Compress an image file using browser Canvas before uploading to serverless backends.
 * Keeps documents sharp and legible while drastically reducing payload from 5MB+ to ~200-400KB.
 */
export async function compressEvidenceFile(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ base64: string; size: number; name: string; type: string }> {
  // If PDF, cannot compress via canvas; read as data URL directly
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          base64,
          size: file.size,
          name: file.name,
          type: 'application/pdf'
        });
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(file);
    });
  }

  // Compress image (JPG, PNG, WebP)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas not available
          return resolve({
            base64: reader.result as string,
            size: file.size,
            name: file.name,
            type: file.type
          });
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimate binary size from base64
        const head = 'data:image/jpeg;base64,';
        const rawLength = compressedDataUrl.length - head.length;
        const estimatedSize = Math.round((rawLength * 3) / 4);

        resolve({
          base64: compressedDataUrl,
          size: estimatedSize,
          name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          type: 'image/jpeg'
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Safely parse fetch response preventing "Unexpected token '<', '<!DOCTYPE'" and "Unexpected token 'R'" errors
 */
export async function parseApiResponse(res: Response): Promise<any> {
  const text = await res.text();
  const trimmed = text.trim();

  // If server returned an HTML error page (e.g. 504 timeout, 500 error, 404 rewrite)
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<?xml') || trimmed.startsWith('<!doctype')) {
    if (res.status === 504 || trimmed.includes('504 Gateway Time-out') || trimmed.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      throw new Error('Cloud server timed out while processing your request. Please try again with a compressed image.');
    }
    if (res.status === 413 || trimmed.includes('Request Entity Too Large')) {
      throw new Error('Attachment file is too large for the cloud server (exceeds limit). Please upload a compressed photo or smaller document.');
    }
    throw new Error(`Server returned an HTML error page (HTTP ${res.status}). The service may be starting up or the route was unavailable.`);
  }

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (res.status === 413 || text.includes('Request Entity Too Large')) {
      throw new Error(
        'Attachment file is too large for the cloud server (exceeds 4.5MB limit). Please upload a compressed photo or smaller document.'
      );
    }
    throw new Error(`Failed to parse server response (HTTP ${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data;
}
