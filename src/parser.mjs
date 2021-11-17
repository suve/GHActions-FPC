import * as path from 'path';


function Parser(excludePath) {
	let excludeDirs = [];
	let excludeFiles = [];
	for(let ex of excludePath) {
		if(ex.endsWith(path.sep)) {
			excludeDirs.push(ex);
		} else {
			excludeFiles.push(ex);
		}
	}

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

		const filePath = path.normalize(check[1]);
		const line = Number(check[2]);
		const column = (check[3] !== undefined) ? Number(check[3]) : null;
		const type = check[4].toLowerCase();
		const message = check[5];

		/*
		 * When a function is called with the wrong number of parameters, the compiler emits multiple messages:
		 *   /example/main.pas(9,41) Error: Wrong number of parameters specified for call to "SomeFunc"
		 *   /example/impl.pas(3,10) Error: Found declaration: SomeFunc(SmallInt):SmallInt;
		 * If these two messages are treated separately, they'll generate a rather non-useful annotation,
		 * attached to an error-free line, possibly in a different file. Instead, try to detect the second message type
		 * and attach the "declaration found" information to the initial "wrong number of parameters" message.
		 */
		const foundDeclarationString = "Found declaration: ";
		if(message.startsWith(foundDeclarationString)) {
			if(previous !== null) {
				// The workdir for the Action is the repo root, so a path relative to cwd will be relative to repo root.
				// If this produces a path starting with "../", then it's a file outside the repo - in which case, refer to it using the full path.
				let repoPath = path.relative("", filePath);
				if(repoPath.startsWith(`..${path.sep}`)) {
					repoPath = filePath;
				}

				let declaration = message.substring(foundDeclarationString.length);
				previous.message += `\nFound declaration in ${repoPath}(${line},${column}): ${declaration}`
			}
			return false;
		}

		// Ignore any messages pertaining to excluded files
		for(let excluded of excludeDirs) {
			if(filePath.startsWith(excluded)) {
				return false;
			}
		}
		for(let excluded of excludeFiles) {
			if(filePath === excluded) {
				return false;
			}
		}

		// Ignore the "fatal error because errors occurred" message
		if(type === "fatal") {
			const thereWereErrorsRegexp = /^There (was|were) \d+ errors? compiling module, stopping$/;
			if(thereWereErrorsRegexp.test(message)) {
				return false;
			}
		}

		const diagObj = {
			"path": filePath,
			"line": line,
			"column": column,
			"type": type,
			"message": message,
		}
		if((type === "error") || (type === "fatal")) {
			diagnostics.byType.error.push(diagObj);
		} else {
			diagnostics.byType[type].push(diagObj);
		}

		if(diagnostics.byFile.hasOwnProperty(filePath)) {
			diagnostics.byFile[filePath].push(diagObj);
		} else {
			diagnostics.byFile[filePath] = [diagObj];
		}

		previous = diagObj;
		return true;
	};
}

export {
	Parser,
}
