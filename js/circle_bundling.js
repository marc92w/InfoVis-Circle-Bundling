var margin = 20,
    diameter = 600;
		
var diameter = 960,
radius = diameter / 2,
innerRadius = radius - 120;

var cluster = d3.layout.cluster()
	.size([360, innerRadius])
	.sort(null)
	.value(function(d) { return d.size; });

var color = d3.scale.linear()
	.domain([-1, 5])
	.range(["hsl(0,0%,94%)", "hsl(0,0%,19%)"])
	.interpolate(d3.interpolateHcl);

var pack = d3.layout.pack()
	.padding(2)
	.size([diameter - margin, diameter - margin])
	.value(function(d) { return d.size; })
	
var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var svg = d3.select("body").append("svg")
  .attr("width", diameter)
  .attr("height", diameter)
  .append("g")
  .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

d3.json("js/data.json", function(json) {
		root = json;
		
    var focus = root,
    nodes = pack.nodes(root),
      view,
			links = packageImports(nodes);

    var circle = svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("class", function(d) { 
				return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; 
			})
      .style("fill", function(d) { 
				return d.children ? color(d.depth) : null; 
			})
      .on("click", function(d) {
				if (focus !== d) zoom(d), d3.event.stopPropagation(); 
			});

    var text = svg.selectAll("text")
				.data(nodes)
      .enter()
				.append("text")
				.attr("class", "label")
				.style("fill-opacity", function(d) { 
					return d.parent === root ? 1 : 0; 
				})
				.style("display", function(d) { 
					return d.parent === root ? null : "none";
				})
				.text(function(d) { return d.name; });

    var node = svg.selectAll("circle,text");
		
		svg.selectAll(".link")
      .data(bundle(links))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", line);

    d3.select("body")
      .style("background", color(-1))
      .on("click", function() { zoom(root); });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
			var focus0 = focus; focus = d;

			var transition = d3.transition()
				.duration(d3.event.altKey ? 7500 : 750)
				.tween("zoom", function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
					return function(t) { zoomTo(i(t)); };
				});

			transition.selectAll("text")
				.filter(function(d) { 
					return d.parent === focus || this.style.display === "inline"; 
				})
				.style("fill-opacity", function(d) { 
					return d.parent === focus ? 1 : 0; 
				})
				.each("start", function(d) { 
					if (d.parent === focus) this.style.display = "inline"; 
				})
				.each("end", function(d) { 
					if (d.parent !== focus) this.style.display = "none"; 
				});
    }

    function zoomTo(v) {
      var k = diameter / v[2]; 
			view = v;
      node.attr("transform", function(d) { 
				return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; 
			});
      circle.attr("r", function(d) { 
				return d.r * k;
			});
    }
  });

d3.select(self.frameElement).style("height", diameter + "px");

// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }

  classes.forEach(function(d) {
    find(d.name, d);
  });

  return map[""];
}

// Return a list of imports for the given array of nodes.
function packageImports(nodes) {
  var map = {},
      imports = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.name] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.imports) d.imports.forEach(function(i) {
      imports.push({source: map[d.name], target: map[i]});
    });
  });

  return imports;
}