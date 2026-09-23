import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {Batch,verifyRelations,type BatchType} from './schema';
import {isDemo} from './auth';
export async function batches():Promise<BatchType[]>{const dir=path.join(process.cwd(),'data/batches');const names=await readdir(dir);const values=await Promise.all(names.filter(n=>n.endsWith('.json')).map(async n=>Batch.parse(JSON.parse(await readFile(path.join(dir,n),'utf8')))));for(const b of values)verifyRelations(b);return values.filter(b=>!isDemo()||b.mode==='example').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export async function findIdea(id:string){for(const batch of await batches()){const idea=batch.ideas.find(i=>i.id===id);if(idea)return {batch,idea,challenge:batch.challenges.find(c=>c.ideaId===id)!,page:batch.pages.find(p=>p.ideaId===id)};}return null;}
export async function standards(){return readFile(path.join(process.cwd(),'design/standards.md'),'utf8');}
export function repository(){const r=process.env.NEXT_PUBLIC_LAB_REPOSITORY||'mralexcheeseman/impossible';return /^[\w.-]+\/[\w.-]+$/.test(r)?r:'mralexcheeseman/impossible';}
