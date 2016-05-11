var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var rattle  = require('./rattle.js');
var io      = rattle.listen(http);
app.use(express.static(__dirname+'/../client'));

var port = process.env.PORT || 3000;


setInterval(rattle.updateScore,100);
setInterval(rattle.update,124);

http.listen(port, function() {
  console.log("Server is listening on port " + port);
});
