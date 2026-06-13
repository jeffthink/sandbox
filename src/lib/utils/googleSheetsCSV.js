/**
 * Utilities for parsing published Google Sheets CSV text into row objects.
 * `parseCSV` is used server-side by the /api/swim-data function (see
 * src/lib/server/swimGate.js); the published CSV URLs are held as server-side
 * env vars and never reach the browser.
 */

/**
 * Parses CSV text into an array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of objects with headers as keys
 */
export function parseCSV(csvText) {
	const lines = csvText.split('\n').filter(line => line.trim());
	if (lines.length === 0) return [];
	
	// Parse headers
	const headers = parseCSVLine(lines[0]);
	
	// Parse data rows
	return lines.slice(1).map(line => {
		const values = parseCSVLine(line);
		const obj = {};
		headers.forEach((header, index) => {
			obj[header] = values[index] || '';
		});
		return obj;
	});
}

/**
 * Parses a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
	const values = [];
	let current = '';
	let inQuotes = false;
	
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++; // Skip next quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			values.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	
	values.push(current.trim());
	return values;
}

/**
 * How to get published CSV URLs:
 * 
 * 1. Open your Google Sheet
 * 2. File → Share → Publish to web
 * 3. Choose the specific sheet (tab)
 * 4. Select "Comma-separated values (.csv)"
 * 5. Click "Publish"
 * 6. Copy the URL
 * 
 * The URL will look like:
 * https://docs.google.com/spreadsheets/d/e/LONG_ID_HERE/pub?gid=0&single=true&output=csv
 * 
 * Where gid=0 is the first tab, gid=12345 is other tabs
 */