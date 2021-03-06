﻿class Sprite implements IMapObject {
    id: string;
    imgId: string;
    mapObjectType: MapObjectType;
    x: number;
    y: number;
    z: number;
    sectionId: string;
    yAdjust: number;
    height: number;
    width: number;
    currAnim: number;
    prevAnim: number;
    stepCounter: number;
    stepDir: number;
    currStep: number;
    on: Block;
    pass: boolean;
    passSlow: number;
    passing: boolean;
    canPickup: boolean;

    constructor(imgId: string, asset: Asset, imgCache: Array<CachedImageData>) {
        var sprite = this;

        sprite.id = guid();
        sprite.mapObjectType = MapObjectType.sprite;

        sprite.height = 96;
        sprite.width = 72;

        sprite.z = 1;
        sprite.currAnim = 2;
        sprite.currStep = 1;

        sprite.stepCounter = 0;
        sprite.stepDir = 1;

        sprite.yAdjust = 1; // used to cut sprite off early, like when partly underwater

        sprite.pass = false;
        sprite.passSlow = 0;
        sprite.passing = false;
        sprite.canPickup = false;

        // cache imported img set if not already there
        if (!_.some(imgCache, function (i: CachedImageData) { return i.id === imgId; })) {
            var imgSet = sprite.importSet(asset.value),
                imgData: CachedImageData = {
                    id: imgId,
                    value: imgSet
                };

            imgCache.push(imgData);
        }
    }

    importSet(charset: HTMLImageElement) {
        var charsetData = [
            [null, null, null], // up
            [null, null, null], // right
            [null, null, null], // down
            [null, null, null]  // left
        ];

        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 3; x++) {
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext("2d"),
                    offsetx = this.width * x,
                    offsety = this.height * y,
                    splicedImg = new Image();

                canvas.width = this.width;
                canvas.height = this.height;

                // sourceImage, sourceOffsetX, sourceOffsetY, chunkSizeX, chunkSizeY, canvasPlacementX, canvasPlacementY, newSizeX, newSizeY)
                ctx.drawImage(charset, offsetx, offsety, this.width, this.height, 0, 0, this.width, this.height);
                splicedImg.src = canvas.toDataURL('image/png');
                charsetData[y][x] = splicedImg;
            }
        }
        return charsetData;
    }

    onItem(y: number, x: number) {
        return (y >= this.y && y <= this.y + this.height) && (x >= this.x && x <= this.x + this.width);
    }

    //move(controls: Controls, world: World) {
    //    var note = [50, .1, .4, 'triangle'];

    //    var d = Math.ceil(((controls.sprinting && !controls.looking ? controls.strength * 2 : controls.strength) * 2) * this.slow),
    //        nextY = Math.round(this.y + (controls.y * d)),
    //        nextX = Math.round(this.x + (controls.x * d)),
    //        yOffset = Math.round(-(this.height * (1 - this.yAdjust))),
    //        nextBlock = world.getBlock(nextX, nextY + yOffset),
    //        nearbyBlocks = world.getSurroundingBlocks(nextX, nextY + yOffset),
    //        nearbyObjects = world.getBlocksObjects(nearbyBlocks),
    //        canMove = true;

    //    if (nextBlock.type === TerrainType.shallow) {
    //        this.slow = this.yAdjust > .75 ? .75 : this.yAdjust > .65 ? .5 : .25;
    //        note = [43.65, .3, .4, 'sawtooth'];
    //    }
    //    else if (nextBlock.type === TerrainType.ocean || nextBlock.type === TerrainType.mountain) {
    //        canMove = false;
    //    }
    //    else {
    //        this.slow = 1;
    //    }

    //    this.on = nextBlock;

    //    if (d < 4) {
    //        note = [50, .1, .1, 'triangle'];
    //    }


    //    if (canMove) {
    //        if (nearbyObjects.length > 0) {
    //            this.passing = false;
    //            for (var o in nearbyObjects) {
    //                if (nearbyObjects[o].z === this.z && nearbyObjects[o].onItem(nextY, nextX)) {
    //                    if (nearbyObjects[o].pass) {
    //                        this.slow = nearbyObjects[o].passSlow;
    //                        this.passing = true;
    //                    }
    //                    else {
    //                        canMove = false;
    //                    }
    //                }
    //            }
    //        }
    //        else {
    //            this.passing = false;
    //        }
    //    }

    //    // logging
    //    var info2 = document.getElementById('tile');
    //    info2.innerHTML = nextBlock.type.toString();

    //    if (controls.looking) {
    //        this.currAnim = (Math.abs(controls.lookx) > Math.abs(controls.looky)) ? (controls.lookx > 0 ? 1 : 3) : (controls.looky > 0 ? 2 : 0);
    //    }
    //    else {
    //        this.currAnim = (Math.abs(controls.x) > Math.abs(controls.y)) ? (controls.x > 0 ? 1 : 3) : (controls.y > 0 ? 2 : 0);
    //    }

    //    if (controls.strength > 0) {
    //        if (canMove && d !== 0) {
    //            if (this.stepCounter >= 80) this.stepDir = -1;
    //            else if (this.stepCounter <= 0) this.stepDir = 1;

    //            this.stepCounter += (d * this.stepDir);

    //            //this.currAnim = (Math.abs(controls.x) > Math.abs(controls.y)) ? (controls.x > 0 ? 1 : 3) : (controls.y > 0 ? 2 : 0);
    //            this.currStep = this.stepCounter < 20 ? 0 : this.stepCounter > 60 ? 2 : 1;

    //            if (this.stepCounter === 80 || this.stepCounter === 0) {
    //                //sound.startNote.apply(sound, note);
    //            }

    //            this.x = nextX;
    //            this.y = nextY;
    //        }
    //    }

    //    this.sectionId = world.getSectionId(this.x, this.y, 'p');

    //    // logging
    //    //var info = document.getElementById('pos');
    //    //info.innerHTML = "";
    //    //info.innerHTML += 'x: ' + this.x + '<br />';
    //    //info.innerHTML += 'y: ' + this.y + '<br />';
    //    //info.innerHTML += 'anim: ' + this.currAnim;
    //}

    draw(ctx: CanvasRenderingContext2D, view: ViewPort, imgCache: Array<CachedImageData>) {
        var obj = this,
            offsetX = this.x - (this.width / 2.2),
            offsetY = this.y - (.9 * this.height),
            centeredX = offsetX - view.startX,
            centeredY = offsetY - view.startY,
            imgSet = Game.getCachedImgSet(obj.imgId, imgCache),
            img: HTMLImageElement = imgSet.value[this.currAnim][this.currStep];

        if (this.on.type === TerrainType.shallow || this.on.type === TerrainType.ocean) {
            var bordersLand = this.on.borders([TerrainType.beach, TerrainType.dirt, TerrainType.grass, TerrainType.rock]),
                bordersOcean = this.on.borders([TerrainType.ocean]);

            if ((bordersLand && bordersOcean) || (!bordersLand && !bordersOcean)) {
                this.yAdjust = .75;
                ctx.drawImage(img, 0, 0, this.width, this.height * this.yAdjust, centeredX, centeredY, this.width, this.height * this.yAdjust);
            }
            else if (bordersLand) {
                this.yAdjust = .85;
                ctx.drawImage(img, 0, 0, this.width, this.height * this.yAdjust, centeredX, centeredY, this.width, this.height * this.yAdjust);
            }
            else if (bordersOcean) {
                this.yAdjust = .65;
                ctx.drawImage(img, 0, 0, this.width, this.height * this.yAdjust, centeredX, centeredY, this.width, this.height * this.yAdjust);
            }
        }
        else {
            this.yAdjust = 1;
            ctx.drawImage(img, 0, 0, this.width, this.height, centeredX, centeredY, this.width, this.height);
        }
    }
}