import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

import * as core from '@actions/core';

const MESSAGE_TYPE_NAME = {
	"fatal": "Fatal error",
	"error": "Error",
	"warning": "Warning",
	"note": "Note",
	"hint": "Hint",
};

function parserLineToAnnotationProps(line, fileDetails) {
	const fileName = fileDetails.name;
	const filePath = fileDetails.path;
	const lineNo = (line.line > fileDetails.lineCount) ? fileDetails.lineCount : line.line;

	let props = {
		"file": filePath,
		"startLine": lineNo,
	};

	let title = `${fileName}(${lineNo}`;
	if(line.column > 0) {
		props.startColumn = line.column;
		title += `,${line.column}`
	} else {
		// GitHub requires the "startColumn" field to be present.
		props.startColumn = 1;
	}

	title += "): " + MESSAGE_TYPE_NAME[line.type];
	if(line.userDefined) title += " (user defined)";

	props.title = title;
	return props;
}

function emitSingleAnnotation(line, fileDetails) {
	const props = parserLineToAnnotationProps(line, fileDetails);
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

async function countLinesInFile(path) {
	const newline = 10; // ASCII '\n'

	// Treat all files, even zero-byte files, as containing at least one line.
	let count = 1;
	// If a file ends with a newline, treat the empty line at end of file as non-existent.
	// For example, "aaa\nbbb" and "aaa\nbbb\n" should both return a count of 2 lines.
	let endsWithNewline = false;

	let fd = await fs.promises.open(path, 'r');
	let buffer = Buffer.alloc(16 * 1024);
	while(true) {
		let read = await fd.read(buffer, 0, buffer.length, null);
		if(read.bytesRead === 0) break;

		let searchPos = 0;
		while(true) {
			let newlinePos = buffer.indexOf(newline, searchPos);
			if(newlinePos < 0) break;

			count += 1;
			searchPos = newlinePos + 1;
		}

		// This will get overwritten with each chunk we read,
		// so the end value will reflect the status of the final chunk.
		endsWithNewline = buffer[read.bytesRead - 1] === newline;
	}
	await fd.close();

	return endsWithNewline ? (count - 1) : count;
}

async function emitAnnotations(parserData) {
	for(const file in parserData.byFile) {
		const fileDetails = {
			"name": path.basename(file),
			"path": path.relative("", file),
			"lineCount": await countLinesInFile(file),
		};

		core.startGroup(fileDetails.path);
		for(const msg of parserData.byFile[file]) {
			emitSingleAnnotation(msg, fileDetails);
		}
		core.endGroup();
	}
}

export {
	emitAnnotations,
}
