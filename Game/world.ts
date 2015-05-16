﻿interface Section {
    x: number;
    y: number;
    canvas: HTMLCanvasElement;
}

interface Block {
    x: number;
    y: number;
    type?: TerrainType;
    above?: Block;
    right?: Block;
    below?: Block;
    left?: Block;
    bg?: string;
}

enum TerrainType {
    ocean,
    shallow,
    beach,
    grass,
    dirt,
    rock,
    mountain,
    lava
}

class World {
    grid: Array<Array<Block>>;
    tileset: HTMLImageElement;
    cached: Array<Array<HTMLCanvasElement>>;
    sectionsX: number;
    sectionsY: number;
    numX: number;
    numY: number;
    tileSize: number;
    gradientSize: number;
    terrainType: TerrainType;

    constructor(x, y, tileSize, gradientSize, tileset) {
        this.numX = x;
        this.numY = y;
        this.tileSize = tileSize;
        this.gradientSize = gradientSize;

        // init grid
        this.sectionsX = 2;
        this.sectionsY = 2;

        this.cached = [];
        for (var sy = 0; sy < this.sectionsY; sy++) {
            for (var sx = 0; sx < this.sectionsX; sx++) {
                if (sx === 0) {
                    this.cached[sy] = [];
                }

                this.cached[sy][sx] = document.createElement('canvas');
                this.cached[sy][sx].width = (this.numX / this.sectionsX) * tileSize;
                this.cached[sy][sx].height = (this.numY / this.sectionsX) * tileSize;
            }
        }

        this.tileset = tileset;

        this.initGrid();
        this.build();
        this.render();
    }

    initGrid() {
        this.grid = [];

        // initialize empty blocks in grid
        for (var y = 0; y < this.numY; y++) {
            for (var x = 0; x < this.numX; x++) {
                var block = {
                    x: x,
                    y: y
                };

                if (x === 0) {
                    this.grid[y] = [];
                }
                this.grid[y][x] = block;
            }
        }

        // apply pointers to nearby
        for (var j in this.grid) {
            var row = this.grid[j];

            for (var k in row) {
                var b = row[k];
                this.setNearbyPointers(b);
            }
        }
    }

    build() {
        this.createOcean();
        this.createBeach();
        this.createMountain();

        // fill with dirt
        this.fill(this.gradientSize * 4, this.numX - (this.gradientSize * 4), this.gradientSize * 4, this.numY - (this.gradientSize * 4), TerrainType.dirt, false);
        
        // add grass patches to dirt randomly
        this.createGrass(.02, 5);
    }

    createOcean() {
        this.layerEmptyTop(0, this.numX, 0, TerrainType.ocean, TerrainType.beach, true);
        this.layerEmptyRight(this.numX - 1, 0, this.numY, TerrainType.ocean, TerrainType.beach, true);
        this.layerEmptyBelow(0, this.numX, this.numY - 1, TerrainType.ocean, TerrainType.beach, true);
        this.layerEmptyLeft(0, 0, this.numY, TerrainType.ocean, TerrainType.beach, true);
    }

    createBeach() {
        this.layerEmptyTop(this.gradientSize * 2, this.numX - (this.gradientSize * 2) + 1, this.gradientSize * 2, TerrainType.beach, TerrainType.dirt, true);
        this.layerEmptyRight(this.numX - 1 - (this.gradientSize * 2), this.gradientSize * 2, this.numY - (this.gradientSize * 2), TerrainType.beach, TerrainType.dirt, true);
        this.layerEmptyBelow(this.gradientSize * 2, this.numX - (this.gradientSize * 2) + 1, this.numY - 1 - (this.gradientSize * 2), TerrainType.beach, TerrainType.dirt, true);
        this.layerEmptyLeft(this.gradientSize * 2, this.gradientSize * 2, this.numY - (this.gradientSize * 2) + 1, TerrainType.beach, TerrainType.dirt, true);
    }

    createGrass(chance: number, size: number) {
        for (var y = 0; y < this.numY; y++) {
            for (var x = 0; x < this.numX; x++) {
                var block = this.grid[y][x];
                if (block.type === TerrainType.dirt) {
                    // roll for chance
                    var rand = Math.random();
                    if (rand <= chance) {
                        this.randShape(x, y, Math.round(Math.random() * size), 1, TerrainType.grass, [TerrainType.dirt]);
                    }
                }
            }
        }
    }

    createMountain() {
        this.randShape(Math.round(this.numX / 2), Math.round(this.numY / 2), this.gradientSize * 4, 1, TerrainType.rock);
        this.randShape(Math.round(this.numX / 2), Math.round(this.numY / 2), this.gradientSize * 2, 1, TerrainType.mountain, [TerrainType.rock]);
        this.randShape(Math.round(this.numX / 2), Math.round(this.numY / 2), Math.round(this.gradientSize / 3), 1, TerrainType.lava, [TerrainType.mountain]);
    }

