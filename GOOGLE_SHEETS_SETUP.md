# Google Sheets Setup for Sales CRM

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Sales CRM Leads"
4. In the first row (headers), add these columns:
   - A1: `Place ID`
   - B1: `Business Name`
   - C1: `Phone`
   - D1: `Address`
   - E1: `Status`
   - F1: `Business Type`
   - G1: `Notes`
   - H1: `Marked By`
   - I1: `Date`
   - J1: `Reviews`

## Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any code in the editor
3. Paste the following code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Find existing row by Place ID
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === data.placeId) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }
    
    var rowData = [
      data.placeId,
      data.name,
      data.phone,
      data.address,
      data.status,
      data.businessType,
      data.notes,
      data.markedBy,
      new Date(data.date).toLocaleString(),
      data.reviews
    ];
    
    if (rowIndex > 0) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Append new row
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get stats per user
function getStats() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  var stats = {};
  
  for (var i = 1; i < data.length; i++) {
    var markedBy = data[i][7]; // Column H
    var status = data[i][4];   // Column E
    
    if (!stats[markedBy]) {
      stats[markedBy] = { calls: 0, closed: 0, interested: 0, rejected: 0 };
    }
    
    if (status === 'CALLED' || status === 'CALLBACK') stats[markedBy].calls++;
    if (status === 'CLOSED') stats[markedBy].closed++;
    if (status === 'INTERESTED') stats[markedBy].interested++;
    if (status === 'REJECTED') stats[markedBy].rejected++;
  }
  
  return stats;
}
```

4. Click **Save** (Ctrl+S)
5. Name the project "Sales CRM Sync"

## Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set these options:
   - Description: "Sales CRM API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
6. **COPY THE WEB APP URL** - it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## Step 4: Add URL to the App

1. In the Sales CRM app, click the **⚙️ Settings** button
2. Paste the Web App URL
3. Click **Save Settings**

## Done! 🎉

Now whenever you mark a lead with any status (except "New"), it will automatically sync to your Google Sheet!

---

## Viewing Stats

To see who's made more calls/closes, you can:

1. In Google Sheets, go to **Extensions > Apps Script**
2. Run the `getStats()` function to see a breakdown by user
3. Or just add a filter in the sheet and count by "Marked By" column

## Sharing with Your Friend

1. Click **Share** in Google Sheets
2. Add your friend's email
3. Give them **Editor** access
4. They use the same Web App URL in their app settings
