# Google Ads Script: YouTube Channel Excluder
Google Ads script that scans YouTube channels and excludes them based on country of origin or if it is categorised as a music channel.

Have you ever set up a YouTube campaign only to see that it is aired on all kinds of rubish YouTube channels? This script can help you by exluding unwanted channels.

The script will check if the YouTube channel an ad has aired on is from of a list of defined countries. Further it will check if the channel is a music channel and even if that channel is form an alowed country it will be blacklisted. The reason for this beeing that music video clips are oftentimes not the best videos to place ads, since people consume them without actively watching YouTube.

YouTube channels you have explicitly selected in the Google Ads interface for a campaign to be aired will not be blacklisted.

This script is an improvemend of:
https://github.com/RicSti/google-ads-script-youtube-channel-excluder

The number of YouTube API calls have been reduced by improving the Google Ads query returing placements to be checked.
Additionally it checks for the topic type of a channel and excludes the channel if the topic is in one of the music categories.

Please take in to account that this script will also exclude channels that do not have a country of origin set. Oftentimes channels that do not have that information set are of low quality. Check the exlcusion list after the first run to make sure you are not exlucding unwanted channels.

# how to use
Load the script in to the script section of Google Ads. Make sure you enable the YouTube API for the Google Ads script (top right extended APIs).

If you run the script daily you can set the ```impressionsTimeRange``` to ```YESTERDAY```. No need to look back 7 days every day. This will save YouTube API calls.

## Configuration
```js
//url to a google sheet file, whitelisted YouTube Channel IDs will be stored here
var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/XXXX";
var SHEET_NAME = "Placements";
// email address you want the report to be sent to after the script has executed
var EMAIL_ADRESSES = "yourname@email.com"; // comma separated

// The origin country of a YouTube channel you want to whitelist for advertising
var allowedCountries = /^DE|AT|US|GB|CH$/; // Provide RegEx, e.g. /^DE$/ or /^DE|AT|CH$/ ISO 3166-1 alpha-2 https://www.iso.org/obp/ui/#search

// the range of days the script will look back for channel impression data
var impressionsTimeRange = "LAST_7_DAYS"; // valid ranges, see: https://developers.google.com/google-ads/api/docs/query/date-ranges

// the number of minimum ad impressions in a YouTube channel required so that the script will evaluate. 
var impressionsThreshold = 1;
```

