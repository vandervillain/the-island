var Sprite = (function () {
    function Sprite(charPath, world) {
        var sprite = this;
        sprite.world = world;
        sprite.height = 96;
        sprite.width = 72;
        sprite.set = null;
        sprite.stepCounter = 0;
        sprite.stepDir = 1;
        sprite.importSet(charPath, function (set) {
            sprite.set = set;
        });
    }
    Sprite.prototype.importSet = function (filename, callback) {
        var charsetData = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        var charset = new Image(), obj = this;
        charset.onload = function () {
            for (var y = 0; y < 4; y++) {
                for (var x = 0; x < 3; x++) {
                    var canvas = document.createElement('canvas'), ctx = canvas.getContext("2d"), offsetx = obj.width * x, offsety = obj.height * y, splicedImg = new Image();
                    canvas.width = obj.width;
                    canvas.height = obj.height;
                    // sourceImage, sourceOffsetX, sourceOffsetY, chunkSizeX, chunkSizeY, canvasPlacementX, canvasPlacementY, newSizeX, newSizeY)
                    ctx.drawImage(charset, offsetx, offsety, obj.width, obj.height, 0, 0, obj.width, obj.height);
                    splicedImg.src = canvas.toDataURL('image/png');
                    charsetData[y][x] = splicedImg;
                }
            }
            callback(charsetData);
        };
        charset.src = filename;
    };
    Sprite.prototype.move = function (x, y, strength) {
        var nextX = this.x + (x * strength * 2), nextY = this.y + (y * strength * 2), nextBlock = this.world.getBlock(nextX, nextY);
        if (nextBlock.type === TerrainType.ocean || nextBlock.type === TerrainType.mountain)
            return;
        if (this.stepCounter >= 40)
            this.stepDir = -strength;
        else if (this.stepCounter <= 0)
            this.stepDir = strength;
        this.stepCounter += this.stepDir;
        this.currAnim = (Math.abs(x) > Math.abs(y)) ? (x > 0 ? 1 : 3) : (y > 0 ? 2 : 0);
        this.currStep = this.stepCounter < 10 ? 0 : this.stepCounter > 30 ? 2 : 1;
        this.x = nextX;
        this.y = nextY;
    };
    Sprite.prototype.draw = function (ctx) {
        ctx.drawImage(this.set[this.currAnim][this.currStep], 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
    };
    return Sprite;
})();
//# sourceMappingURL=sprite.js.map