    randShape(cx: number, cy: number, d: number, smooth: number, type: TerrainType, overwrite?: Array<TerrainType>) {
        var startX = Math.round(cx - d - (d * Math.random())),
            endX = Math.round(cx + d + (d * Math.random())),
            startY = cy - d,
            endY = cy + d,
            prevPushA = 0,
            prevPushB = 0;

        for (var x = startX; x <= endX; x++) {
            var xFactor = d - Math.abs(cx - x),
                pushA = Math.round(d * Math.random()) + (xFactor > d / 2 ? d / 2 : xFactor), // random stretch above y center, make distance from x center factor
                evenedA = pushA,
                pushB = Math.round(d * Math.random()) + (xFactor > d / 2 ? d / 2 : xFactor), // random stretch below y center, make distance from x center factor
                evenedB = pushB;

            // for n of smooth, make this next one closer previous
            for (var s = 0; s < smooth; s++) {
                evenedA = Math.round((evenedA + prevPushA) / 2);
                evenedB = Math.round((evenedB + prevPushB) / 2);
            }

            for (var y = startY; y <= endY; y++) {
                if (!this.typeIsSet(this.grid[y][x]) || (overwrite && overwrite.indexOf(this.grid[y][x].type) > -1)) {
                    // if y is center or y is higher but greater than even or y is lower but less than even, make type
                    if ((y == cy && (evenedA > 0 || evenedB > 0)) || (y < cy && y >= cy - evenedA) || (y > cy && y <= cy + evenedB)) {
                        this.setType(this.grid[y][x], type);
                    }
                }
            }

            prevPushA = evenedA;
            prevPushB = evenedB;
        }
    }

    layerEmptyTop(startX: number, endX: number, startY: number, type: TerrainType, fillType: TerrainType, overwrite: boolean) {
        var prevPush = this.gradientSize;
        for (var x = startX; x < endX; x++) {
            var random = Math.random(),
                push = Math.round(this.gradientSize * random),
                middle = Math.round((push + prevPush) / 2);

            for (var y = startY; y < startY + (this.gradientSize * 2); y++) {
                if (overwrite || !this.typeIsSet(this.grid[y][x])) {
                    if (y < startY + this.gradientSize + middle) {
                        this.setType(this.grid[y][x], type);
                    }
                    else if (fillType && this.grid[y][x].type != type) {
                        this.setType(this.grid[y][x], fillType);
                    }
                }
            }

            prevPush = push;
        }
    }

    layerEmptyRight(startX: number, startY: number, endY: number, type: TerrainType, fillType: TerrainType, overwrite: boolean) {
        var prevPush = this.gradientSize;
        for (var y = startY; y < endY; y++) {
            var random = Math.random(),
                push = Math.round(this.gradientSize * random),
                middle = Math.round((push + prevPush) / 2);

            for (var x = startX; x > startX - (this.gradientSize * 2); x--) {
                if (overwrite || !this.typeIsSet(this.grid[y][x])) {
                    if (x > startX - (this.gradientSize + middle)) {
                        this.setType(this.grid[y][x], type);
                    }
                    else if (fillType && this.grid[y][x].type != type) {
                        this.setType(this.grid[y][x], fillType);
                    }
                }
            }

            prevPush = push;
        }
    }

    layerEmptyBelow(startX: number, endX: number, startY: number, type: TerrainType, fillType: TerrainType, overwrite: boolean) {
        var prevPush = this.gradientSize;
        for (var x = startX; x < endX; x++) {
            var random = Math.random(),
                push = Math.round(this.gradientSize * random),
                middle = Math.round((push + prevPush) / 2);

            for (var y = startY; y > startY - (this.gradientSize * 2); y--) {
                if (overwrite || !this.typeIsSet(this.grid[y][x])) {
                    if (y > startY - (this.gradientSize + middle)) {
                        this.setType(this.grid[y][x], type);
                    }
                    else if (fillType && this.grid[y][x].type != type) {
                        this.setType(this.grid[y][x], fillType);
                    }
                }
            }

            prevPush = push;
        }
    }

    layerEmptyLeft(startX: number, startY: number, endY: number, type: TerrainType, fillType: TerrainType, overwrite: boolean) {
        var prevPush = this.gradientSize;
        for (var y = startY; y < endY; y++) {
            // generate values for random edges
            var random = Math.random(),
                push = Math.round((this.gradientSize * random)),
                middle = Math.round((push + prevPush) / 2); // keeps close rows similar 
			
            // loop through min * 2 for x and set the ocean/beach values
            for (var x = startX; x < startX + (this.gradientSize * 2); x++) {
                if (overwrite || !this.typeIsSet(this.grid[y][x])) {
                    if (x < startX + this.gradientSize + middle) {
                        this.setType(this.grid[y][x], type);
                    }
                    else if (fillType && this.grid[y][x].type != type) {
                        this.setType(this.grid[y][x], fillType);
                    }
                }
            }

            prevPush = push;
        }
    }

    render() {
        for (var sy = 0; sy < this.sectionsY; sy++) {
            for (var sx = 0; sx < this.sectionsX; sx++) {
                var ctx = this.cached[sy][sx].getContext("2d"),
                    startX = sx * (this.numX / this.sectionsX),
                    endX = startX + (this.numX / this.sectionsX),
                    startY = sy * (this.numY / this.sectionsY),
                    endY = startY + (this.numY / this.sectionsY);

                for (var y = startY; y < endY; y++) {
                    var row = this.grid[y];

                    for (var x = startX; x < endX; x++) {
                        var block = row[x];
                        this.renderBlock(block, sy, sx, ctx);
                    }
                }
            }
        }
    }

