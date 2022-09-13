import * as path from 'path';
import * as process from 'process';

import * as core from '@actions/core';

import { findFpc } from './fpc.mjs';


function getExcludePath() {
	let exclude = core.getInput('exclude-path');
	if(exclude === '') return [];

	const cwd = process.cwd();
	function resolvePath(p) {
		if(!path.isAbsolute(p)) {
			p = cwd + path.sep + p;
		}
		return path.normalize(p);
	}

	return exclude
		.split(path.delimiter)
		.filter(entry => entry !== '')
		.map(entry => resolvePath(entry))
	;
}

function getFailOn() {
	return parseVerbosityFlags("fail-on");
}

function getFlags() {
	const flags = core.getInput('flags');
	if(flags === '') return [];

	const addLeadingDash = function(value) {
		if(value.charAt(0) !== '-') {
			return '-' + value;
		} else {
			return value;
		}
	};

	return flags
		.split(' ')
		.filter(elem => elem !== '')
		.map(addLeadingDash)
	;
}

function getFpc() {
	const fpc = core.getInput('fpc');
	if(fpc !== '') return fpc;

	return findFpc();
}

function getSource() {
	return core.getInput("source");
}

function getUserDefined() {
	const value = core.getInput("user-defined");
	if(value === '*') return null;

	return parseVerbosityFlags("user-defined");
}

function getVerbosity() {
	const enabled = parseVerbosityFlags("verbosity");

	let flags = '';
	if(enabled.error) flags += 'e';
	if(enabled.warning) flags += 'w';
	if(enabled.note) flags += 'n';
	if(enabled.hint) flags += 'h';

	return flags;
}

function getWorkdir() {
	return core.getInput("workdir");
}

function parseVerbosityFlags(name) {
	let result = {
		"error": false,
		"warning": false,
		"note": false,
		"hint": false,
	};

	const value = core.getInput(name);
	for(const char of value) {
		// FPC treats verbosity switches in a case-insensitive manner, so let's do that as well.
		if((char === 'e') || (char === 'E')) {
			result.error = true;
		} else if((char === 'w') || (char === 'W')) {
			result.warning = true;
		} else if((char === 'n') || (char === 'N')) {
			result.note = true;
		} else if((char === 'h') || (char === 'H')) {
			result.hint = true;
		} else {
			throw new Error(`Value for the "${name}" input contains an illegal character: "${char}" (only 'e', 'w', 'n', 'h' are allowed)`);
		}
	}

	// Provide "fatal" in addition to "error" for convenience
	result.fatal = result.error;
	return result;
}

function getInputs() {
	return {
		"excludePath": getExcludePath(),
		"failOn": getFailOn(),
		"flags": getFlags(),
		"fpc": getFpc(),
		"source": getSource(),
		"userDefined": getUserDefined(),
		"verbosity": getVerbosity(),
		"workdir": getWorkdir(),
	};
}

export {
	getInputs,
}
