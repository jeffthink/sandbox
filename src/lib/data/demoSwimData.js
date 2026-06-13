/**
 * Synthetic swim data for the public demo. All swimmers and meets are fictional.
 *
 * Design notes (so the demo reads like a real season, not a toy):
 * - Swimmers share an age group and go HEAD-TO-HEAD in shared events: same
 *   EventNumber, same meet (Marlin/Pip in 11-12; Coral/Finn in 9-10). When two
 *   of our swimmers are in the same race, the faster time gets the better place.
 *   Some events are unique to one swimmer. Event variety per swimmer ranges 2-5.
 * - Fields are realistically sized: ~10-16 swimmers at dual meets, ~20-34 at the
 *   championship. Our swimmers mostly finish mid-pack; wins are absent and only a
 *   couple of podium (2nd) swims show up, on standout days in small fields.
 * - Times generally trend down across the season but fluctuate meet to meet, so
 *   personal records are occasional (most are the swimmer's first swim of an
 *   event; only ~5 events show a genuine in-season improvement).
 * - Week 2 (vs Sharks) is a team loss; one swim is a DQ.
 *
 * Values are emitted as strings to match the shape produced by the CSV parser,
 * so this data flows through processSwimData() exactly like real sheet data.
 */

// MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams
const MEET_ROWS = [
	['2025-06-14-week-1', '2025-06-14', 'Summer League Week 1', 'Otters', 'Home Pool', 25, 'meters', 298, 276, '', ''],
	['2025-06-21-week-2', '2025-06-21', 'Summer League Week 2', 'Sharks', 'Away Pool', 25, 'meters', 264, 312, '', ''],
	['2025-06-28-week-3', '2025-06-28', 'Summer League Week 3', 'Dolphins', 'Home Pool', 25, 'meters', 305, 271, '', ''],
	['2025-07-12-champs', '2025-07-12', 'Summer Championships', 'Multiple', 'Regional Aquatic Center', 25, 'meters', 0, 0, 3, 6]
];

// short meet code -> MeetId, in season order
const MEET_IDS = {
	w1: '2025-06-14-week-1',
	w2: '2025-06-21-week-2',
	w3: '2025-06-28-week-3',
	ch: '2025-07-12-champs'
};

const SWIMMER_CODE = {
	'Marlin Waters': 'mw',
	'Pip Splash': 'ps',
	'Coral Reef': 'cr',
	'Finn Current': 'fc'
};

