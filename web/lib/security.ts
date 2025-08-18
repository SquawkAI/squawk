import { SignJWT } from "jose";

export function getEmbeddingKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret || !secret.trim()) {
        throw new Error("JWT_SECRET is not configured");
    }
    return new TextEncoder().encode(secret);
}

export async function mintEmbeddingToken(userId: string) {
    const key = getEmbeddingKey();
    return await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("60s") // short TTL
        .setAudience("embedding")
        .setIssuer("next-api")
        .sign(key);
}