const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const o_base = core.getInput("base");
const o_head = core.getInput("head");

const { owner, repo } = github.context.repo;


async function listBranches() {
  // list all branches in a repository
  octokit.rest.repos.listBranches({
    owner: owner,
    repo: repo
  }).then(({ data }) => {
    // data contains an array of branch objects
    console.log('data ' + data);
    data.forEach(branch => {
      console.log('current branch ' + branch.name);
      // do PR for branches that starts with release
      if (branch.name.startsWith('release'))
        doAutoPR(branch.name);
    });

  }).catch(error => {
    console.log("error occured " + error);
    console.error(error);
  });

};


async function doAutoPR(base_branch) {
  try {
    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    console.log('owener ' + owner + ' repo ' + repo + '; ' + ' base_branch ' + base_branch);
    const title = "chore: [Auto-PR] master to " + base_branch + ' ' + formattedDate;
    octokit.rest.pulls.create({
      owner,
      repo,
      base: base_branch,
      head: 'master',
      title: title
    }).then(({ data }) => {
      console.log("PR created ," + data.number + ' data ' + data);
      // add a labels to a pull request
      octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: data.number,
        labels: ["auto-marge"]
      }).then(({ data }) => {
        console.log("label added" + data);
      }).catch(error => {
        console.error('error: ' + error);
      });
    }).catch(error => {
      console.error('error: ' + error);
    });

  } catch (error) {
    core.setFailed('Error ' + error);
  }
}


try {
  listBranches();
  console.log('done PR');
} catch (error) {
  core.setFailed('error e ' + error)
}