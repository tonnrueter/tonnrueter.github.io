// import "https://d3js.org/d3.v3.min.js"
// import "https://d3js.org/topojson.v1.min.js"
// import "https://unpkg.com/math@0.0.3/math.js"
// import "https://unpkg.com/maplibre-gl@1.15.2/dist/maplibre-gl.js"
// import "https://unpkg.com/@turf/turf@6/turf.min.js"

// MAP COLORING
// Switch how values are shown
var show_me_winner = true;
var show_me_yay = false;
var show_me_nay = false;

var dwe_colors = [
	'#801C62', // Lila
	'#FDD816', // Gold
	'#555555'  // Nicht definiert
];

// From https://stackoverflow.com/a/46310610/4453999
function float_to_string(num, n=2) {
    let normal_conv = num.toString();
    let fixed_conv = num.toFixed(n);
    return (fixed_conv.length > normal_conv.length ? fixed_conv : normal_conv);
}

function get_fill_color_config() {
	var won  = [ '>', ['get', 'ja_rel'], ['get', 'nein_rel']];
	var lost = ['>=', ['get', 'nein_rel'], ['get', 'ja_rel']];

	return [
		'interpolate',
		// Select method. Available:["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2],
		['linear'],
		// Select data for interpolation
		['case',
			show_me_nay, ['get', 'nein_rel'],
			show_me_yay, ['get', 'ja_rel'],
			['get', [
				'case',
				lost, 'nein_rel',
				won,  'ja_rel',
				''
			]]
		],
		// Minimum value and color
		20.0, ['to-color', '#FFFFFF'],
		// Maximums value and color
		80.0, ['case',
			show_me_nay, dwe_colors[0],
			show_me_yay, dwe_colors[1],
			['case',
				lost, dwe_colors[0],
				won,  dwe_colors[1],
				dwe_colors[2],
			]
		]
	];
}

// Option Box
$("#minmax_button").click(function(){
    if($(this).html() == "-"){
        $(this).html("+");
    }
    else{
        $(this).html("-");
    }
		// console.log($("#box").outerHeight());
    $("#box").height($("#box").height()).slideToggle();
});

function detectMob() {
	return ( ( window.innerWidth <= 600 ) || ( window.innerHeight <= 600 ) );
}

if (detectMob()) {
	$("#minmax_button").click();
}

var transparency_checkbox = document.querySelector("input[name='transparency']");
transparency_checkbox.addEventListener('change', function(event) {
	// console.log(event.target.checked);
	map.setPaintProperty('urnenwbs-fills', 'fill-opacity', event.target.checked ? 0.3 : 1.0);
});

var ungueltige_stimmen = false;
document.querySelector("input[name='ungueltige']").addEventListener('change', function(event) {
	ungueltige_stimmen = !ungueltige_stimmen;
	render_result(unqiue_visible_features(active_filter));
	// console.log(ungueltige_stimmen);
});

var active_filter = null;
function show_me_options_changed(event) {
	if (event.target.id == 'winner') show_me_winner = true; else show_me_winner = false;
	if (event.target.id == 'yay') show_me_yay = true; else show_me_yay = false;
	if (event.target.id == 'nay') show_me_nay = true; else show_me_nay = false;
	// console.log(show_me_winner);
	// console.log(show_me_yay);
	// console.log(show_me_nay);

	map.setPaintProperty('urnenwbs-fills', 'fill-color', get_fill_color_config());
}

document.querySelectorAll("input[name='show_me']").forEach((input) => {
  input.addEventListener('change', show_me_options_changed);
});

