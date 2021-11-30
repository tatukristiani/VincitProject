var labels = ["Day 1", "Day 2", "Day 3", "Day 4"];

var data = {
  labels: labels,
  datasets: [
    {
      label: "Price",
      backgroundColor: "red",
      data: ["10", "5", "40", "25"]
    }
  ]
};

var config = {
  type: "line",
  data: data,
  options: {}
};

var myChart = new Chart(document.getElementById("cryptoChart"), config);

var searchButton = document.getElementById("searchButton");

searchButton.onclick = function() {
  var startDate = new Date(document.getElementById("start-date").value);
  var endDate = new Date(document.getElementById("end-date").value);
  console.log("Start Date: " + startDate);
  console.log("End Date: " + endDate);
  // Check if both dates are valid dates.
  if (isValidDate(startDate) && isValidDate(endDate)) {
    clearChart(myChart);
    fetchData(startDate, endDate);
    console.log(isValidDate(startDate) + " & " + isValidDate(endDate));
  } else {
    alert("Please select Start date & End date for your search!");
  }
};

// Converts Date-object to unix timestamp.
function convertDateToUnix(date) {
  console.log("Date before unix: " + date);
  var unixDate = parseInt((new Date(date).getTime() / 1000).toFixed(0));
  console.log("Date after unix: " + unixDate);
  return unixDate;
}

// If date is a Date object & not NaN -> return true, else false.
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

// Clears / Removes data from the chart-object.
function clearChart(chart) {
  chart.data.labels = new Array();
  chart.data.datasets.data = new Array();
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
  var isInNeedOfSort = false;
  var unixStartDate = convertDateToUnix(startDate);
  var unixEndDate = convertDateToUnix(endDate);

  var daysBetween = getDaysBetween(startDate, endDate);

  if (daysBetween < 90) {
    var extraDates = 90 - endDate.getDate();
    unixEndDate = extraDates * 86400 + unixEndDate;
    console.log("Edited unix date");
    isInNeedOfSort = true;
  }

  var url =
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&from=" +
    unixStartDate +
    "&to=" +
    unixEndDate;

  console.log("Start date fetch: " + unixStartDate);
  console.log("End date fetch: " + unixEndDate);

  var response = await fetch(url);

  if (response.ok) {
    var json = response.json();
    var neededData = json.prices;
    if (isInNeedOfSort) {
      var sortedJson = getWantedDates(neededData, unixEndDate);
      if (sortedJson != null) {
        updateChart(sortedJson);
      } else {
        alert("Sorted Json was null");
      }
      isInNeedOfSort = false;
    } else {
      updateChart(neededData);
    }
  } else {
    alert("HTTP-Error: " + response.status);
  }
}

//CHECK !!!
// Sorts the given prices array by using the unixEndDate(in seconds) to remove the dates after that date.
function getWantedDates(neededData, RealUnixEndDate) {
  var dateInMilliseconds = RealUnixEndDate * 1000;
  console.log("Searching for " + dateInMilliseconds);
  for (var i = 0; i < neededData.length; i++) {
    console.log(
      "Result: " + neededData[i][0] + ", actual: " + dateInMilliseconds
    );
    if (neededData[i][0] > dateInMilliseconds) {
      neededData.length = i;
      console.log(
        "Found real date: " +
          dateInMilliseconds +
          ", in array: " +
          neededData[i][0]
      );
      break;
    }
  }
  return neededData;
}

// Return the number of days between two dates.
function getDaysBetween(startDate, endDate) {
  var timeDifference = endDate.getTime() - startDate.getTime();
  var days = timeDifference / (1000 * 3600 * 24);
  return days;
}

// CHECK !!!!
// Updates the data on chart.
function updateChart(json) {
  if (json != null) {
    var array = new Array();

    // Create BitcoinData-objects of the received data from the API.
    for (var i = 0; i < json.length; i++) {
      var date = new Date(json[i][0]);
      var data = new BitcoinData(date, json[i][1]);
      array.push(data);
      console.log("Date?: " + date + "Price: " + json[i][1]);
    }

    // Set the labels of the chart to be "MM/DD/YYYY" & adds the data to the chart
    for (BitcoinData of array) {
      var dateLabel =
        BitcoinData.getDate().getMonth() +
        1 +
        "/" +
        BitcoinData.getDate().getDate() +
        "/" +
        BitcoinData.getDate().getFullYear();
      addData(myChart, dateLabel, BitcoinData.getPrice());
    }
    myChart.update();
  } else {
    alert("The data of the given dates doesn't exist.");
  }
}
