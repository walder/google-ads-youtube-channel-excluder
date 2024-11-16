var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/xxxx";
var SHEET_NAME = "Placements";
var EMAIL_ADRESSES = "yourmail@domain.com"; // comma separated
var allowedCountries = /^DE|AT|US|GB|CH$/; // Provide RegEx, e.g. /^DE$/ or /^DE|AT|CH$/ // ISO 3166-1 alpha-2  https://www.iso.org/obp/ui/#search
var impressionsTimeRange = "LAST_7_DAYS"; // valid ranges, see: https://developers.google.com/google-ads/api/docs/query/date-ranges
var impressionsThreshold = 1;
var MUSIC_TOPIC_CATEGORIES = [
"/m/04rlf", "/m/05fw6t", "/m/02mscn", "/m/0ggq0m", "/m/01lyv", "/m/02lkt", "/m/0glt670", "/m/05rwpb", "/m/03_d0", "/m/028sqc", "/m/0g293", "/m/064t9",
  "/m/06cqb", "/m/06j6l", "/m/06by7", "/m/0gywn"
];

function main() {
  // Prepare an array for logging purposes
  var allExclusions = [];
  // Fetch all active video campaigns and start iterating
  var videoCampaignIterator = AdsApp.videoCampaigns().withCondition("Status = 'ENABLED'").get();
  while (videoCampaignIterator.hasNext()) {
    var alreadyExcludedYouTubeChannels = [];
    var includedYouTubeChannelsFromGoogleAdsInterface = [];
    var videoCampaign = videoCampaignIterator.next();
   
    // Fetch all already excluded YouTube Channels from the processed campaign and store them in an array
    var exludedYoutubeChannelIterator = videoCampaign.videoTargeting().excludedYouTubeChannels().get();
    while (exludedYoutubeChannelIterator.hasNext()) {
      var excludedYouTubeChannel = exludedYoutubeChannelIterator.next();
      try{
         alreadyExcludedYouTubeChannels.push(excludedYouTubeChannel.getChannelId());
      }
      catch(err){
        console.log("fetching next exclude channel failed "+err.message);      
      }
    }
    
    //Fetch YouTube Channels that have been included to the campaign, these channels will not be blacklisted even if they do not meet inclusion critera (Musc Channel, Country)
    var selectedYouTubeChannels = videoCampaign.videoTargeting().youTubeChannels().get();
    while (selectedYouTubeChannels.hasNext()) {
      var selectedYouTubeChannel = selectedYouTubeChannels.next();
      includedYouTubeChannelsFromGoogleAdsInterface.push(selectedYouTubeChannel.getChannelId());
    }
    
    
    // Build a batch with to be excluded YouTube channels
    const toBeExcludedYouTubeChannels = checkYouTubeChannels(videoCampaign.getId(),alreadyExcludedYouTubeChannels, includedYouTubeChannelsFromGoogleAdsInterface);
    // Exclude all YouTube channels in batch from campaign
    for (i=0;i<toBeExcludedYouTubeChannels.length;i++){
      videoCampaign.videoTargeting().newYouTubeChannelBuilder().withChannelId(toBeExcludedYouTubeChannels[i].id).exclude();
    }
    // Add logging information to log array
    allExclusions.push({ campaign: videoCampaign.getName(), excludedYouTubeChannels: toBeExcludedYouTubeChannels });
  }
  // Prepare and send a notification email with logging information
  sendConfirmationEmail(allExclusions);
}

function buildLikeQueryExtension(channelIDs){
  var channels = "";
  for (var i = 0; i < channelIDs.length; i++){
    if(channelIDs[i].length > 0){
      channels += " AND detail_placement_view.group_placement_target_url NOT LIKE '%"+channelIDs[i]+"%' ";
    }
  }
  return channels;
}

