import { sep as PATH_SEPARATOR } from 'path';


function Parser(excludePath) {
	this._excludeDirs = [];
	this._excludeFiles = [];
	for(let ex of excludePath) {
		if(ex.endsWith(PATH_SEPARATOR)) {
			this._excludeDirs.push(ex);
		} else {
			this._excludeFiles.push(ex);
		}
	}

	this._data = {
		"byType": {
			"error": [],
			"warning": [],
			"note": [],
			"hint": [],
		},
		"byFile": {},
	};

	this.getData = function() {
		return this._data;
	}

	this.parseLine = function(text) {
		text = text.trim();

		const diagnosticRegexp = /^(.+)\((\d+),?(\d+)?\) (Fatal|Error|Warning|Note|Hint): (.+)$/;
		const check = diagnosticRegexp.exec(text);
		if(check === null) return false;

		const path = check[1];
		const line = Number(check[2]);
		const column = (check[3] !== undefined) ? Number(check[3]) : null;
		const type = check[4].toLowerCase();
		const message = check[5];

		// Ignore any messages pertaining to excluded files
		for(let excluded of this._excludeDirs) {
			if(path.startsWith(excluded)) {
				return false;
			}
		}
		for(let excluded of this._excludeFiles) {
			if(path === excluded) {
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
			"path": path,
			"line": line,
			"column": column,
			"type": type,
			"message": message,
		}
		if((type === "error") || (type === "fatal")) {
			this._data.byType.error.push(diagObj);
		} else {
			this._data.byType[type].push(diagObj);
		}

		if(this._data.byFile.hasOwnProperty(path)) {
			this._data.byFile[path].push(diagObj);
		} else {
			this._data.byFile[path] = [diagObj];
		}

		return true;
	}
}

export {
	Parser,
}
