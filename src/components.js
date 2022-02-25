export const Colors = {
	'lightblue': { area: '#3366CC', alpha: 0.45, stroke: '#3366CC' },
	'magenta'  : { area: '#FF005E' },
	'yellow'   : { area: '#FF0' },
	'purple'   : { area: '#732C7B' },
	'steelblue': { area: '#4682B4' },
	'red'      : { area: '#F00' },
	'lime'     : { area: '#9CC222', line: '#566B13' }
};

export const Area = ({
	width,
	height,
	xAttr,
	yAttr,
	scaleX,
	scaleY,
	interpolation = "curveLinear"
}) => {
	return d3.area()
		.curve(typeof interpolation === 'string' ? d3[interpolation] : interpolation)
		.x(d => (d.xDiagCoord = scaleX(d[xAttr])))
		.y0(height)
		.y1(d => scaleY(d[yAttr]));
};

export const Path = ({
	name,
	color,
	strokeColor,
	strokeOpacity,
	fillOpacity,
}) => {
	let path = d3.create('svg:path')

	if (name) path.classed(name, true);

	path.style("pointer-events", "none");

	path
	.attr("fill", color || '#3366CC')
	.attr("stroke", strokeColor || '#000')
	.attr("stroke-opacity", strokeOpacity || '1')
	.attr("fill-opacity", fillOpacity || '0.8');

	return path;
};

export const Axis = ({
	type = "axis",
	tickSize = 6,
	tickPadding = 3,
	position,
	height,
	width,
	axis,
	scale,
	ticks,
	tickFormat,
	label,
	labelX,
	labelY,
	name = "",
	onAxisMount,
}) => {
	return g => {
		let [w, h] = [0, 0];
		if (position == "bottom") h = height;
		if (position == "right")  w = width;

		if (axis == "x" && type == "grid") {
			tickSize = -height;
		} else if (axis == "y" && type == "grid") {
			tickSize = -width;
		}

		let axisScale = d3["axis" + position.replace(/\b\w/g, l => l.toUpperCase())]()
			.scale(scale)
			.ticks(ticks)
			.tickPadding(tickPadding)
			.tickSize(tickSize)
			.tickFormat(tickFormat);

		let axisGroup = g.append("g")
			.attr("class", [axis, type, position, name].join(" "))
			.attr("transform", "translate(" + w + "," + h + ")")
			.call(axisScale);

		if (label) {
			axisGroup.append("svg:text")
				.attr("x", labelX)
				.attr("y", labelY)
				.text(label);
		}

		if (onAxisMount) {
			axisGroup.call(onAxisMount);
		}

		return axisGroup;
	};
};

export const Grid = (props) => {
	props.type = "grid";
	return Axis(props);
};

export const PositionMarker = ({
	theme,
	xCoord = 0,
	yCoord = 0,
	labels = {},
	item = {},
	length = 0,
}) => {
	return g => {

		let line = g.select('.height-focus.line');
		let circle = g.select('.height-focus.circle-lower');
		let text = g.select('.height-focus-label');

		if (!line.node()) line = g.append('svg:line');
		if (!circle.node()) circle = g.append('svg:circle');
		if (!text.node()) text = g.append('svg:text');

		if (isNaN(xCoord) || isNaN(yCoord)) return g;

		circle
			.attr("class", theme + " height-focus circle-lower")
			.attr("transform", "translate(" + xCoord + "," + yCoord + ")")
			.attr("r", 6)
			.attr("cx", 0)
			.attr("cy", 0);

		line
			.attr("class", theme + " height-focus line")
			.attr("x1", xCoord)
			.attr("x2", xCoord)
			.attr("y1", yCoord)
			.attr("y2", length);

		text
			.attr("class", theme + " height-focus-label")
			.style("pointer-events", "none")
			.attr("x", xCoord + 5)
			.attr("y", length);

		let label;

		for (var i in labels) {
			label = text.select(".height-focus-" + labels[i].name);

			if (!label.size()) {
				label = text.append("svg:tspan")
					.attr("class", "height-focus-" + labels[i].name)
					.attr("dy", "1.5em");
			}

			label.text(typeof labels[i].value !== "function" ? labels[i].value : labels[i].value(item));
		}

		text.select('tspan').attr("dy", text.selectAll('tspan').size() > 1 ? "-1.5em" : "0em" );
		text.selectAll('tspan').attr("x", xCoord + 5);

		return g;
	}
};

export const LegendItem = ({
	name,
	label,
	width,
	height,
	margins = {},
	color,
	path
}) => {
	return g => {
		g
			.attr("class", "legend-item legend-" + name.toLowerCase())
			.attr("data-name", name);

		g.on('click.legend', () => d3.select(g.node().ownerSVGElement || g)
			.dispatch("legend_clicked", {
				detail: {
					path: path.node(),
					name: name,
					legend: g.node(),
					enabled: !path.classed('leaflet-hidden'),
				}
			})
		);

		g.append("svg:rect")
			.attr("x", (width / 2) - 50)
			.attr("y", height + margins.bottom / 2)
			.attr("width", 50)
			.attr("height", 10)
			.attr("fill", color)
			.attr("stroke", "#000")
			.attr("stroke-opacity", "0.5")
			.attr("fill-opacity", "0.25");

		g.append('svg:text')
			.text(L._(label || name))
			.attr("x", (width / 2) + 5)
			.attr("font-size", 10)
			.style("text-decoration-thickness", "2px")
			.style("font-weight", "700")
			.attr('y', height + margins.bottom / 2)
			.attr('dy', "0.75em");

		return g;
	}
};

