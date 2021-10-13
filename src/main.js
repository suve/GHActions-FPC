import * as core from '@actions/core';
import * as exec from '@actions/exec';

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
	const width = 6;

	const err = parserData.errors.length.toString().padStart(width);
	const war = parserData.warnings.length.toString().padStart(width);
	const not = parserData.notes.length.toString().padStart(width);
	const hin = parserData.hints.length.toString().padStart(width);

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

function checkFail(exitCode, inputs, parserData) {
	if((inputs.failOn.error) && (parserData.errors.length > 0)) {
		throw new Error(`${parserData.errors.length} errors were emitted`)
	}
	if((inputs.failOn.warning) && (parserData.warnings.length > 0)) {
		throw new Error(`${parserData.warnings.length} warnings were emitted and fail-on-warning is enabled`)
	}
	if((inputs.failOn.note) && (parserData.notes.length > 0)) {
		throw new Error(`${parserData.notes.length} notes were emitted and fail-on-note is enabled`)
	}
	if((inputs.failOn.hint) && (parserData.hints.length > 0)) {
		throw new Error(`${parserData.hints.length} hints were emitted and fail-on-hint is enabled`)
	}
	if(exitCode !== 0) {
		throw new Error(`FPC exited with code ${exitCode}`)
	}
}

async function main() {
	try {
		let inputs = await getInputs();
		let parser = new Parser();

		let flags = getExecFlags();
		let options = getExecOptions(parser);
		let exitCode = await exec.exec(inputs.fpc, flags, options);

		printStats(parser.getData());
		checkFail(exitCode, inputs, parser.getData());
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
