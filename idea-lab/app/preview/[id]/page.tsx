import Link from 'next/link';
import {notFound} from 'next/navigation';
import {findIdea} from '@/lib/data';
import {LandingPage} from '@/components/landing';
export const dynamic='force-dynamic';
export default async function Preview({params}:{params:Promise<{id:string}>}){const {id}=await params;const d=await findIdea(id);if(!d?.page)notFound();return <><div className="preview-bar"><Link href={`/ideas/${id}`}>← Back to the brief</Link><span>CONCEPT PREVIEW · NO SIGNUPS COLLECTED</span></div><LandingPage page={d.page} name={d.idea.name}/></>}
