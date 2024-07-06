# google-ads-youtube-channel-excluder
Google Ads script that scans YouTube channels and excludes them based on country of origin or if it is categorised as a music channel.

Have you ever set up a YouTube campaign only to see that it is aired on all kinds of rubish YouTube channels? This script can help you by exluding unwanted channels.

The script will check if the YouTube channel an ad has aired on is from of a list of defined countries. Further it will check if the channel is a music channel and even if that channel is form an alowed country it will be blacklisted. The reason for this beeing that music video clips are oftentimes not the best videos to place ads, since people consume them without actively watching YouTube.

YouTube channels you have explicitly selected in the Google Ads interface for a campaign to be aired will not be blacklisted.

This script is an improvemend of:
https://github.com/RicSti/google-ads-script-youtube-channel-excluder

This script has been improved to reduce the number of YouTube API calls.
Additionally it checks for the topic type of a channel and excludes it if the YouTube channel is about music.

# how to use
Load the script in to the script section of Google Ads. Make sure you enable the YouTube API for the Google Ads script (top right extended APIs).

If you run the script daily you can set the impressionsTimeRange to YESTERDAY. No need to look back 7 days every day. This will save YouTube API calls.

## Configuration
```js
//url to a google sheet file, whitelisted YouTube Channel IDs will be stored here
var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/XXXX";
var SHEET_NAME = "Placements";
// email address you want the report to be sent to after the script has executed
var EMAIL_ADRESSES = "yourname@email.com"; // comma separated

// The origin country of a YouTube channel you want to whitelist for advertising
var allowedCountries = /^DE|AT|US|GB|CH$/; // Provide RegEx, e.g. /^DE$/ or /^DE|AT|CH$/

// the range of days the script will look back for channel impression data
var impressionsTimeRange = "LAST_7_DAYS";

// the number of minimum ad impressions in a YouTube channel required so that the script will evaluate. 
var impressionsThreshold = 1;
```

