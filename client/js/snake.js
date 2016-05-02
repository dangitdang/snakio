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
    // function init() {
    //     direction = "right";
    //     make_snake();
    //     make_note();
    //     game_loop = setInterval(paint, 60);
    //
    //     var counter = 1500;
    //     var myFunction = function() {
    //         clearInterval(interval);
    //         var numAddedNotes = pitchList.length - oldPitchListLen;
    //         counter += (500 * numAddedNotes); //increases interval if a new note has been added
    //         oldPitchListLen = pitchList.length;
    //         playSnake();
    //         interval = setInterval(myFunction, counter);
    //     }
    //     //var interval = setInterval(myFunction, counter);
    // }
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

    //instead of playing every x seconds, it will always repeat
    var globalDelay = 0.0;

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

    //plays a note when it's first eaten
    function playNote(note, duration) {
        var delay = 0;
        var velocity = 127;
        MIDI.setVolume(0, 127);
        MIDI.noteOn(0, note, velocity, delay);
        MIDI.noteOff(0, note, delay + duration);

    }

    //Moving the snake
    $(document).keydown(function(e) {
        var letter = e.which;
        var direction;
        if (letter == "37") {
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

    //making the snake, initialized with a length of 3
    function make_snake() {
        for (var i = 2; i >= 0; i--) {
            var pitch = scale[Math.floor(Math.random() * scale.length)];
            pitchList.push(pitch);
            musicSnake.push({
                x: i,
                y: 3,
                color: "#f42ada",
                note: pitch
            });
        }
        //console.log(musicSnake, "snake");
    }


    //makes and returns a single random note
    function make_note() {
        var rand = colorToNote[Math.floor(Math.random() * colorToNote.length)];
        var pitchhhh = scale[Math.floor(Math.random() * scale.length)]
            //console.log(pitchhhh, "PITCH????")
        food = {
            x: Math.round(Math.random() * (width - cellSize) / cellSize),
            y: Math.round(Math.random() * (height - cellSize) / cellSize),
            color: "#aaff32",
            note: pitchhhh,
        };

        availableNotes.push(food);
        //console.log(availableNotes, "food list");
        return food;
    }
    var headColor;
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
    function paint() {
        //canvas
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(0, 0, width, height);
        //console.log(musicSnake[0], "first");
        var headX = musicSnake[0].x;
        var headY = musicSnake[0].y;
        var headPitch = musicSnake[0].note;
        //console.log(headPitch, "head pitch")
        headColor = "#a9fedd"; //pitchToColor[headPitch.toString()];

        //move in the right direction
        if (direction == "right") headX++;
        else if (direction == "left") headX--;
        else if (direction == "up") headY--;
        else if (direction == "down") headY++;

        //if hits the end of the canvas or hits itself, end
        if (headX == -1 || headY == -1 || headX == width / cellSize || headY == height / cellSize || check_collision(headX, headY, musicSnake)) {
            return;
        }


        if (headX == food.x && headY == food.y) {
            var tail = {
                x: headX,
                y: headY,
                pitch: headPitch,
                color: headColor
            };

            var delay = 0;
            var note = food.note;
            var velocity = 127;
            // play the note
            MIDI.setVolume(0, 127);
            MIDI.noteOn(0, note, velocity, delay);
            MIDI.noteOff(0, note, delay + 1.75);
            score++;
            pitchList.push(note);
            make_note();
        }
        //no food eaten- move tail to head
        else {
            var tail = musicSnake.pop(); //pops out the last cell
            tail.x = headX;
            tail.y = headY;
            tail.note = headPitch;
            tail.color = headColor;
        }
        musicSnake.unshift(tail);
        //draw the snake
        for (var i = 0; i < musicSnake.length; i++) {
            var c = musicSnake[i];
            color_note(c.x, c.y);
        }
        color_note(food.x, food.y);

        var score_text = "Score: " + score;
        ctx.fillText(score_text, 5, height - 5)
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
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = color;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    function paintSnake(snake){
      var diff = paintHead(snake.head);
      snake.body.forEach(function(part){
        paintPart(part, diff, player.hue);
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
      color_note(head.x+dx,head.y+dy, player.hue);
      return {
        dx : dx,
        dy : dy,
      }

    }
});
