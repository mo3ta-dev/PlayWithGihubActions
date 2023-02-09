const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));

const {
  number: pullNumber,
  repository: {
    owner: { login: ownerName },
  },
  pull_request: {
    base: {
      repo: { name: repoName },
    },
    changed_files: filesNumber,
  },
} = github.context.payload;



Object.prototype.abortOnErrorCheck = async function () {
  if (
    this.filename.endsWith(".gradle") &&
    !this.filename.includes("node_modules")
  ) {
    const fileResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: github.context.payload.pull_request.head.repo.owner.login,
        repo: github.context.payload.pull_request.head.repo.name,
        ref: github.context.payload.pull_request.head.ref,
        path: this.filename,
      }
    );

    if (fileResponse.status === 200 || fileResponse.status === 302) {
      const content = Buffer.from(
        fileResponse.data.content,
        "base64"
      ).toString();

      if (content.includes("abortOnError false")) return true;
    }
  }

  return false;
};



/*
const androidCheck = async () => {
  let errorsCount = 0;

  let filesList = [];

  await Promise.allSettled(
    Array.from(Array(Math.ceil(filesNumber / 100)).keys()).map(async (item) => {
      const response = await octokit.rest.pulls.listFiles({
        owner: ownerName,
        repo: repoName,
        pull_number: pullNumber,
        per_page: 100,
        page: item + 1,
      });

      filesList.push(...response.data);
    })
  ); 
}
*/
