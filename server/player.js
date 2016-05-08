var R = require('ramda');
var DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
];
var utils = require('../utils.js');
var randomColor = require('randomcolor');
var PlayersManager = function(opts) {
    var that = this;
    var players = [];

    that.newPlayer = function(id) {
        var player = {
            id: id,
            head: utils.distributedPosition(players),
            dir: DIRS[Math.floor(Math.random() * 3)],
            body: [],
            notes: [],
            lastPing: new Date().getTime(),
            hue: randomColor()
        };
        var initNotes = [53, 57, 60];
        R.forEach(function(note){
          that.appendNote(player, note);
        }, initNotes);
        console.log(player, 'new notes?');
        return player;
    };

    that.addPlayer = function(player){
      players.push(player);
    };

    that.removePlayer = function(player){
      for (var i = 0; i < players.length; i++) {
        if (players[i].id === player.id){
          players.splice(i,1);
          break;
        }
      }
    };

    that.getPlayer = function(id){
      for (var i = 0; i < players.length; i++) {
        var p = players[i].id;
        if (id === p) return players[i];
      }
    }

    that.moveAll = function(){
      players.forEach(function(player){
        that.movePlayer(player);
      });
    };

    that.movePlayer = function(player) {
        var dx = player.dir[0];
        var dy = player.dir[1];
        player.body.pop();
        player.body.unshift({
          x : player.head.x,
          y : player.head.y
        });
        player.head.x += dx;
        player.head.y += dy;
    };

    that.appendNote = function(player, note){
        var body = player.body;
        var prev = body.length < 1 ? player.head : body[body.length-1];
        var newNote = {
          x: prev.x - player.dir[0],
          y: prev.y - player.dir[1],
        }
        player.body.push(newNote);
        if (player.notes.length > 8){
          player.notes.splice(0,1);
        }
        player.notes.push(note);
    };

    that.nearByPlayers = function(player) {
        var nearBy = R.map(function(other) {
            if (other.id === player.id) {
                return;
            }
            for (var i = 0; i < other.body.length; i++) {
                if (utils.checkDistance(player.head, other.body[i],40,40)) {
                    return other;
                }
            }
        }, players);
        return R.filter(function(other) { return other; }, nearBy);
    };
    that.deadPlayer = function(player){
      player.body = [];
      player.notes = [];
      player.dir = [0,0];
    }
    that.checkCollisions = function(player, nearBy){
      for (var i = 0; i < nearBy.length; i++) {
        var other = nearBy[i];
        for (var j = 0; j < other.body.length; j++) {
          var pos = other.body[j];
          if (pos.x === player.head.x && pos.y === player.head.y) {
            return true;
          }
        }
      }

      for (var i = 0; i < player.body.length; i++) {
        var part = player.body[i];
        if (part.x === player.head.x && part.y === player.head.y){
          return true;
        }
      }
      if (player.head.x < 0 || player.head.x > 199 || player.head.y < 0 || player.head.y > 199 ){
        return true;
      }
      return false;
    };

    that.setDirection = function(player, dir) {
      var curDir = player.dir;
      var sanityCheck = R.map(function(i){return i * -1;}, dir);
      if (!R.equals(curDir, sanityCheck)) {
        player.dir = dir;
        return true;
      }
      return false;
    }

    return that;
};

var manager;
module.exports = function(opts){
  if (manager){
    return manager;;
  } else {
    return PlayersManager(opts);
  }
}
