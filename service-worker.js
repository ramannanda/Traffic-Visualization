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
    if (!this.data) {
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

var version = 'v0.0.1';

self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Installed version', version);
  self.importScripts(
    'js/ext/lodash.min.js',
    'js/ext/d3.min.js'
  );
  event.waitUntil(
    fetch('js/ext/cities_top_10000_world.csv').then(function(response) {
      return caches.open(version).then(function(cache) {
        console.log('[ServiceWorker] Cached Population for', version);
        return cache.put('/api/data', response);
      });
    }).then(function() {
      console.log('[ServiceWorker] Skip waiting on install');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Acitvated', version);
  self.clients.matchAll({
    includeUncontrolled: true
  }).then(function(clientList) {
    var urls = clientList.map(function(client) {
      return client.url;
    });
    console.log('[ServiceWorker] Matching clients:', urls.join(', '));
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== version) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[ServiceWorker] Claiming clients for version', version);
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (url.origin === location.origin &&
    url.pathname === '/api/data') {
    console.log('[ServiceWorker] Serving random.jpg for', event.request.url);
    event.respondWith(
      caches.open(version).then(function(cache) {
        return cache.match('/api/data').then(function(response) {
          if (!response) {
            console.error('[ServiceWorker] Missing cache!');
            return response;
          } else {
            return response.text().then(function(body) {
              const data = d3.csvParse(body);
              const randomData = new GeoGenerator(data).calculate();
              return new Response(JSON.stringify(randomData), {
                "status": 200,
                "statusText": "OK",
                "headers": {
                  'Content-Type': 'application/json'
                }
              });
            });
          }
        });
      })
    );
  }
  if (event.request.url.includes('/version')) {
    event.respondWith(new Response(version, {
      headers: {
        'content-type': 'text/plain'
      }
    }));
  }
});
