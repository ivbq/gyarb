#!usr/bin/env zx
// spreadsheet row to geojson object parser
var xml2js = new require('xml2js').Parser();
fs.readFile('schools.xml', function(err, data ) {
	xml2js.parseString(data, function (err, result) {
		var table = result['Workbook']['ss:Worksheet'][0].Table[0];
		var rawNode = [];

		for (var i = 1; i < Object.keys(table.Row).length; i++) {
			rawNode.push({
				// Information
				'id': table.Row[i].Cell[0].Data[0]['_'],
				'name': table.Row[i].Cell[1].Data[0]['_'],
				'form': table.Row[i].Cell[2].Data[0]['_'],
				'url': table.Row[i].Cell[3].Data[0]['_'],

				// Coordinates
				'lat': parseCoord('lat', table.Row[i].Cell[4].Data[0]['_']),
				'lng': parseCoord('lng', table.Row[i].Cell[4].Data[0]['_']),

				// Choice of programs
				'BF': table.Row[i].Cell[5].Data[0]['_'],
				'BA': table.Row[i].Cell[6].Data[0]['_'],
				'EE': table.Row[i].Cell[7].Data[0]['_'],
				'FT': table.Row[i].Cell[8].Data[0]['_'],
				'HA': table.Row[i].Cell[9].Data[0]['_'],
				'HV': table.Row[i].Cell[10].Data[0]['_'],
				'HT': table.Row[i].Cell[11].Data[0]['_'],
				'IN': table.Row[i].Cell[12].Data[0]['_'],
				'NB': table.Row[i].Cell[13].Data[0]['_'],
				'RL': table.Row[i].Cell[14].Data[0]['_'],
				'VF': table.Row[i].Cell[15].Data[0]['_'],
				'VO': table.Row[i].Cell[16].Data[0]['_'],
				'EK': table.Row[i].Cell[17].Data[0]['_'],
				'ES': table.Row[i].Cell[18].Data[0]['_'],
				'HU': table.Row[i].Cell[19].Data[0]['_'],
				'NA': table.Row[i].Cell[20].Data[0]['_'],
				'SA': table.Row[i].Cell[21].Data[0]['_'],
				'TE': table.Row[i].Cell[22].Data[0]['_']
			});
		}

		var geojson = require('geojson');
		var node = geojson.parse(rawNode, {Point: ['lat', 'lng']})
		fs.writeFile('nodes.geojson', JSON.stringify(node));
	})
})

function parseCoord(way, coord) {
	if (way == 'lat') {
		coord = coord.split(', ')[0].replace('"N', '');
	}
	else if (way == 'lng') {
		coord = coord.split(', ')[1].replace('"E', '');
	}

	var decCoord = parseFloat(coord.split('°')[0]);
	decCoord += parseFloat(coord.split('°')[1].split("'")) / 60;
	decCoord += parseFloat(coord.split('°')[1].split("'")[1]) / 3600

	return decCoord;
}