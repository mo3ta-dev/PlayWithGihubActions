const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const o_base = core.getInput("base");
const o_head = core.getInput("head");

const { owner, repo } = github.context.repo;

const o_base_branch = "main";


async function brnaches  (){
  console.log('start ' + o_base_branch);
 // list all branches in a repository
octokit.rest.repos.listBranches({
  owner: owner,
  repo: repo
}).then(({ data }) => {
  // data contains an array of branch objects
  console.log('data ' + data);
  data.forEach(branch => {
    console.log('data PR  ' + branch);
    if (branch.name.startsWith('test'))
    doAutoPR(branch.name);
  });

/*
  console.log('filter ');
  const testBranches = data.filter(e => e.startsWith('test'));
  
  testBranches.forEach(branch => {
    console.log('testBranches ' + branch);
    doAutoPR(branch);
  });
  */

}).catch(error => {
  console.error(error);
});

};


async function doAutoPR(head_branch) {
try {
console.log(' owener ' + owner + ' repo ' + repo + '; ' + 'head_branch ' + head_branch  ); 
const rest = octokit.rest.pulls.create({
  owner, 
  repo, 
  base: 'main', 
  head: head_branch, 
  title:'Auto PR' 
}); 

} catch (error) {
  core.setFailed('Error ' + error);
}
}


// run code 

try {
brnaches();
console.log('done PR'); 
} catch (error) {
  core.setFailed('error e ' + error)
}