function filter_options_changed(event) {
	// console.log('filter_options_changed called');
	// console.log(event.target.id);
	// let active_filter = null;
	switch (event.target.id) {
		case 'filter_landslide':
			let threshold = 65.0
			let landslide_won  = ['>=', ['get', 'ja_rel'  ], threshold];
			let landslide_lost = ['>=', ['get', 'nein_rel'], threshold];
			active_filter = ['any', landslide_won, landslide_lost];
			break;
		case 'filter_haeuser':
			var min_hauser = parseInt(document.getElementById('filter_n_haeuser').value);
			active_filter = ['>=', ['get', 'bst_ente'], min_hauser];
			break;
		case 'filter_n_haeuser':
			var min_hauser = parseInt(document.getElementById('filter_n_haeuser').value);
			active_filter = ['>=', ['get', 'bst_ente'], min_hauser];
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_haeuser');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		case 'filter_genossis':
			var min_hauser = parseInt(document.getElementById('filter_n_genossis').value);
			active_filter = ['>=', ['get', 'bst_gssi'], min_hauser];
			break;
		case 'filter_n_genossis':
			var min_hauser = parseInt(document.getElementById('filter_n_genossis').value);
			active_filter = ['>=', ['get', 'bst_gssi'], min_hauser];
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_genossis');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		case 'filter_rentner':
			active_filter = ['>=', ['get', 'dem_rente'], 24.0];
			break;
		case 'filter_sgb2':
			var sgb2_threshold = parseFloat(document.getElementById('filter_sgb2_threshold').value);
			active_filter = ['>=', ['get', 'dem_sgb'], sgb2_threshold];
			break;
		case 'filter_sgb2_threshold':
			var sgb2_threshold = parseFloat(document.getElementById('filter_sgb2_threshold').value);
			active_filter = ['>=', ['get', 'dem_sgb'], sgb2_threshold];
			// Make sure the radio button is set. Does not trigger another change event
			var filter_rb = document.getElementById('filter_sgb2');
			if (!filter_rb.checked) { filter_rb.checked = true; }
			break;
		case 'filter_bezirk':
			var bezirk_id = document.getElementById('select_bezirke').value;
			active_filter = ['==', ['get', 'bid'], bezirk_id];
			break;
		case 'select_bezirke':
			var bezirk_id = document.getElementById('select_bezirke').value;
			active_filter = ['==', ['get', 'bid'], bezirk_id]
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_bezirk');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		case 'filter_awk':
			var awk_id = document.getElementById('select_awk').value;
			active_filter = ['==', ['get', 'awk'], awk_id];
			break;
		case 'select_awk':
			var awk_id = document.getElementById('select_awk').value;
			active_filter = ['==', ['get', 'awk'], awk_id]
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_awk');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		case 'filter_erst':
			var partei = document.getElementById('select_erst').value;
			active_filter = ['==', ['get', 'agh_2'], partei];
			break;
		case 'select_erst':
			var partei = document.getElementById('select_erst').value;
			active_filter = ['==', ['get', 'agh_2'], partei]
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_erst');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		case 'filter_zweit':
			var partei = document.getElementById('select_zweit').value;
			active_filter = ['==', ['get', 'agh_2'], partei];
			break;
		case 'select_zweit':
			var partei = document.getElementById('select_zweit').value;
			active_filter = ['==', ['get', 'agh_2'], partei]
			// Make sure the radio button is set
			var filter_rb = document.getElementById('filter_zweit');
			if (!filter_rb.checked) {
				// Does not trigger another change event
				filter_rb.checked = true;
			}
			break;
		default:
			active_filter = null;
			break;
	};
	map.setFilter('urnenwbs-fills', active_filter);
	render_result(unqiue_visible_features(active_filter));
}

document.querySelectorAll("input[name='filter_distr']").forEach((input) => {
  input.addEventListener('change', filter_options_changed);
});
document.getElementById("select_bezirke").addEventListener("change", filter_options_changed, false);
document.getElementById("select_awk").addEventListener("change", filter_options_changed, false);
document.getElementById("filter_n_haeuser").addEventListener("change", filter_options_changed, false);
document.getElementById("filter_n_genossis").addEventListener("change", filter_options_changed, false);
document.getElementById("filter_sgb2_threshold").addEventListener("change", filter_options_changed, false);
document.getElementById("select_erst").addEventListener("change", filter_options_changed, false);
document.getElementById("select_zweit").addEventListener("change", filter_options_changed, false);

function unqiue_visible_features(filter) {
	// Need to filter here: It's not a bug it's a feature
	// https://github.com/mapbox/mapbox-gl-js/issues/3147
	// console.log('results_for_visible_features');
	const features = map.querySourceFeatures(
		'urnenwbs',
		{filter: filter}
	);
	// query rendered features gives wrong results
	// const features = map.queryRenderedFeatures(
	// 	{filter: filter, layers: ['urnenwbs-fills']}
	// );

	const unique = new Set();
	const selection = new Array();
	features.forEach((item, idx) => {
		if (!unique.has(item['id'])) {
			unique.add(item['id']);
		  selection.push(item['properties']);
		}
	});

	return selection;
}

