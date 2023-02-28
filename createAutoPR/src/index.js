const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const {
  owner,
  repo
} = github.context.repo;

const pr_repo_name = core.getInput("repo_name");
const pr_source_target_branch = core.getInput("source_target_branch");
let pr_head_branch = core.getInput("source_branch");
let pr_base_branch = core.getInput("target_branch");
const pr_title = core.getInput("pr_title");
const pr_body = core.getInput("pr_body");
const pr_label = core.getInput("pr_label");
const use_matching_target_branches = core.getInput("use_matching_target_branches");

// list all branches, return empty if any error occured 
async function listBranches(ownerValue, repoValue) {
  const branchesResponse = await octokit.rest.repos.listBranches({
    owner: ownerValue,
    repo: repoValue
  })

  if (branchesResponse.status == 200) {
    console.log('loaded branches ' + branchesResponse.data.length)
    return branchesResponse.data.map(item => item.name);
  } else {
    console.error("error occured with listing branches " + branchesResponse.data);
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
function prepareTitle(title, head_branch, base_branch) {
  if (title.length == 0) {
    const formattedDate = getCurrentDateFormatted();
    return "chore: [Auto-PR] " + head_branch + " to " + base_branch + ' ' + formattedDate;
  } else {
    return title
  }
}

function addLabel(pr_owner, pr_repo, pull_request_number, label) {
  console.log('adding ' + label + ' to PR with number' + pull_request_number);
  // add a labels to a pull request
  octokit.rest.issues.addLabels({
    owner: pr_owner,
    repo: pr_repo,
    issue_number: pull_request_number,
    labels: [label]
  }).then(({
    data
  }) => {
    console.log("label" + label + " added to the PR");
  }).catch(error => {
    console.error('error while creating label: ' + error);
  });
}

async function openPR(pr_owner, pr_repo, head_branch, base_branch, body, title, label) {
  const pr_title = prepareTitle(title, head_branch, base_branch);
  console.log("title : " + pr_title);
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
    console.log("Creating PR for " + pr_repo + " number " + data.number);
    // add label if was sent 
    if (label.length > 0) {
      addLabel(pr_owner, pr_repo, data.number, label);
    }

  }).catch(({
    message
  }) => {
    console.error('error: while creating PR ' + message);
  });
}

function checkRequiredInputs(){
  if(pr_source_target_branch){
    const splitted = pr_source_target_branch.split("-");
    pr_head_branch = splitted[0];
    pr_base_branch = splitted[1];
  }

  if (!pr_head_branch || !pr_base_branch){
    core.setFailed('please provide required inputs like [source_branch] [target_branch]')
    return false; 
  }
  return true; 
}

function main(){
  // use current repository
  let repoValue = repo;
  // if user provides another repository name, use it 
  if (pr_repo_name){
    repoValue = pr_repo_name
  } 

  if (use_matching_target_branches == 'true') {
    const allBranches = listBranches(owner, repoValue);
    allBranches.then((data) => {
      console.log('allBranches  ' + data.length)
      data.forEach(branch => {
        // create PRs for branches that start with pr_base_branch
        if (branch.startsWith(pr_base_branch))
          openPR(owner, repoValue, pr_head_branch, branch, pr_body, pr_title, pr_label);
      });
    }).catch((error) => {
      console.error('error with listing ' + error);
    });
  
  } else {
    openPR(owner, repoValue, pr_head_branch, pr_base_branch, pr_body, pr_title, pr_label);
  }
}

if (checkRequiredInputs()){
  main(); 
}
