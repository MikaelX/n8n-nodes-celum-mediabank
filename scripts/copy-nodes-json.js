const glob = require('fast-glob');
const fs = require('fs');
const path = require('path');

function copyJsonFiles(baseDir) {
	const files = glob.sync('nodes/**/*.node.json', { cwd: baseDir });
	for (const file of files) {
		const destPath = path.resolve(baseDir, 'dist', file);
		const destDir = path.dirname(destPath);
		// Ensure destination directory exists
		fs.mkdirSync(destDir, { recursive: true });
		fs.copyFileSync(path.resolve(baseDir, file), destPath);
	}
}

copyJsonFiles(process.argv[2] || process.cwd());

