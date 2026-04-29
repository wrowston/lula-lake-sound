# CI Autofix Open Source Prompt

Use this prompt to ask an agent to add the Cursor CI autofix workflow and script to an open source repository.

```text
You are adding a GitHub Actions CI autofix system to this repository.

Goal:
- When the normal CI job fails, start a Cursor Cloud Agent that inspects the failed run, fixes the underlying issue, verifies the fix, and opens or updates a pull request.
- Keep the setup safe for an open source repo: do not run autofix for forked pull requests, avoid recursive Cursor-created branch loops, and require a repository secret for the Cursor API key.

Implementation requirements:
1. Add the Cursor Cloud Agent SDK dependency.
   - If this repo uses Bun, run: bun add -d @cursor/february
   - If this repo uses another package manager, use that package manager's equivalent dev dependency install.

2. Create or update .github/workflows/ci.yml.
   - Keep the repository's existing test/build steps if they already exist.
   - Add a normal CI job that runs tests and build.
   - Add a second job named cursor-autofix that:
     - needs the normal CI job.
     - runs only when the normal CI job fails.
     - does not run on branches that start with cursor/.
     - runs on push failures.
     - runs on same-repository pull request failures only.
     - can be manually started through workflow_dispatch with a cursor_autofix boolean input.
     - uses read-only contents and pull request permissions.
     - checks out the repo, installs dependencies, and runs .github/scripts/cursor-autofix.ts.
     - passes CURSOR_API_KEY from secrets.CURSOR_API_KEY.
     - passes CURSOR_MODEL from vars.CURSOR_MODEL with a default of composer-2.
     - passes PR_URL from github.event.pull_request.html_url when available.

3. Create .github/scripts/cursor-autofix.ts.
   - Use @cursor/february/agent.
   - Validate required environment variables.
   - Build a workflow URL from GITHUB_REPOSITORY, GITHUB_RUN_ID, and GITHUB_RUN_ATTEMPT.
   - Target the PR URL when available, otherwise target the failing SHA.
   - Include verification commands in the prompt.
   - Support CURSOR_AUTOFIX_DRY_RUN=true so maintainers can inspect the generated prompt without starting an agent.
   - Stream useful Cursor run status to the GitHub Actions log.
   - Print created branch and PR URLs when available.
   - Set a non-zero exit code if the Cursor run does not finish successfully.
   - Dispose the agent in a finally block.

4. Add setup documentation to README.md or equivalent.
   - Required secret: CURSOR_API_KEY.
   - Optional variable: CURSOR_MODEL.
   - Explain that forked PRs are intentionally ignored for secret safety.
   - Explain that cursor/* branches are ignored to prevent autofix loops.
   - Include a dry-run command maintainers can use locally or in CI.

Reference implementation notes:
- The final workflow lives in .github/workflows/ci.yml.
- The final agent launcher lives in .github/scripts/cursor-autofix.ts.
- The package dependency added for the launcher is @cursor/february.
- The workflow_dispatch path was later tightened so manual dispatch only starts an agent when cursor_autofix=true.
- The autofix job was guarded against cursor/* branches to prevent recursive autofix loops.
- Pull request autofix is limited to same-repository PRs so secrets are not exposed to forked pull requests.
- The agent prompt tells Cursor to inspect the failed workflow URL, reproduce the failure, keep the fix focused, run verification, and document infrastructure or credential failures instead of inventing code fixes.

Files from the reference implementation:

package.json dependency:
```json
{
  "devDependencies": {
    "@cursor/february": "^1.0.7"
  }
}
```

.github/workflows/ci.yml:
```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]
    types: [opened, synchronize, reopened, labeled]
  workflow_dispatch:
    inputs:
      cursor_autofix:
        description: "Start a Cursor Cloud Agent if CI fails"
        required: false
        type: boolean
        default: false

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.ref_name }}
  cancel-in-progress: true

jobs:
  test-and-build:
    name: Test and build
    runs-on: ubuntu-latest

    env:
      CI: "true"

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Cache Bun install
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests
        run: bun test

      - name: Build
        run: bun run build

  cursor-autofix:
    name: Cursor autofix
    runs-on: ubuntu-latest
    needs: test-and-build
    if: >-
      ${{
        failure() &&
        needs.test-and-build.result == 'failure' &&
        !startsWith(github.head_ref || github.ref_name, 'cursor/') &&
        (
          github.event_name == 'push' ||
          (
            github.event_name == 'workflow_dispatch' &&
            inputs.cursor_autofix
          ) ||
          (
            github.event_name == 'pull_request' &&
            github.event.pull_request.head.repo.full_name == github.repository
          )
        )
      }}
    permissions:
      contents: read
      pull-requests: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Cache Bun install
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Start Cursor Cloud Agent
        run: bun .github/scripts/cursor-autofix.ts
        env:
          CURSOR_API_KEY: ${{ secrets.CURSOR_API_KEY }}
          CURSOR_MODEL: ${{ vars.CURSOR_MODEL || 'composer-2' }}
          PR_URL: ${{ github.event.pull_request.html_url || '' }}
```

.github/scripts/cursor-autofix.ts:
```ts
import { Agent } from "@cursor/february/agent";

const requiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optionalEnv = (name: string) => {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
};

const formatList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const repository = requiredEnv("GITHUB_REPOSITORY");
const githubSha = requiredEnv("GITHUB_SHA");
const githubRunId = requiredEnv("GITHUB_RUN_ID");
const githubRunAttempt = optionalEnv("GITHUB_RUN_ATTEMPT") ?? "1";
const githubRefName = optionalEnv("GITHUB_REF_NAME") ?? "unknown";
const githubEventName = optionalEnv("GITHUB_EVENT_NAME") ?? "unknown";
const prUrl = optionalEnv("PR_URL");
const workflowUrl = `https://github.com/${repository}/actions/runs/${githubRunId}/attempts/${githubRunAttempt}`;
const repoUrl = `https://github.com/${repository}`;
const dryRun = optionalEnv("CURSOR_AUTOFIX_DRY_RUN") === "true";

const repoConfig = prUrl
  ? { url: repoUrl, prUrl }
  : { url: repoUrl, startingRef: githubSha };

const verificationCommands = ["bun install --frozen-lockfile", "bun test", "bun run build"];

const prompt = `The GitHub Actions CI workflow failed for ${repository}.

Context:
- Event: ${githubEventName}
- Ref: ${githubRefName}
- SHA: ${githubSha}
- Failed workflow run: ${workflowUrl}
${prUrl ? `- Pull request: ${prUrl}` : "- Pull request: none; create a new fix PR"}

Please inspect the failure, reproduce it, and fix the underlying code issue.

Verification commands:
${formatList(verificationCommands)}

Requirements:
- Run the verification commands before finishing.
- Keep the fix focused on the CI failure.
- Do not make unrelated refactors.
- If the failure is caused by unavailable infrastructure or credentials rather than code, document that clearly instead of fabricating a code fix.
${prUrl ? "- Push the fix back to the pull request branch if you have permission." : "- Commit the fix, push a branch, and open a pull request."}
- Include the verification results in your final response.`;

if (dryRun) {
  console.log("Cursor autofix dry run");
  console.log(JSON.stringify({ repoConfig, workflowUrl }, null, 2));
  console.log(prompt);
  process.exit(0);
}

const agent = Agent.create({
  apiKey: requiredEnv("CURSOR_API_KEY"),
  model: { id: optionalEnv("CURSOR_MODEL") ?? "composer-2" },
  cloud: {
    repos: [repoConfig],
    autoCreatePR: true,
    skipReviewerRequest: true,
  },
});

try {
  console.log("Starting Cursor Cloud Agent autofix run...");
  console.log(`Repository: ${repoUrl}`);
  console.log(`Target: ${prUrl ?? githubSha}`);
  console.log(`Workflow: ${workflowUrl}`);

  const run = await agent.send(prompt);

  for await (const event of run.stream()) {
    switch (event.type) {
      case "assistant":
        for (const block of event.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
          }
        }
        break;
      case "status":
        console.log(`\n[cursor:status] ${event.status}${event.message ? ` - ${event.message}` : ""}`);
        break;
      case "task":
        if (event.text) {
          console.log(`\n[cursor:task] ${event.text}`);
        }
        break;
      case "tool_call":
        console.log(`\n[cursor:tool] ${event.name}: ${event.status}`);
        break;
      case "thinking":
      case "request":
      case "system":
      case "user":
        break;
    }
  }

  const result = await run.wait();

  console.log(`\nCursor run finished with status: ${result.status}`);

  for (const branch of result.git?.branches ?? []) {
    if (branch.branch) {
      console.log(`Cursor branch: ${branch.branch}`);
    }

    if (branch.prUrl) {
      console.log(`Cursor PR: ${branch.prUrl}`);
    }
  }

  if (result.status !== "finished") {
    process.exitCode = 1;
  }
} finally {
  await agent[Symbol.asyncDispose]();
}
```

Reference behavior to preserve:
- The workflow uses a separate autofix job instead of embedding agent startup in the main CI job.
- The autofix job depends on the failing CI job and uses failure() plus needs.test-and-build.result == 'failure'.
- Forked pull requests are excluded because GitHub does not expose repository secrets to untrusted fork workflows.
- cursor/* branches are excluded so fixes created by the agent do not recursively start more agents.
- workflow_dispatch is supported but requires cursor_autofix=true, which prevents accidental manual agent starts.
- CURSOR_AUTOFIX_DRY_RUN=true prints repoConfig, workflowUrl, and the exact agent prompt without requiring CURSOR_API_KEY.

After implementing, verify:
- Run the package manager install command.
- Run the repository's test command.
- Run the repository's build command.
- Run a dry run similar to:
  CURSOR_AUTOFIX_DRY_RUN=true GITHUB_REPOSITORY=owner/repo GITHUB_SHA=0000000000000000000000000000000000000000 GITHUB_RUN_ID=123 GITHUB_RUN_ATTEMPT=1 GITHUB_REF_NAME=main GITHUB_EVENT_NAME=workflow_dispatch bun .github/scripts/cursor-autofix.ts

Do not call the real Cursor API during verification unless the maintainer explicitly asks for an end-to-end live agent run.
```

