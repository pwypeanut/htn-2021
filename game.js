// script to run game

// import * as levels from 'levels/levels.js';

function getUrlParameters(parameter, staticURL, decode) {

    var currLocation = (staticURL.length) ? staticURL : window.location.search,
        parArr = currLocation.split("?")[1].split("&"),
        returnBool = true;

    for (var i = 0; i < parArr.length; i++) {
        parr = parArr[i].split("=");
        if (parr[0] == parameter) {
            return (decode) ? decodeURIComponent(parr[1]) : parr[1];
            returnBool = true;
        } else {
            returnBool = false;
        }
    }
    if (!returnBool) return false;
}

var roomID = parseInt(getUrlParameters("roomID", window.location.href, true));
var playerNo = parseInt(getUrlParameters("player", window.location.href, true));
var level = parseInt(getUrlParameters("level", window.location.href, true));
var ghost = undefined;
//inventory
var inventory = 0;
var blocks = 0;

var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 720,
    audio: {
        disableWebAudio: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
// var bomb_animation;
var stars;
var bombs;
var platforms;
var breakables;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var explosive;

// sounds variable
var sounds2 = {};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('start', 'assets/start.png');
    this.load.image('block', 'assets/block.png');
    this.load.image('break_block', 'assets/break_block.png');
    this.load.image('break_block_2', 'assets/2-block.png');
    this.load.image('break_block_3', 'assets/3-block.png');
    this.load.image('end', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('collectible_block', 'assets/collect_block.png');
    this.load.image('collectible_block_small', 'assets/collect_block_small.png');

    this.load.audio('explosion', 'assets/explosion.wav');
    this.load.audio('win', 'assets/win.wav');
    this.load.audio('collect', 'assets/collect.wav');
    this.load.audio('drop', 'assets/drop.wav');

    this.load.spritesheet('explosion_animation', 'assets/bomb_explosion_2.png', { frameWidth: 40, frameHeight: 40 });

    if (playerNo == 1) {
        this.load.spritesheet('player1', 'assets/Player1.png', { frameWidth: 42, frameHeight: 51 });
        this.load.spritesheet('player2', 'assets/Player2.png', { frameWidth: 42, frameHeight: 51 });
    } else {
        this.load.spritesheet('player2', 'assets/Player1.png', { frameWidth: 42, frameHeight: 51 });
        this.load.spritesheet('player1', 'assets/Player2.png', { frameWidth: 42, frameHeight: 51 });
    }
}

var won = false;
var otherWin = false;
var MAX_LEVEL = Object.keys(levels).length / 2;

function nextLevel() {
    if (level == MAX_LEVEL) {
        window.location.href = "/thanks.html";
    } else {
        window.location.href = "/game.html?roomID=" + roomID + "&player=" + playerNo + "&level=" + (level + 1);
    }
}

function reachGoal() {
    if (!won) {
        won = true;
        endGroups.getChildren()[0].alpha = 0.5;
        serverPush(roomID + playerNo - 1, {
            type: "win",
        });
        sounds2['win'].play();
        if (otherWin) {
            setTimeout(nextLevel, 500);
        }
    }
}

function create() {
    //  A simple background for our game
    // this.add.image(400, 300, 'sky');
    listSounds = ['explosion', 'win', 'collect', 'drop'];

    // create platforms 
    platforms = this.physics.add.staticGroup();
    breakables = this.physics.add.staticGroup();
    breakables2 = this.physics.add.staticGroup();
    breakables3 = this.physics.add.staticGroup();
    bombs = this.physics.add.staticGroup();
    bombInvent = this.physics.add.staticGroup();
    startGroups = this.physics.add.staticGroup();
    endGroups = this.physics.add.staticGroup();
    animations = this.physics.add.staticGroup();
    collectibles = this.physics.add.staticGroup();
    placedBlocks = this.physics.add.staticGroup();
    blockInvent = this.physics.add.staticGroup();

    for (i = 0; i < 4; i++) {
        var sound = this.sound.add(listSounds[i], { loop: false });
        sounds2[listSounds[i]] = sound;
    }

    var currlevel = "level_" + level + "_" + playerNo;
    var platform = levels[currlevel].split(/[\r\n]+/);

    // size = size of the block in px
    size = 50;
    var startX, startY;

    for (i = 0; i < 700 / size; i++) {
        currfloor = platform[i + 1].split("")
        for (j = 0; j < 1000 / size; j++) {
            var x = size * (j + 1 / 2);
            var y = size * (i + 1 / 2) - i * 3;
            if (currfloor[j] == 'w') {
                platforms.create(x, y, 'block');
            } else if (currfloor[j] == 'b') {
                breakables.create(x, y, 'break_block');
            } else if (currfloor[j] == 'd') {
                breakables2.create(x, y, 'break_block_2');
            } else if (currfloor[j] == 't') {
                breakables3.create(x, y, 'break_block_3');
            } else if (currfloor[j] == 'o') {
                bombs.create(x, y, 'bomb');
            } else if (currfloor[j] == 's') {
                startX = x;
                startY = y;
                startGroups.create(x, y, 'start');
            } else if (currfloor[j] == 'e') {
                endGroups.create(x, y, 'end');
            } else if (currfloor[j] == 'c') {
                collectibles.create(x, y, 'collectible_block_small');
            }
        }
    }

    // The player and its settings
    player = this.physics.add.sprite(startX, startY - 10, 'player1');
    ghost = this.physics.add.sprite(-100, -100, 'player2');
    player.setScale(0.9);
    ghost.setScale(0.9);
    ghost.body.allowGravity = false;
    ghost.alpha = 0.3;

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player1', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'left2',
        frames: this.anims.generateFrameNumbers('player2', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'player1', frame: 3 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'turn2',
        frames: [{ key: 'player2', frame: 3 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player1', { start: 4, end: 6 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'right2',
        frames: this.anims.generateFrameNumbers('player2', { start: 4, end: 6 }),
        frameRate: 10,
        repeat: -1
    });

    // bomb animation
    this.anims.create({
        key: 'bomb_explosion',
        frames: this.anims.generateFrameNumbers('explosion_animation', { start: 0, end: 5 }),
        frameRate: 15,
        repeat: 0,
    })

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    // scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, breakables);
    this.physics.add.collider(player, breakables2);
    this.physics.add.collider(player, breakables3);
    this.physics.add.collider(player, placedBlocks);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    // this.physics.add.overlap(player, stars, collectStar, null, this);

    // this.physics.add.collider(player, bombs, hitBomb, null, this);

    this.physics.add.overlap(player, endGroups, reachGoal, null, this);
    this.physics.add.overlap(player, bombs, collectBomb, null, this);
    this.physics.add.overlap(player, collectibles, collectBlocks, null, this);
}

var orientation = 'turn';

function update() {
    if (gameOver) {
        return;
    }

    for (let i in explosions) {
        pair = explosions[i];
        var bomb_animation = this.physics.add.sprite(pair[0], pair[1], 'explosion_animation');
        bomb_animation.body.allowGravity = false;
        // setTimeout(() => bomb_animation.destroy(), 600)
        bomb_animation.setScale(3);
        bomb_animation.anims.play('bomb_explosion', true);
        setTimeout(() => bomb_animation.destroy(), 600)
        // bomb_animation.disableBody(true, true);
    }
    if (explosions.length !== 0) explosions = [];

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        orientation = 'left2';

        // player.anims.play('left', false) // removes any repetition
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        orientation = 'right2';

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        orientation = 'turn2';

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-240);
    }

}

