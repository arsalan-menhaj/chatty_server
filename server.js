const express = require('express');
const SocketServer = require('ws').Server;
const jquery = require('jquery');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Variable to store the number of active users
let clientCounter = 0;

// Variable to store the ID that will be attached to the next message
let messageId = 0;

// Checks where data sent by client is a message or notfication
// and responds accordingly
function response(message) {
  console.log(message);

  // Broadcast to everyone else.
  wss.clients.forEach(function each(client) {
    let parsed = JSON.parse(message);
    let returnItem = {};
    switch (parsed.type) {
      case "postNotification":
        returnItem = {
          type: "incomingNotification",
          id: messageId,
          username: parsed.username ? parsed.username:"Anonymous",
          content: parsed.content
        };
        console.log('sending notification back');
        break;
      case "postMessage":
        returnItem = {
          type: "incomingMessage",
          id: messageId,
          username: parsed.username ? parsed.username:"Anonymous",
          userColor: parsed.userColor,
          // The line below removes the url text from the actual message content
          content: processImageLink(parsed.content) ? parsed.content.replace(processImageLink(parsed.content)[0],''):parsed.content,
          imageURL: processImageLink(parsed.content)
        };
        break;
    }
    console.log(JSON.stringify(returnItem));
    client.send(JSON.stringify(returnItem));
    messageId++;
  });
}

// Helper function that checks if image URL is included in user input

function processImageLink(text) {
  // Check for url in text string using regular expressions
    // Check for .jpg, .png, .gif
    // Url is the part of the string preceeding the extension until a space is hit
  let urlText = /\b(https?:\/\/\S+(?:png|jpe?g|gif)\S*)\b/.exec(text);

  return urlText;
}


// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  clientCounter++;
  console.log('Client connected - ', clientCounter);

  // Send the number of active clients to each client
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify({ clientCounter: clientCounter }));
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    clientCounter--;

    wss.clients.forEach(function each(client) {
      // Send the number of active clients to each client
      console.log('Client disconnected - ', clientCounter);
      client.send(JSON.stringify({ clientCounter: clientCounter }));
    });
  });

  ws.on('message', (message) => {
    response(message);
  });
});


