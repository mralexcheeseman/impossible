import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {GitHub} from '../lib/github';
import {ResponsesProvider} from '../lib/provider';
import {assertRunAllowed,generateBatch} from '../lib/pipeline';
import {Batch,feedbackFromIssue,type FeedbackType,type BatchType} from '../lib/schema';
import {capturePages} from './check-pages';
const repo=process.env.GITHUB_REPOSITORY??'';
const token=process.env.GITHUB_TOKEN??'';
const github=new GitHub(repo,token);
const metadata=await github.request('');
const pulls=await github.list('/pulls?state=open');
assertRunAllowed({enabled:process.env.LAB_ENABLED==='true',privateRepo:metadata.private===true,openDrafts:pulls.filter(p=>p.head.ref.startsWith('lab/')).length});
if(!process.env.OPENAI_API_KEY)throw new Error('Set OPENAI_API_KEY as a GitHub Actions secret');
const issues=await github.list('/issues?state=all&sort=created&direction=desc');
if(issues.some(i=>!i.pull_request&&i.state==='open'&&i.title==='[Lab pause]'))throw new Error('Paused by owner issue');
const now=new Date();const id=`lab-${now.toISOString().slice(0,10)}`;
if(issues.some(i=>i.title===`[Lab run] ${id}`)){console.log('This UTC date already has a claimed run. No model calls made.');process.exit(0);}
const feedback:FeedbackType[]=[];const feedbackRecords:{number:number;value:FeedbackType}[]=[];const history:string[]=[];const past:BatchType[]=[];
for(const issue of [...issues].reverse()){
 if(issue.pull_request)continue;
 if(issue.title.startsWith('[Lab feedback]')){const f=feedbackFromIssue(issue.body??'',issue.user.login,metadata.owner.login);if(f){feedback.push(f);feedbackRecords.push({number:issue.number,value:f});}}
 if(issue.title.startsWith('[Lab run]')){const comments=await github.list(`/issues/${issue.number}/comments`);for(const comment of comments){if(!['github-actions[bot]',metadata.owner.login].includes(comment.user.login))continue;const m=comment.body.match(/<!-- LAB_RESULT -->\s*```json\s*([\s\S]*?)\s*```/);if(m){try{const b=Batch.parse(JSON.parse(m[1]));past.push(b);history.push(...b.ideas.map(i=>`${i.name}: ${i.problem}`));}catch{throw new Error('Stored run result failed validation');}}}}
}
const applied=new Set(past.flatMap(b=>b.events.filter(e=>e.type==='feedback.applied').map(e=>Number(e.detail))));
let revision;
const latestReviews=new Map<string,typeof feedbackRecords[number]>();for(const review of feedbackRecords)latestReviews.set(review.value.ideaId,review);
for(const review of [...latestReviews.values()].sort((a,b)=>b.number-a.number)){if(review.value.decision!=='revise'||applied.has(review.number))continue;const original=[...past].reverse().find(b=>b.pages.some(p=>p.ideaId===review.value.ideaId));if(!original)continue;revision={idea:original.ideas.find(i=>i.id===review.value.ideaId)!,page:original.pages.find(p=>p.ideaId===review.value.ideaId)!,challenge:original.challenges.find(c=>c.ideaId===review.value.ideaId)!,feedbackId:review.number};break;}
const run=await github.request('/issues','POST',{title:`[Lab run] ${id}`,body:`Run claimed at ${now.toISOString()}.\n\nIdempotency key: ${id}. One claimed run per UTC date. This issue records events and the resulting review branch.\n\nWorkflow: https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID??''}`});
const comment=(body:string)=>github.request(`/issues/${run.number}/comments`,'POST',{body});
try{
 const batch=await generateBatch({id,provider:new ResponsesProvider(process.env.OPENAI_API_KEY,process.env.LAB_MODEL||'gpt-4.1'),build:process.env.LAB_BUILD==='true',contracts:await readFile('prompts/contracts.md','utf8'),standards:await readFile('design/standards.md','utf8'),history,feedback,revision,capture:capturePages,onEvent:async e=>{await comment(`**${e.type}** · ${e.at}\n\n${e.detail}${e.inputTokens!==undefined?`\n\nTokens: ${e.inputTokens} input / ${e.outputTokens} output`:''}`);}});
 await mkdir('data/batches',{recursive:true});await writeFile(`data/batches/${id}.json`,JSON.stringify(batch,null,2)+'\n');
 const content=JSON.stringify(batch,null,2)+'\n';
 const ref=await github.request(`/git/ref/heads/${metadata.default_branch}`);const parent=await github.request(`/git/commits/${ref.object.sha}`);
 const tree=await github.request('/git/trees','POST',{base_tree:parent.tree.sha,tree:[{path:`idea-lab/data/batches/${id}.json`,mode:'100644',type:'blob',content}]});
 const commit=await github.request('/git/commits','POST',{message:`lab: ${id} candidate batch`,tree:tree.sha,parents:[ref.object.sha]});
 const branch=`lab/${id}`;await github.request('/git/refs','POST',{ref:`refs/heads/${branch}`,sha:commit.sha});
 const pr=await github.request('/pulls','POST',{title:`Idea Lab: ${batch.ideas.map(i=>i.name).join(' / ')}`,head:branch,base:metadata.default_branch,draft:true,body:`## Candidate batch\n\n${batch.ideas.length} researched ideas; ${batch.pages.length} landing page concepts.\n\nOpen the Vercel preview when available, then review each brief and use its feedback form. Submit the prepared GitHub issue to save feedback.\n\nRun history: #${run.number}\n\nThe model's triage score is not a demand estimate. Permanent design-rule changes require a separate reviewed edit. Nothing is automatically merged or promoted to production.`});
 await comment(`<!-- LAB_RESULT -->\n\n\`\`\`json\n${JSON.stringify(batch)}\n\`\`\`\n\nReview: ${pr.html_url}`);await github.request(`/issues/${run.number}`,'PATCH',{state:'closed'});console.log(`Created review: ${pr.html_url}`);
}catch(error){await comment('**run.failed**\n\nThe run stopped. Inspect the GitHub Actions logs. The daily idempotency claim remains in place to prevent repeated spend.');throw error;}
