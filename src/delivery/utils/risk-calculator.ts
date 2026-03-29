export interface OrderInput {
	orderId: string;
	customerName: string;
	phone: string;
	address: string;
	city: string;
	codAmount: number;
	itemCount: number;
	isFirstTimeCustomer: boolean;
}

export interface RiskResult {
	score: number;
	reasons: string[];
}

export function calculateRisk(order: any) {
	let score = 100;
	const reasons: string[] = [];
  
	const address = (order.address || '').toLowerCase();
	const phone = order.phone || '';
	const cod = Number(order.codAmount) || 0;
	const city = order.city || '';
  
	// Address
	if (!address || address.length < 10) {
	  score -= 25;
	  reasons.push('Incomplete address');
	}
  
	if (!address.includes('street') && !address.includes('building')) {
	  score -= 10;
	  reasons.push('Address lacks details');
	}
  
	// Phone
	if (!/^05\d{8}$/.test(phone)) {
	  score -= 30;
	  reasons.push('Invalid UAE phone');
	}
  
	// COD
	if (cod > 1000) {
	  score -= 40;
	  reasons.push('Very high COD');
	} else if (cod > 500) {
	  score -= 20;
	  reasons.push('High COD');
	}
  
	// City
	if (!city) {
	  score -= 15;
	  reasons.push('Missing city');
	}
  
	const riskyCities = ['Sharjah Industrial', 'Ajman'];
	if (riskyCities.includes(city)) {
	  score -= 10;
	  reasons.push('High-risk area');
	}
  
	// Suspicious patterns
	if (phone === '0500000000') {
	  score -= 40;
	  reasons.push('Fake phone');
	}
  
	let status = 'READY';
  
	if (score <= 40) status = 'DO_NOT_SHIP';
	else if (score <= 70) status = 'RISKY';
  
	return { score, status, reasons };
}

// export function calculateRisk(order: any) {
// 	let score = 100;
// 	const reasons: string[] = [];
  
// 	if (!order.address || order.address.length < 5) {
// 	  score -= 25;
// 	  reasons.push('Invalid address');
// 	}
  
// 	if (!order.phone || order.phone.length < 9) {
// 	  score -= 20;
// 	  reasons.push('Invalid phone');
// 	}
  
// 	if (Number(order.codAmount) > 500) {
// 	  score -= 30;
// 	  reasons.push('COD too high');
// 	}
  
// 	if (!order.city) {
// 	  score -= 10;
// 	  reasons.push('Missing city');
// 	}
  
// 	let status = 'READY';
  
// 	if (score > 60) {
// 	  status = 'DO_NOT_SHIP';
// 	} else if (score > 30) {
// 	  status = 'RISKY';
// 	}
  
// 	return {
// 	  score,
// 	  status,
// 	  reasons,
// 	};
//   }
  
// export function calculateRisk(order: OrderInput): RiskResult {
// 	let score = 0;
// 	const reasons: string[] = [];

// 	// High COD risk
// 	if (order.codAmount > 300) {
// 		score += 25;
// 		reasons.push('High COD amount');
// 	}

// 	// First time buyer
// 	if (order.isFirstTimeCustomer) {
// 		score += 20;
// 		reasons.push('First-time customer');
// 	}

// 	// Vague address detection
// 	const vagueWords = ['near', 'behind', 'opposite', 'beside'];

// 	const lowerAddress = order.address.toLowerCase();

// 	if (vagueWords.some(word => lowerAddress.includes(word))) {
// 		score += 20;
// 		reasons.push('Vague address detected');
// 	}

// 	// Risky cities
// 	const riskyCities = ['Sharjah', 'Ajman'];

// 	if (riskyCities.includes(order.city)) {
// 		score += 10;
// 		reasons.push('Higher delivery failure zone');
// 	}

// 	// Large order
// 	if (order.itemCount >= 3) {
// 		score += 10;
// 		reasons.push('Large order size');
// 	}

// 	return { score, reasons };
// }