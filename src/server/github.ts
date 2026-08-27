import { Octokit } from "octokit";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function getOpenPRs(owner:string, repo:string) {
   const response = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
})

const cleanPRs = response.data.map((pr) => {
    return {
        id: String(pr.id),
        title: pr.title,
        authorLogin: pr.user?.login,
        openedAt: new Date(pr.created_at),
        requestedReviewers: pr.requested_reviewers?.map((reviewer) => reviewer.login) || [],
    };
})

   return cleanPRs;
}