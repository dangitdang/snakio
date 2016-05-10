var R = require('ramda');
var utils = require('../utils.js');
var scale = [53, 55, 57, 58, 60, 62, 64, 65];
var NotesManager = function(opts){
  var that = this;
  var notes = [];
  var powerups=[];

  that.addNotes = function(amnt){
    while (amnt--) {
        var position = utils.randomPosition(notes);
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

  that.decreaseNotes = function(amnt){
    while (amnt--){
      notes.pop();
    }
  };
    
  that.decreasePowerups = function(amnt){
    while (amnt--){
      powerups.pop();
    }
  };

  var deleteNotes = function(notesToDelete){
    notesToDelete.forEach(function(note){
      for (var i = 0; i < notes.length; i++) {
        if (notes[i].x === note.x && notes[i].y === note.y) {
          notes.splice(i,1);
          break;
        }
      }
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
    var nearBy = R.map(function(note){
      if (utils.checkDistance(player.head, note, 40, 40)){
        return note;
      }
      return;
    }, notes);
    return R.filter(function(note){ return note;}, nearBy);
  };
  
    that.nearByPowerups=function(player){
        return powerups;
    }

  that.ateNote = function(player, nearBy){
    for (var i = 0; i < nearBy.length; i++) {
      if (player.head.x === nearBy[i].x && player.head.y === nearBy[i].y){
        deleteNotes([nearBy[i]]);
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
