// Add Leaflet map layer centered and zoomed in on Stockholm
let map = L.map('leaflet').setView([59.3, 18.075], 13);

// Add Leaflet tile layer from Mapbox
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    accessToken: 'pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ',
    tileSize: 512,
    zoomOffset: -1,
}).addTo(map);

// Load in GeoJSON nodes from file
let nodeLayer = L.geoJSON().addTo(map);
fetch('nodes.geojson')
    .then(response => response.json())
    .then(data => nodeLayer.addData(data));

fetch('nodes.geojson')
    .then(response => response.json())
    .then(async function name(data) {
        var isoArray = [];
        for (const [key, value] of Object.entries(data.features)) {
            isoArray.push(await retrieveIsochrone(value));
        }
        console.log(isoArray);
    })
    
let subwayNodes;
fetch('subway.geojson')
    .then(response => response.json())
    .then(data => { subwayNodes = data; });

let dataLayer = L.geoJSON().addTo(map);

// Definitions
let retrieveIsochrone = function (node) {
    return fetch(`https://api.mapbox.com/isochrone/v1/mapbox/walking/${formatCoords([node])}?contours_meters=250,500,750&generalize=0&polygons=true&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
        .then(response => response.json())
        .then(data => {
            map.removeLayer(dataLayer);
            dataLayer = L.geoJSON(data).addTo(map);
            return data;
        })
}

let sortClosest = function (nodes) {
    const closest = (nodes.distances[0]).slice(1);
    const i = closest.findIndex((n) => { return n == Math.min(...closest) });
    return [nodes.destinations[1+i].location[0], nodes.destinations[1+i].location[1]];
}

let retrieveNearestStation = async function (node, points) {
    if (points.features.length == 1) {
        return [points.features[0].geometry.coordinates[0], points.features[0].geometry.coordinates[1]];
    }
    else if (points.features.length > 1) {
        return fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${formatCoords([node, points])}?sources=0&destinations=all&annotations=distance&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
            .then(response => response.json())
            .then(data => sortClosest(data))
    }
}

let retrieveDirections = async function (node, station) {
    return fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${formatCoords([node, station])}?geometries=geojson&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
        .then(response => response.json())
        .then(path => {
            L.geoJSON(path.routes[0].geometry).addTo(map);
            Promise.resolve(path);
        })
}

let formatCoords = function (nodeObject) {
    let tempCoords = "";
    nodeObject.forEach(obj => { tempCoords += `${turf.getCoord(obj)[0]},${turf.getCoord(obj)[1]};` })
    return tempCoords.slice(0, -1);
}

// Function to populate list of schools
// document.getElementById("programs").innerHTML = "";
// for (const [key, value] of Object.entries(node.properties)) {
//     if (value == "J") {
//         let listElement = document.createElement("li");
//         listElement.innerHTML = program[key];
//         document.getElementById("programs").appendChild(listElement);
//     }
// }



// Dictionary of program name and corresponding program code for national programs
const program = {
    BF: "Barn- och fritidsprogrammet",
    BA: "Bygg- och anläggningsprogrammet",
    EK: "Ekonomiprogrammet",
    EE: "El- och energiprogrammet",
    ES: "Estetiska programmet",
    FT: "Fordons- och transportprogrammet",
    HA: "Handels- och administrationsprogrammet",
    HT: "Hotell- och turismprogrammet",
    HU: "Humanistiska programmet",
    HV: "Hantverksprogrammet",
    IN: "Industritekniska programmet",
    NA: "Naturvetenskapsprogrammet",
    NB: "Naturbruksprogrammet",
    RL: "Restaurang- och livsmedelsprogrammet",
    SA: "Samhällsvetenskapsprogrammet",
    TE: "Teknikprogrammet",
    VF: "VVS- och fastighetsprogrammet",
    VO: "Vård- och omsorgsprogrammet"
}

// Add listener to nodes
nodeLayer.on("click", (event) => {
    let node = event.layer.feature;
    console.log(node);

    // Show basic school information
    document.getElementById("school").innerHTML = node.properties.name;
    document.getElementById("link").innerHTML = "Hemsida";
    document.getElementById("link").href = node.properties.url;
    document.getElementById("form").innerHTML = node.properties.form;

    // Show available programs
    document.getElementById("programs").innerHTML = "";
    for (const [key, value] of Object.entries(node.properties)) {
        if (value == "J") {
            let listElement = document.createElement("li");
            listElement.innerHTML = program[key];
            document.getElementById("programs").appendChild(listElement);
        }
    }

    // Retrieve, draw, and pass on distance isochrone for given school
    retrieveIsochrone(node)
        // Pass on stations within isochrone
        .then(isochrone => turf.pointsWithinPolygon(subwayNodes, isochrone.features[0]))
        // Retrieve and pass on closest station within isochrone
        .then(points => retrieveNearestStation(node, points))
        // Retrieve and draw directions to nearest station
        .then(nearestStation => retrieveDirections(node, nearestStation))
});