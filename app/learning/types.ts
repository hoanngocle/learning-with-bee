export type Learner = { id: string; username: string; displayName: string };
export type LearningErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_INPUT' | 'CONFLICT' | 'BUSY' | 'UNAVAILABLE';
export class LearningError extends Error {
  constructor(public code: LearningErrorCode, message: string = code) { super(message); }
}
export type Mutation<T> = { requestId: string; input: T };
export type ActivityKind = 'flashcard' | 'quiz' | 'scramble' | 'box' | 'assessment';
export type QuestionDefinition = {
  id: string; targetId: string; prompt: string; options: string[];
  points: number; hint: string;
};
export type ActivityDefinition = { id: string; kind: ActivityKind; questions: QuestionDefinition[] };
export type QuestionProgress = {
  id: string; solved: boolean; answered: boolean; firstAnswerCorrect: boolean | null;
  hintCount: number; revealed: boolean;
};
export type AttemptScoreInput = { kind: ActivityKind; questions: Array<QuestionProgress & { points: number }> };
export type AttemptDto = {
  id: string; activityId: string; kind: ActivityKind; status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string; completedAt: string | null; questions: QuestionProgress[];
  gameScore: number; correctFirst: number; questionCount: number;
};
export type RewardDto = {
  id: string; kind: 'mastery' | 'level_up'; status: 'pending' | 'claimed';
  xp: number; stars: number; level: number | null; celebrationSeen: boolean;
};
export type LearnerSnapshot = {
  revision: number; studyDate: string; learner: Learner;
  profile: { totalXp: number; stars: number; level: number; xpWithinLevel: number; xpToNext: number; bonusBps: number };
  learnedWordIds: string[]; reviewedTodayWordIds: string[]; seenLetterIds: string[]; completedLetterIds: string[];
  resume: { letterId: string; wordId: string } | null;
  counts: { sessions: number; perfect: number; studyDays: number; currentStreak: number; longestStreak: number };
  badges: Array<{ id: string; unlockedAt: string | null }>; rewards: RewardDto[];
};
export type MutationResult = {
  snapshot: LearnerSnapshot; attempt: AttemptDto | null; feedback: 'correct' | 'retry' | 'recorded' | null;
  assistance: { kind: 'hint' | 'reveal'; text: string } | null;
};
export type LearningCommands = {
  markWord: { wordId: string; state: 'seen' | 'learned' };
  saveResume: { letterId: string; wordId: string };
  startAttempt: { activityId: string };
  answerQuestion: { attemptId: string; questionId: string; selectedId: string };
  useAssistance: { attemptId: string; questionId: string; kind: 'hint' | 'reveal' };
  abandonAttempt: { attemptId: string };
  claimReward: { rewardId: string };
  acknowledgeCelebration: { rewardId: string };
};
export type LearningOperation = keyof LearningCommands;
export type LeaderboardResult = {
  rows: Array<{ userId: string; displayName: string; score: number; total: number; durationMs: number; rank: number }>;
  own: { rank: number; score: number; durationMs: number } | null;
};
