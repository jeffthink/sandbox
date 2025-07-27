# PDF Import Template for Swim Meet Results

Use this template when asking Claude to extract data from swim meet PDFs.

## Template Prompt

Copy and paste this prompt, then attach your PDF or paste the PDF text:

```
I have a swim meet results PDF that I need to extract data from. Please extract the data in CSV format for two tables: Meets and Races.

IMPORTANT INSTRUCTIONS:
1. Use today's date in YYYY-MM-DD format for the MeetId prefix
2. Only extract races for swimmers with the last name Bordogna. The three swimmers are Eva, Quinn, and Maeve. Our team is called City Swordfish, sometimes abbreivated as "CITY".
3. Convert time formats to SS.SS or M:SS.SS (e.g., 35.67 or 1:23.45)
4. Use full stroke names: Freestyle, Backstroke, Breaststroke, Butterfly, IM
5. Generate unique RaceId values using format: YYYY-MM-DD-event#-swimmer-initials

For the MEETS table, provide ONE row with these columns:
MeetId,Date,MeetName,Opponent,Location,PoolSize,PoolUnit,OurPoints,TheirPoints,TeamPlace,NumTeams

For the RACES table, provide rows with these columns:
RaceId,MeetId,Swimmer,EventNumber,AgeGroup,Distance,Stroke,Time,Place,NumSwimmers

Example output format:

MEETS CSV:
2024-06-15-summer-dual,2024-06-15,Summer League Dual Meet,Sharks,Home,25,yards,245,198,1,2

RACES CSV:
2024-06-15-1-jd,2024-06-15-summer-dual,John Doe,1,8 & Under,25,Freestyle,18.45,2,8
2024-06-15-3-jd,2024-06-15-summer-dual,John Doe,3,8 & Under,25,Backstroke,22.13,1,6

For disqualified swims, put 'DQ' in the Time column.

Be sure to include Relays, as long as they have one of the 3 swimmers mentioned above.

You only need to include first names as the swimmer, since we're only tracking our family (Eva, Quinn, Maeve).

After you extract the data, double check to make sure that you didn't miss any races (especially if there are multiple swimmers in one race), and double check that the data you extracted is accurate.

[PASTE YOUR PDF TEXT OR ATTACH PDF HERE]
```

## Step-by-Step Process

1. **Copy the template prompt above**
2. **Replace `[YOUR TEAM NAME]` with your actual team name**
3. **Attach the PDF or paste the meet results text**
4. **Review Claude's output for:**
   - Correct date format (YYYY-MM-DD)
   - Consistent swimmer names
   - Proper time format
   - Matching MeetId between tables
5. **Copy each CSV section separately**
6. **Paste into your Google Sheet** (each in its respective tab)

## Tips for Better Results

1. **Be Specific About Your Team**: If the PDF lists teams as abbreviations (e.g., "WAVE" vs "Waves"), tell Claude exactly how your team appears

2. **Handle Special Cases**: 
   - Exhibition swims: Decide if you want to track these
   - Time trials: May not have place/opponent data
   - Split times: Usually only want final times

3. **Verify Key Data**:
   - Total points should match the meet summary
   - Number of events should be reasonable
   - Check a few times against the original PDF

4. **Common PDF Issues**:
   - If columns are misaligned, paste as plain text first
   - If swimmer names are cut off, provide the full roster
   - If times include reaction times, specify you want swim time only

## Example Meet Types

### Dual Meet
- One opponent
- Points typically shown
- Usually 2 teams total

### Invitational/Championship
- Multiple teams
- May need to extract only your team vs "Field"
- TeamPlace and NumTeams become important

### Time Trials
- No opponent (use "Time Trial" or "N/A")
- No points (use 0 for both)
- Focus on times only

## Quick Checklist

Before importing:
- [ ] MeetId is unique and includes date
- [ ] Date is in YYYY-MM-DD format
- [ ] Swimmer names are consistent with previous meets
- [ ] Times are in correct format (SS.SS or M:SS.SS)
- [ ] Stroke names are spelled out fully
- [ ] Age groups match your team's divisions