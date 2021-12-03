// Premade variables for the Chart(labels,data,config).
var labels = [];

var data = {
  labels: labels,
  datasets: [
    {
      label: "Price",
      backgroundColor: "red",
      data: []
    }
  ]
};

var config = {
  type: "line",
  data: data,
  options: {}
};

// Variables for chart and search button.
var myChart = new Chart(document.getElementById("cryptoChart"), config);
var searchButton = document.getElementById("searchButton");



searchButton.onclick = function () {
  var startDate = new Date(document.getElementById("start-date").value);
  var endDate = new Date(document.getElementById("end-date").value);
  console.log("Start Date: " + startDate);
  console.log("End Date: " + endDate);

  // Check if both dates are valid dates. -> Clear chart and proceed to get bitcoin dates/prices.
  if (isValidDate(startDate) && isValidDate(endDate)) {
    clearChart(myChart);
    fetchData(startDate, endDate);
  } else {
    alert("Please select Start date & End date for your search!");
  }
};


// Converts Date-object to unix time.
function convertDateToTimestamp(date) {
  var newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  return newDate.getTime() / 1000;
}

// If date is a Date object & not NaN -> return true, else false.
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

// Clears / Removes data from the Chart.
function clearChart(chart) {
  chart.data.labels = new Array();
  chart.data.datasets.data = new Array();
  chart.update();
}

// Adds data to the Chart.
function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach(dataset => {
    dataset.data.push(data);
  });
}

// Fetch's bitcoin data from coingecko API with the dates from the html date inputs. 
// Allways gets 101 results since it gives us everytime the 00:00 UTC time of the price & it isn't time costly.
async function fetchData(startDate, endDate) {
  var isInNeedOfSort = false;
  var startDateSeconds = convertDateToTimestamp(startDate);
  var endDateSeconds = convertDateToTimestamp(endDate);

  var daysBetween = getDaysBetween(startDate, endDate);

  // Checks if the given date range is less than 100, so we can always have without extra work the 00:00 UTC time prices.
  if (daysBetween < 100) {
    var extraDates = 100 - daysBetween;
    startDateSeconds = startDateSeconds - extraDates * 86400;
    isInNeedOfSort = true;
  }

  var url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&from=" + startDateSeconds + "&to=" + endDateSeconds;

  console.log("Start date fetch: " + startDateSeconds);
  console.log("End date fetch: " + endDateSeconds);

  await fetch(url).then(res => res.json()).then(data => handleResponseData(data, isInNeedOfSort, startDate));
}

// Updates the chart with the given data, deletes all the unnecessary data.
function handleResponseData(data, isInNeedOfSort, startDate) {
  console.log(data);
  var prices = data.prices;
  if (prices.length > 1) {
    if (isInNeedOfSort) {
      var sortedJson = getWantedDates(prices, startDate);
      if (sortedJson != null) {
        updateChart(sortedJson);
      } else {
        alert("There was an error while getting the data.");
      }
      isInNeedOfSort = false;
    } else {
      updateChart(prices);
    }
  } else {
    alert("There are no data available");
  }
}

// Sorts the given data array by using the original start date to remove the dates before it.
function getWantedDates(pricesData, startDate) {
  console.log("Length before: " + pricesData.length);
  var dateInMilliseconds = startDate.getTime();
  console.log("Searching for " + dateInMilliseconds + ", Date: " + startDate);
  for (var i = 0; i < pricesData.length; i++) {
    console.log("Result: " + pricesData[i][0] + ", actual: " + dateInMilliseconds);
    var areDatesEqual = compareDates(startDate, new Date(pricesData[i][0]));
    if (areDatesEqual || pricesData[i][0] >= dateInMilliseconds) {
      console.log("Searched for: " + dateInMilliseconds + ", Found: " + pricesData[i][0]);
      console.log("Found Date: " + new Date(pricesData[i][0]));
      pricesData.splice(0, i);
      console.log("Searched Date: " + startDate);
      console.log("Length after: " + pricesData.length);
      return pricesData;
    }
  }
  console.log("Length after: " + pricesData.length);
  return null;
}

// Compares two Date objects, if their Dates, Month & Year are the same -> return value == true.
function compareDates(dateOne, dateTwo) {
  return dateOne.getDate() == dateTwo.getDate() && dateOne.getMonth() == dateTwo.getMonth() && dateOne.getFullYear() == dateTwo.getFullYear();
}

// Return the number of days between two dates.
function getDaysBetween(startDate, endDate) {
  var timeDifference = endDate - startDate.getTime();
  var days = timeDifference / (1000 * 3600 * 24);
  console.log("Day difference: " + days);
  return days;
}


// Updates the data on chart.
function updateChart(prices) {
  if (prices != null && prices.length > 0) {
    var array = new Array();

    // Create BitcoinData-objects of the received data from the API & pushes them to the array.
    for (var i = 0; i < prices.length; i++) {
      var date = new Date(prices[i][0]);
      var price = prices[i][1];
      let bitcoinObj = new BitcoinData(date, price);
      array.push(bitcoinObj);
      console.log("Date: " + bitcoinObj.date + ", Price: " + bitcoinObj.price);
    }
    array.forEach(createDataToChart);
    myChart.update();
  } else {
    alert("The data of the given dates doesn't exist.");
  }

  // Creates the labels(dates) and prices to be added to the chart. Current way to present date = MM/DD/YYYY
  function createDataToChart(bitcoinObj) {
    var dateLabel = bitcoinObj.date.getMonth() + 1 + "/" + bitcoinObj.date.getDate() + "/" + bitcoinObj.date.getFullYear();
    addData(myChart, dateLabel, bitcoinObj.price);
  }
}

