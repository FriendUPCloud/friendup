(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

//global variables
window.onload = function () {
  var game = new Phaser.Game(320, 512, Phaser.AUTO, 'ludumdare29');

  // Game States
  game.state.add('boot', require('./states/boot'));
  game.state.add('gameover', require('./states/gameover'));
  game.state.add('menu', require('./states/menu'));
  game.state.add('play', require('./states/play'));
  game.state.add('preload', require('./states/preload'));
  

  game.state.start('boot');
};
},{"./states/boot":9,"./states/gameover":10,"./states/menu":11,"./states/play":12,"./states/preload":13}],2:[function(require,module,exports){
'use strict';

var Block = function(game, x, y, leftFace, aboveFace) {
	Phaser.Sprite.call(this, game, x, y, 'images');
	
	// 0 - bright
	// 1 - med
	
	this.leftFace = leftFace;
	this.topFace = aboveFace;
	this.rightFace = game.rnd.integerInRange(0,1);
	this.bottomFace = game.rnd.integerInRange(0,1);
	
	this.frameName = "tileset_dirt" + "000" + getFrame(this, this.leftFace, this.topFace, this.rightFace, this.bottomFace) + ".png";
	
	// scale up! //
	this.smoothed = false;
	this.scale.x = 2;
	this.scale.y = 2;
	
	this.anchor.setTo(0.5, 0.5);
	this.x += this.width / 2;
	this.y += this.height / 2;
};

Block.prototype = Object.create(Phaser.Sprite.prototype);
Block.prototype.constructor = Block;

var getFrame = function(block,left,top,right,bottom) {
	var type = left * 1000 + top * 100 + right * 10 + bottom;
	var sum = left + top + right + bottom;
	var frameNum = 0;
	
	if (sum !== 2) {
		frameNum = sum;
		if (type === 1) block.angle = 180;
		if (type === 10) block.angle = 90;
		if (type === 1000) block.angle = 270;
		if (type === 1011) block.angle = 90;
		if (type === 1101) block.angle = 180;
		if (type === 1110) block.angle = 270;
	} else {
		if (type === 11) {frameNum = 2; block.angle = 90;}
		else if (type === 110) {frameNum = 2;}
		else if (type === 101) {frameNum = 5;}
		else if (type === 1100) {frameNum = 2; block.angle = 270;}
		else if (type === 1010) {frameNum = 5; block.angle = 90;}
		else {frameNum = 2; block.angle = 180;}
	}
	
	return frameNum;
};

module.exports = Block;
},{}],3:[function(require,module,exports){
'use strict';

var POWER_DURATION = 450; // how long the powerup lasts, in frames
var NORMAL_SPEED = 100; // speed of the player, normally
var BOOST_SPEED = 200; // speed of the player, boosting
var POWER_SPEED = 300; // speed of the player when carroted
var SLOW_SPEED = 50; // speed when drilling through a rock
var INITIAL_HEALTH = 100; // how much health the player starts with
var REGEN_RATE = 0.1; // how quickly heat dissipates if not drilling through rock or lava
var REGEN_MAX = 100; // the maximum amount of heat that can be regenerated
var NORMAL_TURN = 100; // how fast you turn normally
var POWER_TURN = 200; // how fast you turn if carroty
var MAX_SPEED = 300; // the maximum possible speed from depth
var MAX_BOOST = 50;
var BOOST_REGEN = 0.5;
var BOOST_DRAIN = 0.75;

var Bunny = function(game, x, y, frame) {
	Phaser.Sprite.call(this, game, x, y, 'images', frame);
	// scale up!
	this.smoothed = false;
	this.scale.x = 2;
	this.scale.y = 2;
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	// enable physics
	this.game.physics.arcade.enableBody(this);
	// set body size
	this.body.setSize(12, 14, 0, 12);
	// enable input
	this.cursors = game.input.keyboard.createCursorKeys();
	// wiggle wiggle
	this.baseY = this.y;
	// animate
	this.animations.add('drill', Phaser.Animation.generateFrameNames('drilling', 0, 2, '.png', 4), 12, true);
	this.animations.add('power', Phaser.Animation.generateFrameNames('drilling', 3, 5, '.png', 4), 24, true);
	//this.animations.add('crack', [6, 7, 8], 2, false);
	this.animations.add('overheat', Phaser.Animation.generateFrameNames('drilling', 6, 9, '.png', 4), 2, false);
	this.animations.play('drill');
	// POWER UP
	this.powertimer = 0;
	// moooove
	this.body.velocity.y = NORMAL_SPEED;
	// set initial health
	this.health = INITIAL_HEALTH;
	// set to false to deny input (menu screen)
	this.controllable = true;
	// whether or not a rock is slowing us down
	this.slowed = false;
	this.dead = false;
	this.boost = 0;
	this.boosting = false;
};

Bunny.prototype = Object.create(Phaser.Sprite.prototype);
Bunny.prototype.constructor = Bunny;

Bunny.prototype.update = function() {
	if (this.dead) return;
	
	if (!this.slowed && this.boost < MAX_BOOST) this.boost += BOOST_REGEN;
	
	this.body.velocity.x = 0;
	
	if ((this.cursors.left.isDown || (this.game.input.pointer1.isDown && this.game.input.pointer1.screenX < this.game.width / 2)) && this.controllable) {
		this.body.velocity.x = this.powertimer > 0 ? -POWER_TURN : -NORMAL_TURN;
	}
	
	if ((this.cursors.right.isDown || (this.game.input.pointer1.isDown && this.game.input.pointer1.screenX >= this.game.width / 2)) && this.controllable) {
		this.body.velocity.x = this.powertimer > 0 ? POWER_TURN : NORMAL_TURN;
	}
	
	if (this.body.velocity.x < 0 && this.angle < 22.5) {
		this.body.angularVelocity = 200;
	} else if (this.body.velocity.x > 0 && this.angle > -22.5) {
		this.body.angularVelocity = -200;
	} else if (this.angle != 0){
		if (this.angle < 0) {
			this.body.angularVelocity = 50;
		} else if (this.angle > 0) {
			this.body.angularVelocity = -50;
		}
	}
	
	if (!this.slowed && this.health < REGEN_MAX){
		this.health += REGEN_RATE;
	}
	
	// carrot powerup neglects slowing by rocks
	
	if (this.powertimer > 0)
	{
		this.powertimer--;
		
		if (this.powertimer === 0)
		{
			this.animations.play('drill');
			this.body.velocity.y = NORMAL_SPEED;
		}
		
		this.boosting = false;
	} else if (this.game.input.keyboard.justPressed(Phaser.Keyboard.SPACEBAR) && this.boost > 0) {
		this.body.velocity.y = BOOST_SPEED;
		this.boost -= BOOST_DRAIN;
		this.boosting = true;
	} else if (this.slowed) {
		this.body.velocity.y = SLOW_SPEED;
		this.slowed = false;
		this.boosting = false;
	} else {
		this.body.velocity.y = NORMAL_SPEED;
		this.boosting = false;
	}
	
	if (this.x < 0) this.x = 0;
	if (this.x > 320) this.x = 320;
};

Bunny.prototype.powerup = function() {
	this.animations.play('power');
	this.powertimer = POWER_DURATION;
	this.body.velocity.y = POWER_SPEED;
};

Bunny.prototype.hitRock = function(damage) {
	this.slowed = true;
	
	if (!this.powertimer > 0 && !this.boosting) {
		this.health -= damage;
	}
};

Bunny.prototype.updateSpeed = function(amount) {
	NORMAL_SPEED += amount;
	
	if (NORMAL_SPEED > MAX_SPEED) {
		NORMAL_SPEED = MAX_SPEED;
	} else {
		POWER_SPEED += amount * 2;
	}
};

Bunny.prototype.maxHealth = function() {
	return INITIAL_HEALTH;
};

Bunny.prototype.maxBoost = function() {
	return MAX_BOOST;
};

Bunny.prototype.playDead = function() {
	this.body.velocity.x = 0;
	this.body.velocity.y = 0;
	this.body.angularVelocity = 0;
	this.controllable = false;
	this.animations.play('overheat');
	this.dead = true;
};

module.exports = Bunny;

},{}],4:[function(require,module,exports){
'use strict';

var Carrot = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'images');
	
	this.frameName = "carrot.png";
	
	// scale up!
	this.smoothed = false;
	this.scale.x = 2;
	this.scale.y = 2;
	
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	
	this.game.physics.arcade.enableBody(this);
	this.body.setSize(6, 6, 0, 0);
	this.body.rotation = game.rnd.realInRange(-180, 180);
	
	// automatically kill after 15 seconds
	this.lifespan = 15000;
	
};

