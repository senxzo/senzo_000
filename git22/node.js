const express = require("express");
const bodyParser = require("body-parser");
const Order = require("./Order");
const CakeProcess = require("./CakeProcess");
const Shawarma = require("./Shawarma");
const Pizza = require("./Pizza");
const Burger = require("./Burger");
const app = express();
const server = require("http").createServer(app);
const socketIO = require("socket.io");
const _ = require("underscore");

const io = socketIO(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("www"));

const oOrders = {};
let items = "";
let total = 0;

app.get("/payment/:phone/:items/:total", (req, res) => {
  const sFrom = req.params.phone;
  const sItems = req.params.items;
  const sTotal = req.params.total;

  const order = new Order(req.url, sFrom); // Create an instance of the Order class
  const form = renderForm(order, sFrom, sItems, sTotal); // Get the rendered form
  res.send(form); // Send the form as the response to the client
});

const OrderState = Object.freeze({
  WELCOME: Symbol(0),
  BURGER: Symbol(1),
  TOPPINGS: Symbol(2),
  QUERY: Symbol(20),
  DRINKS: Symbol(3),
  SHAWARMA: Symbol(4),
  SHWTOPPING: Symbol(6),
  PIZZA: Symbol(7),
  PIZZATOPPING: Symbol(9),
  RESP: Symbol(10),
  UPSELL: Symbol(11),
  BURGERTOPPINGS: Symbol(5),
  ITEMS: Symbol(12),
  QSET: Symbol(13),
  PAYMENT: Symbol(14),
});

const cakeOrder = new CakeProcess();
const shawarma = new Shawarma();
const pizza = new Pizza();
const burger = new Burger();
let currentState = OrderState.WELCOME;
const maxOrder = 2;
let orderCount = 0;
let orderList = [];

io.on("connection", (socket) => {
  socket.on("send message", (data) => {
    const reply = data.message.toLowerCase();
    const from = data.from; // Retrieve the 'from' value from the data object
    const url = socket.request.headers.referer;
    let order;
    if (!oOrders.hasOwnProperty(from)) {
      order = new Order(url, from);
      oOrders[from] = order;
    } else {
      order = oOrders[from];
    }

    const { orderSummary, link } = generatePaypalLink(order, items, total);
    const text = "Click to pay with PayPal";
    const linkTemplate = _.template(
      '<a href="<%= url %>" target="_blank"><%= text %></a>'
    );
    const linkHtml = linkTemplate({ url: link, text: text });

    const responses = [];
    // Process the user's message based on the current order state
    switch (currentState) {
      case OrderState.WELCOME:
        currentState = OrderState.RESP;
        responses.push(
          "Welcome to Innocent Audu pastry ordering service! (Enter 1, 2, or 3 to select)"
        );
        responses.push(order.menu);
        break;

      case OrderState.RESP:
        if (orderCount + 1 === maxOrder && (reply === "no" || reply === "n")) {
          currentState = OrderState.UPSELL;
          responses.push(
            "Would you like to add a cake or drink to your order @ $5 only? (Yes/No)"
          );
        } else {
          if (reply === "1") {
            currentState = OrderState.SHAWARMA;
            orderCount++;
            responses.push("Select your shawarma size");
            responses.push(shawarma.sizeOptions);
          } else if (reply === "2") {
            currentState = OrderState.PIZZA;
            orderCount++;
            responses.push("Select your pizza size");
            responses.push(pizza.sizeOptions);
          } else if (reply === "3") {
            currentState = OrderState.BURGER;
            orderCount++;
            responses.push("Select a burger size");
            responses.push(burger.sizeOptions);
          } else {
            currentState = OrderState.WELCOME;
            responses.push(
              "Invalid Entry. Enter any key then send to continue"
            );
          }
        }
        break;

      case OrderState.SHAWARMA:
        currentState = OrderState.SHWTOPPING;
        orderList.push(new Shawarma(true, reply));
        responses.push("Please choose your toppings.");
        responses.push(shawarma.toppingOptions);
        break;

      case OrderState.SHWTOPPING:
        if (orderCount >= maxOrder) {
          orderList[orderCount - 1].addTopping(reply);
          currentState = OrderState.UPSELL;
          responses.push(
            "Would you like to add a cake or drink to your order @ $5 only? (Yes/No)"
          );
        } else {
          currentState = OrderState.RESP;
          orderList[orderCount - 1].addTopping(reply);
          responses.push("Do add another item (enter No if none)?");
          responses.push(order.menu);
        }
        break;

      case OrderState.UPSELL:
        if (reply === "yes") {
          currentState = OrderState.QUERY;
          responses.push("Enter 1 for drink and 2 for cakes");
        } else {
          currentState = OrderState.PAYMENT;
          responses.push("\n\n" + orderSummary);
          responses.push("Please pay for your order here");
          responses.push(`${linkHtml}`);
        }
        break;

      case OrderState.QUERY:
        if (reply === "1") {
          currentState = OrderState.DRINKS;
          responses.push("Select a drink");
          responses.push(cakeOrder.drinkOptions);
        } else if (reply === "2") {
          currentState = OrderState.TOPPINGS;
          responses.push("Select your cake type:");
          responses.push(cakeOrder.toppingOptions);
        } else {
          currentState = OrderState.SHWTOPPING;
          responses.push("Invalid entry, press any key then send to continue");
        }
        break;

      case OrderState.DRINKS:
        currentState = OrderState.PAYMENT;
        cakeOrder.setDrink(reply);
        cakeOrder.isSelected = true;
        responses.push("\n\n" + orderSummary);
        responses.push("Please pay for your order here");
        responses.push(`${linkHtml}`);
        break;

      case OrderState.TOPPINGS:
        currentState = OrderState.PAYMENT;
        cakeOrder.isSelected = true;
        cakeOrder.addTopping(reply);
        responses.push("\n\n" + orderSummary);
        responses.push("Please pay for your order here");
        responses.push(`${linkHtml}`);
        break;

      case OrderState.PIZZA:
        currentState = OrderState.PIZZATOPPING;
        orderList.push(new Pizza(true, reply));
        responses.push("Please choose your toppings.");
        responses.push(pizza.toppingOptions);
        break;

      case OrderState.PIZZATOPPING:
        if (orderCount >= maxOrder) {
          orderList[orderCount - 1].addTopping(reply);
          currentState = OrderState.UPSELL;
          responses.push(
            "Would you like to add a cake or drink to your order @ $5 only? (Yes/No)"
          );
        } else {
          currentState = OrderState.RESP;
          orderList[orderCount - 1].addTopping(reply);
          responses.push("Do add another item (enter No if none)?");
          responses.push(order.menu);
        }
        break;

      case OrderState.BURGER:
        currentState = OrderState.BURGERTOPPINGS;
        orderList.push(new Burger(true, reply));
        responses.push("Please choose your burger toppings/option.");
        responses.push(burger.toppingOptions);
        break;

      case OrderState.BURGERTOPPINGS:
        if (orderCount >= maxOrder) {
          orderList[orderCount - 1].addTopping(reply);
          currentState = OrderState.UPSELL;
          responses.push(
            "Would you like to add a cake or drink to your order @ $5 only? (Yes/No)"
          );
        } else {
          currentState = OrderState.RESP;
          orderList[orderCount - 1].addTopping(reply);
          responses.push("Do you want to add another item (enter No if none)?");
          responses.push(order.menu);
        }
        break;

      case OrderState.PAYMENT:
        currentState = OrderState.WELCOME;
        console.log(reply); // Log the response from PayPal
        responses.push("PAYMENT");
        break;

      default:
        currentState = OrderState.WELCOME;
        responses.push("Sorry, I didn't understand. Let's restart your order!");
        break;
    }

    // Emit the response back to the frontend
    socket.emit("receive message", { response: responses });
  });

  socket.on("paypal response", (response) => {
    console.log("PayPal response received:", response);

    // Handle the PayPal response on the server-side as needed
    // For example, process the payment data or update the order status

    // Emit the response back to the client through the socket
    socket.emit("paypal response", response);
  });
});

