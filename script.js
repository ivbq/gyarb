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

let subwayNodes;
fetch('subway.geojson')
    .then(response => response.json())
    .then(data => { subwayNodes = data; });

let isoLayer = L.geoJSON().addTo(map);
let dirLayer = L.geoJSON().addTo(map);

// Definitions
function retrieveIsochrone(node) {
    return fetch(`https://api.mapbox.com/isochrone/v1/mapbox/walking/${formatCoords([node])}?contours_meters=250,500,750&generalize=0&polygons=true&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
        .then(response => response.json())
        .then(data => {
            map.removeLayer(isoLayer);
            isoLayer = L.geoJSON(data).addTo(map);
            return data;
        });
}

function sortClosest(nodes) {
    var combined = (nodes.destinations).map((obj, index) => [obj, nodes.distances[0][index]]);
    return combined[1];
}

async function retrieveNearestStation(node, points) {
    if (points.features.length == 1) {
        return node;
    }
    else if (points.features.length > 1) {
        return fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${formatCoords([node, points])}?sources=0&destinations=all&annotations=distance&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
            .then(response => response.json())
            .then(data => sortClosest(data));
    }
}

async function retrieveDirections(node, station) {
    station = station[0];
    const coords = formatCoords([node, station]);
    if (coords.length == 0)
        return null;
    return fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${formatCoords([node, station])}?geometries=geojson&access_token=pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ`)
        .then(response => response.json())
        .then(path => {
            map.removeLayer(dirLayer);
            dirLayer = L.geoJSON(path.routes[0].geometry).addTo(map);
            return path;
        });
}

function formatCoords(nodeList) {
    let coords = "";
    for (const node of nodeList) {
        if (node.hasOwnProperty('location'))
            coords += `${node.location[0]},${node.location[1]}`;
        else if (node.hasOwnProperty('features'))
            for (const innerNode of node.features) {
                coords += `${turf.getCoord(innerNode)[0]},${turf.getCoord(innerNode)[1]};`;
            }
        else
            coords += `${turf.getCoord(node)[0]},${turf.getCoord(node)[1]};`;
    }
    return coords.slice(0, -1);
}

async function findPossibleStations(node) {
    const circle = turf.ellipse(node, 5, 5);
    const stations = turf.pointsWithinPolygon(subwayNodes, circle);
    stations.features.sort((x, y) => turf.distance(x, node) - turf.distance(y, node));
    if (stations.features.length > 9)
        stations.features = stations.features.slice(0, 9);
    return stations;
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

    retrieveIsochrone(node)
    findPossibleStations(node)
        .then(points => retrieveNearestStation(node, points))
        .then(nearestStation => retrieveDirections(node, nearestStation))
});