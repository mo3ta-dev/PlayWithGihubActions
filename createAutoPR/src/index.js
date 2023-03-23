const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const {
  owner,
  repo
} = github.context.repo;

const pr_repo_name = core.getInput("repo_name");
const pr_head_branch = core.getInput("source_branch");
const pr_base_branch = core.getInput("target_branch");
const pr_title = core.getInput("pr_title");
const pr_body = core.getInput("pr_body");
const pr_label = core.getInput("pr_label");
const use_matching_target_branches = core.getInput("use_matching_target_branches");
const enbale_auto_merge = core.getInput("enbale_auto_merge");

// list all branches, return empty if any error occurred
async function listBranches(ownerValue, repoValue) {
  console.log(`listBranches: listing branches for repo: ${ownerValue}/${repoValue}`);
  const branchesResponse = await octokit.rest.repos.listBranches({
    owner: ownerValue,
    repo: repoValue
  })

  if (branchesResponse.status == 200) {
    console.log(`listBranches: found ${branchesResponse.data.length} branches`);
    return branchesResponse.data.map(item => item.name);
  } else {
    core.error(`listBranches: Error occurred with listing branches: ${branchesResponse.data}`);
    return [];
  }

};

// format date in form DD/MM/YYYY 
function getCurrentDateFormatted() {
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

}

// if title is not provided a default one will be constructed, otherwise the same title will be returned
function prepareTitle(title, head_branch, base_branch,enbale_auto_merge) {
  if (title.length == 0) {
    const formattedDate = getCurrentDateFormatted();
    let prefixOfTitle = '';
    if (enbale_auto_merge){
      prefixOfTitle = `chore: [Auto-Merge]`;
    }else {
      prefixOfTitle = `chore: [Auto-PR]`;
    }
    return `${prefixOfTitle} ${head_branch} to ${base_branch} ${formattedDate}`;
  } else {
    return title
  }
}

// if body is not provided a default one will be constructed, otherwise the same body will be returned
function prepareBody(body, enbale_auto_merge) {
  let pr_body = body; 
  if (pr_body.length == 0) {
    if (enbale_auto_merge){
      pr_body = `chore: [Auto-Merge]`;
    }else {
      pr_body = `chore: [Auto-PR]`;
    }
  }
  return pr_body;
}


function addLabel(pr_owner, pr_repo, pull_request_number, label, enbale_auto_merge) {
  console.log(`addLabel: adding: ${label} to PR with number: ${pull_request_number}`);
  // add a labels to a pull request
  octokit.rest.issues.addLabels({
    owner: pr_owner,
    repo: pr_repo,
    issue_number: pull_request_number,
    labels: [label]
  }).then(( data ) => {
    console.log(`addLabel: label ${label} added to the PR`);
    if (enbale_auto_merge){
      mergePullRequest(pr_owner,pr_repo,pull_request_number);
    }
  }).catch(error => {
    core.error(`addLabel: Error occurred while creating label: ${error}`);
  });
}

function mergePullRequest(pr_owner, pr_repo, pull_request_number){
  console.log(`mergePullRequest: merging PR with number: ${pull_request_number}`);
  octokit.rest.pulls.merge({
    owner: pr_owner,
    repo: pr_repo,
    pull_number: pull_request_number
  }).then((data) => {
    core.debug(`merge: is merged: ${data.data.merged} merge message: ${data.data.message}`);
  }).catch((error) => {
    core.error(`merge: Error occurred while merging: ${error}`)
  });
}

async function openPR(pr_owner, pr_repo, head_branch, base_branch, body, title, label, enbale_auto_merge) {
  const pr_title = prepareTitle(title, head_branch, base_branch, enbale_auto_merge);
  const pr_body = prepareBody(body, enbale_auto_merge);
  console.log(`openPR: creating PR for repo: ${pr_repo} from source: ${head_branch} to target: ${base_branch} with title: ${pr_title} body: ${pr_body} and label: ${label}`);
  octokit.rest.pulls.create({
    owner: pr_owner,
    repo: pr_repo,
    base: base_branch,
    head: head_branch,
    title: pr_title,
    body: body
  }).then(({
    data
  }) => {
    console.log(`openPR: PR created successfully with number: ${data.number} and link: ${data._links.html.href}`);
    // add label if was sent 
    if (label.length > 0) {
      addLabel(pr_owner, pr_repo, data.number, label);
    }
  }).catch((message) => {
    core.error(`openPR: Error occurred while creating PR: ${message}`);
  });
}

function checkRequiredInputs() {
  if (!pr_head_branch && !pr_base_branch) {
    core.setFailed(`checkRequiredInputs: please provide required inputs [source_branch] which is your ${pr_head_branch} [target_branch] which is your ${pr_base_branch}`);
    return false;
  } else {
    return true;
  }
}

function logInputs(){
  console.log('logging inputs:');
  console.log(`source_branch: ${pr_head_branch}`);
  console.log(`target_branch: ${pr_base_branch}`);
  console.log(`repo_name: ${pr_repo_name}`);
  console.log(`pr_title: ${pr_title}`);
  console.log(`pr_body: ${pr_body}`);
  console.log(`pr_label: ${pr_label}`);
  console.log(`use_matching_target_branches: ${use_matching_target_branches}`);
  console.log(`enbale_auto_merge: ${enbale_auto_merge}`);
  console.log('finished logging inputs.');
}

function main() {
  logInputs();
  // use current repository
  let repoValue = repo;
  // if user provides another repository name, use it 
  if (pr_repo_name) {
    repoValue = pr_repo_name
  }
  // log final name of repo
  console.log(`main: using repo: ${repoValue}`); 
  if (use_matching_target_branches == 'true') {
    const allBranches = listBranches(owner, repoValue);
    allBranches.then((data) => {
      data.forEach(branch => {
        // create PRs for branches that start with pr_base_branch
        if (branch.startsWith(pr_base_branch))
          openPR(owner, repoValue, pr_head_branch, branch, pr_body, pr_title, pr_label,enbale_auto_merge);
      });
    }).catch((error) => {
      core.error(`main: Error occurred with listing branches: ${error}`);
    });

  } else {
    openPR(owner, repoValue, pr_head_branch, pr_base_branch, pr_body, pr_title, pr_label,enbale_auto_merge);
  }
}

if (checkRequiredInputs()) {
  main();
}
