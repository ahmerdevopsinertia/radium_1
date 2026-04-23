export function safeJsonParse(text: string) {
	try {
		let cleaned = text.trim();

		// 👉 Extract first JSON-like block
		const match = cleaned.match(/\{[\s\S]*/);
		if (!match) return null;

		let jsonStr = match[0];

		// 👉 Auto-fix missing closing brace
		if (!jsonStr.endsWith('}')) {
			jsonStr += '}';
		}

		return JSON.parse(jsonStr);
	} catch {
		return null;
	}
}