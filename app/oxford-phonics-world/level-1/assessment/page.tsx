import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LearningScreen } from '../../../learning/learning-screen';
import { Assessment } from './assessment';
export const metadata:Metadata={title:'Kiểm tra 26 chữ cái · Learning With Bee'};
export default function AssessmentPage() {
  return <Suspense fallback={<p>Đang tải bài kiểm tra…</p>}><LearningScreen screen={Assessment} activityId="opw.l1.assessment" /></Suspense>;
}