function checkYouTubeChannels(campaignId, alreadyExcludedYouTubeChannels, includedYouTubeChannelsFromGoogleAdsInterface){
  // Prepare an array for the return values  
  var toBeExcludedYouTubeChannels = [];
  // Load currently known allowed YouTube Channels from Google Sheet
  var knownAllowedYouTubeChannels = getAllowedYouTubeChannels();
  // Prepare an array for newly identified allowed YouTube Channels to be added to the Google Sheet
  var newAllowedYouTubeChannels = [];
  // Query all YouTube placements of the processed campaign with at least ${impressionsThreshold} impressions within the ${impressionsTimeRange}
  
  var query = 
    "SELECT detail_placement_view.group_placement_target_url FROM detail_placement_view " +
    "WHERE " +
    "  campaign.id = " + campaignId +
    "  AND segments.date DURING " + impressionsTimeRange +
    "  AND metrics.impressions > " + impressionsThreshold + 
    "  AND detail_placement_view.placement_type IN ('YOUTUBE_VIDEO','YOUTUBE_CHANNEL') " +
    "  AND detail_placement_view.group_placement_target_url IS NOT NULL " +
    buildLikeQueryExtension(alreadyExcludedYouTubeChannels) + buildLikeQueryExtension(includedYouTubeChannelsFromGoogleAdsInterface) + buildLikeQueryExtension(knownAllowedYouTubeChannels)
    "";
  var result = AdsApp.search(query);
  //console.log(query);
  
  var channels = new Set();
  
  while (result.hasNext()) {
    var row = result.next();
   // console.log(row['detailPlacementView']['groupPlacementTargetUrl']);
    var channelID = row['detailPlacementView']['groupPlacementTargetUrl'].match(/^.*\/([^\/]*)$/)[1];
   // console.log(channelID);
    channels.add(channelID);
  }
  console.log(channels.size+ " unique YouTube placements found");
   
  //test data 1 entry invalid channel that has been included in google Ads Interface:
  //channels = new Set(['UC3XTzVzaHQEd30rQbuvCtTQ'])

  
   //should fail but does not (lands on include list, but channel is excluded
  //channels = new Set(['UC6yedsm3A27kECzyNQiyvDA'])
 
  
  //channel with empty topic Ids
  //channels = new Set(['UCS3EcW5FS_p0MzapOPcNooA'])
  
   //unique ids of channels are iterated here
   for (const channelID of channels) {
     const channelInfo = getChannelInfo(channelID);
     var title = channelInfo.title;
     var topicIDs = channelInfo.topicIDs;
     var country = channelInfo.country;
     var language = channelInfo.language;
     var isMusicChannel = arrayContainsElementOf(MUSIC_TOPIC_CATEGORIES, topicIDs);
     /*
        console.log("channel is Music: "+arrayContainsElementOf(MUSIC_TOPIC_CATEGORIES, topicIDs))
        console.log("channel is in valid country: "+country.match(allowedCountries))
        console.log("channel is in known allowed Channels: "+(knownAllowedYouTubeChannels.indexOf(channelID) == -1))
        console.log("channel is included in google Ads: "+(includedYouTubeChannelsFromGoogleAdsInterface.indexOf(channelID) != -1))
    */  
     if (!isMusicChannel && country.match(allowedCountries)){
       // Store channel id of newly identified YouTube Channel in array to be added to Google Sheet
       newAllowedYouTubeChannels.push(channelID);
     }
     else {
       toBeExcludedYouTubeChannels.push(
         {
           id: channelID,
           name: title,
           country: country,
           language: language,
           isMusicChannel: isMusicChannel 
         }
       );
     }
      }
    if (newAllowedYouTubeChannels.length > 0){
      console.log(newAllowedYouTubeChannels.length + " new allowed Channel(s) found." + "\n\n");
      saveAllowedYouTubeChannels(newAllowedYouTubeChannels);
    }
  return toBeExcludedYouTubeChannels.sort();
}

function arrayContainsElementOf(masterArray, searchArray){
  for ( let i = 0; i < searchArray.length; i++){
      var searchElement = searchArray[i];
      for ( let j = 0; j < masterArray.length; j++){
        var masterElement = masterArray[j];
        if( masterElement == searchElement ){
          return true;
        }
      }
  }
  return false;
}

