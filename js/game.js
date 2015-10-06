var game = new Phaser.Game(1200, 750, Phaser.AUTO, '', { 
    preload: preload, 
    create: create, 
    render: render, 
    update: update
}, false, false);

//Globals
var blobSprite = null;
var ennemy = null;
var enemies = null;
var scoreText = null;
var eatenBlobs = 0;
var gameOverText = null;
var alwaysFollowMouse = true;
var lastWeightLoss = null;
var lastEnemyCreation = null;
var maxSpeed = 400;
var maxPlayerDistance = 200;
var slurpSounds = [];  
//Assets loading - do not use asssets here
function preload () {
    //Load this image, available with the 'background' key later
	game.load.image('blob', 'images/Blob1.png');
	game.load.image('foes', 'images/Blob2.png');
	game.load.image('background', 'images/grid.png');
	game.load.audio('slurp1', 'images/slurp1.mp3');
	game.load.audio('slurp2', 'images/slurp2.mp3');
} 

//Called after preload - create sprites,... using assets here
function create () {

    game.world.setBounds(0,0, 10000,10000);
    var backgrounds = this.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    blobSprite = game.add.sprite(600,400,'blob');
    blobSprite.anchor.set(0.5);

    game.physics.enable(blobSprite, Phaser.Physics.ARCADE);
    blobSprite.body.setSize(blobSprite.body.width/2, blobSprite.body.height/2, 0, 0);
	updateMaxVelocity();

    game.camera.follow(blobSprite);
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;

    var i = 0;
    while(i<10){
    	createEnemy();
    	i++;
    }

    //game.physics.enable(enemies, Phaser.Physics.ARCADE);

    game.world.sendToBack(enemies);
    game.world.sendToBack(backgrounds);

    scoreText = game.add.text(10, 0, "0 blobs eaten");
    scoreText.fixedToCamera = true;
    scoreText.cameraOffset.setTo(10, 0);

	gameOverText = game.add.text(100,100,"GAME OVER");
	gameOverText.fixedToCamera = true;
	gameOverText.cameraOffset.setTo(100, 100);
	gameOverText.visible = false;

	slurpSounds.push(game.add.audio("slurp1"));
	slurpSounds.push(game.add.audio("slurp2"));
	
}

function playSlurpSound(){
	var i = Math.round(Math.random()*(slurpSounds.length-1));
	var slurp = slurpSounds[i];
	slurp.play();
}

//Called for each refresh
function update(){
	var now = new Date();
	var timeSinceNewEnemy = now.getTime() - lastEnemyCreation.getTime();
	if(timeSinceNewEnemy > 3000){
		createEnemy();
	}
	//game.physics.arcade.collide(enemies, enemies);
	enemies.forEachAlive(function(ennemy){
		if(ennemy.scale.getMagnitude() > blobSprite.scale.getMagnitude() ){
			//console.log("EXTERMINATE !!!");
			game.physics.arcade.moveToObject(ennemy, blobSprite);
		}else{
			game.physics.arcade.moveToObject(ennemy, blobSprite);			
			ennemy.body.velocity.x = -ennemy.body.velocity.x;
			ennemy.body.velocity.y = -ennemy.body.velocity.y;
		}	
	}, this);

    if (game.input.mousePointer.isDown && blobSprite.scale.getMagnitude() >= 1.5){
    	var recentWeightLoss = false;
    	if(lastWeightLoss){
        	var deltaTime = now.getTime() - lastWeightLoss.getTime();
        	if(deltaTime < 1000){
        		recentWeightLoss = true;
        	}
		}
		if(!recentWeightLoss){
	    	lastWeightLoss = now;
	    	blobSprite.scale.setMagnitude(blobSprite.scale.getMagnitude() - 0.5);
	    	createEnemy(blobSprite.x,blobSprite.y,0.5+1*Math.random(),3000);
	    	console.log(blobSprite.scale.getMagnitude());
	    	updateMaxVelocity();
		}
	}
    if (game.input.mousePointer.isDown || alwaysFollowMouse){
        game.physics.arcade.moveToPointer(blobSprite, maxSpeed);
        if (Phaser.Rectangle.contains(partialRectangle(blobSprite.body,0.4), game.input.x, game.input.y)){
            blobSprite.body.velocity.setTo(0,0);
        }
    }else{
        blobSprite.body.velocity.setTo(blobSprite.body.velocity.x*0.95, blobSprite.body.velocity.y*0.95);
   	}
   
}

