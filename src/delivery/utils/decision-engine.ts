import axios from 'axios';
import { buildDeliveryPrompt } from './delivery.prompt';
import { safeJsonParse } from './json-parser';

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

export function ruleEngine(order: any) {
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

export async function getAiScore(order: any) {
  // let aiScore = 0;
  // const aiReasons: string[] = [];

  // const address = (order.address || '').toLowerCase();
  // const phone = order.phone || '';

  // // AI-like logic
  // if (address.includes('near') || address.includes('behind')) {
  //   aiScore += 20;
  //   aiReasons.push('Vague address (AI)');
  // }

  // if (phone === '0500000000') {
  //   aiScore += 30;
  //   aiReasons.push('Suspicious phone pattern (AI)');
  // }

  // if (address.length < 8 && order.codAmount > 300) {
  //   aiScore += 25;
  //   aiReasons.push('Suspicious order combination (AI)');
  // }

  // return {
  //   aiScore,
  //   aiReasons,
  //   confidence: 0.7, // static for now
  // };

  try {

    const prompt = buildDeliveryPrompt(order);

    const response = await axios.post(
      'http://localhost:8080/completion',
      {
        prompt,
        max_tokens: 80,
        temperature: 0.1,
        stop: ["\n\n", "}"] // 👈 stops extra output
      }
    );

    const text = response.data?.content || response.data?.text;

    // ⚠️ Try parsing JSON safely
    const parsed = safeJsonParse(text);

    if (!parsed) {
      return {
        aiScore: 0,
        aiReasons: ['AI parsing failed'],
        confidence: 0.2,
      };
    }

    return {
      aiScore: parsed?.aiScore || 0,
      aiReasons: [parsed?.reason || 'AI analysis'],
      confidence: 0.7,
    };

  } catch (err) {
    console.error('AI ERROR:', err.message);

    return {
      aiScore: 0,
      aiReasons: ['AI unavailable'],
      confidence: 0,
    };
  }
}

export function mergeDecision(ruleScore: number, aiScore: number) {
  let finalScore = ruleScore;

  // AI influence (controlled)
  if (aiScore > 20) {
    finalScore -= 10;
  }

  if (aiScore > 40) {
    finalScore -= 10;
  }

  // Hard rules (cannot be overridden)
  if (ruleScore <= 40) {
    return {
      finalScore,
      status: 'DO_NOT_SHIP',
    };
  }

  if (finalScore <= 70) {
    return {
      finalScore,
      status: 'RISKY',
    };
  }

  return {
    finalScore,
    status: 'READY',
  };
}

export async function evaluateOrder(order: any) {
  // 1. Rule Engine
  const { score, reasons } = ruleEngine(order);

  // 2. AI Layer
  const { aiScore, aiReasons, confidence } = await getAiScore(order);

  // 3. Merge Decision
  const { finalScore, status } = mergeDecision(score, aiScore);

  return {
    ...order,
    baseScore: score,
    aiScore,
    finalScore,
    status,
    reasons: [...reasons, ...aiReasons],
    aiConfidence: confidence,
  };
}