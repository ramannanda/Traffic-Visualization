/*jshint esversion: 6 */

const container = d3.select('#container');
const svg = container.append('svg');
const element = container.node();

var geo;
var user;

let setup = () => {
  if(!geo || !user) {
    return;
  }

  container.classed("loading", true);
  const width = 1280;
  const height = Math.round(width/1.85);

  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  var projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  var geoPath = d3.geoPath()
    .projection(projection);

  user.forEach(site => {
    const coords = projection([+site.lng, +site.lat]);
    site.x = coords[0];
    site.y = coords[1];
  });

  const hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .projection(projection)
    .pathGenerator(geoPath)
    .hexRadius(4);

  const hex = hexgrid(user);

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
    .attr('transform', d => `translate(${d.x} ${d.y})`)
    .style(
      'fill',
      d => (!d.pointDensity ? '#fff' : colourScale(d.pointDensity))
    )
    .style('stroke', '#C0C0C0');

  container.classed("loading", false);
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
