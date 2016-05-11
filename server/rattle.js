var utils = require('../utils.js');
var socketio = require('socket.io');
var config = require('../config.js');
var powerups = require('./powerups.js');
var COMMANDS = ['setDirection','activatePower'];
var POWERS = ['changeInstrument', 'increaseMaxLength', 'increaseMaxLength'];
var io;
var rattle;
var sockets = {};
var grid = utils.makeGrid(200, 200);
var players = require('./player.js')(grid, {});
var notes   = require('./notes.js')(grid, {});

notes.addNotes(200);

for (var i = 0; i < 20; i++) {
  var power = utils.randomBetween(0,3);
  notes.addPowerups(1,POWERS[power]);
}

var SCORES = [];
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

var updateScores=function(){
    SCORES = players.getScores();
    SCORES.sort(function(a, b){
    var keyA = a.score,
        keyB = b.score;
    // Compare the 2 dates
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
});
//    console.log(scores);
//    io.sockets.emit("score",scores)

}

var sendUpdates = function () {
  var start = console.time('update')
  if (Math.random() < .03 && notes.totalPowerUps() < 70){
    var power = utils.randomBetween(0,3);
    notes.addPowerups(1,POWERS[power]);
  }
  players.moveAll();

  var playersId = Object.keys(sockets);
  playersId.forEach(function(id){
    var player = players.getPlayer(id);
    if (player === undefined){
      return;
    }
    if (player.dir[0] === player.dir[1]){
      return;
    }
    var nearPlayers = players.nearByPlayers(player);

    var nearByItems = notes.nearByNotes(player);
    var nearNotes = nearByItems.filter(function(i){
      return i.type === 'NOTE';
    })
    var nearPowerups = nearByItems.filter(function(i){
      return i.type === 'POWERUP'
    });
    if (players.checkCollisions(player, nearPlayers)){
      players.removePlayer(player);
      var newPlayer = players.newPlayer(id);
      sockets[id].emit('dead', newPlayer );

    } else {
      var thingAte = notes.eatNote(player);
      if (thingAte) {
        if (thingAte.type === 'NOTE') {
          players.appendNote(player, thingAte.pitch);
        } else {
          powerups[thingAte.effect](player);
          sockets[id].emit('message', {
            msg: thingAte.effect
          })
        }
      }
      sockets[id].emit('update',{
        player : player,
        nearByPlayers : nearPlayers,
        nearByNotes : nearNotes,
        nearByPowerups:nearPowerups,
        scoreList : SCORES
      });
    }
  });
// var end = console.timeEnd('update')
}

module.exports = {
  listen : listen,
  step : stepPlayers,
  update : sendUpdates,
  updateScore:updateScores
}
