/**
 * Swim data for the public demo. Seeded from a real summer-league season but
 * fully de-identified: swimmer names, the initials embedded in RaceIds, and all
 * team / league / opponent / meet names are fictional. Every performance value
 * (times, places, events, age groups, strokes, field sizes, points, dates) is
 * real, so the demo behaves like genuine data without identifying anyone.
 *
 * Values are strings to match the shape produced by the CSV parser, so this data
 * flows through processSwimData() exactly like a published sheet would.
 */

export const meets = [
	{"MeetId":"2025-06-11-vs-otters","Date":"2025-06-11","MeetName":"Summer League Week 1","Opponent":"Otters","Location":"Home","PoolSize":"25","PoolUnit":"meters","OurPoints":"-","TheirPoints":"-","TeamPlace":"-","NumTeams":"2"},
	{"MeetId":"2025-06-18-vs-sharks","Date":"2025-06-18","MeetName":"Summer League Week 2","Opponent":"Sharks","Location":"Home","PoolSize":"25","PoolUnit":"meters","OurPoints":"549.5","TheirPoints":"496.5","TeamPlace":"1","NumTeams":"2"},
	{"MeetId":"2025-06-25-vs-stingrays","Date":"2025-06-25","MeetName":"Summer League Week 3","Opponent":"Stingrays","Location":"Away","PoolSize":"25","PoolUnit":"meters","OurPoints":"207","TheirPoints":"217","TeamPlace":"2","NumTeams":"2"},
	{"MeetId":"2025-07-02-vs-dolphins","Date":"2025-07-02","MeetName":"Summer League Week 4","Opponent":"Dolphins","Location":"Away","PoolSize":"25","PoolUnit":"meters","OurPoints":"538","TheirPoints":"493","TeamPlace":"1","NumTeams":"2"},
	{"MeetId":"2025-07-10-vs-marlins","Date":"2025-07-10","MeetName":"Summer League Week 5","Opponent":"Marlins","Location":"Home","PoolSize":"25","PoolUnit":"meters","OurPoints":"166.5","TheirPoints":"201.5","TeamPlace":"2","NumTeams":"2"},
	{"MeetId":"2025-07-16-vs-barracudas","Date":"2025-07-16","MeetName":"Summer League Week 6","Opponent":"Barracudas","Location":"Away","PoolSize":"25","PoolUnit":"meters","OurPoints":"512","TheirPoints":"544","TeamPlace":"2","NumTeams":"2"},
	{"MeetId":"2025-07-25-championships","Date":"2025-07-25","MeetName":"Summer League Championships","Opponent":"Multiple Teams","Location":"Away","PoolSize":"25","PoolUnit":"yards","OurPoints":"1702.5","TheirPoints":"2332.5","TeamPlace":"6","NumTeams":"16"}
];

