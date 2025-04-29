// middleware.js
import { NextResponse } from "next/server";

export default function middleware(req) {
  // Ignorer complètement Clerk et laisser passer toutes les requêtes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
