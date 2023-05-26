var margin = { top: 80, right: 80, bottom: 80, left: 80 },
	width = Math.min(500, window.innerWidth - 10) - margin.left - margin.right,
	height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
					
var color = d3.scaleOrdinal().range(["#EDC951", "#CC333F", "#00A0B0"]);
					
var options = {
				w: width,
				h: height,
				margin: margin,
				maxValue: 0.5,
				levels: 5,
				roundStrokes: true,
				color: d3.scaleOrdinal(d3.schemeCategory10)
			  };

const id = ".chart"

d3.csv("tw-transportation.csv").then(function (csvData) {	
	var headers = csvData.columns;
	
	var years = csvData.map(function(row) {
    	return parseInt(row['Year']);
  	});


	var minYear = d3.min(years),
		maxYear = d3.max(years);
	
	d3.select('#yearValue').attr("value", maxYear);

	var slider = d3
		.sliderHorizontal()
		.min(minYear)
		.max(maxYear)
		.step(1)
		.value(maxYear)
		.width(250)
		.tickValues(years)
		.tickFormat(d3.format('.0f'))
		.on('onchange', (val) => {
			d3.select('#yearValue').attr("value", val);
		});

	const yearSlider = d3.select('#yearSlider')
						.append('svg')
						.attr("height", 100)
						.append('g')
						.attr('width', 1000)
						.attr('transform', 'translate(30,30)')
						.call(slider);
	
	var data = loadData(maxYear)

	var target = ["Kaohsiung","Taoyuan"]

	var data = data.filter(function(item) {
		var itemCity = item[0].city;
		return target.includes(itemCity);
	  });

	var cfg = {
				w: 600,					//Width of the circle
				h: 600,					//Height of the circle
				margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
				levels: 3,				//How many levels or inner circles should there be drawn
				maxValue: 0, 			//What is the value that the biggest circle will represent
				labelFactor: 1.25, 		//How much farther than the radius of the outer circle should the labels be placed
				wrapWidth: 60, 			//The number of pixels after which a label needs to be given a new line
				opacityArea: 0.35, 		//The opacity of the area of the blob
				dotRadius: 4, 			//The size of the colored circles of each blog
				opacityCircles: 0.1, 	//The opacity of the circles of each blob
				strokeWidth: 2, 		//The width of the stroke around each blob
				roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
				color: d3.scaleOrdinal(d3.schemeCategory10)	//Color function
			  };
	
	if('undefined' !== typeof options){
		for(var i in options){
			if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
		}
	}
	
	// If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(cfg.maxValue, d3.max(data, d => d3.max(d.map(o => o.value))));

	maxValue = roundUpToNextPower(maxValue);
		
	var allAxis = data[0].map(function(i, j){return i.axis}),	//Names of each axis
		total = allAxis.length,									//The number of different axes
		radius = Math.min(cfg.w/2, cfg.h/2), 					//Radius of the outermost circle
		Format = d3.format('.0f'),			 					//Percentage formatting
		angleSlice = Math.PI * 2 / total;						//The width in radians of each "slice"

	var radiusScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, maxValue]);

	d3.select(id).select("svg").remove();
	
	var svg = d3.select(id).append("svg")
				.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
				.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
				.attr("class", "radar"+id);
			
	var g = svg.append("g")
			   .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");
	
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
		.text(function(d,i) { return Format(maxValue * d/cfg.levels); });

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
				.text(Format(i.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});
		
	// Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);

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

	function loadData(year) {

		var selectedYear = year; // 指定要篩選的年份
		var filteredData = csvData.filter(function(d) {
		  return d.Year === selectedYear.toString();
		});

		// 使用d3.group()將篩選後的數據按城市分組
		var nestedData = d3.group(filteredData, function(d) { return d.City; });

		// 計算每個分組的總載客量
		var formattedData = [];
		nestedData.forEach(function(records, city) {
			var totalBus = d3.sum(records, function(d) { return d.Bus; });
			var totalMRT = d3.sum(records, function(d) { return d.MRT; });
			var totalHSR = d3.sum(records, function(d) { return d.HSR; });
			var eachData = [];
		
			eachData.push({ city: city, axis: "Bus", value: totalBus });
			eachData.push({ city: city, axis: "MRT", value: totalMRT });
			eachData.push({ city: city, axis: "HSR", value: totalHSR });
			formattedData.push(eachData);
		  });

		return formattedData;
	}

	// Year slider
	yearSlider.on("click", function () {
		selectedYear = parseInt(d3.select("#yearValue").property("value"));	
		
		rawdata = loadData(selectedYear)


		var data = rawdata.filter(function(item) {
			var itemCity = item[0].city;
			return target.includes(itemCity);
		  });
		
		var maxValue = roundUpToNextPower(Math.max(cfg.maxValue, d3.max(data, d => d3.max(d.map(o => o.value)))));
		
		var radiusScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, maxValue]);

		var radarLine = d3.lineRadial()
		.curve(d3.curveCardinalClosed)
		.radius(function(d) { return radiusScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });
		
		// Update and redraw the radar chart
		var blobWrapper = g.selectAll(".radarWrapper")
		.data(data);

		// Enter
		var newBlobWrapper = blobWrapper.enter().append("g")
		.attr("class", "radarWrapper");

		newBlobWrapper.append("path")
		.attr("class", "radarArea")
		.merge(blobWrapper.select(".radarArea"))
		.transition().duration(500)
		.attr("d", function(d, i) { return radarLine(d); })
		.style("fill", function(d, i) { return cfg.color(i); });

		newBlobWrapper.append("path")
		.attr("class", "radarStroke")
		.merge(blobWrapper.select(".radarStroke"))
		.transition().duration(500)
		.attr("d", function(d, i) { return radarLine(d); })
		.style("stroke", function(d, i) { return cfg.color(i); });

		blobWrapper.selectAll(".radarCircle")
		.data(function(d, i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.merge(blobWrapper.selectAll(".radarCircle"))
		.transition().duration(500)
		.attr("cx", function(d, i) { return radiusScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
		.attr("cy", function(d, i) { return radiusScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); });

		var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)

		blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.merge(blobCircleWrapper.selectAll(".radarInvisibleCircle"))
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
		.text(Format(i.value))
		.transition().duration(200)
		.style('opacity', 1);
		})
		.on("mouseout", function(){
		tooltip.transition().duration(200)
		.style("opacity", 0);
		});

		// Update axis labels
		axisGrid.selectAll(".axisLabel")
		.text(function(d, i) { return Format(maxValue * (cfg.levels - i) / cfg.levels); });

		// Exit
		blobWrapper.exit().remove();
		blobCircleWrapper.exit().remove();
  	});

})

function roundUpToNextPower(number) {
	// 找到數字的位數
	var numDigits = Math.floor(Math.log10(number)) + 1;
  
	// 計算最大位數下一位的數字
	var nextPower = Math.pow(10, numDigits - 1);
  
	// 計算向上取整的數字
	var roundedValue = Math.ceil(number / nextPower) * nextPower;
  
	return roundedValue;
  }