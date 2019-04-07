/*jshint esversion: 6 */

const container = d3.select('#container');
const svg = container.append('svg');
const element = container.node();

const width = 1920;
const height = Math.round(width / 1.82);

var geo;
var data = [];

var hexgrid;

let setup = (geoData) => {
  if (!geoData) {
    return;
  }

  geo = geoData;
  container.classed("loading", true);
  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
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
    .on("click", function(d) {
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


let update = (data) => {
  if(!data || !geo) {
    return;
  }

  console.log("Update");
  var projection = d3.geoRobinson().fitSize(
    [width, height],
    geo
  );

  dHex = hexgrid(data);
  updatedPoints = dHex.grid.layout.filter(x => x.datapoints > 0);
  // updatedPoints = dHex.grid.layout;

  updatedPoints.forEach(pt => {
    //d3.selectAll(`path[transform="translate(${pt.x} ${pt.y})"]`)
    console.log(`translate(${parseInt(pt.x)},${parseInt(pt.y)}) scale(4) rotate(180)`);




    d3.select(`path[transform="translate(${pt.x} ${pt.y})"]`)
      .raise()
        .transition()
        .delay(parseInt(Math.random() * (300 - 100) + 100))
        .duration(400)
        .ease(d3.easeLinear)
        .attrTween("transform", function() {
          return d3.interpolateTransformSvg(
            `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(1)`,
            `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(4)`
          );
        })
        .transition()
        .delay(200)
        .ease(d3.easeLinear)
        .duration(250)
        .attrTween("transform", function() {
          return d3.interpolateTransformSvg(
            `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(4)`,
            `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(1)`
          );
        });
      // .transition()
      //   .delay(200)
      //   .attr("transform", `scale(1)`);

    // d3.select(`path[transform="translate(${pt.x} ${pt.y})"]`)
    //   .raise()
    //     .transition()
    //     .delay(parseInt(Math.random() * (300 - 100) + 100))
    //     .duration(400)
    //     .attr("transform", `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(4)rotate(180)`)
    //   .transition()
    //     .delay(200)
    //     .attr("transform", `translate(${parseInt(pt.x)},${parseInt(pt.y)})scale(1)rotate(-45)`);

  });
};

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
    }, 1000);
  })();
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
      // Notify Service Worker

    }).catch(function(err) {
      console.error("Service Worker Failed to Register. \nError: " + err);
    });

  });
}


// if('serviceWorker' in navigator){
//     // Handler for messages coming from the service worker
//     navigator.serviceWorker.addEventListener('message', function(event){
//         console.log("Client 1 Received Message: " + event.data);

//     });

//     // const channel = new BroadcastChannel('sw-messages');
//     // channel.addEventListener('message', event => {
//     //   console.log('Received', event.data);
//     //   (function poll() {
//     //     setTimeout(function() {
//     //       d3.json('/api/data')
//     //         .then(res => {
//     //           update(res);
//     //           poll();
//     //         });
//     //     }, 1000);
//     //   })();


//     // });
// }
