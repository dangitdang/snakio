var config = require('./config.js');
var randomBetween = function(from, to){
  return Math.floor(Math.random() * (to-from)) + from;
};
module.exports.randomBetween = randomBetween;
module.exports.randomPosition = function() {
  return {
    x : randomBetween(0, config.gameWidth),
    y : randomBetween(0, config.gameHeight)
  };
};

module.exports.makeGrid = function(width, height){
  var grid = [];
  for (var i=0; i < height; i ++){
    grid.push([]);
    grid[i].push(new Array(width));
  }
  return grid;
}

module.exports.getDistance = function(p1, p2){
  return Math.pow(p2.x - p1.x,2) + Math.pow(p2.y-p2.y,2);
}

module.exports.distributedPosition = function(points) {
  var numOfCands = 10;
  var best = module.exports.randomPosition();
  var maxD = 0;

  if (points.length < 1){
    return best;
  }

  for (var i = 0; i < numOfCands; i++) {
    var minD = Infinity;
    var cand = module.exports.randomPosition();

    for (var j=0; j < points.length; j++){
      var distance = Math.min(module.exports.getDistance(cand, points[j]),minD);
    }

    if (minD > maxD) {
      best = cand;
      maxD = minD;
    } else {
      return best;
    }
  }

  return best;
};

module.exports.checkDistance = function(head, joint, width, height){
  var xDiff = Math.abs(head.x - joint.x);
  var yDiff = Math.abs(head.y - joint.y);
  return xDiff < width && yDiff < height;
};
