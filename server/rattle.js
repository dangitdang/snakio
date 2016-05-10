var players = require('./player.js')({});
var notes   = require('./notes.js')({});
var socketio = require('socket.io');
var config = require('../config.js');

var COMMANDS = ['setDirection','activatePower'];
var io;
var rattle;
var sockets = {};
notes.addNotes(500);
notes.addPowerups(100);

var listen = function(app){
    io = socketio.listen(app);

    rattle = io.of('/rattle');
    rattle.on('connection', function(socket){
      console.log('new client connected');

      var currentPlayer = players.newPlayer(socket.id);
      socket.emit('playerInfo', currentPlayer);
      socket.on('readyToStart', function(player){
        console.log(player);
        console.log('[CONNECTION] Player '+ player.name+' has connected');

        currentPlayer = player;
        sockets[player.id] = socket;
        players.addPlayer(currentPlayer);
        io.emit('playerJoined', {name: currentPlayer.name});
        socket.emit('gameConfig',{
          gameWidth  : config.gameWidth,
          gameHeight : config.gameWidth
        });
      });

      socket.on('playerInput', function(input){
        if (COMMANDS.indexOf(input.cmd) > -1){
          players[input.cmd](currentPlayer,input.arg);
        } else {
          socket.emit('error',{
            error : 'Not a valid command'
          });
        }
      });

      socket.on('disconnect', function(){
        players.removePlayer(currentPlayer);
        delete sockets[currentPlayer.id];
      });

    });
}


var stepPlayers = function(){
  players.moveAll();
}

var sendUpdates = function () {
  var start = console.time('update')
  players.moveAll();

  var playersId = Object.keys(sockets);
  playersId.forEach(function(id){

    var player = players.getPlayer(id);
    var nearPlayers = players.nearByPlayers(player);
    var nearNotes = notes.nearByNotes(player);
    var nearPowerups=notes.nearByPowerups(player);

      if (players.checkCollisions(player, nearPlayers)){
      sockets[id].emit('dead', {
        message : 'player dead'
      });
      players.deadPlayer(player);
    } else {
      var noteAte = notes.ateNote(player, nearNotes);
      var powerupAte = notes.atePowerup(player,nearPowerups );
      if (noteAte) {
        players.appendNote(player, noteAte.pitch);
      }
        
      if (powerupAte) {
          
        player.maxLength+=powerupAte.increase;
          console.log(player.maxLength, "max len");
      }
      sockets[id].emit('update',{
        player : player,
        nearByPlayers : nearPlayers,
        nearByNotes : nearNotes,
        nearByPowerups:nearPowerups
      });
    }


  });
//  var end = console.timeEnd('update')
}

module.exports = {
  listen : listen,
  step : stepPlayers,
  update : sendUpdates
}
