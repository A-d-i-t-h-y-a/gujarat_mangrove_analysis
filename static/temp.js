let currentDate = new Date();
document.getElementsByName("todate")[0].value = currentDate.toISOString().split('T')[0]
let navitem = document.getElementsByClassName("nav-link");
let acc = document.getElementsByClassName("accordion");
function act(cont) {
  for (let item of navitem) {
    let e = document.getElementsByClassName(cont)[0];
    if (item === e && item.classList.contains("active")) {
      break;
    }
    if (item === e && !(item.classList.contains("active"))) {
      item.classList.add("active");
    }
    else {
      item.classList.remove("active");
    }
  }
  for (let content of acc) {
    if (content.id === cont && content.classList.contains("act")) {
      break;
    }
    if (content.id === cont && !(content.classList.contains("act"))) {
      content.classList.add("act");
    }
    else {
      content.classList.remove("act");
    }
  }
}

window.addEventListener("scroll", function () {
  var scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (document.documentElement.scrollTop > 1000) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
});

document.getElementById("scrollToTopBtn").addEventListener("click", function () {
  document.documentElement.scrollTop = 0; // Scroll to the top of the page
});

function relocate() {
  map.flyTo([22.5, 69.9], 9);
}

function performTask(lab, ind) {
  if (!taskExecuted) {
    // Task logic goes here
    labels = lab;
    const ctx = document.getElementById('chartCanvas');
    let mgr = document.getElementById('mgr');
    let head = document.getElementById('thead');
    let tcont = document.getElementById('tcont');
    const m = document.getElementById('map');
    let npills = document.getElementById("navpills");
    let imagedata = document.getElementById("imagedata");
    m.style.width = "75%"
    ch = Chart.instances[0];
    // z++;
    // Check if a chart instance exists
    if (ch) {
      // Destroy the existing chart
      // ch.destroy();
      tcont.style.display = 'block'
      var rowContent = `<th scope="row">Analysis</th>` + `<th>Area Name</th>`;
      for (i of lab) {
        rowContent += `<th>${i}</th>`;
      }
      // newRow.innerHTML = rowContent;
      // head.appendChild(newRow)
      head.innerHTML = `<tr>${rowContent}</tr>`;
      if(!document.getElementsByClassName(ind)[0]){
        npills.insertAdjacentHTML("beforeend", `<li class="nav-item">
      <button class="nav-link me-2 ${ind}" aria-current="page" href="#"
      onclick="act('${ind}')">${document.getElementById(ind).innerHTML}</button>
      </li>`);
      }
      if (ind != "ML Analysis") {
        imagedata.insertAdjacentHTML("beforeend", `<div class="accordion" id="${ind}">
      <div id="imgcont${ind.replaceAll(" ", "_")}" class="d-flex flex-row flex-wrap justify-content-between h-5" style="margin: 1.5rem 0rem;">
      </div>
    </div>`);
      }
      else {
        imagedata.insertAdjacentHTML("beforeend", `<div class="accordion act" id="${ind}">
        <div id="plot-container"></div>
      </div>`);
      }
      chart.data = {
        labels: labels,
        datasets: []
      };
      chart.options.plugins.title.text = (ind == "Mangrove Analysis") ? "Mangrove Area Change(sq.km)" : document.getElementById(ind).innerHTML;
      chart.options.scales.y.title.text = (ind != "Mangrove Analysis") ? (ind != "ML Analysis")?"Avg " + ind:"Actual Values" : "Mangrove Area (sq.km)";
      chart.update();
      taskExecuted = true;
      return;
    }
    npills.insertAdjacentHTML("beforeend", `<li class="nav-item">
    <button class="nav-link active me-2 ${ind}" aria-current="page" href="#"
    onclick="act('${ind}')">${document.getElementById(ind).innerHTML}</button>
    </li>`);
    if(ind != "ML Analysis"){
      imagedata.insertAdjacentHTML("beforeend", `<div class="accordion act" id="${ind}">
      <div id="imgcont${ind.replaceAll(" ", "_")}" class="d-flex flex-row flex-wrap justify-content-between h-5" style="margin: 1.5rem 0rem;">
      </div>
    </div>`);
    }
    else{
      imagedata.insertAdjacentHTML("beforeend", `<div class="accordion act" id="${ind}">
        <div id="plot-container"></div>
      </div>`);
    }
    // var newRow = document.createElement('tr');

    // Create the HTML content for the new row
    // console.log(ind)
    if(ind!=="ML Analysis"){
      tcont.style.display = 'block'
      var rowContent = `<th scope="row">Analysis</th>` + `<th>Area Name</th>`;
      for (i of lab) {
        rowContent += `<th>${i}</th>`;
      }
      // newRow.innerHTML = rowContent;
      // head.appendChild(newRow)
      head.innerHTML = `<tr>${rowContent}</tr>`;
      // Set the HTML content of the new row
      // newRow.innerHTML = rowContent;
    }
    mgr.style.display = "block";
    map.invalidateSize();

    const chartOptions = {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date"
          }
        },
        y: {
          title: {
            display: true,
            text: (ind != "Mangrove Analysis") ? (ind != "ML Analysis")?"Avg " + ind:"Actual Values" : "Mangrove Area (sq.km)"
          }
        }

      },
      plugins: {
        title: {
          display: true,
          text: (ind == "Mangrove Analysis") ? "Mangrove Area Change(sq.km)" : document.getElementById(ind).innerHTML
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
  console.log(color)
  const rgba = color.match(/[\d.]+/g);
  const alpha = parseFloat(rgba[3]);

  if (alpha < 1) {
    // If the color is transparent, you can choose a contrasting color based on your preference
    // For example, you can return "black" for transparent colors
    return "black";
  }

  const brightness = (parseFloat(rgba[0]) * 299 + parseFloat(rgba[1]) * 587 + parseFloat(rgba[2]) * 114) / 1000;

  return brightness >= 128 ? "black" : "white";
}

// Function to append HTML content to the element
function appendContent(newContent, ind) {
  // Generate some new HTML content
  // Append the new content to the element without overwriting the existing content
  document.getElementById(`imgcont${ind.replaceAll(" ", "_")}`).insertAdjacentHTML("afterbegin", newContent);

  try {
    const imgElement = document.querySelector(`#openModalBtn${count} img`);
    const maximizeIcon = document.querySelector(`#openModalBtn${count} .maximize-icon`);

    // Add event listener to the img element
    imgElement.addEventListener('mouseenter', () => {
      maximizeIcon.style.opacity = "1";
    });

    imgElement.addEventListener('mouseleave', () => {
      // maximizeIcon.style.display = "none";
      maximizeIcon.style.opacity = "0";
    });
    const openModalBtn = document.querySelector(`#openModalBtn${count} img`);
    const modal = document.getElementById("modal");
    const closeBtn = document.querySelector(".close");
    const mimg = document.getElementById("max_img");

    openModalBtn.addEventListener("click", function (event) {
      modal.style.display = "block";
      mimg.src = event.target.src;
    });

    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    });
  } catch (error) { console.log("No Data Found") }
}

