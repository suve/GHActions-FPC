import * as fs from 'fs';
import * as process from 'process';

import * as exec from "@actions/exec";
import { default as semverGt } from "semver/functions/gt.js";
import { default as semverValid } from "semver/functions/valid.js";

function dirExists(path) {
	try {
		let stat = fs.statSync(path);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

function getFilteredSubdirs(dir, pattern) {
	let filter = function(entry) {
		if(!entry.isDirectory()) return false;
		return pattern.test(entry.name);
	};

	return fs
		.readdirSync(dir, { 'withFileTypes': true })
		.filter(filter)
		.map(entry => entry.name)
	;
}

function findFpc() {
	// On non-Windows platforms, assume fpc can be found somewhere in PATH
	if(process.platform !== 'win32') {
		return 'fpc';
	}

	const semverRegexp = /^\d+\.\d+\.\d+$/;

	let dirsToCheck = [
		'C:/fpc',
		'C:/Program Files/fpc',
		'C:/Program Files (x86)/fpc',
		'C:/lazarus/fpc',
		'C:/Program Files/lazarus/fpc',
		'C:/Program Files (x86)/lazarus/fpc',
	];
	for(let d = 0; d < dirsToCheck.length; ++d) {
		if(!dirExists(dirsToCheck[d])) continue;

		let subdirs = getFilteredSubdirs(dirsToCheck[d], semverRegexp).sort();
		for(let s = (subdirs.length - 1); s >= 0; --s) {
			let compilerNames = [
				'x86_64-win64',
				'x86_64-win32',
				'i386-win32',
			];
			for(let c = 0; c < compilerNames.length; ++c) {
				let fullPath = dirsToCheck[d] + '/' + subdirs[s] + '/bin/' + compilerNames[c] + '/fpc.exe';
				if(fs.existsSync(fullPath)) {
					return fullPath;
				}
			}
		}
	}
	throw new Error('Unable to locate fpc executable');
}

async function getFpcVersion(fpc) {
	let version = null;
	const options = {
		"ignoreReturnCode": true,
		"listeners": {
			"stdline": function(line) {
				if(version === null) version = line;
			},
		},
	};

	let exitCode = await exec.exec(fpc, ["-iV"], options);
	if((exitCode !== 0) || (version === null)) {
		throw new Error("Failed to determine FPC version");
	}

	let semver = semverValid(version.trim());
	if(semver === null) {
		throw new Error(`Failed to parse FPC version: "version"`);
	}
	return semver;
}

async function checkFpcVersion(fpc, minimumVersion) {
	let version = await getFpcVersion(fpc);
	if(semverGt(minimumVersion, version)) {
		throw new Error(`Detected FPC version ${version}, but a minimum of ${minimumVersion} is required`)
	}
}

export {
	checkFpcVersion,
	findFpc,
	getFpcVersion,
};
