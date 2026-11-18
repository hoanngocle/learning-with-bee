'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getQuestion } from '../lesson-content';
import { useLearner } from '../../../learning/use-learner';
import { SaveStatus } from '../../../learning/save-status';
import type { GameInitial } from '../../../learning/use-game';
import { useEnglishSpeech } from '../../../use-english-speech';
import styles from './assessment.module.css';

export function Assessment(initial:GameInitial) {
  const learner=useLearner(initial.initialSnapshot),{speak,audioError}=useEnglishSpeech();
  const attempt=learner.snapshot?(learner.lastResult?.attempt??initial.initialAttempt):null;
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    if(!attempt||attempt.status!=='in_progress')return;
    const timer=setInterval(()=>setElapsed(Math.max(0,Math.floor((Date.now()-Date.parse(attempt.startedAt))/1000))),1000);
    return ()=>clearInterval(timer);
  },[attempt]);
  const index=Math.max(0,attempt?.questions.findIndex(q=>!q.answered)??0),question=getQuestion(0,index);
  const busy=learner.status==='saving';
  return <main className={`page-width ${styles.page}`}>
    <Link href="/oxford-phonics-world/level-1">← Về bài học A–Z</Link>
    <h1>Kiểm tra tổng hợp 26 chữ cái</h1>
    <SaveStatus signedIn={!!learner.snapshot} status={learner.status} message={learner.message} retry={learner.retry} />
    <p>Mỗi câu trả lời một lần. Không có gợi ý. Xếp hạng theo số câu đúng và thời gian tính từ lúc bắt đầu, kể cả khi rời trang.</p>
    {!learner.snapshot?<p><Link href="/login">Đăng nhập</Link> để làm bài và lưu kết quả.</p>:!attempt?<button className={styles.start} type="button" disabled={busy} onClick={()=>void learner.send('startAttempt',{activityId:'opw.l1.assessment'})}>Bắt đầu bài kiểm tra</button>
      :attempt.status==='completed'?<section className="learning-summary"><h2>🎉 Bé đã hoàn thành!</h2><p>Đúng {attempt.correctFirst}/26 câu. Thời gian {Math.round((Date.parse(attempt.completedAt!)-Date.parse(attempt.startedAt))/1000)} giây.</p><Link href="/bangxephang">Xem bảng xếp hạng</Link><button type="button" disabled={busy} onClick={()=>void learner.send('startAttempt',{activityId:'opw.l1.assessment'})}>Làm lại</button></section>
      :<section className={styles.card} aria-labelledby="assessment-question"><p>Câu {index+1}/26 · Thời gian {elapsed} giây</p><h2 id="assessment-question">Which one is “{question.target.word}”?</h2><button type="button" onClick={()=>speak(`Which one is ${question.target.word}?`)}>🔊 Nghe câu hỏi</button>{audioError&&<p role="status">Chưa phát được âm thanh. Bé có thể đọc câu hỏi để tiếp tục.</p>}
        <div className={styles.options}>{question.options.map(option=><button key={option.word} type="button" disabled={busy} onClick={()=>void learner.send('answerQuestion',{attemptId:attempt.id,questionId:attempt.questions[index].id,selectedId:option.word})}><span aria-hidden="true">{option.emoji}</span><strong>{option.word}</strong><small>{option.meaning}</small></button>)}</div>
      </section>}
  </main>;
}
