import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { findFpc } from './find-fpc.mjs';
import { Parser } from './parser.mjs';


function getFlags() {
	let flags = [];

	const argFlags = core.getInput('flags');
	if(argFlags !== '') {
		flags = argFlags.split(' ').filter(elem => elem !== '');
	}

	const argVerbosity = core.getInput('verbosity');
	if(argVerbosity.length > 0) {
		for (let i = 0; i < argVerbosity.length; ++i) {
			let char = argVerbosity.charAt(i);
			if((char !== 'e') && (char !== 'w') && (char !== 'n') && (char !== 'h')) {
				throw new Error(`Value for the "verbosity" input contains an illegal character: "${char}" (only 'e', 'w', 'n', 'h' are allowed)`);
			}
		}
		// Push the -v0 flag first to set verbosity to minimum. This serves to "remove" any defaults set by fpc.cfg.
		// Next, push the desired verbosity level. "i" (the "info" level) is added simply because of personal preference.
		flags.push('-v0', '-vi' + argVerbosity)
	}

	return flags;
}

function printStats(parser) {
	const width = 6;

	const data = parser.getData();
	const err = data.errors.length.toString().padStart(width);
	const war = data.warnings.length.toString().padStart(width);
	const not = data.notes.length.toString().padStart(width);
	const hin = data.hints.length.toString().padStart(width);

	core.info(`
-= GHActions-FPC =-

| Message level | Number |
| ------------- | ------ |
| Error         | ${err} |
| Warning       | ${war} |
| Note          | ${not} |
| Hint          | ${hin} |
`);
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

		let parser = new Parser();
		options.listeners = {
			"stdline": function(line) {
				parser.parseLine(line);
			}
		};

		await exec.exec(fpc, flags, options);
		printStats(parser);
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
