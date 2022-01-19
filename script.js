// Planned features:
// TODO: Allow for sorting and filtering schools
// TODO: Only list visible nodes
// TODO: Mobile support
// TODO: Add accessibility options?

// Small issues:
// TODO: Add rudimentary keyboard control

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
    .then(nodes => nodes.forEach(node => constructSchool(node)))

nodeLayer.on("click", (event) => {
    const node = event.layer.feature;
    const id = node.properties.id;

    // Calls function associated with event handler on list object
    // TODO: Refactor this previously mentioned event handler out
    const listObject = document.getElementById(`i${id}`).previousElementSibling.children[0];
    listObject.click();
    listObject.scrollIntoView({behavior: "smooth", block: "center"});
});

map.on("movestart", () => {
    updateNodeList();
})

// Definitions
const colorArray = ["#bf4040", "#bf8f40", "#50bf40"];
async function getIsochrone(node) {
    const index = nodes.indexOf(node);
    const isochrone = isochrones[index];
    isoLayer.clearLayers();
    isochrone.features.forEach((isochrone, i) => {
        L.vectorGrid.slicer(isochrone, {
            vectorTileLayerStyles: {
                sliced: {
                    fill: true,
                    color: colorArray[i]
                }
            },
            maxZoom: 20
        }).addTo(isoLayer)
    })
}

async function getPathToNearest(node) {
    const index = nodes.indexOf(node);
    const path = directions[index].routes[0].geometry;
    dirLayer.clearLayers();
    L.vectorGrid.slicer(path, {
        vectorTileLayerStyles: {
            sliced: {
                weight: 6,
            }
        },
        maxZoom: 20
    }).addTo(dirLayer);
}

function updateNodeList() {
    return;
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

    // Information about nearest station
    const indexNode = nodes.indexOf(node);
    const direction = directions[indexNode];
    const distance = direction.routes[0].distance;
    school.children[1].children[0].children[2].innerText = `Avstånd till närmsta station: ${distance.toFixed(0)}m`;

    // Populate body with available programs
    school.children[1].children[0].children[3].innerHTML = "";
    for (const [key, value] of Object.entries(node.properties)) {
        if (value == "J") {
            let listElement = document.createElement("li");
            listElement.innerHTML = program[key];
            school.children[1].children[0].children[3].appendChild(listElement);
        }
    }

    school.addEventListener("show.bs.collapse", (event) => {
        const id = event.target.id.slice(1);
        Object.entries(nodeLayer._layers).forEach(([key, value]) => {
            if (value.feature.properties.id == id) {
                getIsochrone(value.feature);
                getPathToNearest(value.feature);
                map.flyTo(value._latlng, 15);
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