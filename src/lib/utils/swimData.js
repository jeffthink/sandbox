/**
 * Utilities for processing and analyzing swim data
 */

/**
 * Converts time string (MM:SS.SS or SS.SS) to total seconds
 * @param {string} timeStr - Time in format "1:23.45" or "23.45"
 * @returns {number} Total seconds
 */
export function parseTimeToSeconds(timeStr) {
	if (!timeStr) return null;
	
	const parts = timeStr.toString().split(':');
	if (parts.length === 1) {
		// Format: SS.SS
		return parseFloat(parts[0]);
	} else if (parts.length === 2) {
		// Format: MM:SS.SS
		const minutes = parseInt(parts[0]);
		const seconds = parseFloat(parts[1]);
		return minutes * 60 + seconds;
	}
	
	return null;
}

/**
 * Formats seconds to display time (MM:SS.SS or SS.SS)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
	if (seconds === null || seconds === undefined) return '';
	
	if (seconds < 60) {
		return seconds.toFixed(2);
	}
	
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = (seconds % 60).toFixed(2);
	return `${minutes}:${remainingSeconds.padStart(5, '0')}`;
}

/**
 * Creates a unique event key for grouping
 * @param {Object} race - Race object
 * @returns {string} Event key like "50 Freestyle"
 */
export function getEventKey(race) {
	return `${race.Distance} ${race.Stroke}`;
}

/**
 * Processes raw swim data from Google Sheets
 * @param {Array} meets - Array of meet objects
 * @param {Array} races - Array of race objects
 * @returns {Object} Processed data with joined information and calculations
 */
export function processSwimData(meets, races) {
	// Create a map of meets by ID for quick lookup
	const meetsMap = new Map();
	meets.forEach(meet => {
		meetsMap.set(meet.MeetId, {
			...meet,
			Date: new Date(meet.Date),
			OurPoints: parseFloat(meet.OurPoints) || 0,
			TheirPoints: parseFloat(meet.TheirPoints) || 0,
			TeamPlace: parseInt(meet.TeamPlace) || null,
			NumTeams: parseInt(meet.NumTeams) || null
		});
	});
	
	// Process races with parsed times and joined meet data
	const processedRaces = races.map(race => {
		const meet = meetsMap.get(race.MeetId);
		const timeInSeconds = parseTimeToSeconds(race.Time);
		
		return {
			...race,
			meet,
			timeInSeconds,
			formattedTime: formatTime(timeInSeconds),
			Place: parseInt(race.Place) || null,
			NumSwimmers: parseInt(race.NumSwimmers) || null,
			EventNumber: parseInt(race.EventNumber) || null,
			eventKey: getEventKey(race),
			date: meet ? meet.Date : null
		};
	}).filter(race => race.meet); // Only include races with valid meets
	
	// Sort races by date
	processedRaces.sort((a, b) => a.date - b.date);
	
	// Calculate personal records and improvements
	const swimmerEventPRs = new Map();
	const swimmerEventHistory = new Map();
	
	processedRaces.forEach(race => {
		if (!race.timeInSeconds) return;
		
		const key = `${race.Swimmer}-${race.eventKey}`;
		
		// Track history
		if (!swimmerEventHistory.has(key)) {
			swimmerEventHistory.set(key, []);
		}
		const history = swimmerEventHistory.get(key);
		
		// Calculate improvement from previous race
		if (history.length > 0) {
			const previousRace = history[history.length - 1];
			race.improvementSeconds = previousRace.timeInSeconds - race.timeInSeconds;
			race.improvementPercent = (race.improvementSeconds / previousRace.timeInSeconds) * 100;
		} else {
			race.improvementSeconds = null;
			race.improvementPercent = null;
		}
		
		history.push(race);
		
		// Track PRs
		if (!swimmerEventPRs.has(key) || race.timeInSeconds < swimmerEventPRs.get(key).timeInSeconds) {
			swimmerEventPRs.set(key, race);
			race.isPersonalRecord = true;
		} else {
			race.isPersonalRecord = false;
		}
	});
	
	// Get unique values for filters
	const swimmers = [...new Set(processedRaces.map(r => r.Swimmer))].sort();
	const events = [...new Set(processedRaces.map(r => r.eventKey))].sort();
	const meetNames = [...new Set(meets.map(m => m.MeetName))].sort();
	const strokes = [...new Set(races.map(r => r.Stroke))].sort();
	
	return {
		races: processedRaces,
		meets: Array.from(meetsMap.values()),
		swimmerEventHistory,
		swimmerEventPRs,
		filters: {
			swimmers,
			events,
			meetNames,
			strokes
		}
	};
}

/**
 * Filters races based on provided criteria
 * @param {Array} races - Array of processed race objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered races
 */
export function filterRaces(races, filters) {
	return races.filter(race => {
		if (filters.swimmer && race.Swimmer !== filters.swimmer) return false;
		if (filters.stroke && race.Stroke !== filters.stroke) return false;
		if (filters.event && race.eventKey !== filters.event) return false;
		if (filters.meet && race.meet.MeetName !== filters.meet) return false;
		if (filters.startDate && race.date < filters.startDate) return false;
		if (filters.endDate && race.date > filters.endDate) return false;
		
		return true;
	});
}