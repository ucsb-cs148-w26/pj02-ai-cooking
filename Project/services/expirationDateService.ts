interface ExpirationDateRequest {
  foodName: string;
  category?: string;
  storage?: string;
  purchaseDate?: string;
}

interface ExpirationDateResponse {
  estimatedExpirationDate: string;
  daysUntilExpiration: number;
  confidence: 'high' | 'medium' | 'low';
  storageTips?: string;
  reasoning?: string;
}

/**
 * Generate an estimated expiration date for a food item using AI
 */
export async function generateExpirationDate(
  request: ExpirationDateRequest
): Promise<ExpirationDateResponse> {
  try {
    // Get API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please add NEXT_PUBLIC_ANTHROPIC_API_KEY to your .env.local file');
    }

    const purchaseDate = request.purchaseDate || new Date().toISOString().split('T')[0];
    
    const prompt = `You are a food safety expert. Given the following information, estimate when this food item will expire:

Food Item: ${request.foodName}
Category: ${request.category || 'not specified'}
Storage Location: ${request.storage || 'not specified'}
Purchase Date: ${purchaseDate}

Consider typical shelf life, storage conditions, and food safety guidelines.

Respond ONLY with a JSON object (no markdown formatting) in this exact format:
{
  "estimatedExpirationDate": "YYYY-MM-DD",
  "daysUntilExpiration": number,
  "confidence": "high|medium|low",
  "storageTips": "brief storage tip",
  "reasoning": "one sentence explanation"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    
    // Extract text from response
    const text = data.content
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text)
      .join("\n");
    
    // Clean up any markdown formatting
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    // Parse the JSON response
    const result: ExpirationDateResponse = JSON.parse(cleanText);
    
    return result;
  } catch (error) {
    console.error("Error generating expiration date:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate expiration date. Please try again.");
  }
}

/**
 * Validate if a date string is in valid format
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}