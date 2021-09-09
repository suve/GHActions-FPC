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

function findFpc() {
	// On non-Windows platforms, assume fpc can be found somewhere in PATH
	if(process.platform !== 'win32') {
		return 'fpc';
	}

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

		// TODO: Filter the subdir list so we only go into dirs matching the "^\d*\.\d*\.\d*$" pattern.
		// TODO: Sort the subdir list so we go into greatest X.Y.Z first.
		let subdirs = fs.readdirSync(dirsToCheck[d], { 'withFileTypes': true });
		for(let s = 0; s < subdirs.length; ++s) {
			if(!subdirs[s].isDirectory()) continue;
			
			let compilerNames = [
				'x86_64-win64',
				'x86_64-win32',
				'i386-win32',
			];
			for(let c = 0; c < compilerNames.length; ++c) {
				let fullPath = dirsToCheck[d] + '/' + subdirs[s].name + '/bin/' + compilerNames[c] + '/fpc.exe';
				if(fs.existsSync(fullPath)) {
					return fullPath;
				}
			}
		}
	}
	throw new Error('Unable to locate fpc executable');
}

async function main() {
	try {
		let fpc = core.getInput('fpc');
		if(fpc === '') {
			fpc = await findFpc();
		}

		let sourceFile = core.getInput('source');
		await exec.exec(fpc, [sourceFile]);
	} catch (e) {
		core.setFailed(e.message);
	}
}

main();
