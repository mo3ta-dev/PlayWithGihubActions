const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const { owner, repo } = github.context.repo;

const pr_head_branch = core.getInput("head_branch");
const pr_base_branch = core.getInput("base_branch");
const pr_title = core.getInput("pr_title");
const pr_body = core.getInput("pr_body");
const pr_label = core.getInput("pr_label");
const use_base_variations = core.getInput("use_base_variations");


// list all branches, return empty if any error occured 
async function listBranches(ownerValue, reporValue) {
  const branchesResponse = await octokit.rest.repos.listBranches({
    owner: ownerValue,
    repo: reporValue
  })

  if (branchesResponse.status == 200){
    console.log('loaded branches' + branchesResponse.data.length )
    return branchesResponse.data.map(item => item.name);
  }else{
    console.error("error occured ");
    return [] ; 
  }

};

// format date in form DD/MM/YYYY 
function getCurrentDataFormatted(){
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

}

// handle if title not provided, it constructs it, otherwise it returns same title. 
function prepareTitle(title, head_branch, base_branch){
  if (title.length == 0){
    const formatedDate = getCurrentDataFormatted();
    return "chore: [Auto-PR] " + head_branch +" to " + base_branch + ' ' + formattedDate;
  }else{
    return title 
  }
}

function addLabel(pr_owner, pr_repo, pull_request_number, label){
  // add a labels to a pull request
  octokit.rest.issues.addLabels({
    pr_owner,
    pr_repo,
    issue_number:pull_request_number,
    labels: [label]
  }).then(({ data }) => {
    console.log("label"+ label + " added to PR");
  }).catch(error => {
    console.error('error while creating label: ' + error);
  });
}

async function openPR(pr_owner, pr_repo, head_branch, base_branch , body , title, label) {
  try {
    const pr_title = prepareTitle(title , head_branch, base_branch);
    console.log("title : " + pr_title);
    octokit.rest.pulls.create({
      pr_owner,
      pr_repo,
      base: base_branch,
      head: head_branch,
      title: pr_title, 
      body: body 
    }).then(({ data }) => {
      console.log("PR created with number" + data.number);
      // add label if was sent 
      if (label.length > 0 ){
          addLabel(pr_owner , pr_repo, data.number, label);
      }  
    
    }).catch(error => {
      console.error('error: while creating PR' + error);
    });

  } catch (error) {
    core.setFailed('Error ' + error);
  }
}

try {
  if (use_base_variations){
    const allBranches = listBranches(repo, owner);
    allBranches.forEach(branch => {
      // do PR for branches that starts with head
      if (branch.name.startsWith(pr_base_branch))
        openPR(repo, owner, pr_head_branch, branch.name, pr_body , pr_title, pr_label);
    });
  }else{
    openPR(repo, owner, pr_head_branch, pr_base_branch , pr_body , pr_title, pr_label);
  }

} catch (error) {
  core.setFailed('Error:' + error)
}