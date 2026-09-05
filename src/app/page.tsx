"use client";

import { api } from "~/trpc/react";

export default function Home() {
  const { data, isLoading } = api.github.getRepoPRs.useQuery({
    
    //using nextjs official repo for testing
    owner: "vercel",
    repo: "next.js",
  });

  const syncRepoMutation = api.github.syncRepo.useMutation({
    onSuccess: () => alert("Sync complete! Check Prisma Studio."),
    onError: () => alert(`Error: ${err.message}`),
  });

return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">PR Load Balancer Test</h1>
      
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6 disabled:opacity-50"
        onClick={() => syncRepoMutation.mutate({ owner: "vercel", repo: "next.js" })}
        disabled={syncRepoMutation.isPending} 
      >
        {syncRepoMutation.isPending ? "Syncing to Database..." : "Sync PRs to Database"}
      </button>
      
      {isLoading ? (
        <p>Loading GitHub data...</p>
      ) : (
        <pre className="bg-slate-800 p-4 rounded overflow-auto max-h-[70vh]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  )
}