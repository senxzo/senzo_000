const Order = require("./Order");

module.exports = class Burger extends Order {
  constructor(selected = false, size = "") {
    super();
    this.sizeOptions = ["small", "medium", "large"];
    this.toppingOptions = ["beef", "Vegan", "chicken", "cheese"];
    this.item = "burger";
    this.size = size;
    this.topping = "";
    this.isSelected = selected;
    this.qty = 0;
  }

  setSize(size) {
    this.size = size;
  }

  addTopping(topping) {
    this.topping = topping;
  }
  setQty(qty) {
    qty += this.qty++;
  }
};
