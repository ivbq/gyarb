// TODO: Scroll in when clicking on school in list/school as node

// TODO: Fix issue where multiple school windows can be open at the same time

// TODO: Allow for filtering schools
// Apply filter to list of schools, only render in items/nodes that fit

// TODO: Show information about nearest station: name, street, distance


// Initialisation
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
        return nodes;
    })
    .then(nodes => {
        nodes.forEach(node => {
            constructSchool(node);
        })
    })

nodeLayer.on("click", (event) => {
    let node = event.layer.feature;
    console.log(node);

    getIsochrone(node);
    getPathToNearest(node);
});

map.on("movestart", () => {
    console.log("Moooove?");
})

// Definitions
function getIsochrone(node) {
    const index = nodes.indexOf(node);
    const isochrone = isochrones[index];
    isoLayer.clearLayers();
    isoLayer.addData(isochrone);
}

function getPathToNearest(node) {
    const index = nodes.indexOf(node);
    const direction = directions[index];
    const path = direction.routes[0].geometry;
    dirLayer.clearLayers();
    dirLayer.addData(path);
}

// I blame this mess on Javascript's handling (or lack thereof) of references
// Reducing side-effects? Never heard of 'em
function constructSchool(node) {
    const school = document.querySelector("template").content.children[0].cloneNode(true);

    // Accordion header & button
    school.id = "";
    school.children[0].children[0].attributes[2].nodeValue += node.properties.id;
    school.children[0].children[0].innerText = node.properties.name;

    // Accordion collapse & body
    school.children[1].id += node.properties.id;
    school.children[1].children[0].children[0].innerText = node.properties.name;
    school.children[1].children[0].children[1].innerText = node.properties.form;

    school.children[1].children[0].children[2].innerHTML = "";
    for (const [key, value] of Object.entries(node.properties)) {
        if (value == "J") {
            let listElement = document.createElement("li");
            listElement.innerHTML = program[key];
            school.children[1].children[0].children[2].appendChild(listElement);
        }
    }

    school.addEventListener("show.bs.collapse", (event) => {
        const id = event.target.id.slice(1);
        Object.entries(nodeLayer._layers).forEach(([key, value]) => {
            if (value.feature.properties.id == id) {
                map.setView(value._latlng);
                getIsochrone(value.feature);
                getPathToNearest(value.feature);
            }
        })
    })

    document.querySelector("#accordion").appendChild(school);
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