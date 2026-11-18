import 'server-only';
import { getSessionAccount } from '../login/session';
import { getLearningDb } from './db';
import { ensureLearner } from './repository';
import { createLearningService } from './service';

export async function getLearningContext() {
  const account=await getSessionAccount();
  if(!account) return null;
  const db=getLearningDb(),learner=ensureLearner(db,account);
  return {learner,db,service:createLearningService(db)};
}
export async function loadLearner(activityId?:string) {
  const context=await getLearningContext();
  return {initialSnapshot:context?context.service.getSnapshot(context.learner):null,
    initialAttempt:context&&activityId?context.service.getActiveAttempt(context.learner,activityId):null};
}