function renderForm(order, from, items, total, socket) {
  // Your client id should be kept private
  const sClientID =
    process.env.SB_CLIENT_ID ||
    "put your client id here for testing ... Make sure that you delete it before committing";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <script src="https://www.paypal.com/sdk/js?client-id=${sClientID}"></script>
      </head>
      <body>
        <div>
          Thank you ${from} for your ${items} order of $${total}.
        </div>
        <div id="paypal-button-container"></div>
        <script>
          paypal
            .Buttons({
              createOrder: function (data, actions) {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: "${total}",
                      },
                    },
                  ],
                });
              },
              onApprove: function (data, actions) {
                return actions.order.capture().then(function (details) {
                  const response = {
                    data,
                    details
                  };

                  // Emit the response to the server through the socket
                  socket.emit("paypal response", response);

                  // Use AJAX to send data back to your server (optional)
                  fetch('/payment/${from}', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(response),
                  })
                    .then(response => response.json())
                    .then(data => {
                      console.log('Payment handled successfully:', data);
                      window.open("", "_self");
                      window.close();
                    })
                    .catch((error) => {
                      console.error('Error:', error);
                    });
                });
              }
            })
            .render("#paypal-button-container");

          // Emit the response back to the client through the socket
          socket.emit("paypal response", response);
        </script>
      </body>
    </html>
  `;
}

function generatePaypalLink(order, items, total) {
  const pickupTime = new Date();
  pickupTime.setMinutes(pickupTime.getMinutes() + 20);

  let orderSummary = `Thank you.\nSub Total is: $${total.toFixed(
    2
  )}\nTotal (13% tax) is: $${(total * 1.13).toFixed(
    2
  )}\nPick up your order by: ${pickupTime}\nHere is the order summary:\n`;

  if (cakeOrder.isSelected) {
    total += 5;
    orderSummary += cakeOrder.getOrderSummary() + "\n";
    items += "cake";
  }

  if (orderList.length > 0) {
    for (const o of orderList) {
      total += 10;
      orderSummary += o.getOrderSummary() + "\n";
      items += o.item + " ";
    }
  }
  let tax = total * 1.13;

  const link = `/payment/${order.from}/${items.trim()}/${tax.toFixed(2)}`;

  return { orderSummary, link };
}

server.listen(3002, () => {
  console.log("listening on port 3002");
});
