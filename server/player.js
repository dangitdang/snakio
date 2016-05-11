var R = require('ramda');
var DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];
var utils = require('../utils.js');
var randomColor = require('randomcolor');

var PlayersManager = function(grid, opts) {
  var that = this;
  var grid = grid;
  var players = [];

  that.newPlayer = function(id) {
    var player = {
      id: id,
      head: utils.distributedPosition(players),
      dir: DIRS[Math.floor(Math.random() * 3)],
      body: [],
      notes: [],
      lastPing: new Date().getTime(),
      hue: randomColor(),
      instrument: 0,
      noteDuration: .25,
      invisible: false,
      score: 0,
      maxLength: 8
    };
    var initNotes = [53, 57, 60];
    R.forEach(function(note) {
      that.appendNote(player, note);
    }, initNotes);
    grid[player.head.y][player.head.x] = [{
      x: player.head.x,
      y: player.head.y,
      type: 'PLAYER',
      playerID: player.id
    }]
    return player;
  };

  that.addPlayer = function(player) {
    players.push(player);
  };

  that.removePlayer = function(player) {
    for (var i = 0; i < players.length; i++) {
      if (players[i].id === player.id) {
        players.splice(i, 1);
        break;
      }
    }
    that.deadPlayer(player);
  };

  that.getPlayer = function(id) {
    for (var i = 0; i < players.length; i++) {
      var p = players[i].id;
      if (id === p) return players[i];
    }
  }

  that.moveAll = function() {
    players.forEach(function(player) {
      that.movePlayer(player);
    });
  };

  that.movePlayer = function(player) {

    var dx = player.dir[0];
    var dy = player.dir[1];
    if (dx === dy) {
      return;
    }
    var prevPos = player.body.pop();
    var prevGrid = grid[prevPos.y][prevPos.x];
    var indexToRemove;
    if (prevGrid.length < 2) {
      grid[prevPos.y][prevPos.x] = undefined;
    } else {
      var updatedPrevGrid = prevGrid.filter(function(i) {
        return i.playerID !== player.id;
      });
      grid[prevPos.y][prevPos.x] = updatedPrevGrid;
    }

    player.body.unshift({
      x: player.head.x,
      y: player.head.y
    });
    player.head.x += dx;
    player.head.y += dy;
    var newPos = {
      x: player.head.x,
      y: player.head.y,
      type: 'PLAYER',
      playerID: player.id
    }
    if (player.head.x > 199 || player.head.x < 0 || player.head.y > 199 || player.head.y < 0) {
      return;
    }
    if (grid[player.head.y][player.head.x] !== undefined) {
      grid[player.head.y][player.head.x].push(newPos)
    } else {
      grid[player.head.y][player.head.x] = [newPos]
    }
  };

  that.appendNote = function(player, note) {
    var body = player.body;
    var prev = body.length < 1 ? player.head : body[body.length - 1];
    var newNote = {
      x: prev.x - player.dir[0],
      y: prev.y - player.dir[1],
      type: 'PLAYER',
      playerID: player.id
    }
    if (grid[newNote.y][newNote.x] === undefined) {
      grid[newNote.y][newNote.x] = [newNote]
    } else {
      grid[newNote.y][newNote.x].push(newNote);
    }

    player.body.push({
      x: newNote.x,
      y: newNote.y
    });

    if (player.notes.length >= player.maxLength) {
      player.notes.splice(0, 1);
    }
    player.notes.push(note);
    player.score += 10; //10 points per note
  };

  that.nearByPlayers = function(player) {
    var nearBy2 = []
    var minX = Math.max(player.head.x - 20, 0);
    var maxX = Math.min(player.head.x + 20, 199);
    var minY = Math.max(player.head.y - 20, 0);
    var maxY = Math.min(player.head.y + 20, 199);
    for (var x = minX; x < maxX; x++) {
      for (var y = minY; y < maxY; y++) {
        if (grid[y][x] !== undefined) {
          grid[y][x].forEach(function(thing) {
            if (thing.type === 'PLAYER' && thing.playerID !== player.id) {
              if (nearBy2.indexOf(thing.playerID) === -1) {
                nearBy2.push(thing.playerID);
              }
            }
          })
        }
      }
    }
    return nearBy2.map(function(id) {
      return that.getPlayer(id);
    });


  };
  that.deadPlayer = function(player) {
    console.log('died');
    player.dir = [0, 0];
    if (player.head.y < 200 && player.head.y > 0 && player.head.x < 200 && player.head.y > 0) {
      grid[player.head.y][player.head.x] = undefined;
    }

    player.body.forEach(function(part) {
      try {
        grid[part.y][part.x] = undefined;
      } catch (e) {
        console.log(e);
      }
    })
    player.head = {};
    player.body = [];
    player.notes = [];

  }
  that.checkCollisions = function(player, nearBy) {
    if (player.head.x < 0 || player.head.x > 199 || player.head.y < 0 || player.head.y > 199) {
      return true;
    }
    for (var i = 0; i < player.body.length; i++) {
      var part = player.body[i];
      if (part.x === player.head.x && part.y === player.head.y) {
        return true;
      }
    }
    var curPosition = grid[player.head.y][player.head.x];
    if (curPosition.length < 2) {
      return false;
    } else {
      console.log(curPosition);
      var otherObjects = curPosition.filter(function(o) {
        return o.type === 'PLAYER'
      });
      if (otherObjects.length > 1){
        return true;
      }
    }

    return false
  };

  that.setDirection = function(player, dir) {
    var curDir = player.dir;
    var sanityCheck = R.map(function(i) {
      return i === 0 ? 0 : i * -1;
    }, dir);
    //console.log(dir, "direction", sanityCheck, "sanity check")
    if (!R.equals(curDir, sanityCheck)) {
      player.dir = dir;
      return true;
    }
    return false;
  };


  that.getScores = function() {
    var scores = []
    players.forEach(function(player) {
      var score = {
        id: player.name,
        score: player.score
      }
      scores.push(score);
    });
    return scores;

  }

  return that;
};

var manager;
module.exports = function(opts) {
  if (manager) {
    return manager;;
  } else {
    return PlayersManager(opts);
  }
}