function displayalert(msg) {
  document.getElementsByClassName("alert")[0].style.display = "block"
  document.getElementsByClassName("alert")[0].innerHTML = msg
  setTimeout(() => {
    document.getElementsByClassName("alert")[0].style.opacity = "1"
  }, 10);
  setTimeout(() => {
    document.getElementsByClassName("alert")[0].style.opacity = "0"
  }, 3500);
  setTimeout(() => {
    document.getElementsByClassName("alert")[0].style.display = "none"
  }, 7000);
}
let klm = 0;

var targetElement = document.getElementById("loader");

function send_req(col, send_data, drawnRectangle) {
  document.getElementById("loader").classList.remove("d-none");
  targetElement.scrollIntoView({ behavior: "smooth" });
  fetch('/my_flask_route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(send_data)
  })
    .then(response => response.json())
    .then(data => {
      if (data && data.error) {
        document.getElementById("loader").classList.add("d-none");
        displayalert("No Data Available at the Area you selected. Kindly Select other Area")
      }
      else if (data && data.plot) {
        document.getElementById("loader").classList.add("d-none");
        if (send_data['index'] != a) {
          a = send_data['index']
          taskExecuted = false
        }
        performTask(data.points.labels, send_data['index']);
        const plotData = JSON.parse(data.plot);
        console.log(plotData)
        // document.getElementById('randomForest').style.display = "block"
        let newContent = `<div id="plot-container-${klm}"></div>`;
        document.getElementById("plot-container").insertAdjacentHTML("afterbegin", newContent)
        Plotly.newPlot(`plot-container-${klm}`, plotData);
        document.getElementById(`plot-container-${klm}`).style.cssText = `border: 2px solid ${col}; margin: 5px 0px; border-radius: 5px;`
        klm++;
        appendData({
          label: `${data.area_name}`,
          data: data.points.actual_values,
          fill: false,
          borderColor: `${col}`,
          tension: 0.1
        }, data.points.labels)
      }
      else {
        count++;
        targetElement = document.getElementById("tcont");
        document.getElementById("loader").classList.add("d-none");
        let tableBody = document.getElementById('tbody');
        let newRow = document.createElement('tr');
        // Create the HTML content for the new row
        let rowContent = `<th id="scrollBtn${count}" style="background-color: ${col}; color: ${getContrastColor(col)}">${z++} ${(send_data['index'] != "Mangrove Analysis") ? "Avg" + send_data['index'] : "Mangrove Area"}</th><td>${(data.area != "") ? data.area : "Area Not Identified"}</td>`;

        for (i of data.data) {
          rowContent += `<td>${(send_data['index'] == "Mangrove Analysis") ? i + " sq.km" : i}</td>`
        }

        if (send_data['index'] != a) {
          a = send_data['index']
          taskExecuted = false
        }
        // Set the HTML content of the new row
        newRow.innerHTML = rowContent;

        performTask(data.labels, send_data['index']);

        // Append the new row to the table body
        tableBody.appendChild(newRow);
        appendData({
          label: `${data.area}`,
          data: data.data,
          fill: false,
          borderColor: `${col}`,
          tension: 0.1
        }, data.labels)
        let newContent = `<div id="openModalBtn${count}" class="fade-out" style="${(send_data['index'] == "Mangrove Analysis") ? "" : "width:48%"}">
        <span class="badge text-bg-primary" style="float: right; margin: 1.2rem 0rem;">${data.area},${document.getElementById(send_data['index']).innerHTML}</span>
        <div style="position: relative;">
        <span class="maximize-icon"><i class="bi bi-zoom-in"></i></span>
        <img src="data:image/png;base64,${data.image}"
        style="width: 100%; border: 2px solid ${col}; margin: 2rem 0rem; border-radius: 10px;">
        </div>
        </div>`;
        appendContent(newContent, send_data['index']);
        document.getElementById(`scrollBtn${count}`).addEventListener("click", function () {
          var targetElement = document.getElementById(`openModalBtn${count}`);
          targetElement.scrollIntoView({ behavior: "smooth" });
        });
        // if (send_data['index'] == "Mangrove Analysis") {
        //   count++;
        //   newContent = `<div id="openModalBtn${count}" class="fade-out" style="width: 48%;">
        //   <span class="badge text-bg-primary" style="float: right; margin: 1.2rem 0rem;">${data.area},${send_data['index']}</span>
        //   <div style="position: relative;">
        //   <span class="maximize-icon"><i class="bi bi-zoom-in"></i></span>
        //   <img src="data:image/png;base64,${data.chman}"
        //   style="width: 100%; height: 16.8rem; border: 2px solid ${col}; margin: 2rem 0rem; border-radius: 10px;">
        //   </div>
        //   </div>`;
        //   appendContent(newContent);
        // }
      }
    }).catch(error => {
      document.getElementById("loader").classList.add("d-none");
      displayalert("An Error Occured While Fetching Data")
      console.log('An error occurred:', error);
    });
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
      send_req(col, data, polygonCoordinates)
      // document.getElementById("lat_lon").innerHTML = `The Selected values range is <br>Latitude = (${lat_min}, ${lat_max})<br>Longitude = (${lng_min}, ${lng_max})`
    }
  } catch (error) { }
}

