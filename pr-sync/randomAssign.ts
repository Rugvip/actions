import * as core from '@actions/core';
import * as github from '@actions/github';

interface Options {
  owner: string;
  repo: string;
  issueNumber: number;
  action?: string;
  excludedUsers?: string;
  author?: string;
}

export const REVIEWERS = ['jhaals', 'Rugvip', 'benjdlambert', 'freben'];

export async function randomAssign(
  client: ReturnType<typeof github.getOctokit>,
  options: Options,
  log = core.info,
) {
  const { author, owner, repo, issueNumber, action, excludedUsers } = options;

  if (action !== 'opened') {
    log(`Skipping assignment for ${action} action`);
    return;
  }

  const excludes = excludedUsers?.split(',').map(u => u.trim()) ?? [];
  if (author) excludes.push(author);

  const reviewer = await getRandomReviewer(excludes);
  log(`Assigning #${issueNumber} by @${author} to @${reviewer}`);

  await client.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [reviewer],
  });
}

async function getRandomReviewer(excludedUsers?: string[]): Promise<string> {
  let randomReviewer: string;
  let overflow = 0;
  do {
    randomReviewer = REVIEWERS[Math.floor(Math.random() * REVIEWERS.length)];
    if (overflow++ > 100) {
      throw new Error(
        `Stuck in loop picking reviewer with excluded users: ${excludedUsers}`,
      );
    }
  } while (excludedUsers?.includes(randomReviewer));
  return randomReviewer;
}
