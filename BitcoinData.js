// Class that holds a date and it's price (as close as possible to 00:00 UTC time)
class BitcoinData {
  constructor(date, price) {
    this.date = date;
    this.price = price;
  }

  getPrice() {
    return this.price;
  }

  getDate() {
    return this.date;
  }
}
