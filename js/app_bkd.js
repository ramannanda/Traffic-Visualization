function ready(geo, userData) {
  // Some set up.
  const width = 900;
  const height = 500;
  const pr = window.devicePixelRatio || 1;

  // Crisp canvas and context.
  const canvas = d3.select('canvas')
    .attr('width', width * pr)
    .attr('height', height * pr)
    .style('width', `${width}px`);
  const context = canvas.node().getContext('2d');
  context.scale(pr, pr);

  // Background.
  const gradient = context.createRadialGradient(width / 2, height / 2, 5, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, '#0C2648');
  gradient.addColorStop(1, '#091426');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Projection and path.
  const projection = d3.geoRobinson().fitSize([width, height], geo);
  const geoPath = d3.geoPath()
    .projection(projection)
    .context(context);

  // Prep user data.
  userData.forEach(site => {
    const coords = projection([+site.lng, +site.lat]);
    site.x = coords[0];
    site.y = coords[1];
  });

  // Hexgrid generator.
  const hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .projection(projection)
    .pathGenerator(geoPath)
    .hexRadius(2);

  // Hexgrid instanace.
  const hex = hexgrid(userData);

  // Colour scale.
  const counts = hex.grid.layout
    .map(el => el.datapointsWt)
    .filter(el => el > 0);
  const ckBreaks = ss.ckmeans(counts, 4).map(clusters => clusters[0]);
  const colour = d3
    .scaleThreshold()
    .domain(ckBreaks)
    .range(['#293e5a', '#5e6d7c', '#929b9f', '#c7cac1', '#fbf8e3']);

  // Draw prep.
  const hexagon = new Path2D(hex.hexagon());

  // Draw.
  hex.grid.layout.forEach(hex => {
    context.save();
    context.translate(hex.x, hex.y);
    context.fillStyle = colour(hex.datapointsWt);
    context.fill(hexagon);
    context.restore();
  });
}

// Load data.
const world = d3.json(
  'https://raw.githubusercontent.com/larsvers/map-store/master/earth-lands-10km.json'
);
const points = d3.csv(
  'https://raw.githubusercontent.com/larsvers/data-store/master/cities_top_10000_world.csv'
);

Promise.all([world, points]).then(res => {
  let [geoData, userData] = res;

  ready(geoData, userData);
});
