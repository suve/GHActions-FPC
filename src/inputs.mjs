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
		.filter(entry => entry.length !== 0)
		.map(entry => resolvePath(entry))
	;
}

function getFailOn() {
	let result = {
		"error": false,
		"warning": false,
		"note": false,
		"hint": false,
	};

	const argFailOn = core.getInput('fail-on');
	for(let char of argFailOn) {
		// The "verbosity" input treats switches in a case-insensitive manner, so "fail-on" should do that as well.
		if((char === 'e') || (char === 'E')) {
			result.error = true;
		} else if((char === 'w') || (char === 'W')) {
			result.warning = true;
		} else if((char === 'n') || (char === 'N')) {
			result.note = true;
		} else if((char === 'h') || (char === 'H')) {
			result.hint = true;
		} else {
			throw new Error(`Value for the "fail-on" input contains an illegal character: "${char}" (only 'e', 'w', 'n', 'h' are allowed)`);
		}
	}

	return result;
}

function getFpc() {
	let fpc = core.getInput('fpc');
	if(fpc === '') {
		fpc = findFpc();
	}

	return fpc;
}

function getInputs() {
	return {
		"excludePath": getExcludePath(),
		"failOn": getFailOn(),
		"fpc": getFpc(),
	};
}

export {
	getInputs,
}
