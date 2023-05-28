const id = ".chart"

d3.csv("tw-transportation.csv").then(function (csvData) {
	var cfg = {
				w: 350,					//Width of the circle
				h: 400,					//Height of the circle
				margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
				levels: 3,				//How many levels or inner circles should there be drawn
				maxValue: 0, 			//What is the value that the biggest circle will represent
				labelFactor: 1.15, 		//How much farther than the radius of the outer circle should the labels be placed
				wrapWidth: 25, 			//The number of pixels after which a label needs to be given a new line
				opacityArea: 0.3, 		//The opacity of the area of the blob
				dotRadius: 3, 			//The size of the colored circles of each blog
				opacityCircles: 0.1, 	//The opacity of the circles of each blob
				strokeWidth: 2, 		//The width of the stroke around each blob
				roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
				color: d3.scaleOrdinal(d3.schemeCategory10)	//Color function
			  };
	
	if('undefined' !== typeof options){
		for(var i in options){
			if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
		}
	}

	var	axisFormat = d3.format('.2s'),			 				//Axis label formating
		tipFormat = d3.format('.0f');							//Tooltip formating

	var types = Object.keys(csvData[0]).slice(3);

	var monthMap = [
		{ name: 'Jan', value: 1 },
		{ name: 'Feb', value: 2 },
		{ name: 'Mar', value: 3 },
		{ name: 'Apr', value: 4 },
		{ name: 'May', value: 5 },
		{ name: 'June', value: 6 },
		{ name: 'July', value: 7 },
		{ name: 'Aug', value: 8 },
		{ name: 'Sept', value: 9 },
		{ name: 'Oct', value: 10 },
		{ name: 'Nov', value: 11 },
		{ name: 'Dec', value: 12 }
	];

	var years = csvData.map(function(row) {
    	return parseInt(row['Year']);
	});
	
	var cities = [...new Set(csvData.map(function(row) {
		return row['City'];
	}))];

	var minYear = d3.min(years), maxYear = d3.max(years);
	
	$( "#year-range" ).slider({
		range: true,
		min: minYear,
		max: maxYear,
		values: [ minYear, maxYear ],
		slide: function( event, ui ) {
			$("#minYear").text(ui.values[0])
			$("#maxYear").text(ui.values[1])
			update()
		}
	});
	
	$("#minYear").text($("#year-range").slider( "values", 0 ));
	$("#maxYear").text($("#year-range").slider("values", 1));
	
	// MONTH RANGE
	$( "#month-range" ).slider({
		range: true,
		min: 1,
		max: 12,
		values: [ 1, 12 ],
		slide: function( event, ui ) {
			$("#minMonth").text(monthMap[ui.values[0] - 1].name)
			$("#maxMonth").text(monthMap[ui.values[1] - 1].name)
			update()
		}
	});
	
	$("#minMonth").text('Jan');
	$("#maxMonth").text('Dec');

	// CITY PANEL
	var cityPanel = d3.select('.cityPanel');

	var cityboxes = cityPanel
		.selectAll('label')
		.data(cities)
		.enter()
		.append("div")
		.attr('class', 'form-check');

	cityboxes
		.append('input')
		.attr('type', 'checkbox')
		.attr('class', 'form-check-input')
		.attr('id', d => d)
		.attr('value', d => d)
		.property('checked', true)
	
	cityboxes
		.append('label')
		.attr('class', 'form-check-label')
		.attr('for', d => d)
		.text(d => d)	
		
	var svg = d3.select(id).append("svg")
		.attr("width", cfg.w + 50)
		.attr("height", cfg.h)
		.attr("class", "radar");
			
	var g = svg.append("g")
		.attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

	createVisualization(cities)

	function createVisualization(cities) {

		var data = citiesFilter(csvData, cities);

		// If the supplied maxValue is smaller than the actual one, replace by the max in the data
		var maxValue = roundUp(Math.max(cfg.maxValue, d3.max(data, function (i) {
			return d3.max(i.map(function (o) { return o.value; }))
		})));
			
		var allAxis = data[0].map(function(i, j){return i.axis}),	//Names of each axis
			total = allAxis.length,									//The number of different axes
			radius = Math.min(cfg.w/2, cfg.h/2), 					//Radius of the outermost circle
			angleSlice = Math.PI * 2 / total;						//The width in radians of each "slice"

		var radiusScale = d3.scaleLinear()
			.range([0, radius])
			.domain([0, maxValue]);

		
		//Filter for the outside glow
		var filter = g.append('defs').append('filter').attr('id','glow'),
			feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
			feMerge = filter.append('feMerge'),
			feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
			feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');
		
		var axisGrid = g.append("g").attr("class", "axisWrapper");
		
		//Draw the background circles
		axisGrid.selectAll(".levels")
			.data(d3.range(1,(cfg.levels+1)).reverse())
			.enter()
				.append("circle")
				.attr("class", "gridCircle")
				.attr("r", function(d, i){ return radius/cfg.levels*d; })
				.style("fill", "#CDCDCD")
				.style("stroke", "#CDCDCD")
				.style("fill-opacity", cfg.opacityCircles)
				.style("filter" , "url(#glow)");

		axisGrid.selectAll(".axisLabel")
			.data(d3.range(1,(cfg.levels+1)).reverse())
			.enter().append("text")
			.attr("class", "axisLabel")
			.attr("x", 4)
			.attr("y", function(d){return -d*radius/cfg.levels;})
			.attr("dy", "0.4em")
			.style("font-size", "10px")
			.attr("fill", "#737373")
			.text(function(d,i) { return axisFormat(maxValue * d/cfg.levels); });

		// Create the straight lines radiating outward from the center
		var axis = axisGrid.selectAll(".axis")
					.data(allAxis)
					.enter()
					.append("g")
					.attr("class", "axis");
		
		// Append the lines
		axis.append("line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", function(d, i){ return radiusScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("y2", function(d, i){ return radiusScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
			.attr("class", "line")
			.style("stroke", "white")
			.style("stroke-width", "2px");

		//Append the labels at each axis
		axis.append("text")
			.attr("class", "legend")
			.style("font-size", "11px")
			.attr("text-anchor", "middle")
			.attr("dy", "0.35em")
			.attr("x", function(d, i){ return radiusScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("y", function(d, i){ return radiusScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
			.text(function(d){return d})
			.call(wrap, cfg.wrapWidth);
		
		var radarLine = d3.lineRadial()
			.curve(d3.curveBasisClosed)
			.radius(function(d) { return radiusScale(d.value); })
			.angle(function(d,i) {	return i*angleSlice; });
			
		if(cfg.roundStrokes) {
			radarLine.curve(d3.curveCardinalClosed);
		}


		//Create a wrapper for the blobs	
		var blobWrapper = g.selectAll(".radarWrapper")
			.data(data)
			.enter().append("g")
			.attr("class", "radarWrapper");
				
		//Append the backgrounds	
		blobWrapper.append("path")
			.attr("class", "radarArea")
			.attr("d", function(d,i) { return radarLine(d); })
			.style("fill", function(d,i) { return cfg.color(i); })
			.style("fill-opacity", cfg.opacityArea)
			.on('mouseover', function (d,i){
				d3.selectAll(".radarArea")
					.transition().duration(200)
					.style("fill-opacity", 0.1); 
				d3.select(this)
					.transition().duration(200)
					.style("fill-opacity", 0.7);	
			})
			.on('mouseout', function(){
				d3.selectAll(".radarArea")
					.transition().duration(200)
					.style("fill-opacity", cfg.opacityArea);
			});
			
		//Create the outlines	
		blobWrapper.append("path")
			.attr("class", "radarStroke")
			.attr("d", function(d,i) { return radarLine(d); })
			.style("stroke-width", cfg.strokeWidth + "px")
			.style("stroke", function(d,i) { return cfg.color(i); })
			.style("fill", "none")
			.style("filter" , "url(#glow)");		
		
		//Append the circles
		blobWrapper.selectAll(".radarCircle")
			.data(function(d,i) { return d; })
			.enter().append("circle")
			.attr("class", "radarCircle")
			.attr("r", cfg.dotRadius)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", function(d,i) { return cfg.color(data.indexOf(d3.select(this.parentNode).datum())); })
			.style("fill-opacity", 0.8);
		
		var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
								.data(data)
								.enter().append("g")
								.attr("class", "radarCircleWrapper");
			
		blobCircleWrapper.selectAll(".radarInvisibleCircle")
			.data(function(d,i) { return d; })
			.enter().append("circle")
			.attr("class", "radarInvisibleCircle")
			.attr("r", cfg.dotRadius*1.5)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mouseover", function(d,i) {
				newX =  parseFloat(d3.select(this).attr('cx')) - 10;
				newY =  parseFloat(d3.select(this).attr('cy')) - 10;
						
				tooltip
					.attr('x', newX)
					.attr('y', newY)
					.text(tipFormat(i.value))
					.transition().duration(200)
					.style('opacity', 1);
			})
			.on("mouseout", function(){
				tooltip.transition().duration(200)
					.style("opacity", 0);
			});
			
		// Set up the small tooltip for when you hover over a circle

		var cityLegend = d3.select('.cityLegend');

		cityLegend
			.append('div')
			.attr('class', 'l')
		
		var legends = d3.select('.l')
			.selectAll('label')
			.data(cities)
			.enter()
			.append("div")
			.attr("class", "legend mb-1");
		
		legends
			.append('span')
			.attr('class', 'badge me-2')
			.style("background-color", function (d, i) { return cfg.color(i); })
			.style("color", function (d, i) { return cfg.color(i); })
			.text('_')
		
		legends
			.append('label')
			.text(d => d)

	}

	function updateVisualization(cities) {
		var data = citiesFilter(csvData, cities);

		// If the supplied maxValue is smaller than the actual one, replace by the max in the data
		var maxValue = roundUp(Math.max(cfg.maxValue, d3.max(data, function (i) {
			return d3.max(i.map(function (o) { return o.value; }))
		})));
			
		var allAxis = data[0].map(function(i, j){return i.axis}),	//Names of each axis
			total = allAxis.length,									//The number of different axes
			radius = Math.min(cfg.w/2, cfg.h/2), 					//Radius of the outermost circle
			angleSlice = Math.PI * 2 / total;						//The width in radians of each "slice"

		var radiusScale = d3.scaleLinear()
			.range([0, radius])
			.domain([0, maxValue]);

		g.selectAll(".axisLabel")
			.text(function(d,i) { return axisFormat(maxValue * d/cfg.levels); });
		
		var radarLine = d3.lineRadial()
			.curve(d3.curveBasisClosed)
			.radius(function(d) { return radiusScale(d.value); })
			.angle(function(d,i) {	return i*angleSlice; });
			
		if(cfg.roundStrokes) {
			radarLine.curve(d3.curveCardinalClosed);
		}
	
		var blobWrapper = g.selectAll(".radarWrapper")
		.data(data);
	  
		//Update radarArea
		blobWrapper.select(".radarArea")
		.transition().duration(200)
		.attr("d", function(d, i) { return radarLine(d); })
		.style("fill", function(d, i) { return cfg.color(i); });
		
		//Update radarStroke
		blobWrapper.select(".radarStroke")
		.transition().duration(200)
		.attr("d", function(d, i) { return radarLine(d); })
		.style("stroke", function(d, i) { return cfg.color(i); });
		
		//Enter new blobwrapper
		var newBlobWrapper = blobWrapper.enter()
		.append("g")
		.attr("class", "radarWrapper");
		
		//Enter new radarArea
		newBlobWrapper.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d, i) { return radarLine(d); })
		.style("fill", function(d, i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function(d, i) {
			d3.selectAll(".radarArea")
			.transition().duration(200)
			.style("fill-opacity", 0.1);
			d3.select(this)
			.transition().duration(200)
			.style("fill-opacity", 0.7);
		})
		.on('mouseout', function() {
			d3.selectAll(".radarArea")
			.transition().duration(200)
			.style("fill-opacity", cfg.opacityArea);
		})
		.transition().duration(200);
		
		//Enter new radarStroke
		newBlobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d, i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d, i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter", "url(#glow)")
		.transition().duration(200);
		
		//Update the circles
		blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.transition().duration(200)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); });

		// Enter new circles
		newBlobWrapper.selectAll(".radarCircle")
			.data(function(d,i) { return d; })
			.enter().append("circle")
			.attr("class", "radarCircle")
			.attr("r", cfg.dotRadius)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", function(d,i) { console.log("123"); return cfg.color(data.indexOf(d3.select(this.parentNode).datum())); })
			.style("fill-opacity", 0.8);
	  
		//Selection and update data
		var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
			.data(data); 
		
		//Update invisibleCircle
		blobCircleWrapper.selectAll(".radarInvisibleCircle")
			.data(function(d) { return d; }) 
			.transition().duration(200)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); });
		

		//Enter new cicleWrapper
		var newBlobCircleWrapper = blobCircleWrapper.enter().append("g")
			.attr("class", "radarCircleWrapper");
		
		//Enter new invisibleCircle
		newBlobCircleWrapper.selectAll(".radarInvisibleCircle")
			.data(function(d) { return d; }) 
			.enter().append("circle")
			.attr("class", "radarInvisibleCircle")
			.attr("r", cfg.dotRadius*1.5)
			.attr("cx", function(d,i){ return radiusScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return radiusScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
		
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(tipFormat(i.value))
				.transition().duration(200)
				.style('opacity', 1);
			})
			.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
			}); 

		
		var legendsContainer = d3.select('.l');
		var legends = legendsContainer
			.selectAll('.mb-1')
			.data(cities);
		
		legends
			.select('span')
			.style("background-color", function(d, i) { return cfg.color(i); })
			.style("color", function(d, i) { return cfg.color(i); });
		
		legends
			.select('label')
			.text(function(d) { return d; });
		
		var newLegends = legends.enter()
			.append("div")
			.attr("class", "mb-1");
		
		newLegends
			.append('span')
			.attr('class', 'badge me-2')
			.style("background-color", function(d, i) { return cfg.color(i); })
			.style("color", function(d, i) { return cfg.color(i); })
			.text('_');
		
		newLegends
			.append('label')
			.text(function(d) { return d; });
		
		legends.exit().remove();
		blobCircleWrapper.remove();
		blobWrapper.exit().remove();
	}
	
	cityPanel.selectAll('input[type="checkbox"]').on("click", function () {
		update()
	});

	function update() {
		var checkedCities = cityPanel
			.selectAll('input[type="checkbox"]:checked')
			.nodes()
			.map(node => node.value);
		

		updateVisualization(checkedCities)
	}
	
	// Used to Rounding up maxvalue
	function roundUp(number) {
		// 找到數字的位數
		var numDigits = Math.floor(Math.log10(number)) + 1;
	
		// 計算最大位數下一位的數字
		var nextPower = Math.pow(10, numDigits - 1);
	
		// 計算向上取整的數字
		var roundedValue = Math.ceil(number / nextPower) * nextPower;
	
		return roundedValue;
	}

	// Filter the csvData with given Cities
	function citiesFilter(csvData, cities){
		var	citiesData = new Map(),
		startYear = parseInt(d3.select("#minYear").text()),
		endYear = parseInt(d3.select("#maxYear").text()),
		startMonth = monthMap.find(function (month) {
			return month.name === d3.select("#minMonth").text();
		}).value,
		endMonth = monthMap.find(function (month) {
			return month.name === d3.select("#maxMonth").text();
		}).value;

		data = [];
		
		csvData.forEach(function(row) {
			if (parseInt(row['Year']) >= startYear && parseInt(row['Year']) <= endYear &&
				parseInt(row['Month']) >= startMonth && parseInt(row['Month']) <= endMonth &&
				cities.includes(row['City'])) {
				var city = row['City'];
				if (citiesData.has(city)) {
					var rowData = citiesData.get(city);
					for (var j = 0; j < types.length; j++) {
						rowData[j].value += parseInt(row[types[j]]);
					}
					citiesData.set(city, rowData);
				} else {
					var rowData = [];
					for (var j = 0; j < types.length; j++) {
						rowData.push({ axis: types[j], value: parseInt(row[types[j]]) });
					}
					citiesData.set(city, rowData);
				}
			}
		});

		citiesData.forEach(function(rowData, city) {
			data.push(rowData);
		});

		return data;
	}

	function wrap(text, width) {
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.4,
				y = text.attr("y"),
				x = text.attr("x"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
				
			while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
			}
			}
		});
	}

	var tooltip = g.append("text")
	.attr("class", "tooltip")
	.style("opacity", 0);
})
