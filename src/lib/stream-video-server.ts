import "server-only";
import { StreamClient } from "@stream-io/node-sdk";
import jwt from "jsonwebtoken";

// Server-side Stream Video client - only used in server components or API routes
export const streamVideo = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
    process.env.STREAM_VIDEO_SECRET_KEY!,
);

// Generate a Stream video token on the server
export function generateStreamToken(userId: string): string {
  const secretKey = process.env.STREAM_VIDEO_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error("Missing Stream Video secret key");
  }
  
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  
  return jwt.sign(payload, secretKey);
}