var prevX = 0;
var prevY = 0;
var prevOrientation = 'turn';

function sendCoords() {
    if (!player) {
        return;
    }
    var x = player.x;
    var y = player.y;
    if (x != prevX || y != prevY || orientation != prevOrientation) {
        serverPush(roomID + playerNo - 1, {
            type: "position",
            x: x,
            y: y,
            orientation: orientation,
        });
    }
    prevX = x;
    prevY = y;
    prevOrientation = orientation;
}

var prevOrientation2 = 'turn';

var explosions = [];

window.onload = function () {
    setInterval(sendCoords, 30);
    serverListen(roomID + (2 - playerNo), function (obj) {
        // console.log(obj);
        if (ghost && obj["type"] == "position") {
            ghost.setX(obj.x);
            ghost.setY(obj.y);
            if (prevOrientation2 !== obj.orientation) {
                ghost.anims.play(obj.orientation);
                prevOrientation2 = obj.orientation;
            }
        }
        if (obj.type == "win") {
            otherWin = true;
            if (won) {
                nextLevel();
            }
        }
        if (obj.type == "restart") {
            window.location.reload(true);
        }
        if (obj.type == "bomb" && breakables != undefined) {
            explosions.push([obj.x, obj.y]);
            var children = breakables.getChildren().slice();
            children.forEach(function (child) {
                var dis = (obj.x - child.x) * (obj.x - child.x) + (obj.y - child.y) * (obj.y - child.y);
                console.log(obj.x, obj.y, child.x, child.y);
                if (dis < 5000) {
                    breakables.remove(child, true, true);
                }
            });
            children = breakables2.getChildren().slice();
            children.forEach(function (child) {
                var dis = (obj.x - child.x) * (obj.x - child.x) + (obj.y - child.y) * (obj.y - child.y);
                if (dis < 5000) {
                    breakables2.remove(child, true, true);
                    breakables.create(child.x, child.y, 'break_block');
                }
            });
            children = breakables3.getChildren().slice();
            children.forEach(function (child) {
                var dis = (obj.x - child.x) * (obj.x - child.x) + (obj.y - child.y) * (obj.y - child.y);
                if (dis < 5000) {
                    var x = child.x;
                    var y = child.y;
                    breakables3.remove(child, true, true);
                    breakables2.create(x, y, 'break_block_2');
                }
            });

            sounds2['explosion'].play();
        }
        if (obj.type == "place") {
            placedBlocks.create(obj.x, obj.y, 'collectible_block');
        }
    });
    $(document).keydown(function (event) {
        if (event.keyCode == 82) {
            serverPush(roomID + playerNo - 1, {
                type: "restart",
            });
            window.location.reload(true);
        }
        if (event.keyCode == 32) {
            if (inventory > 0) {
                var x = size * 1 / 2;
                var y = size * (14 + 1 / 2) - 13 * 3;
                bombInvent.getChildren().forEach(function (child) {
                    child.disableBody(true, true);
                });

                for (i = 0; i < inventory - 1; i++) {
                    bombInvent.create(size * (i + 1 / 2), y, 'bomb');
                }

                inventory -= 1;

                explosions.push([player.x, player.y]);

                serverPush(roomID + playerNo - 1, {
                    type: "bomb",
                    x: player.x,
                    y: player.y,
                });

                sounds2['explosion'].play();
            }
        }
        if (event.keyCode == 16) {
            if (blocks > 0) {
                blockInvent.getChildren().forEach(function (child) {
                    child.disableBody(true, true);
                });
                var y = size * (14 + 1 / 2) - 13 * 3;
                for (i = 0; i < blocks - 1; i++) {
                    blockInvent.create(1000 - size * (i + 1 / 2), y, 'collectible_block_small');
                }
                blocks -= 1;
                serverPush(roomID + playerNo - 1, {
                    type: "place",
                    x: player.x,
                    y: player.y,
                });

                // Add sounds effect here.
                sounds2['drop'].play();
            }
        }

    });
}

// collect bomb
function collectBomb(player, bomb) {
    bomb.disableBody(true, true);
    var x = size * (inventory + 1 / 2);
    var y = size * (14 + 1 / 2) - 13 * 3;
    bombInvent.create(x, y, 'bomb');
    inventory += 1;
    sounds2['collect'].play();
}

// collect bomb
function collectBlocks(player, block) {
    block.disableBody(true, true);
    var x = 1000 - size * (blocks + 1 / 2);
    var y = size * (14 + 1 / 2) - 13 * 3;
    blockInvent.create(x, y, 'collectible_block_small');
    blocks += 1;
    sounds2['collect'].play();
}