let fd = document.getElementsByName("fromdate")[0];
let td = document.getElementsByName("todate")[0];
let today = new Date().toISOString().split("T")[0];
// let randomForest = document.getElementById('randomForest')
td.max = today;
fd.max = today;

let chart, data, labels;

let taskExecuted = false;
let a = ""
let z = 1;
var count = 0

let map = L.map('map').setView([22.5, 69.9], 9);

fetch('/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    // for(let i in data){
    //   console.log(i)
    // }
    console.log(data.data)
    for(let i of data.data){
      // var polygonCoords = [
      //   [[80.06369921260253, 16.278761841360236],
      //    [81.09135078500897, 16.280813604615744],
      //    [81.09090724198668, 15.288158060683616],
      //    [80.06824451551739, 15.286237505336244],
      //    [80.06369921260253, 16.278761841360236]]
      // ];
      
      // Create a Leaflet polygon
      var reversedCoords = i.map(function(arr) {
        return arr.map(function(coord) {
            return [coord[1], coord[0]];
        });
    });
      var polygon = L.polygon(reversedCoords, {color: 'blue'}).addTo(map);
      
      // Fit the map bounds to the polygon
      map.fitBounds(polygon.getBounds());
    }
  }).catch(error => {
    document.getElementById("loader").classList.add("d-none");
    displayalert("An Error Occured While Fetching Data")
    console.log('An error occurred:', error);
  });

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



// Get the element to append the content to
// let element = document.getElementById("imgcont");
let d;

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
  let polygonCoordinates = [
    [lat_min, lng_min],
    [lat_max, lng_min],
    [lat_max, lng_max],
    [lat_min, lng_max]
  ];
  console.log(data)
  send_req(layer.options.color, data, polygonCoordinates);
});
