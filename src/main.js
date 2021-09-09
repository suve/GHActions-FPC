const core = require('@actions/core');
const exec = require('@actions/exec');

async function main() {
	try {
		let sourceFile = core.getInput('source');
		await exec.exec('fpc', [sourceFile]);
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
