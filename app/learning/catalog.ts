import { alphabet, getQuestion } from '../oxford-phonics-world/level-1/lesson-content';
import { scrambleWords, mysteryBoxes, boxPictures } from './game-content';
import { LearningError, type ActivityDefinition } from './types';

export const slug = (word: string) => word.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const learningLetters = alphabet.map(entry => ({ ...entry,
  id: `opw.l1.letter.${entry.letter.toLowerCase()}`,
  words: entry.words.map(word => ({ ...word, id: `opw.l1.word.${entry.letter.toLowerCase()}.${slug(word.word)}` })),
}));
export function getActivity(activityId: string): ActivityDefinition {
  if (activityId === 'opw.l1.scramble.breakfast') return { id: activityId, kind: 'scramble', questions: scrambleWords.map(item => ({
    id: `opw.l1.scramble.word.${slug(item.word)}`, targetId: item.word, prompt: item.meaning,
    options: [], points: 20, hint: `Bắt đầu bằng ${item.word[0]}, kết thúc bằng ${item.word.at(-1)}.`,
  })) };
  if (activityId === 'opw.l1.box.breakfast') return { id: activityId, kind: 'box', questions: mysteryBoxes.map((item,index) => ({
    id: `opw.l1.box.question.${index + 1}`, targetId: item.answer, prompt: item.sentence,
    options: boxPictures.map(p=>p.id), points:10, hint: boxPictures.find(p=>p.id===item.answer)!.hint,
  })) };
  const assessment = activityId === 'opw.l1.assessment';
  const index = alphabet.findIndex(item => activityId === `opw.l1.quiz.${item.letter.toLowerCase()}`);
  if (assessment || index >= 0) return { id: activityId, kind: assessment ? 'assessment' : 'quiz', questions: Array.from({length:assessment ? 26 : 3}, (_,round)=> {
    const question = getQuestion(assessment ? 0 : index, round);
    return { id:`opw.l1.quiz.question.${question.target.letter.toLowerCase()}`, targetId:question.target.word,
      prompt:`Which one is ${question.target.word}?`, options:question.options.map(o=>o.word), points:assessment?1:10,
      hint:`Nghe lại từ ${question.target.word}.` };
  }) };
  throw new LearningError('INVALID_INPUT','Hoạt động không tồn tại.');
}
export function gradeAnswer(activityId: string, questionId: string, selectedId: string) {
  const question = getActivity(activityId).questions.find(q=>q.id===questionId);
  if (!question || (question.options.length && !question.options.includes(selectedId))) throw new LearningError('INVALID_INPUT');
  return selectedId === question.targetId;
}
