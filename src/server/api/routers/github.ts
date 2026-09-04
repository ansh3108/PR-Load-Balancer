import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getOpenPRs } from "~/server/github";

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
        const prs = await getOpenPRs(input.owner, input.repo);
        for (const pr of prs) {
          await ctx.db.pullRequest.upsert({
            where:{ id: pr.id },
            update: { title: pr.title },
            create: {
              id: pr.id,
              repo: `${input.owner}/${input.repo}`,
              title: pr.title,
              authorLogin: pr.authorLogin ?? "unknown_user",
              openedAt: pr.openedAt,
            },
          });

          for(const reviewerLogin of pr.requestedReviewers) {
            await ctx.db.user.upsert({
              where: { githubLogin: reviewerLogin },
              update: {},
              create: {
                id: reviewerLogin,
                githubLogin: reviewerLogin,
              },
            });
            await ctx.db.review.upsert({
              where: {
                id: `${pr.id}-${reviewerLogin}`,
              },
              update: {},
              create: {
                id: `${pr.id}-${reviewerLogin}`,
                pullRequestId: pr.id,
                reviewerId: reviewerLogin,
                requestedAt: new Date(),
              },
            });
          }
        }
      }),
});