export const Tooltip = ({
	xCoord,
	yCoord,
	width,
	height,
	labels = {},
	item = {},
}) => {
	return g => {

		let line = g.select('.mouse-focus-line');
		let box = g.select('.mouse-focus-label');

		if (!line.node()) line = g.append('svg:line');
		if (!box.node()) box = g.append("g");

		let rect = box.select(".mouse-focus-label-rect");
		let text = box.select(".mouse-focus-label-text");

		if (!rect.node()) rect = box.append("svg:rect");
		if (!text.node()) text = box.append("svg:text");

		// Sets focus-label-text position to the left / right of the mouse-focus-line
		let xAlign = 0;
		let yAlign = 0;
		let bbox   = { width: 0, height: 0 };
		try { bbox = text.node().getBBox(); } catch (e) { return g; }

		if (xCoord) xAlign = xCoord + (xCoord < width / 2 ? 10 : -bbox.width - 10);
		if (yCoord) yAlign = Math.max(yCoord - bbox.height, L.Browser.webkit ? 0 : -Infinity);

		line
			.attr('class', 'mouse-focus-line')
			.attr('x2', xCoord)
			.attr('y2', 0)
			.attr('x1', xCoord)
			.attr('y1', height);

		box
			.attr('class', 'mouse-focus-label');

		rect
			.attr("class", "mouse-focus-label-rect")
			.attr("x", xAlign - 5)
			.attr("y", yAlign - 5)
			.attr("width", bbox.width + 10)
			.attr("height", bbox.height + 10)
			.attr("rx", 3)
			.attr("ry", 3);

		text
			.attr("class", "mouse-focus-label-text")
			.style("font-weight", "700")
			.attr("y", yAlign);

		let label;

		for (let i in labels) {
			label = text.select(".mouse-focus-label-" + labels[i].name);

			if (!label.size()) {
				label = text.append("svg:tspan", ".mouse-focus-label-x")
					.attr("class", "mouse-focus-label-" + labels[i].name)
					.attr("dy", "1.5em");
			}

			label.text(typeof labels[i].value !== "function" ? labels[i].value : labels[i].value(item));
		}

		text.select('tspan').attr("dy", "1em");
		text.selectAll('tspan').attr("x", xAlign);

		return g;
	};
};

export const Ruler = ({
	height,
	width,
}) => {
	return g => {

		g.data([{
				"x": 0,
				"y": height,
			}])
			.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

		let rect   = g.selectAll('.horizontal-drag-rect')
			.data([{ w: width }]);

		let line   = g.selectAll('.horizontal-drag-line')
			.data([{ w: width }]);

		let label  = g.selectAll('.horizontal-drag-label')
			.data([{ w: width - 8 }]);

		let symbol = g.selectAll('.horizontal-drag-symbol')
			.data([{
				"type": d3.symbolTriangle,
				"x": width + 7,
				"y": 0,
				"angle": -90,
				"size": 50
			}]);

		rect.exit().remove();
		line.exit().remove();
		label.exit().remove();
		symbol.exit().remove();

		rect.enter()
			.append("svg:rect")
			.attr("class", "horizontal-drag-rect")
			.attr("x", 0)
			.attr("y", -8)
			.attr("height", 8)
			.attr('fill', 'none')
			.attr('pointer-events', 'all')
			.merge(rect)
			.attr("width", d => d.w);

		line.enter()
			.append("svg:line")
			.attr("class", "horizontal-drag-line")
			.attr("x1", 0)
			.merge(line)
			.attr("x2", d => d.w);

		label.enter()
			.append("svg:text")
			.attr("class", "horizontal-drag-label")
			.attr("text-anchor", "end")
			.attr("y", -8)
			.merge(label)
			.attr("x", d => d.w)

		symbol
			.enter()
			.append("svg:path")
			.attr("class", "horizontal-drag-symbol")
			.merge(symbol)
			.attr("d",
				d3.symbol()
				.type(d => d.type)
				.size(d => d.size)
			)
			.attr("transform", d => "translate(" + d.x + "," + d.y + ") rotate(" + d.angle + ")");

		return g;
	}
};

