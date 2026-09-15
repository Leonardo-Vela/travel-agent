export default function HomePage() {
  return (
    <main>
      <h1>Travel Agent API</h1>
      <p>This project is now a Next.js app ready for Vercel deployment.</p>
      <p>Available endpoints:</p>
      <pre>{`GET  /api/health\nGET  /health\nGET  /api/tools\nGET  /api/data\nPOST /api/chat`}</pre>
      <p>
        Required environment variable: <code>OPENAI_API_KEY</code>
      </p>
    </main>
  );
}
