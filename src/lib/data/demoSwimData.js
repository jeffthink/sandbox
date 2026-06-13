/**
 * Synthetic swim data for the public demo. All swimmers and meets are fictional.
 * Values are strings to match the shape produced by the CSV parser, so this data
 * flows through processSwimData() identically to real sheet data.
 */

// MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams
const MEET_ROWS = [
	['2025-06-14-week-1', '2025-06-14', 'Summer League Week 1', 'Otters', 'Home Pool', 25, 'meters', 312, 288, '', ''],
	['2025-06-21-week-2', '2025-06-21', 'Summer League Week 2', 'Sharks', 'Away Pool', 25, 'meters', 305, 295, '', ''],
	['2025-06-28-week-3', '2025-06-28', 'Summer League Week 3', 'Dolphins', 'Home Pool', 25, 'meters', 330, 270, '', ''],
	['2025-07-12-champs', '2025-07-12', 'Summer Championships', 'Multiple', 'Regional Aquatic Center', 25, 'meters', 0, 0, 2, 6]
];

// RaceId, MeetId, Swimmer, EventNumber, AgeGroup, Distance, Stroke, Time, Place, NumSwimmers
const RACE_ROWS = [
	// Marlin Waters — 50 Freestyle (steady improvement, wins at champs)
	['R001', '2025-06-14-week-1', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '35.20', 3, 8],
	['R002', '2025-06-21-week-2', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '34.85', 2, 8],
	['R003', '2025-06-28-week-3', 'Marlin Waters', 3, '11-12', 50, 'Freestyle', '34.10', 2, 8],
	['R004', '2025-07-12-champs', 'Marlin Waters', 12, '11-12', 50, 'Freestyle', '33.60', 1, 8],
	// Marlin Waters — 50 Backstroke
	['R005', '2025-06-14-week-1', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '42.10', 4, 8],
	['R006', '2025-06-21-week-2', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '41.50', 3, 8],
	['R007', '2025-06-28-week-3', 'Marlin Waters', 7, '11-12', 50, 'Backstroke', '41.80', 3, 8],
	['R008', '2025-07-12-champs', 'Marlin Waters', 20, '11-12', 50, 'Backstroke', '40.90', 2, 8],
	// Pip Splash — 50 Freestyle (DQ at champs)
	['R009', '2025-06-14-week-1', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '38.40', 5, 8],
	['R010', '2025-06-21-week-2', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '37.90', 4, 8],
	['R011', '2025-06-28-week-3', 'Pip Splash', 3, '11-12', 50, 'Freestyle', '37.20', 4, 8],
	['R012', '2025-07-12-champs', 'Pip Splash', 12, '11-12', 50, 'Freestyle', 'DQ', 'DQ', 8],
	// Pip Splash — 100 IM
	['R013', '2025-06-14-week-1', 'Pip Splash', 9, '11-12', 100, 'IM', '1:34.50', 4, 6],
	['R014', '2025-06-21-week-2', 'Pip Splash', 9, '11-12', 100, 'IM', '1:32.80', 3, 6],
	['R015', '2025-06-28-week-3', 'Pip Splash', 9, '11-12', 100, 'IM', '1:31.40', 3, 6],
	['R016', '2025-07-12-champs', 'Pip Splash', 24, '11-12', 100, 'IM', '1:30.10', 2, 6],
	// Coral Reef — 25 Freestyle (8 & Under)
	['R017', '2025-06-14-week-1', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.90', 2, 6],
	['R018', '2025-06-21-week-2', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.40', 2, 6],
	['R019', '2025-06-28-week-3', 'Coral Reef', 1, '8 & Under', 25, 'Freestyle', '18.10', 1, 6],
	['R020', '2025-07-12-champs', 'Coral Reef', 4, '8 & Under', 25, 'Freestyle', '17.80', 1, 6],
	// Coral Reef — 25 Butterfly
	['R021', '2025-06-14-week-1', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '22.30', 3, 6],
	['R022', '2025-06-21-week-2', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '21.80', 2, 6],
	['R023', '2025-06-28-week-3', 'Coral Reef', 5, '8 & Under', 25, 'Butterfly', '21.50', 2, 6],
	['R024', '2025-07-12-champs', 'Coral Reef', 8, '8 & Under', 25, 'Butterfly', '21.20', 2, 6],
	// Finn Current — 100 Freestyle (13-14)
	['R025', '2025-06-14-week-1', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:12.40', 3, 8],
	['R026', '2025-06-21-week-2', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:11.20', 2, 8],
	['R027', '2025-06-28-week-3', 'Finn Current', 11, '13-14', 100, 'Freestyle', '1:10.50', 2, 8],
	['R028', '2025-07-12-champs', 'Finn Current', 28, '13-14', 100, 'Freestyle', '1:09.80', 1, 8],
	// Finn Current — 50 Breaststroke
	['R029', '2025-06-14-week-1', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '45.60', 4, 8],
	['R030', '2025-06-21-week-2', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '45.10', 3, 8],
	['R031', '2025-06-28-week-3', 'Finn Current', 15, '13-14', 50, 'Breaststroke', '44.30', 3, 8],
	['R032', '2025-07-12-champs', 'Finn Current', 32, '13-14', 50, 'Breaststroke', '43.90', 2, 8]
];

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

export const races = RACE_ROWS.map(
	([RaceId, MeetId, Swimmer, EventNumber, AgeGroup, Distance, Stroke, Time, Place, NumSwimmers]) => ({
		RaceId,
		MeetId,
		Swimmer,
		EventNumber: String(EventNumber),
		AgeGroup,
		Distance: String(Distance),
		Stroke,
		Time,
		Place: String(Place),
		NumSwimmers: String(NumSwimmers)
	})
);

export const swimmers = [
	{ Name: 'Marlin Waters', Emoji: '🐟' },
	{ Name: 'Pip Splash', Emoji: '🐬' },
	{ Name: 'Coral Reef', Emoji: '🐠' },
	{ Name: 'Finn Current', Emoji: '🦈' }
];
