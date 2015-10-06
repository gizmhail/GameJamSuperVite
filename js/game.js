var game = new Phaser.Game(1200, 800, Phaser.AUTO, '', { 
    preload: preload, 
    create: create, 
    render: render, 
    update: update
});

//Globals
var blobSprite = null;
var ennemy = null;
var enemies = null;
var scoreText = null;
var eatenBlobs = 0;
var gameOverText = null;
var alwaysFollowMouse = true;
//Assets loading - do not use asssets here
function preload () {
    //Load this image, available with the 'background' key later
	game.load.image('blob', 'images/Blob1.png');
	game.load.image('foes', 'images/Blob2.png');
	game.load.image('background', 'images/grid.png');
} 

//Called after preload - create sprites,... using assets here
function create () {

    game.world.setBounds(0,0, 10000,10000);
    var backgrounds = this.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    blobSprite = game.add.sprite(600,400,'blob');
    blobSprite.anchor.set(0.5);

    game.physics.enable(blobSprite, Phaser.Physics.ARCADE);
    blobSprite.body.setSize(blobSprite.body.width/2, blobSprite.body.height/2, 0, 0);
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

}

//Called for each refresh
function update(){
	//game.physics.arcade.collide(enemies, enemies);
	enemies.forEachAlive(function(ennemy){
		if(ennemy.scale.getMagnitude() > blobSprite.scale.getMagnitude() ){
			console.log("EXTERMINATE !!!");
			game.physics.arcade.moveToObject(ennemy, blobSprite);
		}else{
			game.physics.arcade.moveToObject(ennemy, blobSprite);			
			ennemy.body.velocity.x = -ennemy.body.velocity.x;
			ennemy.body.velocity.y = -ennemy.body.velocity.y;
		}	
	}, this);

    if (game.input.mousePointer.isDown || alwaysFollowMouse){
        game.physics.arcade.moveToPointer(blobSprite, 300);
        if (Phaser.Rectangle.contains(blobSprite.body, game.input.x, game.input.y)){
            blobSprite.body.velocity.setTo(0,0);
        }
    }else{
        blobSprite.body.velocity.setTo(blobSprite.body.velocity.x*0.95, blobSprite.body.velocity.y*0.95);
   	}
   
}

//Called after the renderer rendered - usefull for debug rendering, ...
function render () {
	/*
	enemies.forEachAlive(function(ennemy){
		game.debug.body(ennemy);
	});
	game.debug.body(blobSprite);
	*/

	enemies.forEachAlive(function(ennemy){
		//CONSUMPTION
		var enemyIsEdible = ennemy.scale.getMagnitude() < blobSprite.scale.getMagnitude();
		if( enemyIsEdible && Phaser.Rectangle.containsRect(partialRectangle(ennemy.body, 0.6), blobSprite.body) ){
			ennemy.kill();
			eatenBlobs++;
			scoreText.text = eatenBlobs+" blobs eaten";
			var targetScale = blobSprite.scale.getMagnitude() + 0.05;
			var maxScale = 4;
			if(targetScale > maxScale){
				targetScale = maxScale;
			}
			blobSprite.scale.set(targetScale);
			window.setTimeout(function(){ 
				// We add a second ennemy, while reviving the first one ^_^
				createEnemy();
				ennemy.revive();
				var targetEnemyScale = blobSprite.scale.getMagnitude()*(0.7+Math.random()*1);
				console.log("TargetScale:",targetEnemyScale);
				ennemy.scale.setMagnitude(targetEnemyScale);
				var maxPlayerDistance = 200;
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
		}else if( ! enemyIsEdible && Phaser.Rectangle.containsRect(partialRectangle(blobSprite.body, 0.6), ennemy.body) ){
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

function createEnemy(){
	if(enemies.children.length < 70){
		var enemy = enemies.create(Math.random()*1200,Math.random()*800, 'foes');
		enemy.scale.set(0.5+1*Math.random());
		enemy.body.setSize(enemy.body.width/2, enemy.body.height/2, 0, 0);
		var maxVelocityAmplitude = 100;
		enemy.body.velocity.x = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
		enemy.body.velocity.y = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
		enemy.body.collideWorldBounds = true;
		enemy.body.bounce.set(1);
		enemy.anchor.set(0.5);

	}
}
