#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixExports(filePath, className, exportName) {
	if (!fs.existsSync(filePath)) {
		console.error(`File not found: ${filePath}`);
		return false;
	}

	let content = fs.readFileSync(filePath, 'utf8');

	// Remove any existing module.exports that replaces the entire exports object
	content = content.replace(new RegExp(`^module\\.exports\\s*=\\s*${className};?\\s*$`, 'm'), '');

	// Ensure exports[exportName] exists (it should from TypeScript compilation)
	const exportPattern = new RegExp(`exports\\.${exportName}\\s*=\\s*${className};`);
	if (!exportPattern.test(content)) {
		// Find the class definition and add export after it
		const classMatch = content.match(new RegExp(`(class ${className}[^}]+})`, 's'));
		if (classMatch) {
			const insertPos = content.indexOf('}', content.indexOf(`class ${className}`)) + 1;
			content = content.slice(0, insertPos) + `\nexports.${exportName} = ${className};\n` + content.slice(insertPos);
		}
	}

	// Also ensure module.exports[exportName] exists for compatibility
	const moduleExportPattern = new RegExp(`module\\.exports\\.${exportName}`);
	let sourceMapMatch = content.match(/(\/\/# sourceMappingURL=.*)$/m);
	const sourceMap = sourceMapMatch ? sourceMapMatch[1] : '';
	
	if (!moduleExportPattern.test(content)) {
		// Remove the source map comment temporarily
		content = content.replace(/\/\/# sourceMappingURL=.*$/m, '');
		
		// Add module.exports[exportName] (doesn't override exports object)
		content += `\nmodule.exports.${exportName} = ${className};\n`;
	}
	
	// For credential files, also export with the filename-based name for n8n compatibility
	// n8n infers class name from filename (e.g., CelumMediabank.credentials.js -> CelumMediabank)
	if (filePath.includes('credentials')) {
		const filenameMatch = filePath.match(/([^/]+)\.credentials\.js$/);
		if (filenameMatch) {
			const inferredName = filenameMatch[1];
			// Only add if the inferred name is different from the actual export name
			if (inferredName !== exportName) {
				// Check if it already exists
				const inferredExportPattern = new RegExp(`exports\\.${inferredName}\\s*=\\s*${className};`);
				if (!inferredExportPattern.test(content)) {
					// Remove source map if it exists
					content = content.replace(/\/\/# sourceMappingURL=.*$/m, '');
					content += `\nexports.${inferredName} = ${className};\n`;
				}
				const inferredModulePattern = new RegExp(`module\\.exports\\.${inferredName}`);
				if (!inferredModulePattern.test(content)) {
					// Remove source map if it exists
					content = content.replace(/\/\/# sourceMappingURL=.*$/m, '');
					content += `module.exports.${inferredName} = ${className};\n`;
				}
			}
		}
	}
	
	// Restore source map at the end if it was removed
	if (sourceMap && !content.includes('sourceMappingURL')) {
		content += sourceMap + '\n';
	}

	fs.writeFileSync(filePath, content, 'utf8');
	return true;
}

// Fix node file
const nodeFile = path.join(__dirname, '..', 'dist', 'nodes', 'CelumMediabank', 'CelumMediabank.node.js');
if (fixExports(nodeFile, 'CelumMediabank', 'CelumMediabank')) {
	console.log('✓ Fixed node exports');
} else {
	console.error('✗ Failed to fix node exports');
}

// Fix credential file
const credentialFile = path.join(__dirname, '..', 'dist', 'credentials', 'CelumMediabank.credentials.js');
if (fixExports(credentialFile, 'CelumMediabankApi', 'CelumMediabankApi')) {
	console.log('✓ Fixed credential exports');
} else {
	console.error('✗ Failed to fix credential exports');
}

// Copy SVG icon files to dist
function copySvgFiles() {
	const srcSvg = path.join(__dirname, '..', 'src', 'nodes', 'CelumMediabank', 'celummediabank.svg');
	const distSvg = path.join(__dirname, '..', 'dist', 'nodes', 'CelumMediabank', 'celummediabank.svg');
	
	if (fs.existsSync(srcSvg)) {
		// Ensure dist directory exists
		const distDir = path.dirname(distSvg);
		if (!fs.existsSync(distDir)) {
			fs.mkdirSync(distDir, { recursive: true });
		}
		fs.copyFileSync(srcSvg, distSvg);
		console.log('✓ Copied SVG icon to dist');
		return true;
	}
	return false;
}

copySvgFiles();