function data_from_selection(selected) {
	let data = [];
	switch (selected.length) {
		case 0:
			break;
		default:
			var yays = selected.reduce((prev, curr) => prev + curr['ja_abs'], 0);
			var nays = selected.reduce((prev, curr) => prev + curr['nein_abs'], 0);
			if (ungueltige_stimmen) {
				var ungs = selected.reduce((prev, curr) => prev + curr['ung_abs'], 0);
			}
			else {
				var ungs = 0.
			}
			var tots = yays + nays + ungs
			var wahlberechtigte = selected.reduce((prev, curr) => prev + curr['n_wbs_insg'], 0);

			// Kampagnendaten
			var bst_haeuser  = selected.reduce((prev, curr) => prev + curr['bst_ente'], 0);
			var bst_genossen = selected.reduce((prev, curr) => prev + curr['bst_gssi'], 0);
			var anzahl_wahlbezirke = selected.reduce((prev, curr) => {
				let current = 0;
				if (curr['n_distr'] > 0) { current = curr['n_distr'] - 1; }
				return prev + current
			}, 0);

			// var ungs = 0;
			// var tots = teiln
			// console.log(
			// 	100.0*yays/tots+100.0*nays/tots+100.0*ungs/tots,
			// 	100.0*yays/tots,
			// 	100.0*nays/tots,
			// 	100.0*ungs/tots,
			// );
			data = [
				{ 'what': 'JA!',    'val': 100.0*yays/tots, 'color': '#FDD816' },
				{ 'what': 'Nein', 'val': 100.0*nays/tots, 'color': '#801C62' },
				{ 'what': 'Ungültig',  'val': 100.0*ungs/tots, 'color': '#999999' },
				{ 'what': 'wahlbet',  'val': 100.0*tots/wahlberechtigte, 'color': '#999999' },
				{ 'what': 'bst_haeuser', 'val': bst_haeuser, 'color': '#000000' },
				{ 'what': 'bst_genossen', 'val': bst_genossen, 'color': '#000000' },
				{ 'what': 'anzahl_wahlbezirke', 'val': anzahl_wahlbezirke, 'color': '#000000' },
				{ 'what': 'yays', 'val': yays, 'color': '#000000' }, // 9
				{ 'what': 'nays', 'val': nays, 'color': '#000000' },
				{ 'what': 'ungs', 'val': ungs, 'color': '#000000' },
				{ 'what': 'tots', 'val': tots, 'color': '#000000' }
			];
	}
	return data;
}


