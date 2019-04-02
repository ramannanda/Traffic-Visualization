/*jshint esversion: 6 */

const container = d3.select('#container');
const svg = container.append('svg');
const element = container.node();

var geo;
var user;

var projection;

var hexgrid;
var hex;

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};


let setup = () => {
  if(!geo || !user) {
    return;
  }

  container.classed("loading", true);
  const width = 1920;
  const height = Math.round(width/1.85);

  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  var geoPath = d3.geoPath()
    .projection(projection);

  hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .projection(projection)
    .pathGenerator(geoPath)
    .hexRadius(6);

  hex = hexgrid(user);

  const colourScale = d3
    .scaleSequential(function(t) {
      var tNew = Math.pow(t, 10);
      return d3.interpolateViridis(tNew);
    })
    .domain([...hex.grid.extentPointDensity].reverse());

  svg
    .append('g')
    .selectAll('path')
    .data(hex.grid.layout)
    .enter()
    .append('path')
    .attr('d', hex.hexagon())
    .attr('id', function(d) {
      return d.id;
    })
    .attr('transform', d => `translate(${d.x} ${d.y})`)
    .style(
      'fill',
      d => (!d.pointDensity ? '#fff' : colourScale(d.pointDensity))
    )
    .style('stroke', '#C0C0C0')
    .on("click",function(d){
      d3.select(this)
        .raise()
        .transition()
        .duration(100)
        .attr("transform", `translate(${d.x},${d.y})scale(5)rotate(180)`)
      .transition()
        .delay(100)
        .attr("transform", `translate(${d.x},${d.y})scale(1)rotate(0)`);
    });

  container.classed("loading", false);
};

let update = (push) => {
  if(!geo || !user) {
    return;
  }

  var push = [{
    City: "New York City",
    Population: "100",
    lat: "40.7141667",
    lng: "-74.0063889"
  }];

  const width = 1920;
  const height = Math.round(width/1.85);

  var projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  dHex = hexgrid(push);
  updatedPoints = dHex.grid.layout.filter(x => x.datapoints > 0);

  updatedPoints.forEach(pt => {
    //d3.selectAll(`path[transform="translate(${pt.x} ${pt.y})"]`)
    d3.select(`path[transform="translate(${pt.x} ${pt.y})"]`)
      .raise()
        .transition()
        .duration(550)
        .attr("transform", `translate(${pt.x},${pt.y})scale(5)rotate(180)`)
      .transition()
        .delay(500)
        .attr("transform", `translate(${pt.x},${pt.y})scale(1)rotate(-45)`);

      // .remove()

      // replace with new hexgrid
  });


  const colourScale = d3
    .scaleSequential(function(t) {
      var tNew = Math.pow(t, 10);
      return d3.interpolateViridis(tNew);
    })
    .domain([...hex.grid.extentPointDensity].reverse());

  svg
    .selectAll('g path')
    .remove()
    .exit()
    .data(hex.grid.layout)
    .enter()
    .append('path')
    .attr('d', hex.hexagon())
    .attr('transform', d => `translate(${d.x} ${d.y})`)
    .style(
      'fill',
      d => (!d.pointDensity ? '#fff' : colourScale(d.pointDensity))
    )
    .style('stroke', '#C0C0C0');

  // https://pusher.com/tutorials/live-graph-d3

  // https://bl.ocks.org/larsvers/ec4f4c96941b0fa97869184ab9a9fb5b

  // http://bl.ocks.org/phil-pedruco/7745589

  // https://bl.ocks.org/cherdarchuk/822ba3ead00a0ffdbcfd4a144e763e31

  // https://stackoverflow.com/questions/10884886/d3js-how-to-get-lat-log-geocoordinates-from-mouse-click
  // hex.grid.imageCenters.forEach(function(pt) { console.log(projection.invert([pt.x, pt.y])); });


  // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
};

const geoData = d3.json(
  'https://raw.githubusercontent.com/larsvers/map-store/master/earth-lands-10km.json'
);
const points = d3.csv(
  'https://raw.githubusercontent.com/larsvers/data-store/master/cities_top_10000_world.csv'
);

Promise.all([geoData, points]).then(res => {
  let [geoData, userData] = res;
  user = userData;
  geo = geoData;
  setup();
});
