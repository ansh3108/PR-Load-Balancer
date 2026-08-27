"use client";

import { api } from "~/trpc/react";

export default function Home() {
  const { data, isLoading } = api.github.getRepoPRs.useQuery({
    
    //using nextjs official repo for testing
    owner: "vercel",
    repo: "next.js",
  });

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">PR Load Balancer Test</h1>
      
      {isLoading ? (
        <p>Loading GitHub data...</p>
      ) : (
        <pre className="bg-slate-800 p-4 rounded overflow-auto max-h-[80vh]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}