import * as path from 'path';

import * as core from '@actions/core';


function parserLineToAnnotationProps(line, workdir) {
	const suffix = {
		"fatal": "Fatal error",
		"error": "Error",
		"warning": "Warning",
		"note": "Note",
		"hint": "Hint",
	};

	let props = {
		"file": workdir + line.file,
		"startLine": line.line,
	};

	let title = `${line.file}(${line.line}`;
	if(line.column > 0) {
		props.startColumn = line.column;
		title += `,${line.column}`
	}

	title += "): " + suffix[line.type];
	props.title = title;

	return props;
}

function emitSingleAnnotation(line, workdir) {
	const props = parserLineToAnnotationProps(line, workdir);
	switch(line.type) {
		case "fatal":
		case "error":
			core.error(line.message, props);
			break;

		case "warning":
			core.warning(line.message, props);
			break;

		case "note":
		case "hint":
			core.notice(line.message, props);
	}
}

function emitAnnotations(parserData, workdir) {
	if(typeof workdir === "string") {
		workdir = path.relative(".", path.normalize(workdir)) + path.sep;
	} else {
		workdir = "";
	}

	for(const e of parserData.errors) {
		emitSingleAnnotation(e, workdir);
	}
	for(const w of parserData.warnings) {
		emitSingleAnnotation(w, workdir);
	}
	for(const n of parserData.notes) {
		emitSingleAnnotation(n, workdir);
	}
	for(const h of parserData.hints) {
		emitSingleAnnotation(h, workdir);
	}
}

export {
	emitAnnotations,
}
