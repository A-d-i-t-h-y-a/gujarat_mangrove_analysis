let fd = document.getElementsByName("fromdate")[0];
let td = document.getElementsByName("todate")[0];
let today = new Date().toISOString().split("T")[0];
td.max = today;
fd.max = today;

let chart, data, labels;

let map = L.map('map').setView([15.805, 80.9], 10);

let taskExecuted = false;


function performTask(lab) {
  if (!taskExecuted) {
    // Task logic goes here
    labels = lab;
    const ctx = document.getElementById('chartCanvas');
    let mgr = document.getElementById('mgr');
    let head = document.getElementById('thead');
    var newRow = document.createElement('tr');

    // Create the HTML content for the new row
    var rowContent = `<th scope="row">#</th>`;
    for (i of lab) {
      rowContent += `<th>${i}</th>`;
    }
    newRow.innerHTML = rowContent;
    head.appendChild(newRow)

    // Set the HTML content of the new row
    newRow.innerHTML = rowContent;
    mgr.style.display = "block"
    map.invalidateSize();

    const chartOptions = {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          display: true
        }
      }
    };

    data = {
      labels: labels,
      datasets: []
    };

    // Create the chart
    chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: chartOptions
    });

    // Set the flag to true to indicate that the task has been executed
    taskExecuted = true;
  }
}

// performTask([])

function appendData(newData, lab) {
  const dataset = chart.data.datasets;
  // print(type(dataset))
  dataset.push(newData);
  // chart.data.labels.push(lab)
  // console.log(newData)
  chart.update();
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let latlng = L.latLng(15.7, 80.85);

let drawnItems = L.featureGroup().addTo(map);

// create a Rectangle draw handler
let drawControl = new L.Control.Draw({
  draw: {
    rectangle: {
      shapeOptions: {
        color: "black",
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


function getRandomColor() {
  // Generate a random color in hexadecimal format
  // Generate random RGB values in the range of 128-255 (instead of 0-128)
  // Generate random RGB values in the range of 0-255
  var red = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);

  // Convert the RGB components to hexadecimal and concatenate them
  return "#" + ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1);


}

function getContrastColor(color) {
  const rgb = color.match(/\d+/g);
  const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;

  return brightness >= 128 ? "black" : "white";
}

function send_req(col, send_data) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/my_flask_route", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.responseType = "json";
  document.getElementById("loader").classList.remove("d-none");
  // document.getElementById("loader").scrollIntoView({ behavior: "smooth", block: "end" });
  window.scrollTo(0, document.body.scrollHeight);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.UNSENT) {
      console.log("In Progress");
    } else if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        // Process the response here
        if (xhr.response.error) {
          console.log(xhr.response.error);
          document.getElementById("loader").classList.add("d-none");
          const div = document.createElement('div');
          const span = document.createElement('span');
          let text = document.createElement('p');
          div.style.width = "48%";
          text.innerHTML = xhr.response.error;
          text.style.cssText = "width: 100%; height: 80%; border: 2px solid " + col + "; margin: 2rem 0rem; display: block; border-radius: 10px;";
          span.classList.add("badge", "text-bg-danger");
          span.innerHTML = `${send_data['index']}`;
          span.style.float = "right";
          span.style.margin = "1.2rem 0rem";
          div.appendChild(span);
          div.appendChild(text);
          document.getElementById("imgcont").appendChild(div)
        }
        else {
          document.getElementById("loader").classList.add("d-none")
          // const maindiv = document.getElementById("mgr");
          const div = document.createElement('div');
          const span = document.createElement('span');
          const maxim = document.createElement('span');
          const img = document.createElement('img');
          const m = document.getElementById('map');
          // const h = document.getElementsByClassName('heading')[0];
          // h.classList.remove()
          // maindiv.classList.add("row")
          // m.classList.add("col")
          // maxim.innerHTML = "&#x25A1;";
          // maxim.classList.add("maximize-icon")
          // div.appendChild(maxim)
          m.style.width = "50%"
          let tableBody = document.getElementById('tbody');
          let newRow = document.createElement('tr');
          count++
          // Create the HTML content for the new row
          let rowContent = `<th style="background-color: ${col}; color: ${getContrastColor(col)}">${count}</th>`;

          for (i of xhr.response.data) {
            rowContent += `<td>${i}</td>`
          }

          // Set the HTML content of the new row
          newRow.innerHTML = rowContent;

          performTask(xhr.response.labels);

          // Append the new row to the table body
          tableBody.appendChild(newRow);
          appendData({
            label: `${xhr.response.area}`,
            data: xhr.response.data,
            fill: false,
            borderColor: `${col}`,
            tension: 0.1
          }, xhr.response.labels)
          div.style.width = "48%";
          img.src = 'data:image/png;base64,' + xhr.response.image;
          img.style.width = "100%";
          img.style.border = `2px solid ${col}`;
          img.style.margin = "2rem 0rem";
          img.style.borderRadius = "10px"
          span.classList.add("badge", "text-bg-primary");
          span.innerHTML = `${xhr.response.area},${send_data['index']}`;
          span.style.float = "right";
          span.style.margin = "1.2rem 0rem";
          // updateGraph();
          // div.style.margin = "0px 4px"
          // document.getElementById('imgcont').appendChild("<span class='badge text-bg-primary'>Primary</span>")

          // Add the image element to the document body
          // div.id = `openModalBtn${count}`;
          // div.classList.add("fade-out")
          div.appendChild(span);
          div.appendChild(img);
          document.getElementById("imgcont").appendChild(div)
          // const openModalBtn = document.getElementById(`openModalBtn${count}`);
          // const modal = document.getElementById("modal");
          // const closeBtn = document.querySelector(".close");

          // openModalBtn.addEventListener("click", function () {
          //   modal.style.display = "block";
          // });

          // closeBtn.addEventListener("click", function () {
          //   modal.style.display = "none";
          // });

          // window.addEventListener("click", function (event) {
          //   if (event.target == modal) {
          //     modal.style.display = "none";
          //   }
          // });
        }
      }
    }
  };
  xhr.send(JSON.stringify(send_data));
}


