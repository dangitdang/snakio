$(document).ready(function() {

    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext("2d");
    var width = $("#canvas").width();
    var height = $("#canvas").height();

    var cellSize = 20;
    var direction;
    var notes;
    var score = 0;
    var died = false;
    var disconnected = false;
    var gameStarted = false;
    var nearByPlayers = [];
    var player;

    var colorToNote = {
        53 : "#F48FB1",
        55 : "#C51162",
        57 : "#7B1FA2",
        58 : "#3F51B5",
        60 : "#7986CB",
        62 : "#006064",
        64 : "#9ccc65",
        65 : "#FFEE58"
        }
    var pitchToColor = {
        "53": "#F48FB1",
        "55": "#C51162",
        "57": "#7B1FA2",
        "58": "#3F51B5",
        "60": "#7986CB",
        "62": "#006064",
        "64": "#9ccc65",
        "65": "#FFEE58"

    };
    
    var colorToNote = {
        "#F48FB1": "F",
        "#C51162": "G",
        "#7B1FA2": "A",
        "#3F51B5": "Bb",
        "#7986CB": "C",
        "#006064": "D",
        "#9ccc65": "E",
        "#FFEE58": "F"

    };
    var scale = [53, 55, 57, 58, 60, 62, 64, 65]; //f major scale

    var pitchList = []; //list of notes in the snake
    var oldPitchListLen = 3; //number of notes from cycle before

    var socket = io('/rattle');
    $('button').click(function(){
      startGame();
    });
    var startGame = function(){
      player.name = $('#player-name').val();
      gameStarted = true;
      socket.emit('readyToStart',player);
      $('#game-start').fadeOut();
      var counter = 750;
      var audioLoop = function(){
        clearInterval(interval);
        var numAddedNotes = player.notes.length - oldPitchListLen;
        counter += (250 * numAddedNotes);
        oldPitchListLen = player.notes.length;
        playSnake();
        if (died){
          return;
        }
        interval = setInterval(audioLoop, counter);
      }
      var interval = setInterval(audioLoop, counter);
    }
    socket.on('playerInfo', function(playerinfo){
      player = playerinfo;
      console.log(player);
    });
    socket.on('gameConfig', function(size){
      animLoop();
    })
    socket.on('update', function(updates){
      player = updates.player;
      notes = updates.nearByNotes;
      nearByPlayers = updates.nearByPlayers;
    });

    socket.on('dead', function(msg){
      died = true;
    });

    
    function animLoop() {
      animLoopHandle = window.requestAnimationFrame(animLoop);
      gameLoop();
    }

    MIDI.loadPlugin({
        soundfontUrl: "./soundfont2/",
        instrument: "acoustic_grand_piano",
        onprogress: function(state, progress) {
            //console.log(state, progress);
        },
        onsuccess: function() {
            midiLoaded = true;


        }
    });

    
    //plays the snake built so far
    function playSnake() {
        var duration = 0.0;
        var delay = .25;
        var velocity = 127;
        MIDI.setVolume(0, 127);
        for (var i = 0; i < player.notes.length; i++) {
            MIDI.noteOn(0, player.notes[i], velocity, delay);
            MIDI.noteOff(0, player.notes[i], delay + duration);
            delay = delay + .25;
        }

        for (var j = 0; j < nearByPlayers.length; j ++){
          var otherVelocity = 100;
          var otherDelay = .25;
          for (var k = 0; k < nearByPlayers[j].notes.length; k++) {
            var note = nearByPlayers[j].notes[i];
            MIDI.noteOn(0, note, otherVelocity, otherDelay);
            MIDI.noteOff(0, note, otherDelay + duration);
            otherDelay += .25;
          }
        }
    }

    
    //Moving the snake
    $(document).keydown(function(e) {
        var letter = e.which;
        var direction;
        //console.log(direction);
        if (letter == "37" && direction!=[1,0] ) {
            direction = [-1,0];
        } else if (letter == "39") {
            direction = [1,0];
        } else if (letter == "38") {
            direction = [0,-1];
        } else if (letter == "40") {
            direction = [0,1];
        };
        if (direction){
          socket.emit('playerInput',{
            cmd : 'setDirection',
            arg : direction
          });
        }


    })

 
 
  
    function gameLoop(){
      if (died) {
        //TODO: draw dead screen
      }
      else if (!disconnected) {
        if (gameStarted) {
          ctx.fillStyle = '#f2fbff';
          ctx.fillRect(0,0, width, height);

          drawGrid();
          paintBorder();
          paintSnake(player);
          paintNotes();

        }
      }
    }
    
    function paintNotes(){
      var dx = (Math.floor(width/cellSize/2 - player.head.x));
      var dy = (Math.floor(height/cellSize/2 - player.head.y));
      if (!notes) return;
      notes.forEach(function(note){
        color_note(dx+note.x, dy+note.y, pitchToColor[note.pitch]);
      });
    }

    function check_collision(x, y, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].x == x && array[i].y == y)

                return true;
        }
        return false;
    }

    //Colors pitches with different colors- will replace color_note
    function color_note(x, y, color) {
        ctx.font = "15px Arial";
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        ctx.strokeStyle = color;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.fillStyle = "white";
        if (colorToNote[color]!=undefined){
            ctx.fillText(colorToNote[color],x * cellSize+cellSize/4, y * cellSize+cellSize*.75);
        }
        
    }
    function paintSnake(snake){
      var diff = paintHead(snake.head);
      var pitchIndex=0;
      snake.body.forEach(function(part){
          var partPitch=snake.notes[pitchIndex];
        paintPart(part, diff, pitchToColor[partPitch]);
          pitchIndex+=1
      });

      nearByPlayers.forEach(function(other){
        paintOthers(other, diff);
          
      });
    }

    function paintOthers(snake, diff){
      paintPart(snake.head,diff,snake.hue);
      snake.body.forEach(function(part){
        paintPart(part,diff,snake.hue);
      });
    }
    function paintPart(part, diff, hue){
      var x = diff.dx + part.x;
      var y = diff.dy + part.y;
      color_note(x,y, hue);
    }
    function paintBorder(){
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      if (player.head.x < 20){
        ctx.moveTo((20 - player.head.x) * cellSize,0);
        ctx.lineTo((20 - player.head.x) * cellSize,height);
      }
      if (player.head.x > 180){
        ctx.moveTo((200-player.head.x+20)*cellSize, 0);
        ctx.lineTo((200-player.head.x+20)*cellSize, height);
      }

      if (player.head.y < 20){
        ctx.moveTo(0, (20-player.head.y) * cellSize);
        ctx.lineTo(width, (20-player.head.y) * cellSize);
      }

      if (player.head.y > 180){
        ctx.moveTo(0, (200-player.head.y+20) * cellSize);
        ctx.lineTo(width, (200-player.head.y +20)*cellSize);
      }
      ctx.stroke();
    }
    function drawGrid() {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.globalAlpha = 0.15;
      ctx.beginPath();

      for (var x = 0; x < width; x += cellSize){
        ctx.moveTo(x,0);
        ctx.lineTo(x,height);
      }

      for (var y = 0; y < height; y += cellSize){
        ctx.moveTo(0,y);
        ctx.lineTo(width, y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function paintHead(head){
      var dx = (Math.floor(width/cellSize/2)-head.x);
      var dy = (Math.floor(height/cellSize/2)-head.y);
      var headColor=pitchToColor[player.notes[0]];
      color_note(head.x+dx,head.y+dy, player.hue);
      return {
        dx : dx,
        dy : dy,
      }

    }
});
