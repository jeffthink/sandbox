# Swim Tracker Admin Guide

This guide explains how to set up and manage the swim tracker data using Google Sheets.

## Google Sheets Setup

### 1. Create Your Google Sheet

Create a new Google Sheet with two tabs:

#### Meets Tab
Create columns with these exact headers (case-sensitive):
- **MeetId** - Unique identifier for the meet (e.g., "2024-06-15-summer-league")
- **Date** - Date of the meet (format: YYYY-MM-DD)
- **MeetName** - Name of the meet (e.g., "Summer League Week 1")
- **Opponent** - Opposing team name
- **Location** - "home" or "away"
- **PoolSize** - Pool length (e.g., 25, 50)
- **PoolUnit** - "meters" or "yards"
- **OurPoints** - Our team's total points
- **TheirPoints** - Opponent's total points
- **TeamPlace** - Our placement if multiple teams (optional)
- **NumTeams** - Total number of teams in meet (optional)

#### Races Tab
Create columns with these exact headers (case-sensitive):
- **RaceId** - Unique identifier for the race
- **MeetId** - Must match a MeetId from the Meets tab
- **Swimmer** - Swimmer's name
- **EventNumber** - Event number in the meet program
- **AgeGroup** - Age group (e.g., "8 & Under", "9-10")
- **Distance** - Distance swum (e.g., 25, 50, 100)
- **Stroke** - Stroke type (e.g., "Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM")
- **Time** - Time in seconds (format: SS.SS or MM:SS.SS)
- **Place** - Finishing place
- **NumSwimmers** - Total swimmers in the heat/event

### 2. Publish Your Sheets as CSV

For each tab (Meets and Races), do the following:

1. In your Google Sheet, go to **File → Share → Publish to web**
2. In the dropdown, select the specific sheet tab (e.g., "Meets" or "Races")
3. In the format dropdown, select **Comma-separated values (.csv)**
4. Click **Publish**
5. Copy the generated URL - it will look like:
   ```
   https://docs.google.com/spreadsheets/d/e/LONG_ID_HERE/pub?gid=0&single=true&output=csv
   ```
6. Repeat for the other tab (note: each tab will have a different `gid` number)

### 3. Configure the Application

Update the following in `/src/routes/swim-tracker/+page.svelte`:

```javascript
// Replace these with your published CSV URLs
const MEETS_CSV_URL = 'YOUR_MEETS_CSV_URL_HERE';
const RACES_CSV_URL = 'YOUR_RACES_CSV_URL_HERE';
```

## Data Entry Guidelines

### Manual Data Entry

1. **Meet Data**: Enter meet information first, as races reference meets by MeetId
2. **Race Data**: Enter individual race results, ensuring MeetId matches an existing meet
3. **Time Format**: 
   - Under 1 minute: Enter as SS.SS (e.g., 35.67)
   - Over 1 minute: Enter as M:SS.SS (e.g., 1:23.45)

### Extracting Data from PDFs

When you have meet results in PDF format, you can use Claude to help extract the data:

#### Example Prompt for Claude:

```
I have a swim meet results PDF. Please extract the data in this format:

For the Meets tab:
MeetId, Date, MeetName, Opponent, Location, PoolSize, PoolUnit, OurPoints, TheirPoints, TeamPlace, NumTeams

For the Races tab:
RaceId, MeetId, Swimmer, EventNumber, AgeGroup, Distance, Stroke, Time, Place, NumSwimmers

Here's the PDF content: [paste PDF text or upload PDF]

Focus on swimmers from [Your Team Name]. Use "2024-06-15-meet-name" format for MeetId.
```

#### Tips for PDF Extraction:

1. **Consistent Naming**: Use a consistent format for MeetId (e.g., "YYYY-MM-DD-short-name")
2. **Swimmer Names**: Keep swimmer names consistent across meets
3. **Stroke Abbreviations**: Convert to full names:
   - Free → Freestyle
   - Back → Backstroke
   - Breast → Breaststroke
   - Fly → Butterfly
4. **Check Times**: Verify time formats are correct (SS.SS or M:SS.SS)

## Common Issues

### Data Not Loading
- Check that CSV URLs are correctly set
- Verify the sheets are published to web
- Check browser console for error messages
- Note: Changes to the sheet require re-publishing to update the CSV

### Missing Data
- Ensure column headers match exactly (case-sensitive)
- Verify MeetId values match between sheets
- Check that dates are in YYYY-MM-DD format

### Time Calculations
- Times must be in SS.SS or M:SS.SS format
- Invalid times will be ignored in calculations
- Personal records are calculated per swimmer per event

### Publishing Updates
- After making changes to your Google Sheet, you may need to:
  1. Go back to File → Share → Publish to web
  2. Click "Republish" or update settings
  3. Wait a few minutes for changes to propagate

## Maintenance

### Regular Tasks
1. Add new meet data after each swim meet
2. Verify data accuracy, especially times and places
3. Keep swimmer names consistent

### Backing Up Data
1. Use Google Sheets version history for recovery
2. Periodically download the sheet as CSV/Excel
3. Consider creating seasonal archives

## Advanced Features

### Filtering and Sorting
- The races table supports filtering by swimmer, stroke, event, and meet
- Click column headers to sort
- Use the search box for quick filtering

### Visualizations
- **Time Progress**: Shows improvement over time for each event
- **Meet Performance**: Displays team points and win/loss record

### Personal Records
- PRs are automatically calculated and marked with a gold badge
- Improvement percentages show progress from previous races

## Future Enhancements: When to Use Google Sheets API

The current implementation uses published CSV URLs for simplicity. Consider upgrading to the Google Sheets API approach when you need:

### 1. **Write Capabilities**
- Direct data entry from the web interface
- Automatic import from meet result files
- Batch updates or corrections

### 2. **Real-time Updates**
- Instant reflection of sheet changes (no republishing needed)
- Multiple users updating simultaneously
- Live updates during meets

### 3. **Advanced Features**
- Query specific date ranges or swimmers
- Fetch only updated data
- Work with formulas and calculated cells
- Access to multiple spreadsheets

### 4. **Scale and Performance**
- Large datasets (1000+ races)
- Reduced bandwidth (fetch only what's needed)
- Better caching strategies

### 5. **Security**
- Restrict access to specific users
- Track who's accessing the data
- Hide sensitive information

### How to Upgrade to API
1. Follow the original API setup instructions
2. Switch from `fetchSheetCSV` to `fetchSheetData` 
3. Update configuration with API key and sheet ID
4. Remove CSV publishing (data stays private)

For now, the CSV approach works great for:
- Read-only access
- Small to medium datasets
- Simple setup and maintenance
- Public team data sharing