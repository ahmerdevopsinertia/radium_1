export function buildDeliveryPrompt(order: any): string {
	return `
  You are a delivery risk analysis system.
  
  STRICT RULES:
  - Return ONLY ONE JSON object
  - DO NOT include examples
  - DO NOT include explanation outside JSON
  - DO NOT include multiple outputs
  - Output must be valid JSON
  
  Score range:
  0 = safe
  50 = very risky
  
  Order:
  Address: ${order.address}
  Phone: ${order.phone}
  COD: ${order.codAmount}
  City: ${order.city}
  
  Return ONLY this format:
  {
    "aiScore": number,
    "reason": "short reason"
  }
  
  Ensure the JSON is COMPLETE and ends with }.
  `;
}