import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  validateCredentials,
} from "@/lib/auth";
import { clientIpFromRequest, consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = consumeRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde e tente novamente." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() || "";
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const token = await createSessionToken({ email: user.email, name: user.name });
    const response = NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Falha no login." }, { status: 500 });
  }
}
