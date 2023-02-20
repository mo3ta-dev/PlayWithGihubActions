const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const o_base = core.getInput("base");
const o_head = core.getInput("head");

const { owner, repo } = github.context.repo;

const o_base_branch = "main";


async function brnaches  (){
  console.log('start ');
 // list all branches in a repository
octokit.rest.repos.listBranches({
  owner: owner,
  repo: repo
}).then(({ data }) => {
  // data contains an array of branch objects
  const testBranches = data.filter(e => e.startsWith('test'));
 
  testBranches.forEach(branch => {
    doAutoPR(branch , o_base_branch);
  });

}).catch(error => {
  console.error(error);
});

};


async function doAutoPR(head_branch, base_branch ) {
try {
console.log(' owener ' + owner + ' repo ' + repo + '; ' + 'base ' + base_branch  ); 
const rest = octokit.rest.pulls.create({
  owner, 
  repo, 
  base: base_branch, 
  head: head_branch, 
  title:'Auto PR' 
}); 

} catch (error) {
  core.setFailed('Error ' + error);
}
}

try {
  doAutoPR(); 
console.log('done PR'); 
brnaches();
} catch (error) {
  core.setFailed('error e ' + error)
}