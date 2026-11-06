/// <reference types="node" />
// Vercel serverless function: POST /api/elf-lines
// Requires GEMINI_API_KEY in the Vercel project's environment variables
// (optional GEMINI_MODEL to override the default model).
import { handleElfLinesRequest } from '../server/elfLines';

export async function POST(request: Request): Promise<Response> {
  return handleElfLinesRequest(request, process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
}
