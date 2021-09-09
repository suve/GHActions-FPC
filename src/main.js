const core = require('@actions/core');

try {
	console.log('Hello World!');
} catch (e) {
	core.setFailed(e.message);
}
