import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { findFpc } from './find-fpc.mjs';
import { Parser } from './parser.mjs';


function getFlags() {
	let flags = core.getInput('flags');
	if(flags === '') return [];

	return flags.split(' ').filter(elem => elem !== '');
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
		flags.push('-vewnh'); // TODO: Make verbosity configurable

		let sourceFile = core.getInput('source');
		flags.push(sourceFile);

		let options = {};
		let workdir = core.getInput('workdir');
		if(workdir !== '') {
			options.cwd = workdir;
		}

		let parser = new Parser();
		options.listeners = {
			stdline: function(line) {
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
