"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: loadScores, isLoading } = api.github.getLoadScores.useQuery();

  const syncRepoMutation = api.github.syncRepo.useMutation({
    onSuccess: () => alert("SYSTEM_SYNC_COMPLETE. Check Prisma Studio."),
    onError: (err) => alert(`ERR: ${err.message}`),
  });

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <main className="min-h-screen bg-black text-green-500 font-mono p-8 selection:bg-green-900">
      <div className="max-w-3xl mx-auto border border-green-500 p-6 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.15)]">
        
        <h1 className="text-2xl font-bold mb-6 tracking-tight">&gt; PR_LOAD_BALANCER_V1.0</h1>
        
        <div className="mb-8 border-b border-green-500/50 pb-6">
          <button 
            className="bg-green-950 hover:bg-green-900 text-green-400 border border-green-500 py-1 px-4 rounded-sm disabled:opacity-50 transition-colors cursor-pointer"
            onClick={() => syncRepoMutation.mutate({ owner: "vercel", repo: "next.js" })}
            disabled={syncRepoMutation.isPending}
          >
            {syncRepoMutation.isPending ? "[ PROCESSING_SYNC... ]" : "[ EXECUTE_SYNC ]"}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg opacity-80 uppercase tracking-widest">--- Active Engineer Load ---</h2>
          
          {isLoading ? (
            <p className="animate-pulse">&gt; fetching_database_records...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {loadScores?.map((user) => (
                <div key={user.id} className="flex justify-between items-center bg-green-950/30 p-3 border-l-2 border-green-500">
                  <span className="font-semibold text-lg">@{user.githubLogin}</span>
                  
                  <span className="flex items-center gap-3">
                    <span className="opacity-70 text-sm mt-1">ASSIGNED:</span>
                    <span className="text-2xl font-bold text-green-400">{user._count.reviews}</span>
                    <span className="opacity-70 text-sm mt-1">PR(s)</span>
                  </span>
                </div>
              ))}

              {loadScores?.length === 0 && (
                <p className="opacity-50">&gt; NO_DATA_FOUND. RUN_SYNC_COMMAND.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-12 pt-4 border-t border-green-500/30 text-xs opacity-60 text-right">
          you've been here for {formatTime(seconds)}
        </div>
      </div>
    </main>
  );
}