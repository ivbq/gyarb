let map = L.map('leaflet').setView([59.3, 18.075], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    accessToken: 'pk.eyJ1IjoiaXZicSIsImEiOiJja3NwYmdtMXEwMXM2MzJ0aDF1YmVmMm42In0.atndUe-xK2oqzM8E8ZKDDQ',
    tileSize: 512,
    zoomOffset: -1,
}).addTo(map);

let nodeLayer = L.geoJSON().addTo(map);
let isoLayer = L.geoJSON().addTo(map);
let dirLayer = L.geoJSON().addTo(map);

var geometry, nodes, isochrones, directions;
fetch('geometry.geojson')
    .then(response => response.json())
    .then(data => {
        nodes = data.map(tuple => tuple.node);
        isochrones = data.map(tuple => tuple.isochrone);
        directions = data.map(tuple => tuple.directions);
        nodeLayer.addData(nodes);
    })

function getIsochrone(node) {
    const index = nodes.indexOf(node);
    const isochrone = isochrones[index];
    isoLayer.clearLayers();
    isoLayer.addData(isochrone);
}

function getDirections(node) {
    const index = nodes.indexOf(node);
    const direction = directions[index];
    dirLayer.clearLayers();
    dirLayer.addData(direction.routes[0].geometry);
}

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

nodeLayer.on("click", (event) => {
    let node = event.layer.feature;
    console.log(node);

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

    getIsochrone(node);
    getDirections(node);
});