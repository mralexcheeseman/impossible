import {NextRequest,NextResponse} from 'next/server';
import {COOKIE,enabledSecret,isDemo,validSession} from './lib/auth';
export function proxy(req:NextRequest){if(process.env.NODE_ENV==='development'||isDemo())return NextResponse.next();const p=req.nextUrl.pathname;if(p==='/login'||p==='/api/login')return NextResponse.next();const secret=enabledSecret();if(secret&&validSession(req.cookies.get(COOKIE)?.value??'',secret))return NextResponse.next();return NextResponse.redirect(new URL('/login',req.url));}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
