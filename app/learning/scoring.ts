import { LearningError, type AttemptScoreInput } from './types';

function nonnegative(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new LearningError('INVALID_INPUT');
}
export function calculateXp(baseXp: number, bonusBps: number) {
  nonnegative(baseXp); nonnegative(bonusBps);
  return Math.floor(baseXp * (10000 + bonusBps) / 10000);
}
export function levelForXp(totalXp: number) {
  nonnegative(totalXp);
  const level = Math.floor((1 + Math.sqrt(1 + totalXp * .08)) / 2);
  return { level, xpWithinLevel: totalXp - 50 * level * (level-1), xpToNext: 100 * level };
}
export function scoreAttempt(input: AttemptScoreInput) {
  const eligible = input.questions.every(q=>!q.revealed && !q.hintCount);
  const correctFirst = input.questions.filter(q=>q.firstAnswerCorrect).length;
  const gameScore = input.questions.reduce((sum,q)=>sum + (!q.revealed && (input.kind==='assessment' ? q.firstAnswerCorrect : q.solved) ? q.points : 0),0);
  return { gameScore, correctFirst, perfect: eligible && input.questions.length > 0 && correctFirst===input.questions.length, eligible };
}
