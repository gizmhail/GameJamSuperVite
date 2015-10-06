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
    	var enemy = enemies.create(Math.random()*1200,Math.random()*800, 'foes');
    	enemy.scale.set(0.5+1*Math.random());
	    enemy.body.setSize(enemy.body.width/2, enemy.body.height/2, 0, 0);
	    var maxVelocityAmplitude = 100;
	    enemy.body.velocity.x = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
	    enemy.body.velocity.y = -maxVelocityAmplitude + Math.random()*2*maxVelocityAmplitude;
	    enemy.body.collideWorldBounds = true;
	    enemy.body.bounce.set(1);
	    enemy.anchor.set(0.5);
    	i++;
    }

    //game.physics.enable(enemies, Phaser.Physics.ARCADE);

    /*
    ennemy = game.add.sprite(2000, 200, 'foes');
    game.physics.enable(ennemy, Phaser.Physics.ARCADE);
    ennemy.body.setSize(ennemy.body.width/2,ennemy.body.height/2,0,0);
    ennemy.anchor.set(0.5);
    ennemy.scale.set(5);
    */
    game.world.sendToBack(enemies);
    game.world.sendToBack(backgrounds);
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

    if (game.input.mousePointer.isDown){
        game.physics.arcade.moveToPointer(blobSprite, 400);
        var distance = Phaser.Point.distance(
        	{x:blobSprite.body.centerX,y:blobSprite.body.centerY}, 
        	{x:game.input.x, y:game.input.y});
        console.log(distance);
        //if(distance < 100 ){
        if (Phaser.Rectangle.contains(blobSprite.body, game.input.x, game.input.y)){
            blobSprite.body.velocity.setTo(0,0);
        }
    }else{
        blobSprite.body.velocity.setTo(blobSprite.body.velocity.x*0.95, blobSprite.body.velocity.y*0.95);
   	}
   
}

//Called after the renderer rendered - usefull for debug rendering, ...
function render () {
	enemies.forEachAlive(function(ennemy){
		game.debug.body(ennemy);
	});
	game.debug.body(blobSprite);

	enemies.forEachAlive(function(ennemy){
		//CONSUPTION
		if( ennemy && Phaser.Rectangle.containsRect(ennemy.body, blobSprite.body) && ennemy.alive){
			ennemy.kill();
			var targetScale = blobSprite.scale.getMagnitude() + 0.05;
			var maxScale = 4;
			if(targetScale > maxScale){
				targetScale = maxScale;
			}
			blobSprite.scale.set(targetScale);
			window.setTimeout(function(){ 
				ennemy.revive();
				enemy.scale.set((0.5+2*Math.random())*blobSprite.scale.getMagnitude());
				var maxPlayerDistance = 200;
				ennemy.x = blobSprite.x - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
				ennemy.y = blobSprite.y - maxPlayerDistance + 2*maxPlayerDistance*Math.random();
			}, 2000);
		}else if( ennemy && Phaser.Rectangle.containsRect(blobSprite.body, ennemy.body) && ennemy.alive){
			game.paused = true;
			var text = game.add.text(100,100,"GAME OVER");
			text.fixedToCamera = true;
			//TODO Better death
		}
	}, this);
}