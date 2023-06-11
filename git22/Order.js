class Order {
  constructor(url, from) {
    this.url = url;
    this.from = from;
    this.item = ""; // Initialize item property
    this.total = ""; // Initialize total property
    this.done = false;
    this.menu = ["1. Shawarma ($10)", "2. Pizza ($10)", "3. Burger ($10)"];
  }

  isDone() {
    return this.done;
  }

  getOrderSummary() {
    return `Item: ${this.item}, Size: ${this.size}, Toppings: ${this.topping}`;
  }
}

module.exports = Order;
