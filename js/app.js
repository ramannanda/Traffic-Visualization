/*jshint esversion: 6 */

const container = d3.select('#container');
const svg = container.append('svg');
const element = container.node();

const width = 1920;
const height = Math.round(width / 1.82);
const padding = 20;
const barHeight = 200;

var geo;
var data = [];
var deltas = [];

var hexgrid;

var transition;
var xScale;
var yScale;
var xAxis;
var yAxis;

var line;
var area;

var limit = 60 * 1,
  duration = 1000,
  n = 100,
  now = new Date(Date.now() - duration);

const random = d3.randomNormal(0, 1);
var pushData = d3.range(n).map(random);

let setup = (geoData) => {
  if (!geoData) {
    return;
  }

  geo = geoData;
  container.classed("loading", true);
  svg
    .attr('viewBox', `0 0 ${width} ${height + (padding * 2) + barHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const projection = d3.geoRobinson().fitSize(
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

  const hex = hexgrid([]);

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
      'fill', '#fff'
    )
    .style('stroke', '#C0C0C0');


  xScale = d3.scaleTime()
    .domain([now - (n - 2) * duration, now - duration])
    .range([0, width]);

  yScale = d3.scaleLinear()
    .range([barHeight, 0])
    .domain([0, 50]);

  area = d3.area()
    .x((d, i) => xScale(now - (n - 1 - i) * duration))
    .y0(barHeight)
    .y1((d, i) => yScale(d))
    .curve(d3.curveBasis);

  line = d3.line()
    .x((d, i) => xScale(now - (n - 1 - i) * duration))
    .y((d, i) => yScale(d))
    .curve(d3.curveBasis);

  const g = svg.append("g")
    .attr("transform", `translate(0, ${padding + height})`);

  svg.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", barHeight);

  xAxis = d3.axisBottom(xScale).ticks(15).tickSize(-barHeight);
  yAxis = d3.axisLeft(yScale).ticks(5);

  g.append("g")
    .attr("class", "axis--x")
    .attr("transform", "translate(0," + barHeight + ")")
    .call(xAxis);

  g.append('g')
    .attr('class', 'axis--y')
    .call(yAxis);

  transition = d3
    .transition()
    .duration(duration)
    .ease(d3.easeLinear);

  const areapath = g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(pushData)
    .attr("class", "area");

  const path = g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(pushData)
    .attr("class", "line");

  container.classed("loading", false);
};


let update = (delta) => {
  if (!delta || !geo) {
    return;
  }

  console.log("Update");
  var projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  dHex = hexgrid(delta);
  deltas.push(delta);

  updatedPoints = dHex.grid.layout;
  for (var i = 0; i < updatedPoints.length; i++) {
    dHex.grid.layout[i].index = i;
  }
  updatedPoints = updatedPoints.filter(x => x.datapoints > 0);

  data = data.concat(delta);
  data = _.chain(data)
    .countBy('City')
    .thru(counts =>
      _.chain(data)
      .uniqBy('City')
      .map(item =>
        _.assign(
          item, { count: counts[item.City] }
        )
      ).value()
    )
    .value();

  hex = hexgrid(data);

  const colorScale = d3
    .scaleSequential(function(t) {
      var tNew = Math.pow(t, 10);
      return d3.interpolateViridis(t);
    })
    .domain([0, 10].reverse());

  updatedPoints.forEach(pt => {
    d3.select(`path[transform="translate(${pt.x} ${pt.y})"]`)
      .raise()
      .transition()
      .delay(parseInt(Math.random() * (300 - 100) + 100))
      .duration(400)
      .ease(d3.easeLinear)
      .attrTween("transform", function() {
        return d3.interpolateTransformSvg(
          `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(1)rotate(0)`,
          `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(4)rotate(245)`
        );
      })
      .style(
        'fill',
        d => (!hex.grid.layout[pt.index].datapoints ? '#fff' : colorScale(hex.grid.layout[pt.index].datapoints))
      )
      .transition()
      .delay(parseInt(Math.random() * (300 - 100) + 100))
      .ease(d3.easeLinear)
      .duration(250)
      .attrTween("transform", function() {
        return d3.interpolateTransformSvg(
          `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(4)rotate(245)`,
          `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(1)rotate(0)`
        );
      });
  });
};

// Retrieve Data from the Mock Server, Trigger the Graph Update
let poll = () => {
  (function poll() {
    setTimeout(function() {
      console.log('Polling for Content...');
      d3.json('/api/data')
        .then(res => {
          update(res);
          poll();
        }).catch(function(err) {
          console.log(err);
        });
    }, 500);
  })();
};

// Update Line Graph
var tick = function() {
    console.log('Polling for Content...');
    transition = transition
      .each(function() {

        now = new Date();
        xScale.domain([now - (n - 2) * duration, now - duration]);

        if(deltas.length > 0) {
          pushData.push(deltas[deltas.length - 1].length);
        }

        d3.select(".line").attr("d", line).attr("transform", null);

        d3.select('.line')
          .transition(transition)
          .attr("transform", `translate(${(xScale(now - (n - 1) * duration))})`);

        d3.select(".axis--x")
          .transition(transition)
          .call(xAxis);

        d3.select('.area')
          .attr("d", area)
          .attr("transform", null);

        d3.select('.area')
          .transition(transition)
          .attr("transform", `translate(${xScale(now - (n - 1) * duration)})`);

        pushData.shift();
      })
      .transition()
      .on("start", tick);
  };


if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {

    const geoData = d3.json(
      'js/ext/earth-lands-10km.json'
    );

    const sw = navigator.serviceWorker.register('/service-worker.js')
      .then(function() {
        return navigator.serviceWorker.ready;
      });

    Promise.all([geoData, sw]).then(res => {
      let [geo, sw] = res;
      console.log("Service Worker Registered. \nScope is " + sw.scope);
      setup(geo);
      poll();
      tick();

    }).catch(function(err) {
      console.error("Service Worker Failed to Register. \nError: " + err);
    });

  });
}
