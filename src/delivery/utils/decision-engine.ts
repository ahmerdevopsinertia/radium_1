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
  let score = 0;
  const reasons: string[] = [];

  const address = (order.address || '').toLowerCase();
  const phone = order.phone || '';
  const cod = Number(order.codAmount) || 0;
  const city = order.city || '';

  // Address
  if (!address || address.length < 10) {
    score += 25;
    reasons.push('Incomplete address');
  }

  if (!address.includes('street') && !address.includes('building')) {
    score += 10;
    reasons.push('Address lacks details');
  }

  // Phone
  if (!/^05\d{8}$/.test(phone)) {
    score += 30;
    reasons.push('Invalid UAE phone');
  }

  // COD
  if (cod > 1000) {
    score += 40;
    reasons.push('Very high COD');
  } else if (cod > 500) {
    score += 20;
    reasons.push('High COD');
  }

  // City
  if (!city) {
    score += 15;
    reasons.push('Missing city');
  }

  const riskyCities = ['Sharjah Industrial', 'Ajman'];
  if (riskyCities.includes(city)) {
    score += 10;
    reasons.push('High-risk area');
  }

  // Suspicious patterns
  if (phone === '0500000000') {
    score += 40;
    reasons.push('Fake phone');
  }

  // Cap score
  if (score > 100) score = 100;

  let status = 'READY';

  if (score >= 70) status = 'DO_NOT_SHIP';
  else if (score >= 40) status = 'RISKY';

  return { score, status, reasons };
}

export async function getAiScore(order: any) {
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

export async function evaluateOrder(order: any) {
  // 1. Rule Engine
  const { score, reasons } = ruleEngine(order);

  // 2. AI Layer
  const { aiScore, aiReasons, confidence } = await getAiScore(order);

  // 3. Merge Decision
  const { finalScore, status, decisionSource } = mergeDecision(score, aiScore);

  return {
    ...order,
    ruleEngineScore: score,
    aiScore,
    finalScore,
    status,
    reasons,
    aiConfidence: confidence,
    aiReasons: aiReasons,
    decisionSource,
  };
}

export function mergeDecision(ruleScore: number, aiScore: number) {
  // 🎯 Weighting (rule > AI)
  const RULE_WEIGHT = 0.7;
  const AI_WEIGHT = 0.3;

  let adjustedAi = aiScore;

  // Boost extreme AI signals
  if (aiScore >= 40) adjustedAi += 5;
  if (aiScore <= 10) adjustedAi -= 5;

  const finalScore = Math.round(
    ruleScore * RULE_WEIGHT + adjustedAi * AI_WEIGHT
  );

  // 🚫 Hard rule (cannot be overridden)
  if (ruleScore >= 80) {
    return {
      finalScore,
      status: 'DO_NOT_SHIP',
      decisionSource: 'HARD_RULE_SCORE',
    };
  }

  // 📊 Final decision
  if (finalScore >= 70) {
    return {
      finalScore,
      status: 'DO_NOT_SHIP',
      decisionSource: 'WEIGHTED_SCORE',
    };
  }

  if (finalScore >= 40) {
    return {
      finalScore,
      status: 'RISKY',
       decisionSource: 'WEIGHTED_SCORE'
    };
  }

  return {
    finalScore,
    status: 'READY',
    decisionSource: 'WEIGHTED_SCORE',
  };
}