function render_result(selected) {
	// console.log(selected);
	d3.select("#details").select("svg").remove();
	var details_title = document.getElementById("details_title");

  const data = data_from_selection(selected);
	if (data.length == 0) {
		details_title.innerHTML = "Leere Auswahl";
		return;
	}
  // console.log(data);
	// Typical structure of data array:
	// 0: {what: 'JA!', val: 61.34585289514867, color: '#FDD816'}
	// 1: {what: 'Nein', val: 38.65414710485133, color: '#801C62'}
	// 2: {what: 'Ungültig', val: 0, color: '#999999'}
	// 3: {what: 'wahlbet', val: 63.67713004484305, color: '#999999'}
	// 4: {what: 'bst_haeuser', val: 5, color: '#000000'}
	// 5: {what: 'bst_genossen', val: 0, color: '#000000'}
	// 6: {what: 'anzahl_wahlbezirke', val: 2, color: '#000000'}
	// 7: {what: 'yays', val: 784, color: '#000000'}
	// 8: {what: 'nays', val: 494, color: '#000000'}
	// 9: {what: 'ungs', val: 0, color: '#000000'}
	// 10: {what: 'tots', val: 1278, color: '#000000'}
	const plot_data = [];
	var plot_what = [];
	// const plot_what = ['JA!', 'Nein'];
	if (ungueltige_stimmen) {
		plot_what = ['JA!', 'Nein', 'Ungültig'];
	}
	else {
		plot_what = ['JA!', 'Nein'];
	}
	data.forEach((item) => {
		if (plot_what.includes(item['what'])) plot_data.push(item);
	});

	// Infobox Contents
	var title_string = "";
	switch (selected.length) {
		case 0:
			title_string += "Beweg die Maus über der Karte um das Wahlergebnis zu erfahren "
			title_string += "oder wähle einen Filter aus."
			break;
		case 1:
			title_string += '<b>Stimmbezirk';
			var uwbs = selected[0]['uwb'].replace('["', '').replace('"]', '').replaceAll('","', ', ');
			// console.log("'" + uwbs + "'");
			if (uwbs.length <= 3) {
				title_string += ' ' + uwbs
			}
			else {
				title_string += 'e ' + uwbs
			}
			title_string += '</b> in <b>' + selected[0]['bez']
			title_string += '</b>'
			break;
		default:
			title_string += "<b>Wahlergebnis in Auswahl</b>";
	}

	title_string += '</br> (' + data[6].val.toFixed(0) + ' Urnenwahlbezirke + Briefwahl, '
	title_string += 'Wahlbeteiligung: '   + data[3].val.toFixed(2) + '%)</br>'
	title_string += '<b>Stimmen</b> JA!: ' + data[7].val.toFixed(0) + ', '
	title_string += 'Nein: ' + data[8].val.toFixed(0) + ', '
	title_string += 'Ungültig: ' + data[9].val.toFixed(0) + '</br>'
	title_string += '<b>Häuser</b> Kandidaten: ' + data[4].val.toFixed(0) + ', '
	title_string += 'Genossenschaften: '   + data[5].val.toFixed(0) + ''

	details_title.innerHTML = title_string;

	// Wahlergebnis Plot Bar Diagramm
  var margin = {top: 10, right: 20, bottom: 30, left: 50};

	// let details_width = 280;
	let details_width = $(details).width();

  var width  = details_width - margin.left - margin.right,
   	  height = 100 - margin.top - margin.bottom;

  var svg = d3.select("#details").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
            .range([0, width])
            .domain([0, 100]);
  svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(x));

  var y = d3.scaleBand()
            .range([0, height])
            .domain(plot_data.map(function(d) { return d.what; }))
            .padding(0.1);
  svg.append("g")
     .call(d3.axisLeft(y));

  svg.selectAll("#details")
     .data(plot_data)
     .enter()
     .append("rect")
     .attr("x", x(0))
		 // .attr("width", function(d) { return width - x(d.val); })
     .attr("width", function(d) { return x(d.val); })
     .attr("y", function(d) { return y(d.what); })
     .attr("height", y.bandwidth())
     .attr("fill", function(d) { return d.color; });

  svg.selectAll("#details")
     .data(plot_data)
     .enter()
     .append("text")
     .attr("class","label")
     .attr("x", width - 50)
     .attr("y", function(d) { return y(d.what) + y.bandwidth(); })
     .text(function(d) { return d.val.toFixed(2) + ' %'; })
     .attr("fill", "black");

  // return svg
}

document.getElementById('filter_distr')

// HELPER VARIABLES
var active_uwb_id = null;
// var selected_uwb_id = null;
// const selected_uwb_id = new Set()
const selected_uwb_id = new Map()

// THE MAP
// Check for mob(bile), i.e. Smartphone/Tablet
if (detectMob()) { var initial_zoom = 8.5; } else {var initial_zoom = 10;}
if (detectMob()) { var initial_center = [13.4243, 52.4182]; } else {var initial_center = [13.4243, 52.5182];}

var map = new maplibregl.Map({
	container: 'map',
	style:
	'https://api.maptiler.com/maps/voyager/style.json?key=u7yqtGLVmqJHv60oSmgK',
	center: initial_center,
	zoom: initial_zoom,
	minZoom: 8,
	maxZoom: 17,
	maxBounds: new maplibregl.LngLatBounds.convert(
		[[12.60, 52.0],   // South-West/Bottom left corner
		 [14.40, 52.85]]  // North-East/Upper right corner
	),
	dragRotate: false,
	dragPan: true,
	touchPitch: false,
	doubleClickZoom: false,
	//hash:true
});
map.touchZoomRotate.disableRotation();

