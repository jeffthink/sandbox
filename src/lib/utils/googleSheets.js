/**
 * Google Sheets API integration for fetching swim tracker data
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Fetches data from a specific sheet in a Google Spreadsheet
 * @param {string} spreadsheetId - The ID of the Google Spreadsheet
 * @param {string} sheetName - The name of the sheet tab to fetch
 * @param {string} apiKey - Google Sheets API key
 * @returns {Promise<Array>} Array of objects representing rows
 */
export async function fetchSheetData(spreadsheetId, sheetName, apiKey) {
	if (!spreadsheetId || !apiKey) {
		console.warn('Missing Google Sheets configuration. Please set SHEET_ID and API_KEY.');
		return [];
	}
	
	try {
		const range = `${sheetName}!A:Z`; // Fetch all columns
		const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;
		
		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.values || data.values.length === 0) {
			return [];
		}
		
		// Convert to array of objects using first row as headers
		const headers = data.values[0];
		const rows = data.values.slice(1);
		
		return rows.map(row => {
			const obj = {};
			headers.forEach((header, index) => {
				obj[header] = row[index] || '';
			});
			return obj;
		});
	} catch (error) {
		console.error(`Error fetching ${sheetName} data:`, error);
		throw error;
	}
}

/**
 * Validates that the sheet data has the expected columns
 * @param {Array} data - Array of row objects
 * @param {Array<string>} requiredColumns - Array of required column names
 * @returns {boolean} True if all required columns are present
 */
export function validateSheetColumns(data, requiredColumns) {
	if (!data || data.length === 0) return false;
	
	const firstRow = data[0];
	return requiredColumns.every(col => col in firstRow);
}

/**
 * Expected column definitions for each sheet
 */
export const SHEET_COLUMNS = {
	meets: [
		'MeetId',
		'Date',
		'MeetName',
		'Opponent',
		'Location',
		'PoolSize',
		'PoolUnit',
		'OurPoints',
		'TheirPoints',
		'TeamPlace',
		'NumTeams'
	],
	races: [
		'RaceId',
		'MeetId',
		'Swimmer',
		'EventNumber',
		'AgeGroup',
		'Distance',
		'Stroke',
		'Time',
		'Place',
		'NumSwimmers'
	]
};