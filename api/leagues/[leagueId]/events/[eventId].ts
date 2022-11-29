import { IncomingMessage, ServerResponse } from "http";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  res.setHeader("Content-Type", "text/html");
  res.end("hello world");
  return;
}