export const races = [
	{"RaceId":"2025-06-11-vs-otters-22-m","MeetId":"2025-06-11-vs-otters","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"32.72","Place":"18","NumSwimmers":"32"},
	{"RaceId":"2025-06-11-vs-otters-22-p","MeetId":"2025-06-11-vs-otters","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"41.06","Place":"28","NumSwimmers":"32"},
	{"RaceId":"2025-06-11-vs-otters-24-c","MeetId":"2025-06-11-vs-otters","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"46.32","Place":"5","NumSwimmers":"26"},
	{"RaceId":"2025-06-11-vs-otters-42-m","MeetId":"2025-06-11-vs-otters","Swimmer":"Marlin","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"43.13","Place":"14","NumSwimmers":"22"},
	{"RaceId":"2025-06-11-vs-otters-42-p","MeetId":"2025-06-11-vs-otters","Swimmer":"Pip","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"54.22","Place":"17","NumSwimmers":"22"},
	{"RaceId":"2025-06-11-vs-otters-44-c","MeetId":"2025-06-11-vs-otters","Swimmer":"Coral","EventNumber":"44","AgeGroup":"9-10","Distance":"50","Stroke":"Backstroke","Time":"1:01.87","Place":"2","NumSwimmers":"15"},
	{"RaceId":"2025-06-18-vs-sharks-14-c","MeetId":"2025-06-18-vs-sharks","Swimmer":"Coral","EventNumber":"14","AgeGroup":"9-10","Distance":"200","Stroke":"Medley Relay","Time":"4:45.00","Place":"3","NumSwimmers":"4"},
	{"RaceId":"2025-06-18-vs-sharks-22-m","MeetId":"2025-06-18-vs-sharks","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"31.56","Place":"9","NumSwimmers":"25"},
	{"RaceId":"2025-06-18-vs-sharks-22-p","MeetId":"2025-06-18-vs-sharks","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"34.56","Place":"11","NumSwimmers":"25"},
	{"RaceId":"2025-06-18-vs-sharks-24-c","MeetId":"2025-06-18-vs-sharks","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"50.03","Place":"5","NumSwimmers":"21"},
	{"RaceId":"2025-06-18-vs-sharks-34-c","MeetId":"2025-06-18-vs-sharks","Swimmer":"Coral","EventNumber":"34","AgeGroup":"9-10","Distance":"50","Stroke":"Breaststroke","Time":"1:18.02","Place":"9","NumSwimmers":"14"},
	{"RaceId":"2025-06-18-vs-sharks-42-m","MeetId":"2025-06-18-vs-sharks","Swimmer":"Marlin","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"33.56","Place":"6","NumSwimmers":"28"},
	{"RaceId":"2025-06-18-vs-sharks-42-p","MeetId":"2025-06-18-vs-sharks","Swimmer":"Pip","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"42.31","Place":"19","NumSwimmers":"28"},
	{"RaceId":"2025-06-18-vs-sharks-44-c","MeetId":"2025-06-18-vs-sharks","Swimmer":"Coral","EventNumber":"44","AgeGroup":"9-10","Distance":"50","Stroke":"Backstroke","Time":"59.5","Place":"6","NumSwimmers":"23"},
	{"RaceId":"2025-06-25-vs-stingrays-4-c","MeetId":"2025-06-25-vs-stingrays","Swimmer":"Coral","EventNumber":"4","AgeGroup":"9-10","Distance":"100","Stroke":"IM","Time":"DQ","Place":"DQ","NumSwimmers":"11"},
	{"RaceId":"2025-06-25-vs-stingrays-22-m","MeetId":"2025-06-25-vs-stingrays","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"27.19","Place":"10","NumSwimmers":"33"},
	{"RaceId":"2025-06-25-vs-stingrays-22-p","MeetId":"2025-06-25-vs-stingrays","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"34.58","Place":"22","NumSwimmers":"33"},
	{"RaceId":"2025-06-25-vs-stingrays-24-c","MeetId":"2025-06-25-vs-stingrays","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"52.19","Place":"9","NumSwimmers":"20"},
	{"RaceId":"2025-07-02-vs-dolphins-12-m","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Marlin","EventNumber":"12","AgeGroup":"8 & Under","Distance":"100","Stroke":"Medley Relay","Time":"DQ","Place":"DQ","NumSwimmers":"6"},
	{"RaceId":"2025-07-02-vs-dolphins-22-m","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"30.03","Place":"13","NumSwimmers":"26"},
	{"RaceId":"2025-07-02-vs-dolphins-32-m","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Marlin","EventNumber":"32","AgeGroup":"8 & Under","Distance":"25","Stroke":"Breaststroke","Time":"50.4","Place":"12","NumSwimmers":"17"},
	{"RaceId":"2025-07-02-vs-dolphins-22-p","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"28.5","Place":"10","NumSwimmers":"26"},
	{"RaceId":"2025-07-02-vs-dolphins-32-p","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Pip","EventNumber":"32","AgeGroup":"8 & Under","Distance":"25","Stroke":"Breaststroke","Time":"1:10.28","Place":"14","NumSwimmers":"17"},
	{"RaceId":"2025-07-02-vs-dolphins-14-c","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Coral","EventNumber":"14","AgeGroup":"9-10","Distance":"200","Stroke":"Medley Relay","Time":"4:37.75","Place":"4","NumSwimmers":"6"},
	{"RaceId":"2025-07-02-vs-dolphins-24-c","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"51.15","Place":"6","NumSwimmers":"23"},
	{"RaceId":"2025-07-02-vs-dolphins-54-c","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Coral","EventNumber":"54","AgeGroup":"9-10","Distance":"50","Stroke":"Butterfly","Time":"DQ","Place":"DQ","NumSwimmers":"14"},
	{"RaceId":"2025-07-02-vs-dolphins-64-c","MeetId":"2025-07-02-vs-dolphins","Swimmer":"Coral","EventNumber":"64","AgeGroup":"9-10","Distance":"100","Stroke":"Freestyle","Time":"2:05.08","Place":"10","NumSwimmers":"17"},
	{"RaceId":"2025-07-16-vs-barracudas-2-m","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Marlin","EventNumber":"2","AgeGroup":"8 & Under","Distance":"100","Stroke":"Freestyle Relay","Time":"1:45.22","Place":"4","NumSwimmers":"6"},
	{"RaceId":"2025-07-16-vs-barracudas-2-p","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Pip","EventNumber":"2","AgeGroup":"8 & Under","Distance":"100","Stroke":"Freestyle Relay","Time":"1:55.15","Place":"5","NumSwimmers":"6"},
	{"RaceId":"2025-07-16-vs-barracudas-4-c","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Coral","EventNumber":"4","AgeGroup":"9-10","Distance":"100","Stroke":"IM","Time":"2:09.81","Place":"6","NumSwimmers":"11"},
	{"RaceId":"2025-07-16-vs-barracudas-22-p","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"27.84","Place":"16","NumSwimmers":"34"},
	{"RaceId":"2025-07-16-vs-barracudas-22-m","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"28.13","Place":"17","NumSwimmers":"34"},
	{"RaceId":"2025-07-16-vs-barracudas-24-c","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"52.97","Place":"14","NumSwimmers":"29"},
	{"RaceId":"2025-07-16-vs-barracudas-42-m","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Marlin","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"31.44","Place":"10","NumSwimmers":"27"},
	{"RaceId":"2025-07-16-vs-barracudas-42-p","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Pip","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"34.62","Place":"14","NumSwimmers":"27"},
	{"RaceId":"2025-07-16-vs-barracudas-54-c","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Coral","EventNumber":"54","AgeGroup":"9-10","Distance":"50","Stroke":"Butterfly","Time":"57.93","Place":"5","NumSwimmers":"12"},
	{"RaceId":"2025-07-16-vs-barracudas-74-c","MeetId":"2025-07-16-vs-barracudas","Swimmer":"Coral","EventNumber":"74","AgeGroup":"9-10","Distance":"200","Stroke":"Freestyle Relay","Time":"3:02.15","Place":"1","NumSwimmers":"6"},
	{"RaceId":"2025-07-25-championships-14-c","MeetId":"2025-07-25-championships","Swimmer":"Coral","EventNumber":"14","AgeGroup":"9-10","Distance":"200","Stroke":"Medley Relay","Time":"3:07.85","Place":"9","NumSwimmers":"10"},
	{"RaceId":"2025-07-25-championships-24-c","MeetId":"2025-07-25-championships","Swimmer":"Coral","EventNumber":"24","AgeGroup":"9-10","Distance":"50","Stroke":"Freestyle","Time":"42.85","Place":"62","NumSwimmers":"137"},
	{"RaceId":"2025-07-25-championships-54-c","MeetId":"2025-07-25-championships","Swimmer":"Coral","EventNumber":"54","AgeGroup":"9-10","Distance":"50","Stroke":"Butterfly","Time":"44.38","Place":"16","NumSwimmers":"55"},
	{"RaceId":"2025-07-25-championships-22-m","MeetId":"2025-07-25-championships","Swimmer":"Marlin","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"22.38","Place":"47","NumSwimmers":"156"},
	{"RaceId":"2025-07-25-championships-42-m","MeetId":"2025-07-25-championships","Swimmer":"Marlin","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"27.58","Place":"62","NumSwimmers":"139"},
	{"RaceId":"2025-07-25-championships-52-m","MeetId":"2025-07-25-championships","Swimmer":"Marlin","EventNumber":"52","AgeGroup":"8 & Under","Distance":"25","Stroke":"Butterfly","Time":"DQ","Place":"DQ","NumSwimmers":"49"},
	{"RaceId":"2025-07-25-championships-22-p","MeetId":"2025-07-25-championships","Swimmer":"Pip","EventNumber":"22","AgeGroup":"8 & Under","Distance":"25","Stroke":"Freestyle","Time":"22.81","Place":"55","NumSwimmers":"156"},
	{"RaceId":"2025-07-25-championships-32-p","MeetId":"2025-07-25-championships","Swimmer":"Pip","EventNumber":"32","AgeGroup":"8 & Under","Distance":"25","Stroke":"Breaststroke","Time":"DQ","Place":"DQ","NumSwimmers":"51"},
	{"RaceId":"2025-07-25-championships-42-p","MeetId":"2025-07-25-championships","Swimmer":"Pip","EventNumber":"42","AgeGroup":"8 & Under","Distance":"25","Stroke":"Backstroke","Time":"25.37","Place":"34","NumSwimmers":"139"}
];

export const swimmers = [
	{"Name":"Marlin","Emoji":"🐟"},
	{"Name":"Pip","Emoji":"🐬"},
	{"Name":"Coral","Emoji":"🐠"}
];
