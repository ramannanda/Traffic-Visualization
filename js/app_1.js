/*jshint esversion: 6 */

const container = d3.select('#container');
const svg = container.append('svg');
const element = container.node();

var data = [];

let setup = (geo) => {
  if(!geo) {
    return;
  }

  container.classed("loading", true);
  const width = 1920;
  const height = Math.round(width/1.82);

  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  var geoPath = d3.geoPath()
    .projection(projection);

  const hexgrid = d3.hexgrid()
    .extent([width, height])
    .geography(geo)
    .projection(projection)
    .pathGenerator(geoPath)
    .hexRadius(6);

  const hex = hexgrid([]);

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

  // if('serviceWorker' in navigator) {
  //   navigator.serviceWorker.controller.postMessage("client:ready");
  // }

};




if('serviceWorker' in navigator) {
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
        console.log("Service Worker Registered. \nScope is "+ sw.scope);
        setup(geo);

        console.log(sw);
        // Notify Service Worker

    }).catch(function(err){
      console.error("Service Worker Failed to Register. \nError: " + err);
    });

  });
}


if('serviceWorker' in navigator){
    // Handler for messages coming from the service worker
    navigator.serviceWorker.addEventListener('message', function(event){
        console.log("Client 1 Received Message: " + event.data);

    });

    // const channel = new BroadcastChannel('sw-messages');
    // channel.addEventListener('message', event => {
    //   console.log('Received', event.data);
    //   (function poll() {
    //     setTimeout(function() {
    //       d3.json('/api/data')
    //         .then(res => {
    //           update(res);
    //           poll();
    //         });
    //     }, 1000);
    //   })();


    // });
}