function OnChange() {
  try {
    let lat = parseFloat(document.getElementById("latitude").value);
    let lon = parseFloat(document.getElementById("longitude").value);
    let buf = parseFloat(document.getElementById("buffer").value);
    let todate = td.value;
    let fromdate = fd.value;
    let calc = document.getElementById("calc");
    let index = calc.value;
    if (lat != NaN && lon != NaN && buf != NaN) {
      let polygonCoordinates = [
        [lat - buf, lon - buf],
        [lat + buf, lon - buf],
        [lat + buf, lon + buf],
        [lat - buf, lon + buf]
      ];
      let lat_min = lat - buf;
      let lat_max = lat + buf;
      let lng_min = lon - buf;
      let lng_max = lon + buf;
      // Create a polygon using the coordinates
      let col = "#" + Math.floor(Math.random() * 16777215).toString(16);
      var polygon = L.polygon(polygonCoordinates, { color: col }).addTo(map);
      let data = {
        lat_min: lat_min,
        lat_max: lat_max,
        lng_min: lng_min,
        lng_max: lng_max,
        todate: todate,
        fromdate: fromdate,
        index: index
      }
      console.log(data)
      send_req(col, data)
      document.getElementById("lat_lon").innerHTML = `The Selected values range is <br>Latitude = (${lat_min}, ${lat_max})<br>Longitude = (${lng_min}, ${lng_max})`
    }
  } catch (error) { }
}
var count = 0
// when a rectangle is drawn, add it to the drawnItems feature group
map.on('draw:created', function (e) {
  var layer = e.layer;
  layer.options.color = getRandomColor();
  drawnItems.addLayer(layer);
  drawControl.remove();
  drawControl.addTo(map);

  // get the coordinates of the selected area
  let coordinates = layer.getLatLngs();
  console.log(coordinates)
  let lat_min = coordinates[0][0]["lat"];
  let lat_max = coordinates[0][1]["lat"];
  let lng_min = coordinates[0][0]["lng"];
  let lng_max = coordinates[0][2]["lng"];
  let todate = td.value;
  let fromdate = fd.value;
  let calc = document.getElementById("calc");
  let index = calc.value;
  let data = {
    lat_min: lat_min,
    lat_max: lat_max,
    lng_min: lng_min,
    lng_max: lng_max,
    todate: todate,
    fromdate: fromdate,
    index: index
  }
  console.log(data)
  send_req(layer.options.color, data);
});