// One entry per swimmer. EventNumber is shared across swimmers for the same
// (age group, distance, stroke), so swimmers in the same age group meet in the
// same numbered event. Each result is [meetCode, time, place, numSwimmers];
// a DQ is ['<meet>', 'DQ', 'DQ', numSwimmers].
const SEASON = [
	{
		swimmer: 'Marlin Waters',
		ageGroup: '11-12',
		events: [
			{ eventNumber: 22, distance: 50, stroke: 'Freestyle', results: [
				['w1', '33.80', 5, 14], ['w2', '34.20', 7, 13], ['w3', '33.50', 4, 15], ['ch', '33.60', 12, 30]
			] },
			{ eventNumber: 24, distance: 100, stroke: 'Freestyle', results: [
				['w1', '1:17.80', 6, 12], ['w2', '1:18.40', 7, 11], ['w3', '1:18.10', 5, 13], ['ch', '1:18.30', 14, 26]
			] },
			{ eventNumber: 28, distance: 50, stroke: 'Backstroke', results: [
				['w1', '40.60', 6, 12], ['w2', '41.30', 8, 12], ['w3', '40.90', 5, 13], ['ch', '41.00', 15, 24]
			] },
			{ eventNumber: 34, distance: 100, stroke: 'IM', results: [
				['w1', '1:32.40', 4, 10], ['w2', '1:32.80', 6, 11], ['w3', '1:31.80', 3, 12], ['ch', '1:32.10', 10, 22]
			] }
		]
	},
	{
		swimmer: 'Pip Splash',
		ageGroup: '11-12',
		events: [
			{ eventNumber: 22, distance: 50, stroke: 'Freestyle', results: [
				['w1', '35.10', 9, 14], ['w2', '35.70', 11, 13], ['w3', '35.30', 8, 15], ['ch', '35.50', 21, 30]
			] },
			{ eventNumber: 34, distance: 100, stroke: 'IM', results: [
				['w1', '1:35.00', 7, 10], ['w2', 'DQ', 'DQ', 11], ['w3', '1:34.60', 6, 12], ['ch', '1:34.90', 16, 22]
			] },
			{ eventNumber: 30, distance: 50, stroke: 'Breaststroke', results: [
				['w1', '47.10', 5, 11], ['w2', '47.60', 7, 10], ['w3', '47.30', 6, 12], ['ch', '47.80', 18, 20]
			] }
		]
	},
	{
		swimmer: 'Coral Reef',
		ageGroup: '9-10',
		events: [
			{ eventNumber: 21, distance: 25, stroke: 'Freestyle', results: [
				['w1', '18.40', 7, 16], ['w2', '18.90', 9, 15], ['w3', '18.60', 6, 16], ['ch', '18.70', 17, 34]
			] },
			{ eventNumber: 23, distance: 50, stroke: 'Freestyle', results: [
				['w1', '39.60', 8, 16], ['w2', '40.20', 10, 15], ['w3', '39.80', 7, 16], ['ch', '40.00', 19, 32]
			] },
			{ eventNumber: 27, distance: 25, stroke: 'Backstroke', results: [
				['w1', '20.90', 5, 14], ['w2', '21.50', 7, 13], ['w3', '21.10', 4, 14], ['ch', '21.30', 13, 28]
			] },
			{ eventNumber: 29, distance: 25, stroke: 'Butterfly', results: [
				['w1', '20.60', 6, 12], ['w2', '20.90', 8, 12], ['w3', '20.40', 2, 11], ['ch', '20.70', 14, 24]
			] },
			{ eventNumber: 33, distance: 100, stroke: 'IM', results: [
				['w1', '1:41.50', 6, 10], ['w2', '1:42.40', 8, 10], ['w3', '1:42.00', 5, 11], ['ch', '1:42.20', 16, 20]
			] }
		]
	},
	{
		swimmer: 'Finn Current',
		ageGroup: '9-10',
		events: [
			{ eventNumber: 21, distance: 25, stroke: 'Freestyle', results: [
				['w1', '18.10', 4, 16], ['w2', '18.40', 6, 15], ['w3', '17.90', 2, 16], ['ch', '18.00', 11, 34]
			] },
			{ eventNumber: 23, distance: 50, stroke: 'Freestyle', results: [
				['w1', '38.60', 5, 16], ['w2', '39.30', 7, 15], ['w3', '38.90', 4, 16], ['ch', '39.10', 13, 32]
			] }
		]
	}
];

// Flatten the season into CSV-parser-shaped race rows (all string values).
export const races = SEASON.flatMap(({ swimmer, ageGroup, events }) =>
	events.flatMap(({ eventNumber, distance, stroke, results }) =>
		results.map(([meetCode, time, place, numSwimmers]) => ({
			RaceId: `${meetCode}-${eventNumber}-${SWIMMER_CODE[swimmer]}`,
			MeetId: MEET_IDS[meetCode],
			Swimmer: swimmer,
			EventNumber: String(eventNumber),
			AgeGroup: ageGroup,
			Distance: String(distance),
			Stroke: stroke,
			Time: String(time),
			Place: String(place),
			NumSwimmers: String(numSwimmers)
		}))
	)
);

export const meets = MEET_ROWS.map(
	([MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams]) => ({
		MeetId,
		Date,
		MeetName,
		Opponent,
		Location,
		PoolSize: String(PoolSize),
		PoolUnit,
		OurPoints: String(OurPoints),
		TheirPoints: String(TheirPoints),
		TeamPlace: String(TeamPlace),
		NumTeams: String(NumTeams)
	})
);

export const swimmers = [
	{ Name: 'Marlin Waters', Emoji: '🐟' },
	{ Name: 'Pip Splash', Emoji: '🐬' },
	{ Name: 'Coral Reef', Emoji: '🐠' },
	{ Name: 'Finn Current', Emoji: '🦈' }
];