    renderBlock(block: Block, ySection: number, xSection: number, ctx: CanvasRenderingContext2D) {
        var byps = this.numY / this.sectionsY, // blocks y per section
            bxps = this.numX / this.sectionsX, // blocks x per section
            startBlockY = (block.y - (ySection * byps)) * this.tileSize,
            startBlockX = (block.x - (xSection * bxps)) * this.tileSize;

        ctx.drawImage(this.tileset, block.type * this.tileSize, 0, this.tileSize, this.tileSize, startBlockX, startBlockY, this.tileSize, this.tileSize);
        //else {
        //    //define the colour of the square
        //    ctx.fillStyle = block.bg;

        //    // Draw a square using the fillRect() method and fill it with the colour specified by the fillStyle attribute
        //    ctx.fillRect(block.x * this.tileSize, block.y * this.tileSize, this.tileSize, this.tileSize);
        //}
    }

    getBlock(x: number, y: number) {
        var yIndex = Math.floor(y / this.tileSize),
            xIndex = Math.floor(x / this.tileSize);

        return this.grid[yIndex][xIndex];
    }

    setNearbyPointers(block) {
        block.above = block.y > 0 ? this.grid[block.y - 1][block.x] : null;
        block.below = block.y < this.numY - 2 ? this.grid[block.y + 1][block.x] : null;
        block.left = block.x > 0 ? this.grid[block.y][block.x - 1] : null;
        block.right = block.x < this.numX - 2 ? this.grid[block.y][block.x + 1] : null;
    }

    fill(startX: number, endX: number, startY: number, endY: number, fillType: TerrainType, overwrite: boolean) {
        for (var y = startY; y < endY; y++) {
            for (var x = startX; x < endX; x++) {
                if (overwrite || !this.typeIsSet(this.grid[y][x])) {
                    this.setType(this.grid[y][x], fillType);
                }
            }
        }
    }

    setTerrainType(block: Block) {
        if (block.type !== undefined && block.type !== null) {
            return;
        }
        else if (this.bordersDirt(block)) {
            var chances = {};

            if (((block.x < (this.numX / 2)) && block.x < this.gradientSize * 5) || // left side and close to left
                ((block.x > (this.numX / 2)) && block.x > this.numX - (this.gradientSize * 5)) || // left side and close to left
                ((block.y < (this.numY / 2)) && block.y < this.gradientSize * 5) || // left side and close to left
                ((block.y > (this.numY / 2)) && block.y > this.numY - (this.gradientSize * 5))) { // left side and close to left
                chances[TerrainType.dirt] = .8;
                chances[TerrainType.grass] = .2;
            }
            else {
                chances[TerrainType.dirt] = .6;
                chances[TerrainType.grass] = .4;
            }
            this.chanceType(block, chances);
        }
        else if (this.bordersGrass(block)) {
            var chances = {};
            chances[TerrainType.grass] = .8;
            chances[TerrainType.dirt] = .1;
            chances[TerrainType.rock] = .1;
            this.chanceType(block, chances);
        }
        else {
            var chances = {};
            chances[TerrainType.rock] = 1;
            this.chanceType(block, chances);
        }
    }

    typeIsSet(block: Block) {
        return block.type !== undefined && block.type !== null;
    }

    setType(block: Block, type: TerrainType) {
        if (type == TerrainType.ocean) {
            block.bg = "#0af";
            block.type = TerrainType.ocean;
        }
        else if (type == TerrainType.beach) {
            block.bg = "#eda";
            block.type = TerrainType.beach;
        }
        else if (type == TerrainType.grass) {
            block.bg = "#8c3";
            block.type = TerrainType.grass;
        }
        else if (type == TerrainType.dirt) {
            block.bg = "#a95";
            block.type = TerrainType.dirt;
        }
        else if (type == TerrainType.rock) {
            block.bg = "#aaa";
            block.type = TerrainType.rock;
        }
        else if (type == TerrainType.mountain) {
            block.bg = "#444";
            block.type = TerrainType.mountain;
        }
        else if (type == TerrainType.lava) {
            block.bg = "#600";
            block.type = TerrainType.mountain;
        }
    }

    chanceType(block, chance) {
        var start = 0,
            random = Math.random();

        for (var c in chance) {
            if (random >= start && random <= (chance[c] + start)) {
                return this.setType(block, c);
            }
            start += chance[c];
        }
    }

    bordersDirt(block) {
        return block.above.type === TerrainType.dirt ||
            //block.right.type === TerrainType.dirt ||
            //block.below.type === TerrainType.dirt ||
            block.left.type === TerrainType.dirt;
    }

    bordersGrass(block) {
        return block.above.type === TerrainType.grass ||
            //block.right.type === TerrainType.grass ||
            //block.below.type === TerrainType.grass ||
            block.left.type === TerrainType.grass;
    }
}