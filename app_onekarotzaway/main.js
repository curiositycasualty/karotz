include("util.js");

if (typeof(instanceName)=='undefined') {
    log("Running locally.");
    include("params.js");
    var karotz_ip="192.168.0.109";
} else {
    log("Running remotely.");
    var karotz_ip="localhost";
}

var locale = "en";

//var locale = params[instanceName].locale;
var stopId = params[instanceName].stopId;
var minutesAfter = params[instanceName].minutesAfter;

var stopSentence = function(stopId, minutesBefore, minutesAfter) {
    var undefined;
    if (minutesBefore === undefined) minutesBefore = 0;
    if (minutesAfter === undefined) minutesAfter = 35;
    if (stopId === undefined) stopId = '1_2970';

    var apiKey = "9d2c7cac-4ce1-4e71-a920-d85b5e1f4d0d";

    var url = "http://api.onebusaway.org/api/where/arrivals-and-departures-for-stop/" + stopId + ".json?key=" + apiKey + "&minutesBefore=" + minutesBefore + "&minutesAfter=" + minutesAfter;
    var dataRaw = http.get(url);
    //log(dataRaw);
    if (dataRaw != "" || dataRaw != NaN || dataRaw != undefined) {
        //log("Got the feed, parsing it!");
        var json = JSON.parse(dataRaw);
        if (json.code != '200') {
            karotz.tts.start("Proper feed didn't come through.", locale, exitFunction);
        };
    } else {
        karotz.tts.start("Could not connect to One Bus Away. Sorry.", locale, exitFunction);
    };
    message = "";

    // Count the number of routes for a stop
    var routeCount  = 0;
    for (i in json.data['stop']['routes']) {
        routeCount++;
    };
    //log("Routes: " + routeCount);

    // Count the number of arrivals for a stop
    var arrivalCount  = 0;
    for (i in json.data['arrivalsAndDepartures']) {
        arrivalCount++;
    };


    message += "The " + json.data['stop']['routes'][0]['shortName'] + " will arrive in ";


    // Retreive Unix Epoch time 
    var d = new Date();
    var now = d.getTime();

    for (i in json.data['arrivalsAndDepartures']) {
        //log("routeid = " + json.data['arrivalsAndDepartures'][i]['predictedArrivalTime']['routeId']);

        // convert arrival times to human-readable minutes
        if (json.data['arrivalsAndDepartures'][i]['predictedArrivalTime'] != 0) {
            // Use predicted time uless the bus is on time
            var nextBusTime = Math.floor(((json.data['arrivalsAndDepartures'][i]['predictedArrivalTime'] - now) /1000)/60);
        } else {
            var nextBusTime = Math.floor(((json.data['arrivalsAndDepartures'][i]['scheduledArrivalTime'] - now) /1000)/60);
        };

        //log(i + "\t" + nextBusTime + "\t" + json.data['arrivalsAndDepartures'][i]['routeId']);

        // Parse into a coherent sentence for tts
        if (arrivalCount == 1 || i == 0) {
            message += nextBusTime;
        } else if (arrivalCount == 2 && i == 1) {
            message += " and " + nextBusTime;
        } else if (arrivalCount >= 3 && i < (arrivalCount - 1)) {
            message += ", " + nextBusTime;
        } else if (i == (arrivalCount - 1)) {
            message += " and " + nextBusTime;
        };
    };
    message += " minutes. ";

    message = message.replace(/\s0/g, " now")

    // Parse stop name to make it more readable
    var stopName = " " + json.data['stop']['name'] + " ";

    // Clean up abbreviations
    stopName = stopName.replace(/\sST\s/g, ' Street ');
    stopName = stopName.replace(/\sAVE\s/g, ' Avenue ');
    stopName = stopName.replace(/\sBLVD\s/g, ' Boulevard ');
    stopName = stopName.replace(/\sDR\s/g, ' Drive ');

    stopName = stopName.replace(/\sJR\s/g, ' junior ');

    // Clean up compass directions
    stopName = stopName.replace(/\sN\s/g, ' North ');
    stopName = stopName.replace(/\sNE\s/g, ' Northeast ');
    stopName = stopName.replace(/\sNW\s/g, ' Northwest ');
    stopName = stopName.replace(/\sE\s/g, ' East ');
    stopName = stopName.replace(/\sS\s/g, ' South ');
    stopName = stopName.replace(/\sSE\s/g, ' Southeast ');
    stopName = stopName.replace(/\sSW\s/g, ' Southwest ');
    stopName = stopName.replace(/\sW\s/g, ' West ');

    stopName = stopName.replace(/^\s+|\s+$/g, "");

    //log(json.data['stop']['routes'][r]['shortName']);
    
    return message
}

var exitFunction = function(event) {
    if ((event == "CANCELLED") || (event == "TERMINATED")) {
        exit();
    }
    return true;
}

var buttonListener = function(event) {
    //log("buttonListener calledback");
    if (event == "DOUBLE") {
        karotz.tts.stop();
        exit();
    }
    return true;
}

var onKarotzConnect = function(data) {
    karotz.button.addListener(buttonListener);
}

var speak = function(event) {
    log("sId: " + sId + "/" + sCount);
    if ((event == "CANCELLED") || (event == "TERMINATED")) {
        if ((sCount) != sId) {
            log("More to say.");
            karotz.tts.start(stopSentence(), locale, speak);
            sId++;
        } else if (sId >= sCount) {
            log("No more to say!");
            exit();
        }
    } 
    return true;
}

karotz.connectAndStart(karotz_ip, 9123, onKarotzConnect, {});