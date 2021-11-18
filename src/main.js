import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { emitAnnotations } from './annotations.mjs';
import { checkFpcVersion } from './fpc.mjs';
import { getInputs } from './inputs.mjs';
import { Parser } from './parser.mjs';


function getExecFlags(inputs) {
	let flags = inputs.flags;

	if(inputs.verbosity.length > 0) {
		// Push the -v0 flag first to set verbosity to minimum. This serves to remove any defaults set by fpc.cfg.
		// Next, push the desired verbosity level:
		// - "b" (print full paths) is added to make sub-directory handling easier.
		// - "i" (the "info" level) is added because in the event of a compiler crash,
		//   it makes it easy to pin-point which file was being compiled when the crash happened.
		//   (This is not currently recognized by the Action itself, but could be helpful to a user reading the logs.)
		flags.push('-v0', '-vib' + inputs.verbosity)
	}

	flags.push(inputs.source);
	return flags;
}

function getExecOptions(inputs, parser) {
	let options = {
		"ignoreReturnCode": true
	};

	if(inputs.workdir !== '') {
		options.cwd = inputs.workdir;
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
		let exitCode = await exec.exec(
			inputs.fpc,
			getExecFlags(inputs),
			getExecOptions(inputs, parser)
		);

		printStats(parser.getData());
		await emitAnnotations(parser.getData());

		checkFail(exitCode, inputs, parser.getData());
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
