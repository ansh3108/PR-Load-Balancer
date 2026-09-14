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

        console.log(`[DEBUG] Syncing ${repoFullName} | Allowed by upstash`, success);


        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `The repository ${repoFullName} was synced recently! Please wait 5 minutes before trying again.`
          });
        }

        const prs = await getOpenPRs(input.owner, input.repo);

        const uniqueReviewers = [...new Set(prs.flatMap((pr) => pr.requestedReviewers))];

        await ctx.db.$transaction(
          uniqueReviewers.map((reviewerLogin) => 
            ctx.db.user.upsert({
              where: { githubLogin: reviewerLogin },
              update: {},
              create: {
                id: reviewerLogin,
                githubLogin: reviewerLogin,
              },
            })
          )
        );

        await ctx.db.$transaction(
          prs.map((pr) => 
            ctx.db.pullRequest.upsert({
              where: { id: pr.id },
              update: { title: pr.title },
              create: {
                id: pr.id,
                repo: repoFullName,
                title: pr.title,
                authorLogin: pr.authorLogin,
                openedAt: pr.openedAt,
              },
            })
          )
        );

        const reviewOperations = prs.flatMap((pr) => 
          pr.requestedReviewers.map((reviewerLogin) => 
            ctx.db.review.upsert({
              where: { id: `${pr.id}-${reviewerLogin}` },
              update: {},
              create: {
                id: `${pr.id}-${reviewerLogin}`,
                pullRequestId: pr.id,
                reviewerId: reviewerLogin,
                requestedAt: new Date(),
              },
            })
          )
        );

        if (reviewOperations.length > 0) {
          await ctx.db.$transaction(reviewOperations);
        }
      }),

    getLoadScores: publicProcedure
      .input(z.object({ owner: z.string(), repo: z.string() }))
      .query(async ({ ctx, input }) => {
        const repoFullName = `${input.owner}/${input.repo}`;

        const userWithScores = await ctx.db.user.findMany({
          where: {
            reviews: {
              some: {
                pullRequest: {
                  repo: repoFullName,
                },
              },
            },
          },
          include: {
            _count: {
              select: {
                reviews:{
                  where: {
                    pullRequest: {
                      repo: repoFullName,
                    },
                  },
                },
              },
            },
          },
        }); 

        return userWithScores.sort((a, b) => b._count.reviews - a._count.reviews);
      }), 
}); 