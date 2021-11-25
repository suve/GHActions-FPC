import * as path from 'path';

function Diagnostic(matches) {
	this.path = path.normalize(matches[1]);
	this.line = Number(matches[2]);
	this.column = (matches[3] !== undefined) ? Number(matches[3]) : null;
	this.type = matches[4].toLowerCase();
	this.message = matches[5];
}

function Parser(excludePath) {
	const fileIsExcluded = (function(){
		let excludeDirs = [];
		let excludeFiles = [];
		for(let ex of excludePath) {
			if(ex.endsWith(path.sep)) {
				excludeDirs.push(ex);
			} else {
				excludeFiles.push(ex);
			}
		}

		return function(diag) {
			for(let excluded of excludeDirs) {
				if(diag.path.startsWith(excluded)) return true;
			}
			for(let excluded of excludeFiles) {
				if(diag.path === excluded) return true;
			}
			return false;
		};
	}());

	/*
	 * When a function is called with the wrong number of parameters, the compiler emits multiple messages:
	 *   /example/main.pas(9,41) Error: Wrong number of parameters specified for call to "SomeFunc"
	 *   /example/impl.pas(3,10) Error: Found declaration: SomeFunc(SmallInt):SmallInt;
	 * If these two messages are treated separately, they'll generate a rather non-useful annotation,
	 * attached to an error-free line, possibly in a different file. Instead, try to detect the second message type
	 * and attach the "declaration found" information to the initial "wrong number of parameters" message.
	 */
	const isFoundDeclarationDiagnostic = function(diag) {
		const foundDeclarationString = "Found declaration: ";
		if(!diag.message.startsWith(foundDeclarationString)) return false;

		const wrongNumberOfParametersString = "Wrong number of parameters specified for call to ";
		if((previous !== null) && (previous.message.startsWith(wrongNumberOfParametersString))) {
			// The workdir for the Action is the repo root, so a path relative to cwd will be relative to repo root.
			// If this produces a path starting with "../", then it's a file outside the repo - in which case, refer to it using the full path.
			let repoPath = path.relative("", diag.path);
			if(repoPath.startsWith(`..${path.sep}`)) {
				repoPath = diag.path;
			}

			let declaration = diag.message.substring(foundDeclarationString.length);
			previous.message += `\nFound declaration in ${repoPath}(${diag.line},${diag.column}): ${declaration}`
		}
		return true;
	};

	const isStoppingDiagnostic = function(diag) {
		if(diag.type !== "fatal") return false;

		const thereWereErrorsRegexp = /^There (was|were) \d+ errors? compiling module, stopping$/;
		return thereWereErrorsRegexp.test(diag.message);
	};

	const isErrorDiagnostic = function(diag) {
		return (diag.type === "error") || (diag.type === "fatal");
	};

	let diagnostics = {
		"byType": {
			"error": [],
			"warning": [],
			"note": [],
			"hint": [],
		},
		"byFile": {},
	};
	let previous = null;

	this.getData = function() {
		return diagnostics;
	};

	this.parseLine = function(text) {
		text = text.trim();

		const diagnosticRegexp = /^(.+)\((\d+),?(\d+)?\) (Fatal|Error|Warning|Note|Hint): (.+)$/;
		const check = diagnosticRegexp.exec(text);
		if(check === null) return false;

		const diag = new Diagnostic(check);

		// "Found declaration" messages should not generate their own annotations
		if(isFoundDeclarationDiagnostic(diag)) return false;
		// Ignore the "fatal error because errors occurred" message
		if(isStoppingDiagnostic(diag)) return false;
		// Ignore any messages pertaining to excluded files (unless they're errors, as those will cause a compilation failure)
		if(fileIsExcluded(diag) && !isErrorDiagnostic(diag)) return false;

		// "Fatal error" messages go in the same bucket as regular errors
		const type = (diag.type === "fatal") ? "error" : diag.type;
		diagnostics.byType[type].push(diag);

		if(diagnostics.byFile.hasOwnProperty(diag.path)) {
			diagnostics.byFile[diag.path].push(diag);
		} else {
			diagnostics.byFile[diag.path] = [diag];
		}

		previous = diag;
		return true;
	};
}

export {
	Parser,
}
