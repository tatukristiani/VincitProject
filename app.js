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


myChart = new Chart(document.getElementById("crypto-chart"), config);
var searchButton = document.getElementById("search-button");
var longestBearishText = document.getElementById("longest-bearish");
var startDateInput = document.getElementById("start-date");
var endDateInput = document.getElementById("end-date");
var highestTradingVolume = document.getElementById("highest-trading-volume");
var buySellOptions = document.getElementById("buy-sell-options");
createStringOfTodaysDate(startDateInput);
createStringOfTodaysDate(endDateInput);

searchButton.onclick = function () {
  var startDate = new Date(document.getElementById("start-date").value);
  var endDate = new Date(document.getElementById("end-date").value);

  // Check if both dates are valid dates. -> Clear chart and proceed to get bitcoin dates/prices.
  if (isValidDate(startDate) && isValidDate(endDate)) {
    if (getDaysBetween(startDate, endDate) >= 1 && getDaysBetween(new Date(), endDate) <= 0) {
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
  await fetch(url).then(res => res.json()).then(data => handleResponseData(data, isInNeedOfSort, startDate));
};


// Updates the chart with the given data, deletes all the unnecessary data.
function handleResponseData(data, isInNeedOfSort, startDate) {
  console.log("Data from API:");
  console.log(data);
  if (data.prices.length > 1) {
    if (isInNeedOfSort) {
      var sortedData = getWantedDates(data, startDate);
      if (sortedData != null) {
        console.log("Sorted data:");
        console.log(sortedData.prices);
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
    };
    changeChartData(newData);
    longestBearishText.innerHTML = setBearishInfo(longestBearishTrend(data));
    highestTradingVolume.innerHTML = findMaxTradingVolume(data);
    buySellOptions.innerHTML = whenToBuyAndSell(data);
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
  var dateInMilliseconds = startDate.getTime();
  for (var i = 0; i < data.prices.length; i++) {
    var areDatesEqual = compareDates(startDate, new Date(data.prices[i][0]));
    if (areDatesEqual || data.prices[i][0] >= dateInMilliseconds) {
      data.prices.splice(0, i);
      data.market_caps.splice(0, i);
      data.total_volumes.splice(0, i);

      return data;
    };
  };
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
  return days;
};

// Creates max attribute for given inpu of todays date.
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

function dateToString(date) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var year = date.getFullYear();
  var dateString = month + "/" + day + "/" + year;
  return dateString;
}

/* PRE-ASSIGNMENT TASK ALGORITHMS */

function longestBearishTrend(data) {
  var bitcoinPrices = data.prices;
  var array = new Array(); // Array for DateRangeBearish objects(these have bearish trends atleast for one day)
  var startDate = null; // Holds the current start date.
  var startPrice;
  var endDate = null; // Holds the current endate, gets a value when counting resets.
  var endPrice;

  console.log("Finding longest bearish from: ");
  console.log(data);

  if (bitcoinPrices.length > 2) {
    for (var i = 0; i < bitcoinPrices.length - 1; i++) {
      var currentBitcoinPrice = bitcoinPrices[i][1];
      var currentBitcoinDate = bitcoinPrices[i][0];
      var nextBitcoinPrice = bitcoinPrices[i + 1][1];
      var nextBitcoinDate = bitcoinPrices[i + 1][0];

      if (currentBitcoinPrice > nextBitcoinPrice) {
        if (startDate == null) {
          startDate = currentBitcoinDate;
          startPrice = currentBitcoinPrice;
        }
        endDate = nextBitcoinDate;
        endPrice = nextBitcoinPrice;
        if ((bitcoinPrices.length - (i + 1)) == 1) {
          array.push(new DateRangeBearish(new BitcoinData(new Date(startDate), startPrice), new BitcoinData(new Date(endDate), endPrice)));
        }
      }
      else {
        if (startDate != null) {
          array.push(new DateRangeBearish(new BitcoinData(new Date(startDate), startPrice), new BitcoinData(new Date(endDate), endPrice)));
        }
        startDate = null;
        endDate = null;
      }
    }

    if (array.length > 0) {
      array.sort(function (a, b) { return ((getDaysBetween(b.bitcoinDataStart.date, b.bitcoinDataEnd.date)) - (getDaysBetween(a.bitcoinDataStart.date, a.bitcoinDataEnd.date))) });
      return array[0];
    }
    else if (array.length == 1) {
      return array[0];
    }
    else {
      return null;
    }
  }
  else if (bitcoinPrices.length == 2) {
    if (bitcoinPrices[0][1] >= bitcoinPrices[1][1]) {
      return new DateRangeBearish(new BitcoinData(new Date(bitcoinPrices[0][0]), bitcoinPrices[0][1]), new BitcoinData(new Date(bitcoinPrices[1][0]), bitcoinPrices[1][1]));
    }
  }
  else { // Not possible to reach here. Unless code is altered.
    alert("You can't watch only one days data!!!")
    return null;
  }
}

function setBearishInfo(dateRangeBearish) {
  var text = "Longest bearish downward trend: ";
  if (dateRangeBearish == null) {
    text += " Between the given dates the price only went up."
  }
  else {
    var startDate = dateRangeBearish.bitcoinDataStart.date;
    var endDate = dateRangeBearish.bitcoinDataEnd.date;
    var days = getDaysBetween(startDate, endDate);
    var formattedStartDate = (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear();
    var formattedEndDate = (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear();

    text += days + " days between " + formattedStartDate + " & " + formattedEndDate;
  }
  return text;
}

// Finds the highest trading volume of the given API data.
function findMaxTradingVolume(data) {
  var tradingVolumes = data.total_volumes;

  console.log("Finding max trading volume from: ");
  console.log(data);

  tradingVolumes.sort(function (a, b) { return (b[1] - a[1]) });
  var date = new Date(tradingVolumes[0][0]);
  var dateText = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
  var volumeText = numberFormatter(tradingVolumes[0][1]);
  var text = "Highest trading volume: " + volumeText + " on Date: " + dateText;
  return text;
}

// Returns a string of number given with to decimals.
function numberFormatter(numberToFormat) {
  var formatted = "";
  if (numberToFormat < 1000000) {
    formatted += numberToFormat.toFixed(2);
  }
  else if (numberToFormat > 999999 && numberToFormat < 1000000000) {
    formatted += (numberToFormat / 1000000).toFixed(2) + " milj."
  }
  else if (numberToFormat > 999999999 && numberToFormat < 1000000000000) {
    formatted += (numberToFormat / 1000000000).toFixed(2) + " billion";
  }
  else {
    formatted += (numberToFormat / 1000000000000).toFixed(2) + " trillion";
  }
  return formatted;
}

function whenToBuyAndSell(data) {
  var prices = data.prices;

  if (prices.length >= 2) {
    var lowestDateArray = new Array();
    var currentMaxProfits = prices[1][1] - prices[0][1];
    var currentLowestPrice = prices[0][1];
    var lowestDateIndex = 0;
    lowestDateArray.push(lowestDateIndex);
    var highestDateIndex = 1;

    for (var i = 1; i < prices.length; i++) {
      if ((prices[i][1] - currentLowestPrice) > currentMaxProfits) {
        currentMaxProfits = prices[i][1] - currentLowestPrice;
        highestDateIndex = i;
      }
      if (prices[i][1] < currentLowestPrice) {
        currentLowestPrice = prices[i][1];
        lowestDateIndex = i;
        lowestDateArray.push(lowestDateIndex);
      }
    }
    lowestDateArray.forEach(function (e) {
      console.log(e);
    });
    if (lowestDateIndex > highestDateIndex) {
      while (lowestDateIndex > highestDateIndex) {
        lowestDateIndex = lowestDateArray.pop();
      }
    }
    var profit = currentMaxProfits;
    if (profit > 0) {
      buyBitcoinData = new BitcoinData(new Date(prices[lowestDateIndex][0]), prices[lowestDateIndex][1]);
      sellBitcoinData = new BitcoinData(new Date(prices[highestDateIndex][0]), prices[highestDateIndex][1]);
      var buySellText = "Best profit = " + profit.toFixed(2) + " euros, when " + createBuySellText(buyBitcoinData, sellBitcoinData);
      return buySellText;
    }
    else {
      return "Between the given dates buying or selling isn't profitable.";
    }
  }
  else {
    // Should never come to this part.
    alert("Can't buy and sell on the same day");
  }
}

function createBuySellText(buyBitcoinData, sellBitcoinData) {
  var buyDate = dateToString(buyBitcoinData.date);
  var buyPrice = numberFormatter(buyBitcoinData.price);
  var sellDate = dateToString(sellBitcoinData.date);
  var sellPrice = numberFormatter(sellBitcoinData.price);
  var buySellText = "BUY AT: " + buyDate + "(" + buyPrice + ") & SELL AT: " + sellDate + "(" + sellPrice + ")";
  return buySellText;
}



