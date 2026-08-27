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
});