function getChannelInfo(channelId){
  var channelInformation = {};
  channelInformation.country = "";
  channelInformation.defaultLanguage = "";
  channelInformation.topicIDs = "";
  channelInformation.title = "";
  try {
    const results = YouTube.Channels.list('snippet,localizations, topicDetails', {
      id: channelId,
      maxResults: 1
    });
    if (results === null) {
      console.log(`ID ${channelId}: Unable to search videos`);
      return;
    }
    var topicIDs = [];
    var title = "";
    var country = "";
    var defaultLanguage = "";
    
    if(results.items[0].hasOwnProperty('topicDetails')) {
      if(results.items[0].topicDetails.hasOwnProperty('topicIds')) {
          var topicDetails = results.items[0].topicDetails.topicIds;
          for (var i = 0; i < topicDetails.length; i++){
            topicIDs.push(topicDetails[i]);
          }
      }
    }
    
    if(results.items[0].snippet.hasOwnProperty('title')){
      title = results.items[0].snippet.title;
    }
    
    if(results.items[0].snippet.hasOwnProperty('country')){
      country = results.items[0].snippet.country;
    }
    
    if(results.items[0].snippet.hasOwnProperty('defaultLanguage')){
      defaultLanguage = results.items[0].snippet.defaultLanguage;
    }
    channelInformation.country = country;
    channelInformation.defaultLanguage = defaultLanguage;
    channelInformation.topicIDs = topicIDs;
    channelInformation.title = title;
  } catch (err) {
    // TODO (developer) - Handle exceptions from Youtube API
    console.log(`ID ${channelId}: Failed with an error: %s`, err.message);
  } 
  return channelInformation;
}

function getAllowedYouTubeChannels(){
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  if(lastRow < 1) {
    lastRow = 1;
  }
  var range = sheet.getRange(1, 1, lastRow);
  var returnValues = [];
  var values = range.getValues();
  for (var row in values) {
    for (var col in values[row]) {
      returnValues.push(values[row][col]);
    }
  }
  return returnValues;
}

function saveAllowedYouTubeChannels(newAllowedYouTubeChannels){
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange(lastRow+1,1,newAllowedYouTubeChannels.length);
  var outputValues = [];
  while(newAllowedYouTubeChannels.length) outputValues.push(newAllowedYouTubeChannels.splice(0,1));
  range.setValues(outputValues);
  sheet.sort(1);
}

function sendConfirmationEmail(allExclusions){
  var output = "";
  for (i=0;i<allExclusions.length;i++){
    output += allExclusions[i].excludedYouTubeChannels.length.toLocaleString("de") + " Channel(s) excluded from Campaign " + allExclusions[i].campaign + "\n\n";
    var outputChannels = "";
    for (j=0;j<allExclusions[i].excludedYouTubeChannels.length;j++){
        outputChannels += allExclusions[i].excludedYouTubeChannels[j].name + " (Country: " + allExclusions[i].excludedYouTubeChannels[j].country + " | Language: " + allExclusions[i].excludedYouTubeChannels[j].language + " | Is Music Channel: " + allExclusions[i].excludedYouTubeChannels[j].isMusicChannel + ")\n";
        outputChannels += "https://youtube.com/channel/" + allExclusions[i].excludedYouTubeChannels[j].id + "\n\n";
    }
    output += outputChannels;
  }  
  var eMailAddress = EMAIL_ADRESSES;
  var eMailSubject = "YouTube Channel Excluder";
  var eMailContent = output;
  console.log(output);
  sendSimpleTextEmail(eMailAddress,eMailSubject,eMailContent);
}

// HELPERS

function sendSimpleTextEmail(eMailAddress,eMailSubject,eMailContent) {
  MailApp.sendEmail(eMailAddress,eMailSubject,eMailContent);
  Logger.log("Mail sent.");
}