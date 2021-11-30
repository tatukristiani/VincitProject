let labels = ["Day 1", "Day 2", "Day 3", "Day 4"];

let data = {
  labels: labels,
  datasets: [
    {
      label: "Price",
      backgroundColor: "red",
      data: ["10", "5", "40", "25"]
    }
  ]
};

let config = {
  type: "line",
  data: data,
  options: {}
};

let myChart = new Chart(document.getElementById("cryptoChart"), config);

let searchButton = document.getElementById("searchButton");

// On button click clears old data & inserts new data.
searchButton.onclick = function() {
  clearChart(myChart);
  fetchData(new Date("2020", "10", "20"), new Date("2020", "10", "22"));
};

// Clears / Removes data from the chart-object.
function clearChart(chart) {
  chart.data.labels = new Array();
  chart.data.datasets.forEach(dataset => {
    dataset.data.pop();
  });
  chart.update();
}

// Adds data to the chart-object.
function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach(dataset => {
    dataset.data.push(data);
  });
}

// Fetch's bitcoin data from coingecko API. Hardcoded bitcoin(id) & euro (currency).
async function fetchData(startDate, endDate) {
  startDate = parseInt((new Date(startDate).getTime() / 1000).toFixed(0));
  endDate = parseInt((new Date(endDate).getTime() / 1000).toFixed(0));
  console.log("Start date: " + startDate);
  let url =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&from=" +
    startDate +
    "&to=" +
    endDate;

  let response = await fetch(url);

  if (response.ok) {
    let json = await response.json();
    console.log(json.prices[0]);
    updateChart(json);
  } else {
    alert("HTTP-Error: " + response.status);
  }
}

// Updates the data on chart.
function updateChart(json) {
  if (json != null) {
    let array = new Array();

    // Create BitcoinData-objects of the received data from the API.
    for (let i = 0; i < json.prices.length; i++) {
      let date = new Date(json.prices[i][0]);
      let data = new BitcoinData(date, json.prices[i][1]);
      array.push(data);
      console.log("Date?: " + date + "Price: " + json.prices[i][1]);
    }

    // Set the labels of the chart to be "MM/DD/YYYY" & adds the data to the chart
    for (BitcoinData of array) {
      let dateLabel =
        BitcoinData.getDate().getMonth() +
        "/" +
        BitcoinData.getDate().getDay() +
        "/" +
        BitcoinData.getDate().getFullYear();
      addData(myChart, dateLabel, BitcoinData.getPrice());
    }
    console.log("finish");
    myChart.update();
  } else {
    alert("The data of the given dates doesn't exist.");
  }
}
