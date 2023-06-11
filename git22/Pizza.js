const Order = require("./Order");

module.exports = class Pizza extends Order {
  constructor(selected = false, size = "") {
    super();
    this.sizeOptions = ["small", "medium", "large"];
    this.toppingOptions = ["pepperoni", "Vegan", "chicken"];
    this.item = "pizza";
    this.size = size;
    this.topping = "";
    this.isSelected = selected;
  }

  setSize(size) {
    this.size = size;
  }

  addTopping(topping) {
    this.topping = topping;
  }
};
