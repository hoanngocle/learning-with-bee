import { getLearningContext } from '../../learning/queries';
import { getLearningDb } from '../../learning/db';
import { createLearningService } from '../../learning/service';
import { handleLearningRequest } from '../../learning/http';

async function resolveContext() {
  const context=await getLearningContext();
  if(context)return context;
  const db=getLearningDb();return {learner:null,db,service:createLearningService(db)};
}
export async function GET(request:Request) { return handleLearningRequest(request,resolveContext); }
export async function POST(request:Request) { return handleLearningRequest(request,resolveContext); }
