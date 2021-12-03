// Premade variables for the Chart(labels,data,config).
var myChart;
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


myChart = new Chart(document.getElementById("cryptoChart"), config);
var searchButton = document.getElementById("searchButton");
var longestBearishText = document.getElementById("longestBearish");
var startDateInput = document.getElementById("start-date");
var endDateInput = document.getElementById("end-date");
createStringOfTodaysDate(startDateInput);
createStringOfTodaysDate(endDateInput);

searchButton.onclick = function () {
  var startDate = new Date(document.getElementById("start-date").value);
  var endDate = new Date(document.getElementById("end-date").value);

  console.log("Start Date: " + startDate);
  console.log("End Date: " + endDate);

  // Check if both dates are valid dates. -> Clear chart and proceed to get bitcoin dates/prices.
  if (isValidDate(startDate) && isValidDate(endDate)) {
    if (getDaysBetween(startDate, endDate) > 1 && getDaysBetween(new Date(), endDate) < 0) {
      fetchData(startDate, endDate);
    }
    else if (getDaysBetween(new Date(), endDate) > 0) {
      alert("This program can't see to the future! (Yet...)")
    }
    else {
      alert("You have to select Starting date that is before Ending date!")
    }
  }
  else {
    alert("Please select Start date & End date for your search!");
  }

};

function createStringOfTodaysDate(input) {
  var today = new Date();
  var month = today.getMonth() + 1;
  var day = today.getDate();
  var year = today.getFullYear();

  if (month < 10)
    month = '0' + month.toString();
  if (day < 10)
    day = '0' + day.toString();

  var maxDate = year + '-' + month + '-' + day;
  input.setAttribute('max', maxDate);
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
};


// Updates the chart with the given data, deletes all the unnecessary data.
function handleResponseData(data, isInNeedOfSort, startDate) {
  console.log(data);
  if (data.prices.length > 1) {
    if (isInNeedOfSort) {
      var sortedData = getWantedDates(data, startDate);
      if (sortedData != null) {
        updateChart(sortedData);
      } else {
        alert("There was an error while getting the data.");
      };
      isInNeedOfSort = false;
    } else {
      updateChart(data);
    };
  } else {
    alert("There are no data available");
  };
};


/* CHART MANIPULATION METHODS BELOW */


// Updates the data on chart.
function updateChart(data) {
  var newData = {
    labels: [],
    datasets: [
      {
        label: "Price",
        backgroundColor: "green",
        data: []
      }
    ]
  };

  if (data != null && data.prices.length > 0) {
    // Pushes all the date and price datas to the newData variable that is later used to replace the old data on the chart.
    // Doesn't take market caps or volumes to the chart.
    for (var i = 0; i < data.prices.length; i++) {
      var date = new Date(data.prices[i][0]);
      newData.labels.push((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear());

      var price = data.prices[i][1];
      newData.datasets[0].data.push(price);
      console.log("Date: " + date + ", Price: " + price);
    };
    changeChartData(newData);
    longestBearishText.innerHTML = setBearishInfo(longestBearishTrend(data));
    highestTradingVolume(data);
    whenToBuyAndSell(data);
  } else {
    alert("The data of the given dates doesn't exist.");
  };
};

// Replaces the old chart data with the new ones and updates it.
// For safety reasons creates new Chart if there is no chart yet.
function changeChartData(newData) {
  if (myChart) {
    myChart.data.labels = newData.labels;
    myChart.data.datasets[0].data = newData.datasets[0].data;
    myChart.update();
  }
  else {
    var context = document.getElementById("cryptoChart").getContext("2d");
    myChart = new Chart(context, {
      type: "line",
      data: [],
      options: {}
    });
  };
};



/* DATE MANIPULATION METHOD BELOW */

// Converts Date-object to unix time.
function convertDateToTimestamp(date) {
  var newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  return newDate.getTime() / 1000;
};

// If date is a Date object & not NaN -> return true, else false.
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
};

// Sorts the given data array by using the original start date to remove the dates before it.
function getWantedDates(data, startDate) {
  console.log("Length before(price): " + data.prices.length);
  console.log("Length before(marketcap): " + data.market_caps.length);
  console.log("Length before(volume): " + data.total_volumes.length);
  var dateInMilliseconds = startDate.getTime();
  console.log("Searching for " + dateInMilliseconds + ", Date: " + startDate);
  for (var i = 0; i < data.prices.length; i++) {
    console.log("Result: " + data.prices[i][0] + ", actual: " + dateInMilliseconds);
    var areDatesEqual = compareDates(startDate, new Date(data.prices[i][0]));
    if (areDatesEqual || data.prices[i][0] >= dateInMilliseconds) {
      console.log("Searched for: " + dateInMilliseconds + ", Found: " + data.prices[i][0]);
      console.log("Found Date: " + new Date(data.prices[i][0]));
      data.prices.splice(0, i);
      data.market_caps.splice(0, i);
      data.total_volumes.splice(0, i);

      console.log("Searched Date: " + startDate);
      console.log("Length after(price): " + data.prices.length);
      console.log("Length after(marketcap): " + data.market_caps.length);
      console.log("Length after(volume): " + data.total_volumes.length);
      return data;
    };
  };
  console.log("Length after(price): " + data.prices.length);
  console.log("Length after(marketcap): " + data.market_caps.length);
  console.log("Length after(volume): " + data.total_volumes.length);
  return null;
};

