import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
// But since Next.js 16/15 cookies are async, let's make sure our helper is async.

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "farm-management-super-secret-key-12345678"
);

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
  name: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (error) {
    return null;
  }
}