export const CheckPoint = ({
	point,
	height,
	width,
	x,
	y
}) => {
	return g => {

		if (isNaN(x) || isNaN(y)) return g;

		if (!point.item || !point.item.property('isConnected')) {
			point.position = point.position || "bottom";

			point.item = g.append('g');

			point.item.append("svg:line")
				.attr("y1", 0)
				.attr("x1", 0)
				.attr("style","stroke: rgb(51, 51, 51); stroke-width: 0.5; stroke-dasharray: 2, 2;");

			point.item
				.append("svg:circle")
				.attr("class", " height-focus circle-lower")
				.attr("r", 3);

			if (point.label) {
				point.item.append("svg:text")
					.attr("dx", "4px")
					.attr("dy", "-4px");
			}
		}

		point.item
			.datum({
				pos: point.position,
				x: x,
				y: y
			})
			.attr("class", d => "point " + d.pos)
			.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

		point.item.select('line')
			.datum({
				y2: ({'top': -y, 'bottom': height - y})[point.position],
				x2: ({'left': -x, 'right': width - x})[point.position] || 0
			})
			.attr("y2", d => d.y2)
			.attr("x2", d => d.x2)

		if (point.label) {
			point.item.select('text')
				.text(point.label);
		}

		return g;
	}
};

export const Domain = ({
	min,
	max,
	attr,
	name,
	forceBounds,
	scale
}) => function(data) {
	attr = attr || name;
	if (scale && scale.attr) attr = scale.attr;
	let domain = data && data.length ? d3.extent(data, d => d[attr]) : [0, 1];
	if (typeof min !== "undefined" && (min < domain[0] || forceBounds)) {
		domain[0] = min;
	}
	if (typeof max !== "undefined" && (max > domain[1] || forceBounds)) {
		domain[1] = max;
	}
	return domain;
};

export const Range = ({
	axis
}) => function(width, height) {
	if (axis == 'x')      return [0, width];
	else if (axis == 'y') return [height, 0];
};

export const Scale = ({
	data,
	attr,
	min,
	max,
	forceBounds,
	range,
}) => {
	return d3.scaleLinear()
		.range(range)
		.domain(Domain({min, max, attr, forceBounds})(data));
};

export const Bisect = ({
	data = [0, 1],
	scale,
	x,
	attr
}) => {
	return d3
		.bisector(d => d[attr])
		.left(data, scale.invert(x));
};

export const Chart = ({
	width,
	height,
	margins = {},
	ruler,
}) => {

	const _width   = width - margins.left - margins.right;
	const _height  = height - margins.top - margins.bottom;

	// SVG Container
	const svg   = d3.create("svg:svg").attr("class", "background");

	// SVG Groups
	const g     = svg.append("g");
	const panes = {
		grid   : g.append("g").attr("class", "grid"),
		area   : g.append('g').attr("class", "area"),
		point  : g.append('g').attr("class", "point"),
		axis   : g.append('g').attr("class", "axis"),
		brush  : g.append("g").attr("class", "brush"),
		tooltip: g.append("g").attr("class", "tooltip").attr('display', 'none'),
		ruler  : g.append('g').attr('class', 'ruler'),
		legend : g.append('g').attr("class", "legend"),
	};

	// SVG Paths
	const clipPath      = panes.area.append("svg:clipPath").attr("id", 'elevation-clipper');
	const clipRect      = clipPath.append("svg:rect");

	// Canvas Paths
	const foreignObject = panes.area.append('svg:foreignObject');
	const canvas        = foreignObject.append('xhtml:canvas').attr('class', 'canvas-plot');
	const context       = canvas.node().getContext('2d');

	// Add tooltip
	panes.tooltip.call(Tooltip({ xCoord: 0, yCoord: 0, height: _height, width : _width, labels: {} }));

	// Add the brushing
	let brush   = d3.brushX().on('start.cursor end.cursor brush.cursor', () => panes.brush.select(".overlay").attr('cursor', null));

	// Scales
	const scale = (opts) => ({ x: Scale(opts.x), y: Scale(opts.y)});

	let utils = {
		clipPath,
		canvas,
		context,
		brush,
	};

	let chart = {
		svg,
		g,
		panes,
		utils,
		scale,
	};

	// Resize
	chart._resize  = ({
		width,
		height,
		margins = {},
		ruler,
	}) => {

		const _width   = width - margins.left - margins.right;
		const _height  = height - margins.top - margins.bottom;

		svg.attr("viewBox", `0 0 ${width} ${height}`)
			.attr("width", width)
			.attr("height", height);

		g.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

		// Partially fix: https://github.com/Raruto/leaflet-elevation/issues/123
		if(/Mac|iPod|iPhone|iPad/.test(navigator.platform) && /AppleWebkit/i.test(navigator.userAgent)) {
			canvas
			.style("transform", "translate(" + margins.left + "px," + margins.top + "px)");
		}

		clipRect
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", _width)
			.attr("height", _height);

		foreignObject
			.attr('width', _width)
			.attr('height', _height);

		canvas
			.attr('width', _width)
			.attr('height', _height);

		if (ruler) {
			panes.ruler.call(Ruler({ height: _height, width: _width }));
		}

		panes.brush.call(brush.extent( [ [0,0], [_width, _height] ] ));
		panes.brush.select(".overlay").attr('cursor', null);

		chart._width  = _width;
		chart._height = _height;

		chart.svg.dispatch('resize', { detail: { width: _width, height: _height } } );

	};

	chart.pane = (name) => {
		if (!panes[name]) {
			panes[name] = g.append('g').attr("class", name);
		}
		return panes[name];
	}

	chart.get = (name) => utils[name];

	chart._resize({ width, height, margins});

	return chart;
};
