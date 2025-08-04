class scene2 extends Phaser.Scene {
    constructor(){
        super("playGame");
        this.score = 0;
        this.lives = 3;
        this.bulletDelay = 200;
        this.lastBulletTime = 0;
        this.ufoHealth = 5; // Initial UFO health
        this.ufoStartingHealth = 5; // Starting health for UFO, increases on each respawn
    }

    create(){
        this.background = this.add.tileSprite(0,0, config.width, config.height, "background");
        this.background.setOrigin(0,0);

        this.ship = this.physics.add.sprite(config.width/2, config.height/2 + 200, "ship");
        this.ship.play("ship_animation");
        this.ship.setCollideWorldBounds(true);
        this.ship.body.setAllowGravity(false);

        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.bullets = this.physics.add.group({
            defaultKey: 'beam',
            maxSize: 10
        });

        this.asteroids = this.physics.add.group();
        this.ufo = this.physics.add.sprite(config.width / 2, 50, "ufo");
        this.ufo.play("ufo_animation");
        this.ufo.setCollideWorldBounds(true);
        this.ufo.body.setAllowGravity(false);
        this.ufo.health = this.ufoStartingHealth; // Set initial health on creation

        // UFO movement
        this.ufo.setInteractive();
        this.input.setDraggable(this.ufo);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
        this.livesText = this.add.text(16, 50, 'Lives: 3', { fontSize: '32px', fill: '#fff' });

        this.spawnAsteroid();

        // Add colliders
        this.physics.add.overlap(this.bullets, this.asteroids, this.bulletHitAsteroid, null, this);
        this.physics.add.overlap(this.bullets, this.ufo, this.bulletHitUfo, null, this);
        this.physics.add.overlap(this.ship, this.asteroids, this.shipHitAsteroid, null, this);
        this.physics.add.overlap(this.ship, this.ufo, this.shipHitUfo, null, this);
        this.physics.add.overlap(this.ship, this.asteroids, this.shipHitAsteroid, null, this);

    }

    update() {
        this.moveAsteroids();
        this.background.tilePositionY -= 0.5;

        if (this.keyA.isDown || this.cursorKeys.left.isDown) {
            this.ship.x -= 3;
        } else if (this.keyD.isDown || this.cursorKeys.right.isDown) {
            this.ship.x += 3;
        }
        
        // Shoot bullets
        if (this.spacebar.isDown && (this.time.now - this.lastBulletTime > this.bulletDelay)) {
            this.shootBullet();
            this.lastBulletTime = this.time.now;
        }

        this.bullets.children.each((bullet) => {
            if (bullet.active) {
                bullet.y -= 10;
                if (bullet.y < 0) {
                    bullet.destroy();
                }
            }
        });
    }

    shootBullet() {
        let bullet = this.bullets.get();
        if (bullet) {
            bullet.enableBody(true, this.ship.x, this.ship.y, true, true);
            bullet.setVelocityY(-300);
        }
    }

    bulletHitUfo(ufo, bullet) {
        // Destroy the bullet
        bullet.destroy();
        
        // Decrement UFO health
        ufo.health -= 1;
        
        // Check if UFO health is 0
        if (ufo.health <= 0) {
            // Play explosion animation
            let explosion = this.add.sprite(ufo.x, ufo.y, "explosion");
            explosion.play("explosion_animation");
            
            // Destroy the UFO sprite
            ufo.destroy();

            // Increase score
            this.score += 500;
            this.scoreText.setText('Score: ' + this.score);

            // Increase UFO starting health for the next spawn
            this.ufoStartingHealth += 1;

            // Respawn UFO with new health
            this.spawnUfo();

            // Replenish player lives if not full
            if (this.lives < 3) {
                this.lives = 3;
                this.livesText.setText('Lives: ' + this.lives);
            }
        }
    }

    spawnUfo() {
        this.ufo = this.physics.add.sprite(config.width / 2, 50, "ufo");
        this.ufo.play("ufo_animation");
        this.ufo.setCollideWorldBounds(true);
        this.ufo.body.setAllowGravity(false);
        this.ufo.health = this.ufoStartingHealth; // Set new health
        
        this.ufo.setInteractive();
        this.input.setDraggable(this.ufo);
        
        // Add the collider again for the new UFO
        this.physics.add.overlap(this.bullets, this.ufo, this.bulletHitUfo, null, this);
        this.physics.add.overlap(this.ship, this.ufo, this.shipHitUfo, null, this);
    }
    
    shipHitAsteroid(ship, asteroid){
        let explosion = this.add.sprite(ship.x, ship.y, "explosion");
        explosion.play("explosion_animation");
        this.resetAsteroidPos(asteroid);
        this.ship.y = config.height + 100;
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);

        if (this.lives === 0) {
            this.scene.start("bootGame");
        }
    }
    
    shipHitUfo(ship, ufo){
        let explosion = this.add.sprite(ship.x, ship.y, "explosion");
        explosion.play("explosion_animation");
        this.resetUfoPos(ufo);
        this.ship.y = config.height + 100;
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);

        if (this.lives === 0) {
            this.scene.start("bootGame");
        }
    }

    bulletHitAsteroid(bullet, asteroid) {
        let explosion = this.add.sprite(asteroid.x, asteroid.y, "explosion");
        explosion.play("explosion_animation");
        
        bullet.destroy();
        asteroid.destroy();

        this.createAsteroid(asteroid.scaleX, asteroid.speed);
        
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
    
    spawnAsteroid() {
        this.createAsteroid(0.2, 3.2);
        this.createAsteroid(0.5, 2.1);
        this.createAsteroid(0.9, 1.1);
    }

    createAsteroid(scale, speed){
        const x = Phaser.Math.Between(50, config.width - 50);
        const y = - 50;

        const asteroid = this.asteroids.create(x,y, "asteroid");
        asteroid.setScale(scale);
        asteroid.setOrigin(0.5);
        asteroid.setAngularVelocity(Phaser.Math.Between(-40, 40));
        asteroid.speed = speed;
    }

    moveAsteroids() {
        this.asteroids.children.each((asteroid) => {
            this.moveAsteroid(asteroid);
        });
    }

    moveAsteroid(asteroid) {
        asteroid.y += asteroid.speed;
        if (asteroid.y > config.height) {
            this.resetAsteroidPos(asteroid);
        }
    }

    resetAsteroidPos(asteroid) {
        asteroid.y = -50;
        asteroid.x = Phaser.Math.Between(50, config.width - 50);
    }
    
    resetUfoPos(ufo) {
        ufo.y = -50;
        ufo.x = Phaser.Math.Between(50, config.width - 50);
    }
}