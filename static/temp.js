var map = L.map('map').setView([15.805, 80.9], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// L.marker([51.5, -0.09]).addTo(map)
// .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
// .openPopup();
// var marker = L.marker([15.7, 80.85]).addTo(map);
var latlng = L.latLng(15.7, 80.85);
// var polygon = L.polygon([
// [51.509, -0.08],
// [55.503, -0.08],
// [51.509, -0.04],
// [55.503, -0.04]
// ]).addTo(map);
// marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
// // circle.bindPopup("I am a circle.");
// polygon.bindPopup("I am a polygon.");
// var popup = L.popup()
    // .setLatLng([15.713, 80.95])
    // .setContent("You can start selecting from here")
    // .openOn(map);
    // var tooltip = L.tooltip(latlng, {content: 'Hello world!<br />This is a nice tooltip.'})
    // .addTo(map);
// var corner1 = L.latLng(15.712, 80.927),
// corner2 = L.latLng(15.774, 81.125),
// bounds = L.latLngBounds(corner1, corner2);

// var popup = L.popup();

// function onMapClick(e) {
//     popup
//         .setLatLng(e.latlng)
//         .setContent("You clicked the map at " + e.latlng.toString())
//         .openOn(map);
// }
var drawnItems = L.featureGroup().addTo(map);

// create a Rectangle draw handler
var drawControl = new L.Control.Draw({
  draw: {
    rectangle: {
      shapeOptions: {
        color: '#ffcc33',
        weight: 3
      }
    },
    polygon: false,
    circle: false,
    marker: false,
    polyline: false,
    circlemarker: false
  },
  edit: {
    featureGroup: drawnItems
  }
}).addTo(map);

// when a rectangle is drawn, add it to the drawnItems feature group
map.on('draw:created', function (e) {
  var layer = e.layer;
  drawnItems.addLayer(layer);
  drawControl.remove();
  drawControl.addTo(map);

    // get the coordinates of the selected area
    let coordinates = layer.getLatLngs();
    let lat_min = coordinates[0][0]["lat"];
    let lat_max = coordinates[0][1]["lat"];
    let lng_min = coordinates[0][0]["lng"];
    let lng_max = coordinates[0][2]["lng"];
    // document.getElementById("lat_min").value = lat_min;
    // document.getElementById("lat_max").value = lat_max;
    // document.getElementById("lng_min").value = lng_min;
    // document.getElementById("lng_max").value = lng_max;
    let data = {
      lat_min: lat_min,
      lat_max: lat_max,
      lng_min: lng_min,
      lng_max: lng_max
    }
    console.log(data)
    $(document).ready(function (){
      $.ajax({
        type: "POST",
        url: "/my_flask_route",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function(response) {
          const img = document.createElement('img');
          img.src = 'data:image/png;base64,' + response.image;
      
          // // Add the image to the document body
          document.getElementById("imgcont").appendChild(img);
          // console.log(response)
        }
      });

    })
    // document.getElementById("my-form").submit();

    document.getElementById("lat_lon").innerHTML = `The Selected values range is <br>Latitude = (${lat_min}, ${lat_max})<br>Longitude = (${lng_min}, ${lng_max})`

    // let cont = document.getElementById("imgcont");
    // let img = document.createElement('img');
    // setTimeout(() => {
    //     // img.src = "{{ url_for('static', filename = 'my_plot.png') }}";
    //     cont.appendChild(img);  
    // }, 5000);
    //   let img = new Image();
    //   img.src = "/";
    //   img.onload = function() {
    //     // Do something with the image
    // };
});






// var drawnItems = new L.FeatureGroup();
// map.addLayer(drawnItems);

// var drawControl = new L.Control.Draw({
//     draw: {
//         rectangle: true,
//         marker: false,
//         circle: false,
//         polygon: false,
//         polyline: false
//     },
//     edit: {
//         featureGroup: drawnItems
//     }
// });
// map.addControl(drawControl);

// map.on('draw:created', function (e) {
//     drawnItems.addLayer(e.layer);
// });

// import Map from 'ol/Map.js';
// import View from 'ol/View.js';
// import OSM from 'ol/source/OSM.js';
// import TileLayer from 'ol/layer/Tile.js';

// new Map({
//   layers: [
//     new TileLayer({source: new OSM()}),
//   ],
//   view: new View({
//     center: [0, 0],
//     zoom: 2,
//   }),
//   target: 'map',
// });
