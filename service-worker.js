/*jshint esversion: 6 */

console.log("Loading Service-Worker...");


let loadMap = (geo) => {
  const width = 1920;
  const height = Math.round(width/1.85);

  const projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  const geoPath = d3.geoPath()
    .projection(projection);

  const hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .projection(projection)
    .pathGenerator(geoPath)
    .hexRadius(6);

  const hex = hexgrid([]);
  console.log(hex);
};

// Install Service Worker
self.addEventListener('install', function(event) {
  console.log('Installed Service-Worker!');
  self.importScripts(
    'js/ext/d3-hexgrid.min.js',
    'js/ext/d3.min.js',
    'js/ext/d3-geo-projection.min.js'
  );

  const geoData = d3.json(
    'https://raw.githubusercontent.com/larsvers/map-store/master/earth-lands-10km.json'
  );

  Promise.all([geoData]).then(res => {
    let [geo] = res;
    loadMap(geo);
  });
});

// Service Worker Active
self.addEventListener('activate', function(event){
  console.log('Activated Service-Worker!');
});


