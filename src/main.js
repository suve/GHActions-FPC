import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { findFpc } from './find-fpc.mjs';


function getFlags() {
	let flags = core.getInput('flags');
	if(flags === '') return [];

	return flags.split(' ').filter(elem => elem !== '');
}

async function main() {
	try {
		let fpc = core.getInput('fpc');
		if(fpc === '') {
			fpc = await findFpc();
		}

		let flags = getFlags();
		let sourceFile = core.getInput('source');
		flags.push(sourceFile);

		let options = {};
		let workdir = core.getInput('workdir');
		if(workdir !== '') {
			options.cwd = workdir;
		}

		await exec.exec(fpc, flags, options);
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
