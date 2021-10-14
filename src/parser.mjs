function Parser() {
	this._data = {
		"errors": [],
		"warnings": [],
		"notes": [],
		"hints": [],
	};

	this.getData = function() {
		return this._data;
	}

	this.parseLine = function(text) {
		text = text.trim();

		const diagnosticRegexp = /^(.+)\((\d+),?(\d+)?\) (Fatal|Error|Warning|Note|Hint): (.+)$/;
		const check = diagnosticRegexp.exec(text);
		if(check === null) return false;

		const file = check[1];
		const line = Number(check[2]);
		const column = (check[3] !== undefined) ? Number(check[3]) : null;
		const type = check[4].toLowerCase();
		const message = check[5];

		const diagObj = {
			"file": file,
			"line": line,
			"column": column,
			"type": type,
			"message": message,
		}
		if((type === "error") || (type === "fatal")) {
			this._data.errors.push(diagObj);
		} else if(type === "warning") {
			this._data.warnings.push(diagObj);
		} else if(type === "note") {
			this._data.notes.push(diagObj);
		} else if(type === "hint") {
			this._data.hints.push(diagObj);
		} else {
			// Unknown type. Throw an exception? Print something to stderr?
		}
		return true;
	}
}

export {
	Parser,
}