Carrot.prototype = Object.create(Phaser.Sprite.prototype);
Carrot.prototype.constructor = Carrot;

module.exports = Carrot;
},{}],5:[function(require,module,exports){
'use strict';

var Gauge = function(game, x, y, key) {
	Phaser.Sprite.call(this, game, x, y, 'images');
	this.frameName = key;
	// scale up!
	this.smoothed = false;
	this.scale.x = this.scale.y = 2;
	
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	
	game.add.existing(this);
	
	this.needle = game.add.sprite(x, y, 'images');
	this.needle.frameName = "gauge_needle.png";
	// scale up!
	this.needle.smoothed = false;
	this.needle.scale.x = this.needle.scale.y = 2;
	
	// center rotations
	this.needle.anchor.setTo(0.5, 0.5);
	
	this.minAngle = -90;
	this.maxAngle = 90;
	this.range = this.maxAngle - this.minAngle;
	
	this.needle.angle = this.maxAngle;
  
	this.fixedToCamera = true;
	this.needle.fixedToCamera = true;
};

Gauge.prototype = Object.create(Phaser.Sprite.prototype);
Gauge.prototype.constructor = Gauge;

Gauge.prototype.update = function() {
  
  // write your prefab's specific update code here
  
};

Gauge.prototype.updateNeedle = function(value, min, max) {
	if (min < max) {
		if (value > max) {
			this.needle.angle = this.maxAngle;
		} else if (value < min) {
			this.needle.angle = this.minAngle;
		} else {
			this.needle.angle = (value - min) / (max - min) * this.range + this.minAngle;
		}
	} else {
		if (value > min) {
			this.needle.angle = this.minAngle;
		} else if (value < max) {
			this.needle.angle = this.maxAngle;
		} else {
			this.needle.angle = (value - min) / (max - min) * this.range + this.minAngle;
		}
	}
}

module.exports = Gauge;

},{}],6:[function(require,module,exports){
'use strict';

// small nugget, medium nugget, large nugget, small ruby, small emerald, small lapis
// large ruby, large emerald, large lapis, DIAMOND

var GEM_VALUES = [1,2,3,4,5,6,7,8,9,10];

var Gem = function(game, x, y, frame) {
	Phaser.Sprite.call(this, game, x, y, 'images');
	
	this.gemValue = this.game.rnd.integerInRange(0,9);
	this.frameName = "gems000" + this.gemValue + ".png";
	
	
	// scale up!
	this.smoothed = false;
	this.scale.x = 2;
	this.scale.y = 2;
	//
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	
	this.game.physics.arcade.enableBody(this);
	this.body.setSize(8, 8, 0, 0);
	this.body.rotation = game.rnd.realInRange(-180, 180);
	
	// automatically kill after 15 seconds
	this.lifespan = 15000;
};

Gem.prototype = Object.create(Phaser.Sprite.prototype);
Gem.prototype.constructor = Gem;

Gem.prototype.value = function() {
	return GEM_VALUES[this.gemValue];
}

module.exports = Gem;
},{}],7:[function(require,module,exports){
'use strict';

var Lava = function(game, x, y, frame) {
  Phaser.Sprite.call(this, game, x, y, 'images');

  
  // scale up!
	this.smoothed = false;
	this.scale.x = this.scale.y = game.rnd.realInRange(2, 4);
	
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	
	this.game.physics.arcade.enableBody(this);
	this.body.setSize(25, 25, 0, 0);
	this.body.rotation = game.rnd.realInRange(-180, 180);
	
	this.animations.add('lava', [37, 38, 39], 1, true);
	this.animations.play('lava');
	
	// automatically kill after 15 seconds
	this.lifespan = 15000;
  
};

Lava.prototype = Object.create(Phaser.Sprite.prototype);
Lava.prototype.constructor = Lava;

module.exports = Lava;
},{}],8:[function(require,module,exports){
'use strict';

var TOUGH_WEIGHT = 0.25; // percentage of rocks that are 'tough'
var LARGE_WEIGHT = 0.25; // percentage of rocks that are large

var Rock = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'images', 0);
	
	this.large = game.rnd.realInRange(0,1) < LARGE_WEIGHT;
	this.tough = game.rnd.realInRange(0,1) < TOUGH_WEIGHT;
	
	if(this.large) {
		if (this.tough) {
			this.frameName = "rocks_lg0001.png";
		} else {
			this.frameName = "rocks_lg0000.png";
		}
	} else {
		if (this.tough) {
			this.frameName = "rocks_sm0001.png";
		} else {
			this.frameName = "rocks_sm0000.png";
		}
	}
	
	// scale up!
	this.smoothed = false;
	this.scale.x = this.scale.y = game.rnd.realInRange(2, 4);
	// center rotations
	this.anchor.setTo(0.5, 0.5);
	
	this.game.physics.arcade.enableBody(this);
	if (!this.large) {
		this.body.setSize(24, 24, -4, -6);
	} else {
		this.body.setSize(48, 48, -4, -6);
	}
	this.body.rotation = game.rnd.realInRange(-180, 180);
	
	// automatically kill after 15 seconds
	this.lifespan = 15000;
};

