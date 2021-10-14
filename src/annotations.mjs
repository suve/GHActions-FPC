import * as path from 'path';

import * as core from '@actions/core';


function parserLineToAnnotationProps(line, workdir) {
	let props = {
		"file": workdir + line.file,
		"startLine": line.line,
	};
	if(line.column > 0) {
		props.startColumn = line.column;
	}
	return props;
}

function emitAnnotations(parserData, workdir) {
	if(typeof workdir === "string") {
		workdir = path.relative(".", path.normalize(workdir)) + path.sep;
	} else {
		workdir = "";
	}

	// It would be more elegant to have an "emitSingleAnnotation()" function,
	// but then we'd need to check parserLine.type each time to determine
	// whether we should call core.error(), core.warning() or core.notice().
	for(let i = 0; i < parserData.errors.length; ++i) {
		const e = parserData.errors[i];
		core.error(e.message, parserLineToAnnotationProps(e, workdir));
	}
	for(let i = 0; i < parserData.warnings.length; ++i) {
		const w = parserData.warnings[i];
		core.warning(w.message, parserLineToAnnotationProps(w, workdir));
	}
	for(let i = 0; i < parserData.notes.length; ++i) {
		const n = parserData.notes[i];
		core.notice(n.message, parserLineToAnnotationProps(n, workdir));
	}
	for(let i = 0; i < parserData.hints.length; ++i) {
		const h = parserData.hints[i];
		core.notice(h.message, parserLineToAnnotationProps(h, workdir));
	}
}

export {
	emitAnnotations,
}
