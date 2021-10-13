function Parser() {
	this._data = {
		"errors": [],
		"warnings": [],
		"notes": [],
		"hints": [],
	}

	this.getData = function() {
		return this._data;
	}

	this.parseLine = function(text) {
		text = text.trim();

		const diagnosticRegexp = /^(.+)\((\d+),(\d+)\) (Error|Warning|Note|Hint): (.+)$/;
		const check = diagnosticRegexp.exec(text);
		if(check === null) return false;

		const type = check[4].toLowerCase();
		const diagObj = {
			"file": check[1],
			"line": check[2],
			"column": check[3],
			"type": type,
			"message": check[5],
		}
		if(type === "error") {
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
