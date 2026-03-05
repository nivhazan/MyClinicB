import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
 * Analyzes a receipt image using Claude AI vision and returns structured data.
 * @param {File} file - The receipt image file
 * @returns {Promise<{amount, vendor, date, description, category}>}
 */
export async function analyzeReceiptWithAI(file) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error('נא להעלות קובץ תמונה (JPG, PNG, GIF, WEBP) לזיהוי אוטומטי');
  }

  const base64Image = await fileToBase64(file);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `אתה מנתח קבלות. חלץ את המידע הבא מהקבלה והחזר JSON בלבד, ללא טקסט נוסף:
{
  "amount": <סכום כמספר בלבד ללא סימן מטבע>,
  "vendor": "<שם העסק>",
  "date": "<תאריך בפורמט YYYY-MM-DD>",
  "description": "<תיאור קצר של מה נקנה>",
  "category": "<אחת בדיוק מתוך: ציוד קליני, חומרי משרד, שכר דירה, חשמל ומים, אינטרנט וטלפון, שיווק ופרסום, השתלמויות, ביטוח, אחזקה ותיקונים, אחר>"
}
אם לא ניתן לזהות שדה מסוים, החזר null עבורו.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('לא ניתן לנתח את תשובת ה-AI');
  return JSON.parse(jsonMatch[0]);
}
