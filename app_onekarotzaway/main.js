karotz.led.light(FFFF00)

var karotz_ip="localhost";
//var karotz_ip="192.168.1.4"

var stopId = params[instanceName].stopId;

var url = "http://api.onebusaway.org/api/where/arrivals-and-departures-for-stop/" + stopId + ".json?key=9d2c7cac-4ce1-4e71-a920-d85b5e1f4d0d&minutesBefore=0";
// stopId 1_2970
var json = http.get(url);
var jsonData = eval(json);

/* The #2 (['arrivalsAndDepartures'][1]['routeShortName'])
 bus will arrive at 27th & Union (['stop']['name'])
  in x, y & z minutes */

/* The 2 will be arriving in 5, 10 and 15 minutes. The 48 will be arriving in 12.*/

var c = 0;
message = "";
var routeCount = Object.keys(json.data['stop']['routes']).length;
if (routeCount == 1) { // if there is only 1 bus serving stop
    message += "The " + json.data['stop']['routes'][0]['description'] + " will arrive in ";
    var arrivalCount = Object.keys(json.data['arrivalsAndDepartures']).length;
    var d = new Date();
    var now = d.getTime();
    for (i in json.data['arrivalsAndDepartures']) {
        // convert to human-readable minutes
        var nextBusTime = Math.round(((json.data['arrivalsAndDepartures'][i]['predictedArrivalTime'] - now) /1000)/60);

        // add to message string for tts functions
        if (i == 0)
            message += nextBusTime
        else if (i >= 1 && i != (arrivalCount-1))
            message += ", " + nextBusTime;
        else
            message += " and " + nextBusTime + " minutes.";
    };
    message += " At " + json.data['stop']['name'] + ".";
};

/*
1332448849000 is 1:40 pm
1332452955089 is 2:50 pm
*/

/* Clean up abbreviations
message = message.replace(/St\.?/g, 'Street');
message = message.replace(/Ave\.?/g, 'Avenue');
message = message.replace(/Blvd\.?/g, 'Boulevard');
message = message.replace(/Dr\.?/g, 'Drive'); */

var exitFunction = function(event) {
    if((event == "CANCELLED") || (event == "TERMINATED")) {
        exit();
    }
    return true;
}

var onKarotzConnect = function(data) {
    karotz.tts.start(message, "en", exitFunction);
}

karotz.connectAndStart(karotz_ip, 9123, onKarotzConnect, {});
