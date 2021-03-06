define(["require", "exports", "underscore", "lib", "account", "player", "worldbuilder", "map"], function (require, exports, _, Library, Account, Player, World, Map) {
    var GameServer = (function () {
        function GameServer() {
            this.games = [];
        }
        GameServer.prototype.connection = function (socket) {
            console.log('GameServer.connection');
            // get user account info
            var account = new Account.Account();
            account.id = "test";
            // check if supposed to be in game, if so, force them to reconnect
            var game = new GameData();
            game.addPlayer(account, socket);
            this.games.push(game);
            var objects = [];
            socket.emit('gameReady', game);
            socket.on('subscribeToGame', function () {
                game.start(socket);
            });
        };
        return GameServer;
    })();
    exports.GameServer = GameServer;
    var GameDataLight = (function () {
        function GameDataLight(gameData, player) {
            this.players = gameData.players;
            this.byps = gameData.map.byps;
            this.bxps = gameData.map.bxps;
            this.pyps = gameData.map.pyps;
            this.pxps = gameData.map.pxps;
            var sectionId = Map.Map.getSectionId(gameData.map, player.sprite.x, player.sprite.y, 'p');
            // clone map objects list and add in players
            var mapObjects = gameData.map.objects.concat(gameData.map.sprites);
            // only draw objects that are around current player's section
            var acceptSections = Map.Map.getSurroundingSections(sectionId);
            this.drawObjects = _.filter(mapObjects, function (o) {
                return acceptSections.indexOf(o.sectionId) > -1;
            });
        }
        return GameDataLight;
    })();
    exports.GameDataLight = GameDataLight;
    var GameData = (function () {
        function GameData() {
            this.id = Library.guid();
            this.players = [];
            this.map = new World.World(100, 100, 100, 5).map;
        }
        GameData.prototype.toLight = function (player) {
            return new GameDataLight(this, player);
        };
        GameData.prototype.addPlayer = function (account, socket) {
            console.log('GameData.addplayer');
            var player = new Player.Player(account);
            this.players.push(player);
            Map.Map.addSprite(this.map, player.sprite);
        };
        GameData.prototype.start = function (socket) {
            console.log('GameData.start');
            var obj = this;
            // register each players socket to accept controller updates from client
            //for (var p in obj.players) {
            obj.players[0].registerControlsUpdates(socket);
            //}
            // now set an interval to process each player's latest update
            setInterval(function () {
                for (var p in obj.players) {
                    obj.players[p].processAction(obj.map);
                }
            }, 25);
            socket.on('updateMe', function () {
                socket.emit('gameUpdate', obj.toLight(obj.players[0]));
                socket.emit('other1', obj.toLight(obj.players[0]));
                socket.emit('other2', obj.toLight(obj.players[0]));
                socket.emit('other3', obj.toLight(obj.players[0]));
                socket.emit('other4', obj.toLight(obj.players[0]));
                socket.emit('other5', obj.toLight(obj.players[0]));
                socket.emit('other6', obj.toLight(obj.players[0]));
            });
            socket.emit('subscribed');
            //setInterval(function () {
            //    socket.emit('gameUpdate', obj.toLight(obj.players[0]));
            //}, 15);
        };
        return GameData;
    })();
    exports.GameData = GameData;
});
//# sourceMappingURL=gameServer.js.map