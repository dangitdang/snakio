var R = require('ramda');
var utils = require('../utils.js');
var scale = [53, 55, 57, 58, 60, 62, 64, 65];

var NotesManager = function(grid,opts){
  var that = this;
  var grid = grid;
  var powerups = 0;

  that.addNotes = function(amnt){
    while (amnt--) {
        var position = utils.randomPosition();
        if (grid[position.y][position.x] === undefined){
          grid[position.y][position.x] = [{
            x : position.x,
            y : position.y,
            type : 'NOTE',
            pitch : scale[utils.randomBetween(0,7)]
          }]
        } else {
          amnt++
        }
    }
  };

  that.totalPowerUps = function() {
    return powerups;
  }

  that.addPowerups = function(amnt, effect){
    while (amnt--) {
        var position = utils.randomPosition(powerups);
        var newPower = {
          x : position.x,
          y : position.y,
          type : 'POWERUP',
          effect : effect
        }
        if (grid[position.y][position.x] === undefined){
          grid[position.y][position.x] = [newPower]
          powerups++;
        } else {
          amnt++
        }
    }
  };

  var deleteNotes = function(noteToDelete){
      var prevGrid = grid[noteToDelete.y][noteToDelete.x];
      var newGridValue = prevGrid.filter(function(i){
        return i.type !== 'NOTE'
      });
      grid[noteToDelete.y][noteToDelete.x] = newGridValue;
  }

  var deletePowerups = function(powerupToDelete){
      var prevGrid = grid[powerupToDelete.y][powerupToDelete.x];
      var newGridValue = prevGrid.filter(function(i){
        return i.type !== 'POWERUP'
      });
      grid[powerupToDelete.y][powerupToDelete.x] = newGridValue;
  }

  that.nearByNotes = function(player){
    var nearBy2 = []
    var minX = Math.max(player.head.x - 20,0);
    var maxX = Math.min(player.head.x + 20, 199);
    var minY = Math.max(player.head.y - 20, 0);
    var maxY = Math.min(player.head.y + 20, 199);
    for (var x = minX; x < maxX; x++) {
      for (var y = minY; y < maxY; y++) {
        if (grid[y][x] !== undefined){
          grid[y][x].forEach(function(note){
            if (note.type === 'NOTE' || note.type === 'POWERUP'){
              nearBy2.push(note);
            }
          })
        }
      }
    }
    return nearBy2;
  };

  that.eatNote = function(player){
    var gridValue = grid[player.head.y][player.head.x];
    if (gridValue === undefined){
        return false;
    }
    var notes = gridValue.filter(function(i){
      return i.type === 'NOTE' || i.type === 'POWERUP'
    });
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      if (note.type === 'PLAYER') {
        continue;
      } else {
        if (note.type ==='NOTE') {
          deleteNotes(note);
          that.addNotes(1);
        } else {
          deletePowerups(note);
        }
        return note;
      }
    }
    return false;
  };

  return that;
};

var manager;
module.exports = function(opts){
  if (manager){
    return manager;
  } else {
    return NotesManager(opts);
  }
};
