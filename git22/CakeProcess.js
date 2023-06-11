const Order = require("./Order");

module.exports = class CakeProcess extends Order {
  constructor() {
    super();
    this.toppingOptions = [
      "sponge cake",
      "chocolate cake",
      "vanila cake",
      "strawberry cake",
    ];
    this.drinkOptions = ["Dr pepper", "Pepsi", "Coca cola"];
    this.item = "discounted cake/drink";
    this.size = "";
    this.topping = "";
    this.drink = "";
    this.isSelected = false;
  }

  setSize(size) {
    this.size = size;
  }

  addTopping(topping) {
    this.topping = topping;
  }

  setDrink(drink) {
    this.drink = drink;
  }
  getOrderSummary() {
    if (this.drink.length > 0) {
      return `Discounted Item - ${this.drink}`;
    }
    return "Discounted Item- " + this.topping;
  }
};