Rock.prototype = Object.create(Phaser.Sprite.prototype);
Rock.prototype.constructor = Rock;

module.exports = Rock;
},{}],9:[function(require,module,exports){
'use strict';

function Boot() {}

Boot.prototype = {
	preload: function() {
		this.load.image('preloader', 'assets/preloader.png');
	},
	create: function() {
		this.game.input.maxPointers = 1;
		this.game.state.start('preload');
	}
};

module.exports = Boot;
},{}],10:[function(require,module,exports){

'use strict';
function GameOver() {}

GameOver.prototype = {
  preload: function () {

  },
  create: function () {
    var style = { font: '65px Arial', fill: '#ffffff', align: 'center'};
    this.titleText = this.game.add.text(this.game.world.centerX,100, 'Game Over!', style);
    this.titleText.anchor.setTo(0.5, 0.5);

    this.congratsText = this.game.add.text(this.game.world.centerX, 200, 'You Win!', { font: '32px Arial', fill: '#ffffff', align: 'center'});
    this.congratsText.anchor.setTo(0.5, 0.5);

    this.instructionText = this.game.add.text(this.game.world.centerX, 300, 'Click To Play Again', { font: '16px Arial', fill: '#ffffff', align: 'center'});
    this.instructionText.anchor.setTo(0.5, 0.5);
  },
  update: function () {
    if(this.game.input.activePointer.justPressed()) {
      this.game.state.start('play');
    }
  }
};
module.exports = GameOver;

},{}],11:[function(require,module,exports){
'use strict';

var Bunny = require('../prefabs/Bunny.js');

function Menu() {}

Menu.prototype = {
	create: function() {
		this.game.stage.backgroundColor = '#5FB0F3';
		
		var language = window.navigator.userLanguage || window.navigator.language;
		language = language.substring(0,2);
		
		var isMobile = false;
		
		// I got this dark magic from StackOverflow
		
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			isMobile = true;
		}
		
		var str_sub = '';
		var str_prs = '';
		var small = false;
		
		if (language === 'zh') {str_sub = "\u94BB\u5154\u5B50"; str_prs = "\u6309\u7A7A\u683C";}
		else if (language === 'es') {str_sub = "Conejito de\nPerforaci\u00F3n"; str_prs = "Presione Inicio"; small = true;}
		else if (language === 'fr') {str_sub = "FORAGE\nLAPIN"; str_prs = "Espace Presse"; small = true;}
		else if (language === 'de') {str_sub = "BOHRER\nHASE"; str_prs = "Presseraum"; small = true;}
		else if (language === 'it') {str_sub = "TRAPANO\nCONIGLIO"; str_prs = "Spazio Stampa"; small = true;}
		else if (language === 'ja') {str_sub = "\u30C9\u30EA\u30EB\u30D0\u30CB\u30FC"; str_prs = "\u30D7\u30EC\u30B9\u958B\u59CB"; small = true;}
		else { str_sub = 'DRILL\nBUNNY'; str_prs = 'Press Space!';}
		
		// This breaks localization :(
		
		if (isMobile) {
			str_prs = "Tap To Start!";
		}
		
		this.bg = this.game.add.sprite(0, 216, 'images');
		this.bg.frameName = 'titlescreen.png';
		this.bg.smoothed = false;
		this.bg.scale.x = 2;
		this.bg.scale.y = 2;
		
		var xPos = [25,50,75];
		var yPos = [240,300,360];
		
		for (var i = 0; i < 3; i++) {
			var apple = this.game.add.sprite(xPos.splice(this.game.rnd.integerInRange(0,xPos.length-1),1), yPos.splice(this.game.rnd.integerInRange(0,yPos.length-1),1), 'images');
			apple.frameName = 'apple.png';
			apple.smoothed = false;
			apple.scale.x = 2;
			apple.scale.y = 2;
			apple.anchor.setTo(0.5, 0.25);
			apple.angle = this.game.rnd.pick([-45,45]);
			this.game.add.tween(apple).to({angle: apple.angle < 0 ? 45 : -45}, 2000, Phaser.Easing.Quadratic.InOut, true, 0, Number.MAX_VALUE, true);
			
			var eaten = this.game.add.sprite(this.game.rnd.integerInRange(this.game.width / 2 + 16,this.game.width), this.game.height - 65, 'images');
			eaten.frameName = 'eaten.png';
			eaten.smoothed = false;
			eaten.anchor.setTo(0.5, 0.5);
			eaten.angle = this.game.rnd.integerInRange(-180,180);
		}
		
		this.clouds = this.game.add.sprite(0, 24, 'images');
		this.clouds.frameName = 'clouds.png';
		this.clouds.smoothed = false;
		this.clouds.scale.x = 2;
		this.clouds.scale.y = 2;
		
		// bunny
		
		this.bun = this.game.add.sprite(32,this.game.height - 102,'images');
		this.bun.smoothed = false;
		this.bun.scale.x = 2;
		this.bun.scale.y = 2;
		this.bun.animations.add('sleep', Phaser.Animation.generateFrameNames('chacket', 0, 1, '.png', 4), 1, true);
		this.bun.animations.add('wake', Phaser.Animation.generateFrameNames('chacket', 2, 2, '.png', 4), 1, true);
		this.bun.animations.add('walk', Phaser.Animation.generateFrameNames('chacket', 3, 4, '.png', 4), 12, true);
		this.bun.animations.play('sleep');
		
		// drill
		
		this.drill = this.game.add.sprite(146,this.game.height - 82, 'images');
		this.drill.frameName = 'titledrill.png';
		this.drill.smoothed = false;
		this.drill.scale.x = 2;
		this.drill.scale.y = 2;
		
		// real bun
		
		this.bunny = new Bunny(this.game, 32, 64);
		this.game.add.existing(this.bunny);
		this.bunny.x = 160;
		this.bunny.y = 442;
		this.bunny.controllable = false;
		this.bunny.kill();
		
		// ground
		
		this.ground = this.game.add.sprite(0, this.game.height - 64, 'images');
		this.ground.frameName = 'ground.png';
		this.ground.smoothed = false;
		this.ground.scale.x = 2;
		this.ground.scale.y = 2;
		
		this.title = this.game.add.text(8,8,'Chacket\nValleyparker:', {fill : 'red'});
		this.title.font = "Press Start 2P";
		this.title.fontSize = 24;
		this.title.align = 'center';
		
		this.sub = this.game.add.text(4, 64, str_sub+"\n ");
		this.sub.font = "Press Start 2P";
		
		if (small) {
			this.sub.fontSize = 18;
		} else {
			this.sub.fontSize = 64;
		}
		
		this.sub.x = (this.game.width - this.sub.width) / 2;
		
		if (language === 'en') this.sub.x = 4; //i dunno this is kinda nuts but it works so whatevs
		
		this.press = this.game.add.text(0, this.game.height - 32, str_prs);
		this.press.font = "Press Start 2P";
		this.press.fontSize = 24;
		this.press.x = (this.game.width - this.press.width) / 2;
		
		this.game.add.tween(this.title).to({y:this.title.y + 16}, 2000, Phaser.Easing.Quadratic.InOut, true, 0, Number.MAX_VALUE, true);
		this.game.add.tween(this.sub).to({y:this.sub.y + 16}, 2000, Phaser.Easing.Quadratic.InOut, true, 0, Number.MAX_VALUE, true);
		
		this.start = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.starting = false;
		this.timer = 0;
		this.jumping = false;
		this.phase = false;
		
		// camera fade effect
		this.fade = this.game.add.bitmapData(this.game.width, this.game.height);
		this.fade.context.fillStyle = '#000000';
		this.fade.context.fillRect(0, 0, this.game.width, this.game.height);
		this.fadesprite = this.game.add.sprite(0, 0, this.fade);
		this.fadesprite.alpha = 0.99;
		this.game.add.tween(this.fadesprite).to({alpha:0}, 250, null, true);
		this.fading = false;
		
		// JAMS
		
		this.sfx = this.game.add.sound('atlas');
		this.sfx.addMarker('double', 270.023, 117.33, 1, false);
		this.sfx.addMarker('jump', 1.602, 0.35, 1, false);
		this.sfx.addMarker('wind', 455.128, 23.17, 1, true);
		
		this.sfx.play('double');
		this.game.time.events.add(117330, function(){ this.sfx.play('wind'); }, this);
	},
	update: function() {
		// update clouds
		this.clouds.x -= 0.5;
		
		if (this.clouds.x < -this.clouds.width) this.clouds.x = this.game.width;
		
		// bunny animations
		
		if (this.starting) {
			this.timer++;
		}
		
		if (this.timer === 5) {
			this.bun.y += 4;
		}
		
		if (this.timer > 25 && !this.jumping) {
			this.bun.animations.play('walk');
			this.game.add.tween(this.bun).to({x:146}, 1000, Phaser.Easing.Quadratic.InOut, true);
			this.jumping = true;
		}
		
		if (this.timer > 40 && !this.phase) {
			this.game.add.tween(this.bun).to({y:320}, 350, Phaser.Easing.Quadratic.InOut, true, 0, 1, true);
			this.sfx.play('jump');
			this.bun.animations.stop();
			this.phase = true;
		}
		
		if (this.bun.x == 146 && this.bun.y == 410) {
			this.bun.destroy();
			this.drill.destroy();
			this.bunny.revive();
		}
		
		if (this.bunny.y > this.game.height && !this.fading) {
			this.fading = true;
			this.game.add.tween(this.fadesprite).to({alpha:1}, 250, null, true);
			this.game.add.tween(this.sfx).to({volume:0}, 250, null, true).onComplete.add(this.playScene, this);
		}
		
		if ((this.start.isDown || this.game.input.pointer1.isDown) && !this.starting) {
			this.bun.animations.play('wake');
			this.bun.y -= 4;
			this.starting = true;
		}
	},
	playScene: function() {
		this.sfx.removeMarker('double');
		this.sfx.removeMarker('jump');
		this.sfx.removeMarker('wind');
		this.sfx.stop();
		this.game.state.start('play');
	}
};

module.exports = Menu;
},{"../prefabs/Bunny.js":3}],12:[function(require,module,exports){
'use strict';

// static variables

var GEM_FREQUENCY = 5; // max per chunk
var GEM_WEIGHT = 0.5; // chance of any one gem spawning, 1 = 100%
var ROCK_FREQUENCY = 4; // max per chunk
var ROCK_WEIGHT = 0.5; // chance of any one rock spawning
var CARROT_FREQUENCY = 1; //max per chunk
var CARROT_WEIGHT = 0.25; // chance of any one carrot spawning
var LAVA_FREQUENCY = 2; // max per chunk
var LAVA_WEIGHT = 0.1; //chance of any one lava spawning
var INCREASE_PER_CHUNK = 1.5; // how much faster to go per chunk
var LIGHT_ROCK_DAMAGE = 0.5; // how much damage a light rock does
var DARK_ROCK_DAMAGE = 1.0; // how much damage a dark rock does
var LAVA_DAMAGE = 2.5; // how much damage lava does, per frame

// one chunk is equal to the screen size. so every time you travel one screen height, you enter a new chunk

var Block = require('../prefabs/Block.js');
var Bunny = require('../prefabs/Bunny.js');
var Gem = require('../prefabs/Gem.js');
var Rock = require('../prefabs/Rock.js');
var Carrot = require('../prefabs/Carrot.js');
var Lava = require('../prefabs/Lava.js');
var Gauge = require('../prefabs/Gauge.js');

/**
 * @author Steve Richey http://www.steverichey.com @stvr_tweets
 */
 
function Play() {}

Play.prototype = {
	create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		
		this.game.stage.backgroundColor = '#000';
		
		// initialize game variables
		this.cash = 0;
		
		this.chunkGroup = this.game.add.group();
		this.nextChunkY = 0;
		this.game.world.bounds.x = 0;
		this.game.world.bounds.height = 1024;
		this.game.camera.setBoundsToWorld();
		this.lastChunkIndex = 0;
		this.tephra = this.game.add.group();
		this.rocks = this.game.add.group();
		this.gems = this.game.add.group();
		this.carrots = this.game.add.group();
		this.lastChunk = null;
		this.chunkIndex = 0;
		this.generateChunk();
		this.generateChunk();
		
		// create the dirt emitter
		
		this.dirtEmitter = this.game.add.emitter(32, 64, 500);
		this.dirtEmitter.makeParticles('images', [40,41,42,43], 500, false, false);
		this.dirtEmitter.setYSpeed(-5, 200);
		this.dirtEmitter.setRotation(0, 0);
		this.dirtEmitter.start(false, 500, 25);
		
		// create the dirt effect
		
		this.drilldirt = this.game.add.sprite(32, 64, 'images');
		this.drilldirt.smoothed = false;
		this.drilldirt.scale.x = 2;
		this.drilldirt.scale.y = 2;
		this.drilldirt.anchor.setTo(0.5, -0.1);
		this.drilldirt.animations.add('drill', Phaser.Animation.generateFrameNames('drilldirt', 0, 1, '.png', 4), 16, true);
		this.drilldirt.animations.play('drill');
		
		// create the tunnel
		
		this.tunnel = this.game.add.emitter(32, 64, 100);
		this.tunnel.makeParticles('images', 48, 100, false, false);
		this.tunnel.setXSpeed(0,0);
		this.tunnel.setYSpeed(0,0);
		this.tunnel.gravity = 0;
		this.tunnel.start(false, 2000, 25);
		
		// create the tunnel border
		
		this.tunnelborder = this.game.add.emitter(32, 64, 200);
		this.tunnelborder.makeParticles('images', [45,46,47], 200, false, false);
		this.tunnelborder.setXSpeed(0, 0);
		this.tunnelborder.setYSpeed(0, 0);
		this.tunnelborder.setRotation(0, 0);
		this.tunnelborder.gravity = 0;
		this.tunnelborder.start(false, 2000, 15);
		
		// death fx
		this.deathfade = this.game.add.bitmapData(this.game.width, this.game.height);
		this.deathfade.context.fillStyle = '#000000';
		this.deathfade.context.fillRect(0, 0, this.game.width, this.game.height);
		this.deathfadesprite = this.game.add.sprite(0, 0, this.deathfade);
		this.deathfadesprite.fixedToCamera = true;
		this.deathfadesprite.alpha = 0;
		this.deathfadesprite.kill();
		
		this.circle = this.game.add.sprite(0,0,'images');
		this.circle.frameName = 'circle.png';
		this.circle.alpha = 0.5;
		this.circle.anchor.setTo(0.5,0.5);
		this.circle.kill();
		
		// create the player
		this.bunny = new Bunny(this.game, 0, 0);
		this.bunny.x = this.game.width / 2;
		this.bunny.y = -this.bunny.height;
		this.game.add.existing(this.bunny);
		
		// pickup effect
		this.getEmitter = this.game.add.emitter();
		
		this.getEmitter.makeParticles('images', 44);
		this.getEmitter.gravity = 0;
		this.getEmitter.setAlpha(0, 1);
		this.getEmitter.setXSpeed(-25, 25);
		this.getEmitter.setYSpeed(-25, 25);
		this.getEmitter.bounce.set(0.5, 0.5);
		
		// follow the bunny!
		this.game.camera.follow(this.bunny);
		this.game.camera.deadzone = new Phaser.Rectangle(0, 0, 320, 128);
		
		this.fade = this.game.add.bitmapData(this.game.width, this.game.height);
		this.fade.context.fillStyle = '#000000';
		this.fade.context.fillRect(0, 0, this.game.width, this.game.height);
		this.fadesprite = this.game.add.sprite(0, 0, this.fade);
		this.fadesprite.alpha = 1;
		this.game.add.tween(this.fadesprite).to({alpha:0}, 400, null, true);
		
		// dead flag
		this.dead = false;
		
		// almost dead flag
		this.beeping = false;
		
		// JAMS
		
		this.sfx = this.game.sound.add('atlas');
		this.sfx.addMarker('coral', 2.083, 267.840, 1, true);
		this.sfx.addMarker('carrot', 0.704, 0.535, 1, false);
		this.sfx.addMarker('gem', 1.252, 0.340, 1, false);
		this.sfx.addMarker('ouch', 1.968, 0.1, 1, false);
		this.sfx.addMarker('beep', 0, 0.15, 1, false);
		this.sfx.addMarker('gameover', 387.365, 67.752, true);
		this.sfx.addMarker('boom', 0.162, 0.535, false);
		
		this.sfx.play('coral');
		
		// HUD
		this.heatgauge = new Gauge(this.game, this.game.width - 48, this.game.height - 48, 'gauge.png'); // adds itself to the game
		this.powergauge = new Gauge(this.game, 48, this.game.height - 48, 'gauge_DRILL.png'); // same
		
		this.depthtext = this.game.add.text(96,this.game.height - 48,'0m', {fill: 'white'});
		this.depthtext.font = "Press Start 2P";
		this.depthtext.fontSize = 18;
		this.depthtext.fixedToCamera = true;
		
		this.cashtext = this.game.add.text(96,this.game.height - 24,'$0', {fill: 'white'});
		this.cashtext.font = "Press Start 2P";
		this.cashtext.fontSize = 18;
		this.cashtext.fixedToCamera = true;
	},//
	update: function() {
		if (!this.dead) {
			// collect gems
			this.game.physics.arcade.overlap(this.bunny, this.gems, this.collectGems, null, this);
			
			// collect carrots
			this.game.physics.arcade.overlap(this.bunny, this.carrots, this.collectCarrot, null, this);
			
			// rocks
			this.game.physics.arcade.overlap(this.bunny, this.rocks, this.hitRock, null, this);
			
			// lava
			this.game.physics.arcade.overlap(this.bunny, this.tephra, this.hitLava, null, this);
			
			// generate a new chunk if we're about to run out
			
			if (this.bunny.y > this.chunkGroup.children[this.chunkGroup.children.length - 1].y)
			{
				this.generateChunk();
			}
			
			// garbage collect old chunks
			
			var i = this.chunkGroup.children.length;
			
			while (i >= 0)
			{
				if (this.chunkGroup.children[i])
				{
					if (this.chunkGroup.children[i].y < this.game.camera.y - 8 * 64)
					{
						this.chunkGroup.remove(this.chunkGroup.children[i], false);
					}
				}
				
				i--;
			}
			
			// update dirt particle position
			
			this.dirtEmitter.emitX = this.bunny.x;
			this.dirtEmitter.emitY = this.bunny.y + 24;
			
			// update drill dirt effect position/angle
			
			this.drilldirt.x = this.bunny.x;
			this.drilldirt.y = this.bunny.y;
			this.drilldirt.angle = this.bunny.angle;
			
			// update tunnel position/angle
			
			this.tunnel.emitX = this.bunny.x;
			this.tunnel.emitY = this.bunny.y;
			this.tunnel.setRotation(this.bunny.angle, this.bunny.angle);
			
			// update the tunnel border
			
			this.tunnelborder.emitX = this.game.rnd.pick(
				[	this.bunny.x - this.bunny.width / 2 + 1, 
					this.bunny.x - this.bunny.width / 2 + 2,
					this.bunny.x - this.bunny.width / 2 + 3,
					this.bunny.x + this.bunny.width / 2 - 1,
					this.bunny.x + this.bunny.width / 2 - 2,
					this.bunny.x + this.bunny.width / 2 - 3 ]);
			this.tunnelborder.emitY = this.bunny.y;
			
			// update heat
			this.heatgauge.updateNeedle(this.bunny.health, this.bunny.maxHealth(), 0);
			
			// update booost
			
			this.powergauge.updateNeedle(this.bunny.boost, 0, this.bunny.maxBoost());
			
			if (this.bunny.health < 30 && !this.beeping) {
				// play beeping sound
				this.sfx.play('beep');
				this.game.time.events.add(160, function(){ this.beeping = false; }, this);
				this.beeping = true;
			} else if (this.beeping && this.bunny.health > 30) {
				this.beeping = false;
			}
			
			// update text
			this.depthtext.text = this.bunny.y > 0 ? Math.round(this.bunny.y/10) + "m" : "0m";
			this.cashtext.text = "$" + this.cash;
			
			if (this.bunny.health < 0) {
				this.dead = true;
				this.bunny.playDead();
				this.deathfadesprite.revive();
				this.circle.x = this.bunny.x;
				this.circle.y = this.bunny.y;
				this.circle.revive();
				this.game.add.tween(this.deathfadesprite).to({alpha:1}, 500, null, true);
				this.game.add.tween(this.circle).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.circle.scale).to({x:16}, 250, null, true);
				this.game.add.tween(this.circle.scale).to({y:16}, 500, null, true);
				this.drilldirt.kill();
				this.dirtEmitter.kill();
				this.game.add.tween(this.heatgauge).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.powergauge).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.heatgauge.needle).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.powergauge.needle).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.depthtext).to({alpha:0}, 500, null, true);
				this.game.add.tween(this.cashtext).to({alpha:0}, 500, null, true);
				
				this.gameover = this.game.add.text(32, 160,'GAME\nOVER', {fill: 'red'});
				this.gameover.font = "Press Start 2P";
				this.gameover.fontSize = 64;
				this.gameover.fixedToCamera = true;
				
				this.depthyo = this.game.add.text(32, 286, 'DEPTH ' + this.depthtext.text, {fill: 'white'});
				this.depthyo.font = "Press Start 2P";
				this.depthyo.fontSize = 16;
				this.depthyo.fixedToCamera = true;
				
				this.cashyo = this.game.add.text(32, 304, 'CASH ' + this.cashtext.text, {fill: 'white'});
				this.cashyo.font = "Press Start 2P";
				this.cashyo.fontSize = 16;
				this.cashyo.fixedToCamera = true;
				
				this.pressspace = this.game.add.text(8, 340, 'F5 TO RETRY\n\nTHANKS FOR PLAYING!\nA GAME BY DREAM\nSHOW ADVENTURES\nFOR LUDUM DARE 29\n\nCODE: STEVE RICHEY\nART: ANDREW AGULTO', {fill: 'white'});
				this.pressspace.font = "Press Start 2P";
				this.pressspace.fontSize = 16;
				this.pressspace.fixedToCamera = true;
				
				this.sfx.volume = 0;
				this.game.sound.remove(this.sfx);
				
				this.dfx = this.game.sound.add('atlas');
				this.dfx.volume = 1;
				this.dfx.addMarker('boom', 0.162, 0.535, true);
				this.dfx.addMarker('gameover', 387.365, 67.752, true);
				this.dfx.play('boom');
				this.game.time.events.add(545, function(){this.dfx.play('gameover');}, this);
			}
		}
	},
	generateChunk: function() {
		var newChunk = this.chunkGroup.add(this.game.add.group());
		newChunk.y = this.nextChunkY;
		
		var xPos = 0;
		var yPos = 0;
		var aboveFace = 0;
		var leftFace = 0;
		
		for (var i = 0; i < 5 * 8; i++)
		{
			if (i !== 0 && i % 5 !== 0) {
				leftFace = newChunk.children[i-1].rightFace;
			} else {
				leftFace = this.game.rnd.integerInRange(0,1);
			}
			
			if (i > 4) {
				aboveFace = newChunk.children[i-5].bottomFace;
			} else if (this.chunkGroup.children.length > 1) {
				aboveFace = this.lastChunk.children[this.lastChunk.children.length - (5-i)].bottomFace;
			} else {
				aboveFace = this.game.rnd.integerInRange(0,1);
			}
			
			newChunk.add(new Block(this.game, xPos, yPos, leftFace, aboveFace));
			xPos += 64;
			
			if (xPos >= this.game.width)
			{
				xPos = 0;
				yPos += 64;
			}
		}
		
		for (i = 0; i < GEM_FREQUENCY; i++)
		{
			if(chanceRoll(this.game, GEM_WEIGHT))
				this.gems.add(new Gem(	this.game,
										this.game.rnd.integerInRange(0, 64*5),
										this.game.rnd.integerInRange(this.nextChunkY, this.nextChunkY+64*8)));
		}
		
		if (this.chunkIndex != 0) {// first chunk won't generate rocks, carrots, or lava
			for (i = 0; i < ROCK_FREQUENCY; i++)
			{
				if(chanceRoll(this.game, ROCK_WEIGHT)){
					var newRock;
					do { // try to prevent overlapping rocks, kinda
						newRock = new Rock(this.game, this.game.rnd.integerInRange(0, 64*5), this.game.rnd.integerInRange(this.nextChunkY, this.nextChunkY+64*8));
					} while (this.game.physics.arcade.overlap(newRock, this.rocks));
					
					this.rocks.add(newRock);
				}
			}
			
			for (i = 0; i < CARROT_FREQUENCY; i++)
			{
				if(chanceRoll(this.game, CARROT_WEIGHT))
					this.carrots.add(new Carrot(	this.game,
													this.game.rnd.integerInRange(0, 64*5),
													this.game.rnd.integerInRange(this.nextChunkY, this.nextChunkY+64*8)));
			}
			
			for (i = 0; i < LAVA_FREQUENCY; i++)
			{
				if(chanceRoll(this.game, LAVA_WEIGHT))
					this.tephra.add(new Lava(	this.game,
												this.game.rnd.integerInRange(0, 64*5),
												this.game.rnd.integerInRange(this.nextChunkY, this.nextChunkY+64*8)));
			}
		}
		
		this.nextChunkY += 64 * 8;
		this.lastChunkIndex = this.chunkGroup.getIndex(newChunk);
		this.lastChunk = newChunk;
		this.chunkIndex++;
		
		this.game.world.bounds.y = newChunk.y - 8 * 64;
		this.game.camera.bounds.height += 64 * 8;
		this.game.physics.arcade.setBoundsToWorld();
		
		// FASTER FASTER BUNNY
		if (this.bunny) {
			this.bunny.updateSpeed(INCREASE_PER_CHUNK);
		}
	},
	collectGems: function(player, gem) {
		this.getEmitter.emitX = gem.x;
		this.getEmitter.emitY = gem.y;
		this.cash += gem.value();
		this.gems.remove(gem, true);
		this.getEmitter.start(true, 1000, null, 25);
		
		this.sfx.play('gem');
	},
	collectCarrot: function(player, carrot) {
		this.getEmitter.emitX = carrot.x;
		this.getEmitter.emitY = carrot.y;
		this.carrots.remove(carrot, true);
		this.getEmitter.start(true, 1000, null, 25);
		
		this.bunny.powerup();
		this.sfx.play('carrot');
	},
	hitRock: function(player, rock) {
		if (rock.frame === 1 )
		{
			this.bunny.hitRock(DARK_ROCK_DAMAGE);
		}
		else
		{
			this.bunny.hitRock(LIGHT_ROCK_DAMAGE);
		}
		
		this.sfx.play('ouch');
	},
	hitLava: function(player, lava) {
		this.bunny.hitRock(LAVA_DAMAGE);
		this.sfx.play('ouch');
	}
};

