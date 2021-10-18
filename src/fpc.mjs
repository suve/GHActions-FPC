import * as fs from 'fs';
import * as process from 'process';

import * as exec from "@actions/exec";
import { default as semverCompare } from "semver/functions/compare.js";
import { default as semverValid } from "semver/functions/valid.js";

function dirExists(path) {
	try {
		let stat = fs.statSync(path);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

function getFilteredSubdirs(dir, filter) {
	const jointFilter = function(entry) {
		if(!entry.isDirectory()) return false;
		return filter(entry.name);
	};

	return fs
		.readdirSync(dir, { 'withFileTypes': true })
		.filter(jointFilter)
		.map(entry => entry.name)
	;
}

function findFpc() {
	// On non-Windows platforms, assume fpc can be found somewhere in PATH
	if(process.platform !== 'win32') {
		return 'fpc';
	}

	const isValidSemver = function(name) {
		return semverValid(name) !== null;
	};
	const dirsToCheck = [
		'C:/fpc',
		'C:/Program Files/fpc',
		'C:/Program Files (x86)/fpc',
		'C:/lazarus/fpc',
		'C:/Program Files/lazarus/fpc',
		'C:/Program Files (x86)/lazarus/fpc',
	];

	let matches = [];
	for(let dir of dirsToCheck) {
		if(!dirExists(dir)) continue;

		let subdirs = getFilteredSubdirs(dir, isValidSemver);
		for(let subdir of subdirs) {
			// TODO: Ignore the x86_64/win64 compilers when running on 32-bit Windows.
			const compilerNames = [
				'x86_64-win64',
				'x86_64-win32',
				'i386-win32',
			];
			for(let cname of compilerNames) {
				let fullPath = dir + '/' + subdir + '/bin/' + cname + '/fpc.exe';
				if(fs.existsSync(fullPath)) {
					matches.push({
						"version": subdir,
						"type": cname,
						"path": fullPath,
					})
				}
			}
		}
	}
	if(matches.length === 0) {
		throw new Error('Unable to locate fpc executable');
	}

	matches.sort(function(a, b) {
		const cmp = semverCompare(a, b);
		if(cmp !== 0) return cmp;

		// This comparison makes use of the fact that, lexicographically,
		// "x86_64" comes after "i386", and "win64" comes after "win32".
		if(a.type > b.type) return +1;
		if(a.type < b.type) return -1;
		return 0;
	});
	return matches.pop().path;
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
	if(semverCompare(minimumVersion, version) === +1) {
		throw new Error(`Detected FPC version ${version}, but a minimum of ${minimumVersion} is required`)
	}
}

export {
	checkFpcVersion,
	findFpc,
	getFpcVersion,
};
