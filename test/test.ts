import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
const port = 5678;

const handler = (request: Request): Response => {
  const url = new URL(request.url);
  console.log(url)
  const body = `Your user-agent is:\n\n${
    request.headers.get("user-agent") ?? "Unknown"
  }`;
  
  return new Response(body, { status: 200 });
};

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port });