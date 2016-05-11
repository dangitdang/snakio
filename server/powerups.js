var utils = require('../utils.js');
var channels=[0,118, 57,8,109, 105,75, 36];
var durations = [.125, .25, .5];

module.exports.increaseMaxLength = function(player){
  var value = utils.randomBetween(1,3)*2;
  player.maxLength += value;
}

module.exports.changeInstrument = function(player){
  var value = channels[utils.randomBetween(0,8)]
  player.instrument = value;
}

module.exports.changeNoteDuration = function(player){
  var value = utils.randomBetween(0,3);
  player.noteDuration = value;
}

module.exports.invisible = function(player){
  player.invisible = true;
  setTimeout(function(){
    player.invisible = false;
  }, 6000);
}