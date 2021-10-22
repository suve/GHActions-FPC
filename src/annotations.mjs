import * as path from 'path';

import * as core from '@actions/core';


function parserLineToAnnotationProps(line) {
	const suffix = {
		"fatal": "Fatal error",
		"error": "Error",
		"warning": "Warning",
		"note": "Note",
		"hint": "Hint",
	};

	let fileName = path.basename(line.path);
	let filePath = path.relative("", line.path);

	let props = {
		"file": filePath,
		"startLine": line.line,
	};

	let title = `${fileName}(${line.line}`;
	if(line.column > 0) {
		props.startColumn = line.column;
		title += `,${line.column}`
	}

	title += "): " + suffix[line.type];
	props.title = title;

	return props;
}

function emitSingleAnnotation(line) {
	const props = parserLineToAnnotationProps(line);
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

function emitAnnotations(parserData) {
	for(const list of parserData.byType) {
		for(const line of list) {
			emitSingleAnnotation(line);
		}
	}
}

export {
	emitAnnotations,
}