map.on('load', function() {

	map.addSource('urnenwbs',
	{
		'type': 'geojson',
		// No cache pls: https://stackoverflow.com/questions/13053096/avoid-data-caching-when-using-d3-text
		// 'data' : 'http://localhost:8000/uwbs_4326_geojson_adresse.json' + "?" + Math.floor(Math.random() * 10000),
		'data' : 'data/data.json',
		'promoteId': 'bwb' //Works
	});
	// console.log('map.on -- source added');

	map.addLayer({
		'id': 'urnenwbs-fills',
		// Checkout https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#type
		'source': 'urnenwbs',
		'layout': {},
		'type': 'fill',
		'paint': {
			'fill-color': get_fill_color_config(),
			'fill-opacity': 1.0,
			'fill-outline-color' : 'white',
		},
	});
	// console.log('map.addLayer -- Added fill layer');

	map.addLayer({
		'id': 'urnenwbs-lines',
		// Checkout https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#type
		'source': 'urnenwbs',
		'layout': {},
		'type': 'line',
		'paint': {
			'line-color' : 'black',
			'line-width' : [
				'case',
				['boolean', ['feature-state', 'selected'], false],
				3,
				0
			]
		}
	// 'visibility':'none'
	});
	// console.log('Added line layer');

	// When the user moves their mouse over the state-fill layer, we'll update the
	// feature state for the feature under the mouse.
	map.on('mousemove', 'urnenwbs-fills', function (e) {
		// console.log(e);
		// console.log(e.features);
		if (e.features.length > 0) {
			if (active_uwb_id) {
				map.setFeatureState(
					{ source: 'urnenwbs', id: active_uwb_id },
					{ hover: false }
				);
			}
			active_uwb_id = e.features[0].id;
			// console.log(active_uwb_id);

			if (selected_uwb_id.size == 0) {
				map.setFeatureState(
					{ source: 'urnenwbs', id: active_uwb_id },
					{ hover: true }
				);

				// Set contents of text element
				// document.getElementById('features').innerHTML = JSON.stringify(
				// 	e.features[0].properties,
				// 	null,
				// 	2
				// );
				// update_infobox(e);
				render_result([e.features[0].properties]);
			}

		}
	});

	// When the mouse leaves the state-fill layer, update the feature state of the
	// previously hovered feature.
	map.on('mouseleave', 'urnenwbs-fills', function () {
		if (active_uwb_id) {
			map.setFeatureState(
				{ source: 'urnenwbs', id: active_uwb_id },
				{ hover: false }
			);
		}
		active_uwb_id = null;
		if (selected_uwb_id.size > 0) {
			const values = []
			selected_uwb_id.forEach((properties) => {
					values.push(properties);
			});
			render_result(values);
		}
		else {
			// Nothing selected. Fall back on Filter selection
			render_result(unqiue_visible_features(active_filter));
		}
	});

	map.on('click', 'urnenwbs-fills', function (e) {
		var ctrl_pressed = event.getModifierState('Control');
		// console.log(ctrl_pressed);
		var current_uwb_id = null;
		// console.log(e.features.length);
		// Case e.features.length == 0 never materializes
		if (e.features.length > 0) {

			current_uwb_id = e.features[0].id;

			if (selected_uwb_id.has(current_uwb_id)) {
				// Deselect if already selected
				map.setFeatureState(
					{ source: 'urnenwbs', id: current_uwb_id },
					{ selected: false }
				);
				selected_uwb_id.delete(current_uwb_id);

				if (selected_uwb_id.size > 0) {
					const values = []
					selected_uwb_id.forEach((properties) => {
							values.push(properties);
					});
					render_result(values);
				}
				else {
					// Nothing selected. Fall back on Filter selection
					render_result(unqiue_visible_features(active_filter));
				}
			}
			else {
				// Keep addin uwb_ids if control is pressed, else..
				if (ctrl_pressed) {
					map.setFeatureState(
						{ source: 'urnenwbs', id: current_uwb_id },
						{ selected: true }
					);
					// selected_uwb_id.add(current_uwb_id);
					selected_uwb_id.set(current_uwb_id, e.features[0].properties);

					const values = []
					selected_uwb_id.forEach((properties) => {
							values.push(properties);
					});
					render_result(values);
				}
				else {
					// .. deselect all seleected and only select the new uwb
					selected_uwb_id.forEach((_, uwb_id) => {
						map.setFeatureState(
							{ source: 'urnenwbs', id: uwb_id },
							{ selected: false }
						);
					});
					// for (let uwb_id of selected_uwb_id) {
					// 	map.setFeatureState(
					// 		{ source: 'urnenwbs', id: uwb_id },
					// 		{ selected: false }
					// 	);
					// }
					selected_uwb_id.clear();
					// selected_uwb_id.add(current_uwb_id);
					selected_uwb_id.set(current_uwb_id, e.features[0].properties);
					map.setFeatureState(
						{ source: 'urnenwbs', id: current_uwb_id },
						{ selected: true }
					);
					render_result([e.features[0].properties]);
				}

			}
		}
		else {
			// Nothing selected. Fall back on Filter selection
			render_result(unqiue_visible_features(active_filter));
		}
	});

	// Make sure to render the overall result after loading is completed
	map.once('idle', () => {render_result(unqiue_visible_features(null));});

});
