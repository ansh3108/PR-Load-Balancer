import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getOpenPRs } from "~/server/github";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, "5 m"),
  analytics: true,
});

export const githubRouter = createTRPCRouter({
  getRepoPRs: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string()
    }))
    .query(async ({ input }) => {
      const prs = await getOpenPRs(input.owner, input.repo);

      return prs;
    }),
    
    syncRepo: publicProcedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const repoFullName = `${input.owner}/${input.repo}`;
        
        const { success } = await rateLimit.limit(`sync_${repoFullName}`);

        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `The repository ${repoFullName} was synced recently! Please wait 5 minutes before trying again.`
          });
        }

        const prs = await getOpenPRs(input.owner, input.repo);
        const uniqueReviewers = [...new Set(prs.flatMap((pr) => pr.requestedReviewers))];

        if (uniqueReviewers.length > 0) {
          await ctx.db.user.createMany({
            data: uniqueReviewers.map((login) => ({
              id: login,
              githubLogin: login,
            })),
            skipDuplicates: true,
          });
        }

        if (prs.length > 0) {
          await ctx.db.pullRequest.createMany({
            data: prs.map((pr) => ({
              id: pr.id,
              repo: repoFullName,
              title: pr.title,
              authorLogin: pr.authorLogin,
              openedAt: pr.openedAt,
            })),
            skipDuplicates: true,
          });
        }

        const reviewData = prs.flatMap((pr) => 
          pr.requestedReviewers.map((reviewerLogin) => ({
            id: `${pr.id}-${reviewerLogin}`,
            pullRequestId: pr.id,
            reviewerId: reviewerLogin,
            requestedAt: new Date(),
          }))
        );

        if (reviewData.length > 0) {
          await ctx.db.review.createMany({
            data: reviewData,
            skipDuplicates: true,
          });
        }

        return { syncedCount: prs.length };
      }),

    getLoadScores: publicProcedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .query(async ({ ctx, input }) => {
        const repoFullName = `${input.owner}/${input.repo}`;

        const [userWithScores, totalPRs] = await Promise.all([
          ctx.db.user.findMany({
            where: {
              reviews: { some: { pullRequest: { repo: repoFullName } } },
            },
            include: {
              _count: { select: { reviews: { where: { pullRequest: { repo: repoFullName } } } } },
            },
          }),
          ctx.db.pullRequest.count({
            where: { repo: repoFullName }
          })
        ]) ;

        const sortedUsers = userWithScores.sort((a, b) => b._count.reviews - a._count.reviews);

        return {
          users: sortedUsers,
          totalPRs,
          totalReviewers: sortedUsers.length
        };
      }), 
}); 