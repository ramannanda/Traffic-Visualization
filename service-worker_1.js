/*jshint esversion: 6 */

console.log("Loading Service-Worker...");

class GeoGenerator {
  constructor(data) {
    this.data = data;
    this.setup();
  }

  setup() {
    this.total = this.data.reduce(
      function(acc, obj) {
        return acc + parseInt(obj.Population);
      },
      0
    );
  }

  calculate() {
    if(!this.data) {
      return [];
    }

    // Build Weights
    const count = Math.random() * (50 - 10) + 10;
    var points = [];
    for (var i = 0; i < count; i++) {
      const rand = Math.random() * (this.total - 1) + 1;

      var sum = 0;
      for (var j = 0; j < this.data.length; j++) {
        sum += parseInt(this.data[j].Population);

        if (rand < sum) {
          points.push(this.data[j]);
          break;
        }
      }
    }

    // Reduce Points
    const results = _.chain(points)
      .countBy('City')
      .thru(counts =>
        _.chain(points)
        .uniqBy('City')
        .map(item =>
          _.assign(
            item, { count: counts[item.City] }
          )
        ).value()
      ).value();

    return results;
  }
}

let setup = (data) => {
  gen = new GeoGenerator(data);
};

var gen;


self.addEventListener('message', function(event) {
  console.log('Received Message from Client: ' + event.data);
  switch(event.data) {
    case 'client:ready':
      // self.ready.then(function() {
      //   console.log('hi');
      // });
      break;
    default:
      break;
  }
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if(url.origin === location.origin &&
    url.pathname === '/api/data') {
    console.log('Caught request for ' + event.request.url);
    const data = gen.calculate() || {};
    event.respondWith(
      new Response(JSON.stringify(data), {
        "status": 200,
        "statusText": "OK",
        "headers": {
          'Content-Type': 'application/json'
        }
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).then(function(response){
        return response;
      })
    );
  }
});

// Install Service Worker
self.addEventListener('install', function(event) {
  return self.skipWaiting();
  self.importScripts(
    'js/ext/lodash.min.js',
    'js/ext/d3.min.js'
  );

  event.waitUntil(
    d3.csv(
      'js/ext/cities_top_10000_world.csv'
    ).then(data => {
      setup(data);
      return self.skipWaiting();
    })
  );

  console.log('Installed Service-Worker!');
});

// Service Worker Active
self.addEventListener('activate', function(event) {
  console.log('Activated Service-Worker!');
  event.waitUntil(self.clients.claim());
});
