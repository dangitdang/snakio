var R = require('ramda');
var utils = require('../utils.js');
var scale = [53, 55, 57, 58, 60, 62, 64, 65];
var NotesManager = function(grid,opts){
  var grid = grid;
  var that = this;
  var notes = [];
  var powerups=[];

  that.addNotes = function(amnt){
    while (amnt--) {
        var position = utils.randomPosition(notes);
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
        notes.push({
          x : position.x,
          y : position.y,
          pitch : scale[utils.randomBetween(0,7)]
        });
    }
  };

  that.addPowerups = function(amnt){
    while (amnt--) {
        var position = utils.randomPosition(powerups);
        powerups.push({
          x : position.x,
          y : position.y,
          increase : utils.randomBetween(1,3)*2
        });
    }
  };

  that.decreasePowerups = function(amnt){
    while (amnt--){
      powerups.pop();
    }
  };

  var deleteNotes = function(notesToDelete){
    // notesToDelete.forEach(function(note){
    //   for (var i = 0; i < notes.length; i++) {
    //     if (notes[i].x === note.x && notes[i].y === note.y) {
    //       notes.splice(i,1);
    //       break;
    //     }
    //   }
    // });
    notesToDelete.forEach(function(note){
      var prevGrid = grid[note.y][note.x];
      var newGridValue = prevGrid.filter(function(i){
        return i.type !== 'NOTE'
      });
      grid[note.y][note.x] = newGridValue;
    });
  }

  var deletePowerups = function(powerupsToDelete){
    powerupsToDelete.forEach(function(power){
      for (var i = 0; i < powerups.length; i++) {
        if (powerups[i].x === power.x && powerups[i].y === power.y) {
          powerups.splice(i,1);
          break;
        }
      }
    });
  }

  that.nearByNotes = function(player){
    // var nearBy = R.map(function(note){
    //   if (utils.checkDistance(player.head, note, 40, 40)){
    //     return note;
    //   }
    //   return;
    // }, notes);
    // return R.filter(function(note){ return note;}, nearBy);

    var nearBy2 = []
    var minX = Math.max(player.head.x - 20,0);
    var maxX = Math.min(player.head.x + 20, 199);
    var minY = Math.max(player.head.y - 20, 0);
    var maxY = Math.min(player.head.y + 20, 199);
    for (var x = minX; x < maxX; x++) {
      for (var y = minY; y < maxY; y++) {
        if (grid[y][x] !== undefined){
          grid[y][x].forEach(function(note){
            if (note.type === 'NOTE'){
              nearBy2.push(note);
            }
          })
        }
      }
    }
    return nearBy2
  };

    that.nearByPowerups=function(player){
        return powerups;
    }

  that.ateNote = function(player, nearBy){
    for (var i = 0; i < nearBy.length; i++) {
      if (player.head.x === nearBy[i].x && player.head.y === nearBy[i].y){
        deleteNotes([nearBy[i]]);
        that.addNotes(1);
        return nearBy[i];
      }
    }

    return false;
  };

    that.atePowerup = function(player, nearBy){
    for (var i = 0; i < nearBy.length; i++) {
      if (player.head.x === nearBy[i].x && player.head.y === nearBy[i].y){
        deletePowerups([nearBy[i]]);
        return nearBy[i];
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