// Compares two Date objects, if their Dates, Month & Year are the same -> return value == true.
function compareDates(dateOne, dateTwo) {
  return dateOne.getDate() == dateTwo.getDate() && dateOne.getMonth() == dateTwo.getMonth() && dateOne.getFullYear() == dateTwo.getFullYear();
};

// Return the number of days between two dates.
function getDaysBetween(startDate, endDate) {
  var timeDifference = endDate.getTime() - startDate.getTime();
  var days = timeDifference / (1000 * 3600 * 24);
  console.log("Day difference: " + days);
  return days;
};


/* PRE-ASSIGNMENT TASK ALGORITHMS */

function longestBearishTrend(data) {
  var bitcoinPrices = data.prices;
  var array = new Array(); // Array for DateRangeBearish objects(these have bearish trends atleast for one day)
  var startDate = null; // Holds the current start date.
  var startPrice;
  var endDate = null; // Holds the current endate, gets a value when counting resets.
  var endPrice;

  if (bitcoinPrices.length > 2) {
    console.log("Test 1: " + bitcoinPrices.length);
    for (var i = 0; i < bitcoinPrices.length - 1; i++) {
      var currentBitcoinPrice = bitcoinPrices[i][1];
      var currentBitcoinDate = bitcoinPrices[i][0];
      var nextBitcoinPrice = bitcoinPrices[i + 1][1];
      var nextBitcoinDate = bitcoinPrices[i + 1][0];

      console.log("Test 2: " + currentBitcoinPrice + ", test 2: " + nextBitcoinPrice);
      if (currentBitcoinPrice > nextBitcoinPrice) {
        if (startDate == null) {
          startDate = currentBitcoinDate;
          startPrice = currentBitcoinPrice;
          console.log("Test 3: ");
        }
        endDate = nextBitcoinDate;
        endPrice = nextBitcoinPrice;
        if ((bitcoinPrices.length - i) == 1) {
          array.push(new DateRangeBearish(new BitcoinData(new Date(startDate), startPrice), new BitcoinData(new Date(endDate), endPrice)));
        }
        console.log("Test 4: " + endDate + " test 4: " + endPrice)
      }
      else {
        if (startDate != null) {
          console.log("Test 5: not null")
          array.push(new DateRangeBearish(new BitcoinData(new Date(startDate), startPrice), new BitcoinData(new Date(endDate), endPrice)));
          console.log(array[0]);
        }
        startDate = null;
        endDate = null;
      }
    }

    if (array.length > 0) {
      console.log("Test 6: sorting")
      array.sort(function (a, b) { return ((getDaysBetween(b.bitcoinDataStart.date, b.bitcoinDataEnd.date)) - (getDaysBetween(a.bitcoinDataStart.date, a.bitcoinDataEnd.date))) });
      return array[0];
    }
    else if (array.size == 1) {
      console.log("Test 7: size 1")
      return array[0];
    }
    else {
      alert("Between the given dates the price only went up.");
      return null;
    }
  }
  else if (bitcoinPrices.length == 2) {
    console.log(bitcoinPrices[0][0] + " gegegeg " + bitcoinPrices[0][1]);
    if (bitcoinPrices[0][1] >= bitcoinPrices[1][1]) {
      return new DateRangeBearish(new BitcoinData(new Date(bitcoinPrices[0][0]), bitcoinPrices[0][1]), new BitcoinData(new Date(bitcoinPrices[1][0]), bitcoinPrices[1][1]));
    }
    return null;
  }
  else { // Not possible to reach here. Unless code is altered.
    alert("You can't watch only one days data!!!")
  }
}

function setBearishInfo(dateRangeBearish) {
  var text = "Longest bearish downward trend: ";
  if (dateRangeBearish == null) {
    text += " Between the given dates the price only went up."
  }
  else {
    var startDate = dateRangeBearish.bitcoinDataStart.date;
    console.log("start date" + startDate);
    console.log(dateRangeBearish.bitcoinDataEnd.date);
    var endDate = dateRangeBearish.bitcoinDataEnd.date;

    var days = getDaysBetween(startDate, endDate);
    var formattedStartDate = (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear();
    var formattedEndDate = (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear();
    text += days + " days between " + formattedStartDate + " & " + formattedEndDate;
  }
  return text;
}


function highestTradingVolume(data) {

}

function whenToBuyAndSell(data) {

}



