import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function migrateDatabase(file) {
  mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  const db=new DatabaseSync(file);
  try{
    db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; BEGIN IMMEDIATE;');
    db.exec(readFileSync(new URL('../app/learning/schema.sql',import.meta.url),'utf8'));
    db.exec('COMMIT');
  }catch(error){try{db.exec('ROLLBACK');}catch{}throw error;}finally{db.close();}
}
export async function backupDatabase(file,output) {
  if(existsSync(output))throw new Error('Backup output already exists; choose a new file.');
  mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
  const db=new DatabaseSync(file,{readOnly:true});
  try{await backup(db,output);}finally{db.close();}
}
export function reconcileDatabase(file) {
  const db=new DatabaseSync(file,{readOnly:true});
  try{
    const mismatches=db.prepare(`SELECT p.user_id AS userId,p.total_xp AS profileXp,p.stars AS profileStars,
      coalesce(sum(r.xp_delta),0) AS ledgerXp,coalesce(sum(r.stars_delta),0) AS ledgerStars
      FROM learner_profiles p LEFT JOIN reward_ledger r ON r.user_id=p.user_id AND r.status='claimed'
      GROUP BY p.user_id HAVING p.total_xp<>coalesce(sum(r.xp_delta),0) OR p.stars<>coalesce(sum(r.stars_delta),0)`).all();
    const foreignKeyErrors=db.prepare('PRAGMA foreign_key_check').all();
    const integrity=db.prepare('PRAGMA integrity_check').all();
    return {ok:mismatches.length===0&&foreignKeyErrors.length===0&&integrity.every(r=>r.integrity_check==='ok'),mismatches,foreignKeyErrors,integrity};
  }finally{db.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const operation=process.argv[2],file=process.env.BEE_DATABASE_PATH;
  try{
    if(!file)throw new Error('Set BEE_DATABASE_PATH to an explicit database path.');
    if(operation==='migrate'){migrateDatabase(file);console.log('Migration complete.');}
    else if(operation==='backup') {
      const index=process.argv.indexOf('--output'),output=index>=0?process.argv[index+1]:null;
      if(!output)throw new Error('Use backup --output <new-file-path>.');
      await backupDatabase(file,output);console.log('Backup complete.');
    }else if(operation==='reconcile') {
      const report=reconcileDatabase(file);console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
    }else throw new Error('Use migrate, backup --output <path>, or reconcile.');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
