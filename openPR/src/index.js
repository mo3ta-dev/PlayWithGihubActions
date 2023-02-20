const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));
const o_base = core.getInput("base");
const o_head = core.getInput("head");

const { owner, repo } = github.context.repo;


async function brnaches  (){

  const result = await octokit.request('GET /repos/{owner}/{repo}/branches', {
    owner: owner,
    repo: repo
  });

  console.log("result " + result["items"]);
  
};


async function doCheck() {
try {
console.log(' owener ' + owner + ' repo ' + repo + ';;' ); 
const rest = octokit.rest.pulls.create({
  owner, 
  repo, 
  base: o_base, 
  head: o_head, 
  title:'Auto PR' 
}); 

} catch (error) {
  core.setFailed('Error ' + error);
}
}

try {
doCheck(); 
console.log('done check'); 
brnaches();
} catch (error) {
  core.setFailed('error e ' + error)
}