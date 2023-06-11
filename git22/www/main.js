$(function () {
  var pastMessages = History.get();
  if (pastMessages !== false) {
    for (var i = 0; i < pastMessages.length; i++) {
      print(pastMessages[i].message, pastMessages[i].from);
    }
  }

  var socket = io();

  $("#clear").click(function () {
    localStorage.removeItem("history");
    $("#messages").html("");
  });

  $("#send").click(function (e) {
    sendMessage();
  });

  $("#msg").keypress(function (e) {
    if (typeof e !== "undefined" && e.which == 13) {
      sendMessage();
    }
  });

  function sendMessage() {
    var msg = $("#msg").val().trim();

    if (msg != "") {
      History.add(msg, "user");
      print(msg, "user");
      $("#msg").val("").focus();
      var from = getPhoneNumber(); // Get the phone number or generate a random one
      socket.emit("send message", { message: msg, from: from }); // Include the 'from' value when sending the message
    }
  }

  socket.on("receive message", function (data) {
    var responses = data.response;
    for (var i = 0; i < responses.length; i++) {
      print(responses[i], "server");
    }
  });

  socket.on("paypal response", function (response) {
    console.log("PayPal response received:", response);

    // Handle the PayPal response on the client-side as needed
    // For example, update the UI or display a success message
  });
});

function print(msg, from) {
  var className = from == "server" ? "from-server" : "from-user";
  var messages = $("#messages");

  messages.append('<li class="' + className + '"><p>' + msg + "</p></li>");
  messages.animate({ scrollTop: messages.prop("scrollHeight") }, 0);
}

var History = {
  add: function (msg, from) {
    var pastMessages = History.get();

    if (pastMessages === false) {
      pastMessages = [{ message: msg, from: from }];
    } else {
      pastMessages.push({ message: msg, from: from });
    }

    localStorage.setItem("history", JSON.stringify(pastMessages));
  },
  get: function () {
    var pastMessages = localStorage.getItem("history");

    if (typeof pastMessages !== "undefined" && pastMessages != null) {
      pastMessages = JSON.parse(pastMessages);
    } else {
      pastMessages = false;
    }

    return pastMessages;
  },
};

function getPhoneNumber() {
  var phone = localStorage.getItem("fake-number");

  if (typeof phone === "undefined" || phone == null) {
    phone = makeID(); // Generate a random phone number if no number is found in history
    localStorage.setItem("fake-number", phone); // Save the generated phone number to history
  }

  return phone;
}

function makeID() {
  var id = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Generate random id 10 characters long
  for (var i = 0; i < 10; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return id;
}
