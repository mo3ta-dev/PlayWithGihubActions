const core = require("@actions/core");
const github = require("@actions/github");

const octokit = github.getOctokit(core.getInput("token"));

const { owner, repo } = github.context.repo;

async function doCheck() {
try {
console.log(' owener ' + owner + ' repo ' + repo + ';;' ); 
const rest = octokit.rest.pulls.create({
  owner, 
  repo, 
  base: 'main', 
  head:'test', 
  title:'Auto PR' 
}); 

} catch (error) {
  core.setFailed('Error ' + error);
}
}


doCheck(); 