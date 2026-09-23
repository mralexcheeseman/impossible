import {NextRequest,NextResponse} from 'next/server';
import {COOKIE,sameOrigin} from '@/lib/auth';
export async function POST(req:NextRequest){if(!sameOrigin(req.headers))return new Response('Invalid origin',{status:403});const response=NextResponse.redirect(new URL('/login',req.headers.get('origin')!),303);response.cookies.delete(COOKIE);return response;}
