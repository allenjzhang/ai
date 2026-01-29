import { Octokit } from "@octokit/rest";
import axios, { AxiosResponse } from "axios";
import * as core from "@actions/core";

// Configuration from GitHub Action inputs
const GITHUB_TOKEN = core.getInput("github_token", { required: true });
const REPO_NAME = process.env.GITHUB_REPOSITORY || "";
const PR_NUMBER = parseInt(
  process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER || "0",
  10
);
const AZURE_OPENAI_API_KEY = core.getInput("azure_openai_api_key", {
  required: true,
});
const AZURE_OPENAI_BASE_URL = core.getInput("azure_openai_base_url", {
  required: true,
});
const AZURE_OPENAI_DEPLOYMENT_NAME = core.getInput(
  "azure_openai_deployment_name",
  { required: true }
);
const OPENAI_MODEL_NAME = core.getInput("openai_model_name", {
  required: true,
});

interface FileChange {
  file: string;
  changes: Array<{ line: number; code: string }>;
}

interface AzureOpenAIResponse {
  choices?: Array<{ message: { content: string } }>;
}

// Initialize Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getLLMReview(
  codeSnippet: string,
  filePath: string,
  lineNumber: number
): Promise<string> {
  const prompt = `
    You are an expert code reviewer. Review the following code snippet from ${filePath} at line ${lineNumber}.
    Provide a concise, specific comment about potential issues, improvements, or best practices.
    Focus on the given line or surrounding context. Return only the comment text, no extra formatting.
    
    \`\`\`${filePath.split(".").pop()}
    ${codeSnippet}
    \`\`\`
  `;
  const headers = {
    "api-key": AZURE_OPENAI_API_KEY,
    "Content-Type": "application/json",
  };
  const payload = {
    messages: [
      { role: "system", content: "You are a code review assistant." },
      { role: "user", content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.7,
    model: OPENAI_MODEL_NAME,
  };

  try {
    const response: AxiosResponse<AzureOpenAIResponse> = await axios.post(
      `${AZURE_OPENAI_BASE_URL}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-07-01-preview`,
      payload,
      { headers }
    );
    return (
      response.data.choices?.[0]?.message.content.trim() ||
      "No comment generated."
    );
  } catch (error) {
    core.error(`Azure OpenAI API error: ${error}`);
    return "Unable to generate review comment due to API error.";
  }
}

function parseDiff(diffText: string): FileChange[] {
  const lines = diffText.split("\n");
  const fileChanges: FileChange[] = [];
  let currentFile: string | null = null;
  let currentLineNew = 0;
  let currentLineOld = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      currentFile = line.split(" b/")[1] || "";
      fileChanges.push({ file: currentFile, changes: [] });
      continue;
    }
    const hunkMatch = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
    if (hunkMatch) {
      currentLineOld = parseInt(hunkMatch[1], 10);
      currentLineNew = parseInt(hunkMatch[2], 10);
      continue;
    }
    if (
      currentFile &&
      (line.startsWith("+") || (!line.startsWith("-") && !line.startsWith(" ")))
    ) {
      const code = line.startsWith("+") ? line.slice(1) : line;
      if (code.trim()) {
        fileChanges[fileChanges.length - 1].changes.push({
          line: currentLineNew,
          code: code.trim(),
        });
      }
    }
    if (line.startsWith("-")) {
      currentLineOld++;
    } else if (line.startsWith("+")) {
      currentLineNew++;
    } else {
      currentLineOld++;
      currentLineNew++;
    }
  }

  return fileChanges;
}

async function postReviewComments(
  owner: string,
  repo: string,
  prNumber: number,
  fileChanges: FileChange[]
): Promise<void> {
  for (const fileChange of fileChanges) {
    const filePath = fileChange.file;
    for (const change of fileChange.changes) {
      const { line, code } = change;
      const comment = await getLLMReview(code, filePath, line);
      if (
        comment &&
        comment !== "Unable to generate review comment due to API error."
      ) {
        try {
          await octokit.pulls.createReviewComment({
            owner,
            repo,
            pull_number: prNumber,
            body: comment,
            commit_id: (
              await octokit.pulls.get({ owner, repo, pull_number: prNumber })
            ).data.head.sha,
            path: filePath,
            line,
          });
          core.info(`Posted comment on ${filePath}:${line}: ${comment}`);
        } catch (error) {
          core.error(`Error posting comment on ${filePath}:${line}: ${error}`);
        }
      }
    }
  }
}

async function main(): Promise<void> {
  try {
    const [owner, repo] = REPO_NAME.split("/");
    if (!owner || !repo || !PR_NUMBER) {
      throw new Error("Missing repository or PR number.");
    }
    const pr = await octokit.pulls.get({ owner, repo, pull_number: PR_NUMBER });
    const files = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: PR_NUMBER,
    });

    for (const file of files.data) {
      if (file.patch) {
        const fileChanges = parseDiff(file.patch);
        await postReviewComments(owner, repo, PR_NUMBER, fileChanges);
      }
    }

    core.info("Code review completed.");
  } catch (error) {
    core.setFailed(`Error: ${error}`);
  }
}

if (require.main === module) {
  main();
}
