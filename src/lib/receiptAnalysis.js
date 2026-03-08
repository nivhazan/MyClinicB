const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyzes a receipt image using Claude AI vision via the backend endpoint.
 * The API key is kept server-side for security.
 * @param {File} file - The receipt image file
 * @returns {Promise<{amount, vendor, date, description, category}>}
 */
export async function analyzeReceiptWithAI(file) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error('נא להעלות קובץ תמונה (JPG, PNG, GIF, WEBP) לזיהוי אוטומטי');
  }

  const base64Image = await fileToBase64(file);

  const res = await fetch(`${API_URL}/api/analyze-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      mediaType: file.type,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'שגיאה בניתוח הקבלה');
  }

  return res.json();
}