var chanceRoll = function(game,chanceAsFloat) {
	return (game.rnd.realInRange(0,1) < chanceAsFloat);
};

module.exports = Play;
},{"../prefabs/Block.js":2,"../prefabs/Bunny.js":3,"../prefabs/Carrot.js":4,"../prefabs/Gauge.js":5,"../prefabs/Gem.js":6,"../prefabs/Lava.js":7,"../prefabs/Rock.js":8}],13:[function(require,module,exports){
'use strict';

function Preload() {
	this.loadbar = null;
	this.ready = false;
	this.waiting = false;
};

Preload.prototype = {
	preload: function() {
		this.loadbar = this.add.sprite(60, 0, 'preloader');
		this.loadbar.anchor.setTo(0, 0.5);
		this.loadbar.y = this.game.height / 2;
		this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
		this.load.setPreloadSprite(this.loadbar);
		
		this.load.atlas('images', 'assets/atlas.png', 'assets/atlas.json');
		this.load.audio('atlas', ['assets/atlas.ogg', 'assets/atlas.mp3'], true);
	},
	create: function() {
		this.loadbar.cropEnabled = false;
	},
	update: function() {
		if(!!this.ready && !this.waiting) {
			// A time delay is necessary to get the google webfonts to work.
			// This is a known issue with Phaser.
			this.game.time.events.add(1000, function(){this.game.state.start('menu');}, this);
			this.game.add.tween(this.loadbar).to({alpha:0}, 1000, Phaser.Easing.Quadratic.InOut, true);
			this.waiting = true;
		}
	},
	onLoadComplete: function() {
		this.ready = true;
	}
};

module.exports = Preload;
},{}]},{},[1]);
