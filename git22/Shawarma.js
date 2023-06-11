const Order = require("./Order");

module.exports = class Shawarma extends Order {
  constructor(selected = false, size = "") {
    super();
    this.sizeOptions = ["small", "medium", "large"];
    this.toppingOptions = ["beef", "Vegan", "chicken"];
    this.item = "sharwama";
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
