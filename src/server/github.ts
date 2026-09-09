import { Octokit } from "octokit";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function getOpenPRs(owner:string, repo:string) {
   const allPrs = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
});

return allPrs.map((pr) => ({
    id: pr.id.toString(), 
    title: pr.title,
    authorLogin: pr.user?.login ?? "unknown",
    openedAt: new Date(pr.created_at),
    requestedReviewers: pr.requested_reviewers?.map((reviewer) => reviewer.login) ?? [],
}));
}