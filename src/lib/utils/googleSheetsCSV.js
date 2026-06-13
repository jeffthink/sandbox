/**
 * Alternative Google Sheets integration using published CSV URLs
 * This is simpler than the API approach but has some limitations
 */

/**
 * Fetches and parses CSV data from a published Google Sheet
 * @param {string} publishedUrl - The published CSV URL from Google Sheets
 * @returns {Promise<Array>} Array of objects representing rows
 */
export async function fetchSheetCSV(publishedUrl) {
	try {
		const response = await fetch(publishedUrl);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch CSV: ${response.statusText}`);
		}
		
		const csvText = await response.text();
		return parseCSV(csvText);
	} catch (error) {
		console.error('Error fetching CSV:', error);
		throw error;
	}
}

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

/**
 * Example usage:
 * 
 * const MEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_ID/pub?gid=0&single=true&output=csv';
 * const RACES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_ID/pub?gid=12345&single=true&output=csv';
 * 
 * const meets = await fetchSheetCSV(MEETS_CSV_URL);
 * const races = await fetchSheetCSV(RACES_CSV_URL);
 */