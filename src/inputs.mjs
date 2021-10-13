import * as core from '@actions/core';

import { findFpc } from './find-fpc.mjs';


function getFailOn() {
	let result = {
		"error": false,
		"warning": false,
		"note": false,
		"hint": false,
	};

	const argFailOn = core.getInput('fail-on');
	for (let i = 0; i < argFailOn.length; ++i) {
		let char = argFailOn.charAt(i);
		if(char === 'e') {
			result.error = true;
		} else if(char === 'w') {
			result.warning = true;
		} else if(char === 'n') {
			result.note = true;
		} else if(char === 'h') {
			result.hint = true;
		} else {
			throw new Error(`Value for the "fail-on" input contains an illegal character: "${char}" (only 'e', 'w', 'n', 'h' are allowed)`);
		}
	}

	return result;
}

async function getFpc() {
	let fpc = core.getInput('fpc');
	if(fpc === '') {
		fpc = await findFpc();
	}

	return fpc;
}

async function getInputs() {
	const failOn = getFailOn();
	const fpc = await getFpc();

	return {
		"failOn": failOn,
		"fpc": fpc
	};
}

export {
	getInputs,
}
