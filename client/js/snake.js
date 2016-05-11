$(document).ready(function() {

      var canvas = $("#canvas")[0];
      var ctx = canvas.getContext("2d");
      var width = $("#canvas").width();
      var height = $("#canvas").height();

      var cellSize = 20;
      var direction;
      var notes;
      var powerups;
      var instrumentPowers;
      var score = 0;
      var died = false;
      var disconnected = false;
      var gameStarted = false;
      var curNoteIndex = 0;
      var nearByPlayers = [];
      var playersNoteIndex = {};
      var player;
      var last;
      var scoreList;
      var powerToColor = {
        'increaseMaxLength' : 'red',
        'changeInstrument'  : 'green'
      }

      var colorToNote = {
        53: "#F48FB1",
        55: "#C51162",
        57: "#7B1FA2",
        58: "#3F51B5",
        60: "#7986CB",
        62: "#006064",
        64: "#9ccc65",
        65: "#FFEE58"
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
      var instrumentToChannel = {
        0: 0,
        118: 1,
        57: 2,
        8: 3,
        109: 4, //bagpipe
        105: 5, //banjo
        75: 6, //panflute
        36: 7, //slap bass 1
      }
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
      $('button').click(function() {
        startGame();
      });
      var startGame = function() {
        player.name = $('#player-name').val();
        player.instrument = document.querySelector('input[name = "inst"]:checked').value;

        gameStarted = true;
        socket.emit('readyToStart', player);
        $('#game-start').fadeOut();
      }
      socket.on('playerInfo', function(playerinfo) {
        player = playerinfo;

      });

      socket.on('gameConfig', function(size) {
        playNotes();
        animLoop();
      })
      socket.on('update', function(updates) {
          player = updates.player;
          notes = updates.nearByNotes;
          powerups = updates.nearByPowerups;
          nearByPlayers = updates.nearByPlayers;
          scoreList = updates.scoreList;

          if (last !== undefined) {
            var now = new Date().getTime();

            if (now - last > 100) {
              //console.log(now - last)
            }
          }
        });

        socket.on('dead', function(msg) {
          died = true;
        });


        function updateScoreTable(scores) {
          var rank = 1;
          scores.reverse();
          $('#scoreTable > tbody').empty();
          $('#scoreTable').append('<tr><th>Rank</th><th>Name</th> <th>Points</th></tr>');

          scores.forEach(function(player) {
            $('#scoreTable').find('tbody').append('<tr><td>' + rank + '</td><td>' + player.id + '</td><td>' + player.score + '</td></tr>');
            rank += 1;
          });

        }

        function animLoop() {
          animLoopHandle = window.requestAnimationFrame(animLoop);
          gameLoop();
        }

        MIDI.loadPlugin({
          soundfontUrl: "./soundfont2/",
          instruments: ["acoustic_grand_piano", "trumpet", "synth_drum", "celesta", "bagpipe", "banjo", "pan_flute", "slap_bass_1"],
          onprogress: function(state, progress) {
            //console.log(state, progress);
          },
          onsuccess: function() {
            midiLoaded = true;
            MIDI.programChange(0, 0); // set channel 0 to piano
            MIDI.programChange(1, 118); // set channel 1 to synth drum
            MIDI.programChange(2, 56); //trumpet
            MIDI.programChange(3, 8); //celesta
            MIDI.programChange(4, 109); //bagpipe
            MIDI.programChange(5, 105); //banjo
            MIDI.programChange(6, 75); //panflute
            MIDI.programChange(7, 36); //slap bass
          }
        });

        function calculateVelocity(player, other) {
          var p1 = player.head;
          var p2 = other.head;
          var dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p2.y, 2));
          return 80 - dist * (.7);


        }

        function playNotes() {
          var delay = 0;
          var velocity = 80;
          MIDI.noteOn(instrumentToChannel[player.instrument], player.notes[curNoteIndex], velocity, delay);
          MIDI.noteOff(instrumentToChannel[player.instrument], player.notes[curNoteIndex], delay)
          curNoteIndex += 1;
          curNoteIndex = curNoteIndex % Math.min(player.maxLength, player.notes.length);
          nearByPlayers.forEach(function(other) {
            var index = playersNoteIndex[other.id];
            var velocity = calculateVelocity(player, other);
            if (index !== undefined) {
              var note = other.notes[index];
              var channel = instrumentToChannel[other.instrument];
              MIDI.noteOn(channel, note, velocity, delay);
              MIDI.noteOff(channel, note, delay);
            } else {
              index = 1;
              var note = other.notes[index];
              var channel = instrumentToChannel[other.instrument];
              MIDI.noteOn(channel, note, velocity, delay);
              MIDI.noteOff(channel, note, delay);
            }
            index += 1;
            playersNoteIndex[other.id] = index % Math.min(other.maxLength, other.notes.length);
          })
          setTimeout(playNotes, 250);
        }

        //Moving the snake
        $(document).keydown(function(e) {
          var letter = e.which;
          var direction;
          if (letter == "37") { //left
            direction = [-1, 0];
          } else if (letter == "39") { //right
            direction = [1, 0];
          } else if (letter == "38") { //up
            direction = [0, -1];
          } else if (letter == "40") { //down
            direction = [0, 1];
          };
          if (direction) {
            socket.emit('playerInput', {
              cmd: 'setDirection',
              arg: direction
            });
          }


        })

        function gameLoop() {
          if (died) {
            //TODO: draw dead screen
          } else if (!disconnected) {
            if (gameStarted) {
              ctx.fillStyle = '#f2fbff';
              ctx.fillRect(0, 0, width, height);
              drawGrid();
              paintBorder();
              paintSnake(player);
              paintNotes();
              paintPowerups(powerups);
              updateScoreTable(scoreList);
            }
          }
        }

        function paintNotes() {
          var dx = (Math.floor(width / cellSize / 2 - player.head.x));
          var dy = (Math.floor(height / cellSize / 2 - player.head.y));
          //console.log(dx, dy, "paintnote dx dy");
          if (!notes) return;
          notes.forEach(function(note) {
            color_note(dx + note.x, dy + note.y, pitchToColor[note.pitch]);
          });

        }

        function paintPowerups(array) {
          //console.log("powerups paint", powerups);
          var dx = (Math.floor(width / cellSize / 2 - player.head.x));
          var dy = (Math.floor(height / cellSize / 2 - player.head.y));
          //console.log(dx, dy, "powerup dx dy");
          if (!array) return;
          array.forEach(function(power) {
            color_powerup(dx + power.x, dy + power.y, powerToColor[power.effect]);
          });
        }

        function check_collision(x, y, array) {
          for (var i = 0; i < array.length; i++) {
            if (array[i].x == x && array[i].y == y)

              return true;
          }
          return false;
        }

        function color_note(x, y, color) {
          ctx.font = "15px Arial";
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

          ctx.strokeStyle = color;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.fillStyle = "white";
          if (colorToNote[color] != undefined) {
            ctx.fillText(colorToNote[color], x * cellSize + cellSize / 4, y * cellSize + cellSize * .75);
          }

        }

        function color_powerup(x, y, color) {
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(x * cellSize, y * cellSize);
          ctx.lineTo(x * cellSize + cellSize, y * cellSize);
          ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize + cellSize);
          ctx.fill();

        }

        function paintSnake(snake) {
          var diff = paintHead(snake.head);
          var pitchIndex = 0;
          //console.log(snake.body, "body")
          snake.body.forEach(function(part, i) {
            if (i < snake.maxLength) {
              var partPitch = snake.notes[i];
              paintPart(part, diff, pitchToColor[partPitch] === undefined ? player.hue : pitchToColor[partPitch]);
            } else {
              paintPart(part, diff, snake.hue);
            }
          });
          nearByPlayers.forEach(function(other) {
            paintOthers(other, diff);

          });
        }

        function paintOthers(snake, diff) {
          paintPart(snake.head, diff, snake.hue);
          snake.body.forEach(function(part) {
            paintPart(part, diff, snake.hue);
          });
        }

        function paintPart(part, diff, hue) {
          var x = diff.dx + part.x;
          var y = diff.dy + part.y;
          color_note(x, y, hue);
        }

        function paintBorder() {
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.globalAlpha = 1;
          ctx.beginPath();
          if (player.head.x < 20) {
            ctx.moveTo((20 - player.head.x) * cellSize, 0);
            ctx.lineTo((20 - player.head.x) * cellSize, height);
          }
          if (player.head.x > 180) {
            ctx.moveTo((200 - player.head.x + 20) * cellSize, 0);
            ctx.lineTo((200 - player.head.x + 20) * cellSize, height);
          }

          if (player.head.y < 20) {
            ctx.moveTo(0, (20 - player.head.y) * cellSize);
            ctx.lineTo(width, (20 - player.head.y) * cellSize);
          }

          if (player.head.y > 180) {
            ctx.moveTo(0, (200 - player.head.y + 20) * cellSize);
            ctx.lineTo(width, (200 - player.head.y + 20) * cellSize);
          }
          ctx.stroke();
        }

        function drawGrid() {
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#000000';
          ctx.globalAlpha = 0.15;
          ctx.beginPath();

          for (var x = 0; x < width; x += cellSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
          }

          for (var y = 0; y < height; y += cellSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
          }

          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        function paintHead(head) {
          var dx = (Math.floor(width / cellSize / 2) - head.x);
          var dy = (Math.floor(height / cellSize / 2) - head.y);
          var headColor = pitchToColor[player.notes[0]];
          color_note(head.x + dx, head.y + dy, player.hue);
          return {
            dx: dx,
            dy: dy,
          }

        }
      });
