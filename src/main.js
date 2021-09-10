const core = require('@actions/core');
const exec = require('@actions/exec');

const fs = require('fs');
const process = require('process');

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

function getFlags() {
	let flags = core.getInput('flags');
	if(flags === '') return [];

	return flags.split(' ').filter(elem => elem !== '');
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
		await exec.exec(fpc, flags);
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
