import type { ComponentType } from 'react';
import { loadLearner } from './queries';
import type { GameInitial } from './use-game';

export async function LearningScreen({screen:Screen,activityId}:{screen:ComponentType<GameInitial>;activityId?:string}) {
  const data=await loadLearner(activityId);
  return <Screen key={data.initialSnapshot?.learner.id??'guest'} {...data} />;
}
