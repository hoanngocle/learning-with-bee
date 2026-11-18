import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';

test('catalog has stable shared quiz identities and rejects foreign answers', () => {
  const c = existsSync('app/learning/catalog.ts') ? createLoader()('app/learning/catalog.ts') : {};
  assert.equal(typeof c.getActivity,'function');
  assert.equal(c.learningLetters.length,26);
  assert.equal(c.learningLetters.flatMap(l=>l.words).length,101);
  assert.equal(c.learningLetters.find(l=>l.letter==='X').words.length,1);
  assert.deepEqual(c.getActivity('opw.l1.quiz.z').questions.map(q=>q.id),['opw.l1.quiz.question.z','opw.l1.quiz.question.a','opw.l1.quiz.question.b']);
  assert.equal(c.getActivity('opw.l1.quiz.a').questions[1].id,c.getActivity('opw.l1.quiz.b').questions[0].id);
  assert.equal(c.gradeAnswer('opw.l1.quiz.a','opw.l1.quiz.question.a','Apple'),true);
  assert.throws(()=>c.gradeAnswer('opw.l1.quiz.a','opw.l1.quiz.question.z','Zebra'));
  assert.throws(()=>c.getActivity('bad'));
});
test('scoring distinguishes solved practice from first-try perfect and revealed answers', () => {
  const s = existsSync('app/learning/scoring.ts') ? createLoader()('app/learning/scoring.ts') : {};
  assert.equal(typeof s.scoreAttempt,'function');
  const q={id:'a',solved:true,answered:true,firstAnswerCorrect:true,hintCount:0,revealed:false,points:10};
  assert.deepEqual(s.scoreAttempt({kind:'quiz',questions:[q,q,q]}),{gameScore:30,correctFirst:3,perfect:true,eligible:true});
  assert.equal(s.scoreAttempt({kind:'quiz',questions:[{...q,firstAnswerCorrect:false}]}).perfect,false);
  assert.equal(s.scoreAttempt({kind:'quiz',questions:[{...q,hintCount:1}]}).perfect,false);
  assert.equal(s.scoreAttempt({kind:'quiz',questions:[{...q,revealed:true}]}).gameScore,0);
  assert.equal(s.scoreAttempt({kind:'assessment',questions:[{...q,firstAnswerCorrect:false}]}).gameScore,0);
  assert.equal(s.calculateXp(20,500),21); assert.equal(s.calculateXp(10,950),10);
  for(const [xp,level] of [[0,1],[99,1],[100,2],[299,2],[300,3]]) assert.equal(s.levelForXp(xp).level,level);
  assert.throws(()=>s.calculateXp(-1,0)); assert.throws(()=>s.levelForXp(Infinity));
});
