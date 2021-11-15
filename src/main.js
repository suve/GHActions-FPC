import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { emitAnnotations } from './annotations.mjs';
import { checkFpcVersion } from './fpc.mjs';
import { getInputs } from './inputs.mjs';
import { Parser } from './parser.mjs';


function getExecFlags() {
	let flags = [];

	const argFlags = core.getInput('flags');
	if(argFlags !== '') {
		flags = argFlags.split(' ').filter(elem => elem !== '');
	}

	const argVerbosity = core.getInput('verbosity');
	if(argVerbosity.length > 0) {
		let vError = '';
		let vWarning = '';
		let vNote = '';
		let vHint = '';
		for(let char of argVerbosity) {
			// FPC treats verbosity switches in a case-insensitive manner, so we should as well.
			if((char === 'e') || (char === 'E')) {
				vError = 'e';
			} else if((char === 'w') || (char === 'W')) {
				vWarning = 'w';
			} else if((char === 'n') || (char === 'N')) {
				vNote = 'n';
			} else if((char === 'h') || (char === 'H')) {
				vHint = 'h';
			} else {
				throw new Error(`Value for the "verbosity" input contains an illegal character: "${char}" (only 'e', 'w', 'n', 'h' are allowed)`);
			}
		}
		// Push the -v0 flag first to set verbosity to minimum. This serves to remove any defaults set by fpc.cfg.
		// Next, push the desired verbosity level:
		// - "b" (print full paths) is added to make sub-directory handling easier.
		// - "i" (the "info" level) is added because in the event of a compiler crash,
		//   it makes it easy to pin-point which file was being compiled when the crash happened.
		//   (This is not currently recognized by the Action itself, but could be helpful to a user reading the logs.)
		flags.push('-v0', '-vib' + vError + vWarning + vNote + vHint)
	}

	const sourceFile = core.getInput('source');
	flags.push(sourceFile);

	return flags;
}

function getExecOptions(parser) {
	let options = {
		"ignoreReturnCode": true
	};

	let workdir = core.getInput('workdir');
	if(workdir !== '') {
		options.cwd = workdir;
	}

	options.listeners = {
		"stdline": function(line) {
			parser.parseLine(line);
		}
	};

	return options;
}

function printStats(parserData) {
	const width = 5;

	const er = parserData.byType.error.length.toString().padStart(width);
	const wa = parserData.byType.warning.length.toString().padStart(width);
	const no = parserData.byType.note.length.toString().padStart(width);
	const hi = parserData.byType.hint.length.toString().padStart(width);

	core.info(`
-= GHActions-FPC =-

| Message level | Count |
| ------------- | ----- |
| Error         | ${er} |
| Warning       | ${wa} |
| Note          | ${no} |
| Hint          | ${hi} |
`);
}

function checkFail(exitCode, inputs, parserData) {
	for(let type of ['error', 'warning', 'note', 'hint']) {
		if(!inputs.failOn[type]) continue;

		const count = parserData.byType[type].length;
		if(count < 1) continue;

		let message = (count > 1) ? `${count} ${type}s were emitted` : `1 ${type} was emitted`;
		if(type !== 'error') {
			message += ` and fail-on-${type} is enabled`;
		}
		throw new Error(message);
	}

	if(exitCode !== 0) {
		throw new Error(`FPC exited with code ${exitCode}`)
	}
}

async function main() {
	const MIN_VERSION = '2.1.2';

	try {
		let inputs = getInputs();
		await checkFpcVersion(inputs.fpc, MIN_VERSION);

		let parser = new Parser(inputs.excludePath);
		let exitCode = await exec.exec(inputs.fpc, getExecFlags(), getExecOptions(parser));

		printStats(parser.getData());
		await emitAnnotations(parser.getData());

		checkFail(exitCode, inputs, parser.getData());
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