function updateMaxVelocity(){
	var minVelocity = 100;
	var targetVelocity = maxSpeed/blobSprite.scale.getMagnitude();
	if(targetVelocity < minVelocity){
		targetVelocity = minVelocity;
	}
	blobSprite.body.maxVelocity.setMagnitude(targetVelocity);

}
//Called after the renderer rendered - usefull for debug rendering, ...
function render () {
	if(game.paused){
		return;
	}
	/*
	enemies.forEachAlive(function(ennemy){
		game.debug.body(ennemy);
	});
	game.debug.body(blobSprite);
	*/

	enemies.forEachAlive(function(ennemy){
		//CONSUMPTION
		if(ennemy.alpha < 1){
			//Is reviving
			return;
		}
		var enemyIsEdible = ennemy.scale.getMagnitude() < blobSprite.scale.getMagnitude();
		var playerIsEdible = ennemy.scale.getMagnitude() > blobSprite.scale.getMagnitude();
		if( enemyIsEdible && Phaser.Rectangle.containsRect(partialRectangle(ennemy.body, 0.6), blobSprite.body) ){
			ennemy.kill();
			playSlurpSound();
			eatenBlobs++;
			scoreText.text = eatenBlobs+" blobs eaten";
			var targetScale = blobSprite.scale.getMagnitude() + 0.2;
			var maxScale = 8;
			if(targetScale > maxScale){
				targetScale = maxScale;
			}
			blobSprite.scale.setMagnitude(targetScale);
			updateMaxVelocity();
			window.setTimeout(function(){ 
				// We add a second ennemy, while reviving the first one ^_^
				createEnemy();
				ennemy.revive();
				ennemy.alpha = 0;
			    game.add.tween(ennemy).to({alpha: 1}, 2000, Phaser.Easing.Quadratic.Out, true);

				var targetEnemyScale = blobSprite.scale.getMagnitude()*(0.7+Math.random()*1);
				console.log("TargetScale:",targetEnemyScale);
				ennemy.scale.setMagnitude(targetEnemyScale);
				ennemy.x = blobSprite.x - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
				ennemy.y = blobSprite.y - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
				if(ennemy.x >= blobSprite.x){
					ennemy.x += 200;
				}else{					
					ennemy.x -= 200;
				}
				if(ennemy.y >= blobSprite.y){
					ennemy.y += 200;
				}else{					
					ennemy.y -= 200;
				}
			}, 2000);
		}else if( playerIsEdible && Phaser.Rectangle.containsRect(partialRectangle(blobSprite.body, 0.6), ennemy.body) ){
			gameOverText.visible = true;
			game.paused = true;
			//TODO Better death
		}
	}, this);
}

function partialRectangle(rect,scale){
	var width = rect.width*scale; 
	var height = rect.height*scale; 
	return new Phaser.Rectangle(rect.x + width/2, rect.y + height/2, width, height);
}

function createEnemy(x,y,scale,wakeTime){
	lastEnemyCreation = new Date();
    if (typeof x === 'undefined') { 
    	x = blobSprite.x - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
		if(x >= blobSprite.x){
			x += 200;
		}else{					
			x -= 200;
		}
    }
    if (typeof y === 'undefined') { 
    	y = blobSprite.y - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
		if(y >= blobSprite.y){
			y += 200;
		}else{					
			y -= 200;
		}
    }
    if (typeof scale === 'undefined') { scale = blobSprite.scale.getMagnitude()*(0.5+Math.random()*1); }
    if (typeof wakeTime === 'undefined') { wakeTime = 2000; }

	if(enemies.children.length < 70){
		var enemy = enemies.create(x,y, 'foes');
		enemy.scale.set(scale);
		enemy.body.setSize(enemy.body.width/2, enemy.body.height/2, 0, 0);
		var maxVelocityAmplitude = 100;
		enemy.body.velocity.x = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
		enemy.body.velocity.y = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
		enemy.body.collideWorldBounds = true;
		enemy.body.bounce.set(1);
		enemy.anchor.set(0.5);
		enemy.alpha = 0;
	    game.add.tween(enemy).to({alpha: 1}, wakeTime, Phaser.Easing.Quadratic.Out, true);


	}
}
