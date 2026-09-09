"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: loadScores, isLoading, refetch } = api.github.getLoadScores.useQuery();

  const syncRepoMutation = api.github.syncRepo.useMutation({
    onSuccess: async () => {
      await refetch();
    },
    onError: (err) => {
      alert(`Sync failed: ${err.message}`);
    },
  });

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 p-6 md:p-12 font-sans selection:bg-slate-200">
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">PR Load Balancer</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time review distribution for vercel/next.js</p>
          </div>
          
          <button 
            onClick={() => syncRepoMutation.mutate({ owner: "vercel", repo: "next.js" })}
            disabled={syncRepoMutation.isPending}
            className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white transition-all bg-slate-900 border border-transparent rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto shadow-sm cursor-pointer"
          >
            {syncRepoMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </span>
            ) : (
              "Sync Repository"
            )}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engineer Workload</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
                Loading assignment data...
              </div>
            ) : loadScores?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-4 border border-slate-100">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium text-sm">No review data found</p>
                <p className="text-slate-400 text-sm mt-1">Run a repository sync to populate the database.</p>
              </div>
            ) : (
              loadScores?.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-4 md:p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 text-slate-600 font-medium text-sm shadow-inner">
                      {user.githubLogin.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">@{user.githubLogin}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {index === 0 && user._count.reviews > 0 ? "Highest capacity" : "Active reviewer"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 hidden md:block">Assigned PRs</span>
                    <div className="flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-md bg-slate-100 border border-slate-200 text-slate-900 font-semibold text-sm">
                      {user._count.reviews}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-mono">
            you've been here for {formatTime(seconds)}
          </p>
        </div>
      </div>
    </main>
  );
}