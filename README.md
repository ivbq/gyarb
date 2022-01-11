# gy_mapping

An attempt to make a simple representation of the proximity to public transport for different upper secondary schools in and around Stockholm.
The purpose of this project is to help aspiring upper secondary students make an informed school choice.

The script to convert XML spreadsheet data into GeoJSON-formatted nodes is written for this exact usecase, and will most definitely not work for any other files without adaptation. It's dependent on zx, xml2js, and geojson.

The browser-based map allows for viewing generated nodes in a simple and clean way, though it's currently only optimized for desktop use. It's dependent on Bootstrap for theming and Leaflet for map generation, using OpenStreetMap-data and a Mapbox tileset. At a later stage this will be accessible through Github Pages.

# Planned features:
	Status: Done:
		- Structure data from Wikidata and the Swedish National Board of Education
		- Convert data into Geojson-formatted features with appropriate properties
		- Add a simple map using Leaflet/Mapbox to visualize nodes
		- Add a sidebar to show node information (i.e name, website, available programs)
		- Separate website components into different files
	Status: In progress:
		- Sort through XML data to improve data accuracy
	Status: Far off:
		- Add counter to show closest public transport stations of respective type
		- Add an isodistance representation of walking distance
		- Style map and UI
	
