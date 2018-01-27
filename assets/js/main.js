var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Site = /** @class */ (function () {
    function Site() {
    }
    Site.getCellPos = function (i, j) {
        return {
            x: (i * this.cellWidth) + 2 * this.cellOffset,
            y: (j * this.cellWidth) + 2 * this.cellOffset,
            w: this.cellWidth - 2 * this.cellOffset,
            h: this.cellWidth - 2 * this.cellOffset,
            x2: (i * this.cellWidth) + 4 * this.cellOffset,
            y2: (j * this.cellWidth) + 4 * this.cellOffset,
            w2: this.cellWidth - 6 * this.cellOffset,
            h2: this.cellWidth - 6 * this.cellOffset
        };
    };
    Site.run = function () {
        if (this.currentEvent < this.game.events.length) {
            this.game.events[this.currentEvent++].run();
        }
    };
    Site.next = function () {
        if (this.currentEvent < this.game.events.length) {
            this.game.events[this.currentEvent++].runWithoutAnimation();
        }
    };
    Site.prev = function () {
        if (this.currentEvent > 0) {
            this.game.events[--this.currentEvent].rollback();
        }
    };
    Site.paperWidth = 1000;
    Site.paperHeight = 650;
    Site.paper = Raphael("game-viewer", Site.paperWidth, Site.paperHeight);
    Site.eventTime = 1000;
    Site.currentEvent = 0;
    return Site;
}());
Site.paper.setViewBox(0, 0, Site.paperWidth, Site.paperHeight, true);
Site.paper.setSize('100%', '100%');
var Player = /** @class */ (function () {
    function Player(id, name, color, score, money) {
        this.score = 0;
        this.money = 0;
        this.scoreElement = null;
        this.moneyElement = null;
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = score;
        this.money = money;
    }
    Player.prototype.change = function (elm, newVal, noAnimation) {
        var oldVal = elm.attr('text');
        if (newVal == oldVal)
            return;
        if (noAnimation == false) {
            var ch = (parseInt(newVal) - parseInt(oldVal));
            var changeText = Site.paper.text(elm.attr('x'), elm.attr('y'), ((ch > 0) ? '+' : '') + ch)
                .attr({
                'text-anchor': 'start',
                'font-family': 'Samim',
                'font-size': '18px',
            });
            changeText.animate({
                y: elm.attr('y') - 30,
                opacity: 0
            }, Site.eventTime / 4, 'linear', function () {
                this.remove();
            });
        }
        elm.attr({
            'text': newVal
        });
    };
    Player.prototype.changeMoney = function (newVal, noAnimation) {
        if (noAnimation === void 0) { noAnimation = false; }
        this.money = newVal;
        return this.change(this.moneyElement, "" + newVal, noAnimation);
    };
    Player.prototype.changeScore = function (newVal, noAnimation) {
        if (noAnimation === void 0) { noAnimation = false; }
        this.score = newVal;
        return this.change(this.scoreElement, "" + newVal, noAnimation);
    };
    return Player;
}());
var Map = /** @class */ (function () {
    function Map(width, height) {
        this.width = width;
        this.height = height;
    }
    return Map;
}());
var GamePosition = /** @class */ (function () {
    function GamePosition(x, y) {
        this.x = x;
        this.y = y;
    }
    return GamePosition;
}());
var KhadangHelper = /** @class */ (function () {
    function KhadangHelper() {
    }
    KhadangHelper.get = function (position) {
        for (var i in this.khadangs) {
            var khadang = this.khadangs[i];
            if (khadang.position.x == position.x && khadang.position.y == position.y)
                return khadang;
        }
        return null;
    };
    KhadangHelper.getId = function (position) {
        for (var i in this.khadangs) {
            var khadang = this.khadangs[i];
            if (khadang.position.x == position.x && khadang.position.y == position.y)
                return parseInt(i);
        }
        return -1;
    };
    KhadangHelper.khadangs = [];
    return KhadangHelper;
}());
var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["LEFT"] = 1] = "LEFT";
    Direction[Direction["RIGHT"] = 2] = "RIGHT";
    Direction[Direction["DOWN"] = 3] = "DOWN";
})(Direction || (Direction = {}));
var Khadang = /** @class */ (function () {
    function Khadang(khadangType, owner, position, health) {
        this.khadangType = khadangType;
        this.owner = owner;
        this.position = position;
        this.health = health;
        this.element = Site.paper.set();
        this.healthBar = null;
    }
    Khadang.prototype.getImage = function () {
        switch (this.khadangType) {
            case 'CASTLE':
                return 'castle.png';
            case 'CANNON':
                return 'Cannon.svg';
            case 'GIANT':
                return 'Char-Giant.svg';
            case 'MUSKETEER':
                return 'Char-Muskteer.svg';
        }
        return '';
    };
    Khadang.prototype.getMaxHealth = function () {
        switch (this.khadangType) {
            case 'CASTLE':
                return 20000;
            case 'CANNON':
                return 4000;
            case 'GIANT':
                return 1000;
            case 'MUSKETEER':
                return 200;
        }
        return 1;
    };
    return Khadang;
}());
var GameEvent = /** @class */ (function () {
    function GameEvent(type) {
        this.moneyChanges = {}; // player id -> new money
        this.scoreChanges = {};
        this.oldMoney = {};
        this.oldScore = {};
        this.type = type;
    }
    GameEvent.prototype.addMoneyChanges = function (changes) {
        for (var id in changes) {
            this.addMoneyChange(parseInt(id), changes[id]);
        }
    };
    GameEvent.prototype.addScoreChanges = function (changes) {
        for (var id in changes) {
            this.addScoreChange(parseInt(id), changes[id]);
        }
    };
    GameEvent.prototype.addMoneyChange = function (playerId, newMoney) {
        this.moneyChanges[playerId] = newMoney;
    };
    GameEvent.prototype.addScoreChange = function (playerId, newScore) {
        this.scoreChanges[playerId] = newScore;
    };
    GameEvent.prototype.run = function () {
        for (var playerId in this.moneyChanges) {
            var newMoney = this.moneyChanges[playerId];
            this.oldMoney[playerId] = Site.game.getPlayerById(parseInt(playerId)).money;
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(newMoney);
        }
        for (var playerId in this.scoreChanges) {
            var newScore = this.scoreChanges[playerId];
            this.oldScore[playerId] = Site.game.getPlayerById(parseInt(playerId)).score;
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(newScore);
        }
    };
    GameEvent.prototype.rollback = function () {
        for (var playerId in this.oldMoney) {
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(this.oldMoney[playerId], true);
        }
        for (var playerId in this.oldScore) {
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(this.oldScore[playerId], true);
        }
    };
    GameEvent.prototype.runWithoutAnimation = function () {
        for (var playerId in this.moneyChanges) {
            var newMoney = this.moneyChanges[playerId];
            this.oldMoney[playerId] = Site.game.getPlayerById(parseInt(playerId)).money;
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(newMoney, true);
        }
        for (var playerId in this.scoreChanges) {
            var newScore = this.scoreChanges[playerId];
            this.oldScore[playerId] = Site.game.getPlayerById(parseInt(playerId)).score;
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(newScore, true);
        }
    };
    return GameEvent;
}());
var RoundEvent = /** @class */ (function (_super) {
    __extends(RoundEvent, _super);
    function RoundEvent(number) {
        var _this = _super.call(this, "round") || this;
        _this.number = number;
        return _this;
    }
    RoundEvent.prototype.run = function () {
        _super.prototype.run.call(this);
        var mask = Site.paper.rect(0, 0, Site.gridWidth, Site.gridHeight)
            .attr({
            'fill': 'rgba(0, 0, 0, 0.8)',
            'opacity': 0
        });
        var maskText = Site.paper.text(Site.gridWidth / 2, Site.gridHeight / 2, "Round " + this.number)
            .attr({
            'text-align': 'center',
            'opacity': 0,
            'font-size': '72px',
            'fill': '#fff'
        });
        mask.animate({
            opacity: 1
        }, 200 / 2000 * Site.eventTime);
        maskText.animate({
            opacity: 1
        }, 200 / 2000 * Site.eventTime);
        setTimeout(function () {
            mask.stop().animate({
                opacity: 0
            }, 200 / 2000 * Site.eventTime, "linear", function () {
                this.remove();
            });
            maskText.stop().animate({
                opacity: 0
            }, 200 / 2000 * Site.eventTime, "linear", function () {
                this.remove();
            });
        }, 500 / 2000 * Site.eventTime);
    };
    RoundEvent.prototype.rollback = function () {
        _super.prototype.rollback.call(this);
    };
    RoundEvent.prototype.runWithoutAnimation = function () {
        _super.prototype.runWithoutAnimation.call(this);
    };
    return RoundEvent;
}(GameEvent));
var AddEvent = /** @class */ (function (_super) {
    __extends(AddEvent, _super);
    function AddEvent(khadangId, khadangType, owner, position, health, addToScore, cost) {
        var _this = _super.call(this, "add") || this;
        _this.khadangId = khadangId;
        _this.khadangType = khadangType;
        _this.addToScore = addToScore;
        _this.health = health;
        _this.owner = owner;
        _this.position = position;
        _this.cost = cost;
        return _this;
    }
    AddEvent.prototype.addKhadang = function () {
        var pos = Site.getCellPos(this.position.x, this.position.y); // TODO: fix it
        var khadang = new Khadang(this.khadangType, this.owner, this.position, this.health);
        // let player = Site.game.getPlayerById(this.owner.id);
        // player.changeMoney(player.money - this.cost);
        // player.changeScore(player.score + this.addToScore);
        khadang.element.push(Site.paper.rect(pos.x, pos.y, pos.w, pos.h).attr({
            'fill': khadang.owner.color,
            'stroke': 'rgba(0,0,0,0)'
        }));
        khadang.element.push(Site.paper.image("assets/imgs/" + khadang.getImage(), pos.x2, pos.y2, pos.w2, pos.h2));
        khadang.healthBar = Site.paper.rect(pos.x, pos.y + pos.h - Site.cellOffset, (khadang.health / khadang.getMaxHealth()) * (pos.w), Site.cellOffset).attr({
            'fill': 'red',
            'stroke': 'transparent'
        });
        khadang.element.push(khadang.healthBar);
        return khadang;
    };
    AddEvent.prototype.run = function () {
        _super.prototype.run.call(this);
        var khadang = this.addKhadang();
        khadang.element.transform('S0.1, 0.1');
        khadang.element.animate({
            'transform': "S1, 1"
        }, 200 / 2000 * Site.eventTime);
        KhadangHelper.khadangs.push(khadang);
    };
    AddEvent.prototype.runWithoutAnimation = function () {
        _super.prototype.runWithoutAnimation.call(this);
        var khadang = this.addKhadang();
        KhadangHelper.khadangs.push(khadang);
    };
    AddEvent.prototype.rollback = function () {
        _super.prototype.rollback.call(this);
        var id = KhadangHelper.getId(this.position);
        KhadangHelper.khadangs[id].element.remove();
        delete KhadangHelper.khadangs[id];
    };
    return AddEvent;
}(GameEvent));
var ShootEvent = /** @class */ (function (_super) {
    __extends(ShootEvent, _super);
    function ShootEvent(from, to) {
        var _this = _super.call(this, "shoot") || this;
        _this.oldHealth = 0;
        _this.oldKhadang = null;
        _this.from = from;
        _this.to = to;
        return _this;
    }
    ShootEvent.prototype.run = function () {
        _super.prototype.run.call(this);
        var from = Site.getCellPos(this.from.x, this.from.y);
        var to = Site.getCellPos(this.to.x, this.to.y);
        var attackLine = Site.paper.path("M" + (from.x + (from.w / 2)) + "," + (from.y + (from.h / 2)) +
            "L" + (to.x + (to.w / 2)) + "," + (to.y + (to.h / 2))).attr({
            'stroke': 'red',
            'stroke-dasharray': '--.',
            'stroke-width': 2
        });
        var fromKhadang = KhadangHelper.get(this.from);
        var toKhadangId = KhadangHelper.getId(this.to);
        var toKhadang = KhadangHelper.khadangs[toKhadangId];
        fromKhadang.element.animate({
            'transform': "S1.3, 1.3"
        }, 200 / 2000 * Site.eventTime);
        if (toKhadang != null) {
            this.oldHealth = toKhadang.health;
            toKhadang.health -= this.damage;
            if (toKhadang.health < 0)
                toKhadang.health = 0;
            KhadangHelper.khadangs[toKhadangId] = toKhadang;
            toKhadang.element.animate({
                'transform': "S0.8, 0.8"
            }, 200 / 2000 * Site.eventTime).innerShadow(10, 0, 0, "red", 0.7);
            toKhadang.healthBar.animate({
                'width': (toKhadang.health / toKhadang.getMaxHealth()) * (Site.getCellPos(this.to.x, this.to.y).w)
            }, 1000 / 2000 * Site.eventTime);
        }
        if (toKhadang != null && toKhadang.health == 0) {
            this.oldKhadang = toKhadang;
        }
        setTimeout(function () {
            fromKhadang.element.animate({
                'transform': "S1, 1"
            }, 200 / 2000 * Site.eventTime);
            if (toKhadang != null) {
                toKhadang.element.innerShadow("none");
                if (toKhadang.health != 0) {
                    // back it to normal size
                    toKhadang.element.animate({
                        'transform': "S1, 1"
                    }, 200 / 2000 * Site.eventTime);
                }
                else {
                    // remove it
                    toKhadang.element.animate({
                        'transform': "S0, 0"
                    }, 200 / 2000 * Site.eventTime, function () {
                        this.hide();
                        delete KhadangHelper.khadangs[toKhadangId];
                    });
                }
            }
            attackLine.animate({
                'opacity': 0
            }, 200 / 2000 * Site.eventTime, "linear", function () {
                this.remove();
            });
        }, 800 / 2000 * Site.eventTime);
    };
    ShootEvent.prototype.runWithoutAnimation = function () {
        _super.prototype.runWithoutAnimation.call(this);
        var toKhadang = KhadangHelper.get(this.to);
        if (toKhadang != null) {
            this.oldHealth = toKhadang.health;
            toKhadang.health -= this.damage;
            if (toKhadang.health < 0)
                toKhadang.health = 0;
            KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)] = toKhadang;
            toKhadang.healthBar.attr({
                'width': (toKhadang.health / toKhadang.getMaxHealth()) * (Site.getCellPos(this.to.x, this.to.y).w)
            });
        }
        if (toKhadang != null && toKhadang.health == 0) {
            this.oldKhadang = toKhadang;
        }
        if (toKhadang != null) {
            if (toKhadang.health == 0) {
                // remove it
                toKhadang.element.hide();
                delete KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)];
            }
        }
    };
    ShootEvent.prototype.rollback = function () {
        _super.prototype.rollback.call(this);
        if (this.oldKhadang != null) {
            this.oldKhadang.element.transform("S1, 1");
            this.oldKhadang.element.show();
            KhadangHelper.khadangs.push(this.oldKhadang);
        }
        var toKhadang = KhadangHelper.get(this.to);
        if (toKhadang != null) {
            toKhadang.health = this.oldHealth;
            KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)] = toKhadang;
            toKhadang.healthBar.attr({
                'width': (toKhadang.health / toKhadang.getMaxHealth()) * (Site.getCellPos(this.to.x, this.to.y).w)
            });
        }
    };
    return ShootEvent;
}(GameEvent));
var MoveEvent = /** @class */ (function (_super) {
    __extends(MoveEvent, _super);
    function MoveEvent(position, direction) {
        var _this = _super.call(this, "move") || this;
        _this.position = position;
        _this.direction = direction;
        return _this;
    }
    MoveEvent.prototype.move = function (animate, rollback) {
        if (rollback === void 0) { rollback = false; }
        var dx = 0, dy = 0;
        switch (this.direction) {
            case Direction.UP:
                dy--;
                break;
            case Direction.DOWN:
                dy++;
                break;
            case Direction.LEFT:
                dx--;
                break;
            case Direction.RIGHT:
                dx++;
                break;
        }
        var x = this.position.x, y = this.position.y;
        var nx = this.position.x + dx, ny = this.position.y + dy;
        var from = Site.getCellPos(this.position.x, this.position.y);
        var to = Site.getCellPos(nx, ny);
        if (rollback) {
            var temp = void 0;
            temp = x;
            x = nx;
            nx = temp;
            temp = y;
            y = ny;
            ny = temp;
            temp = from;
            from = to;
            to = temp;
        }
        var id = KhadangHelper.getId(new GamePosition(x, y));
        KhadangHelper.khadangs[id].position.x = nx;
        KhadangHelper.khadangs[id].position.y = ny;
        KhadangHelper.khadangs[id].element.forEach(function (e) {
            if (animate) {
                e.animate({
                    x: e.attr('x') + to.x2 - from.x2,
                    y: e.attr('y') + to.y2 - from.y2
                }, 500 / 2000 * Site.eventTime);
            }
            else {
                e.attr({
                    x: e.attr('x') + to.x2 - from.x2,
                    y: e.attr('y') + to.y2 - from.y2
                });
            }
        });
    };
    MoveEvent.prototype.run = function () {
        _super.prototype.run.call(this);
        this.move(true);
    };
    MoveEvent.prototype.runWithoutAnimation = function () {
        _super.prototype.runWithoutAnimation.call(this);
        this.move(false);
    };
    MoveEvent.prototype.rollback = function () {
        _super.prototype.rollback.call(this);
        this.move(false, true);
    };
    return MoveEvent;
}(GameEvent));
var Game = /** @class */ (function () {
    function Game(map, rounds, players, events) {
        this.map = map;
        this.rounds = rounds;
        this.players = players;
        this.events = events;
    }
    Game.prototype.getPlayerById = function (id) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == id)
                return this.players[i];
        }
        return null;
    };
    return Game;
}());
$.getJSON('game.json').always(function (data) {
    var playerColors = ['#5ab97e', '#f2b179'];
    var game = new Game(new Map(data.misc.mapWidth, data.misc.mapHeight), data.misc.rounds, [], []);
    var lastShootEvent = null;
    var moneyChange = {}, scoreChange = {};
    for (var eventIterator in data.events) {
        var event_1 = data.events[eventIterator];
        switch (event_1.eventType) {
            case "PLAYER_JOIN":
                game.players.push(new Player(event_1.id, event_1.remoteInfo.displayName, playerColors[game.players.length], 0, event_1.initialMoney));
                break;
            case "ROUND_START":
                game.events.push(new RoundEvent(event_1.round));
                game.events[game.events.length - 1].addMoneyChanges(event_1.moneyByPlayer);
                break;
            case "AGENT_ADD":
                game.events.push(new AddEvent(event_1.agent, event_1.agentType, game.getPlayerById(event_1.player), new GamePosition(event_1.x, event_1.y), event_1.hp, event_1.score, event_1.cost));
                break;
            case "AGENT_MOVE":
                var direction = Direction.UP;
                if (event_1.toX == event_1.fromX + 1)
                    direction = Direction.RIGHT;
                if (event_1.toX == event_1.fromX - 1)
                    direction = Direction.LEFT;
                if (event_1.toY == event_1.fromY + 1)
                    direction = Direction.DOWN;
                game.events.push(new MoveEvent(new GamePosition(event_1.fromX, event_1.fromY), direction));
                break;
            case "AGENT_SHOOT":
                lastShootEvent = new ShootEvent(new GamePosition(event_1.x, event_1.y), new GamePosition(event_1.targetX, event_1.targetY));
                break;
            case "AGENT_DAMAGED":
                if (lastShootEvent != null) {
                    lastShootEvent.damage = event_1.damage;
                    game.events.push(lastShootEvent);
                    lastShootEvent = null;
                }
                break;
            case "AGENT_DIE":
                if (lastShootEvent != null) {
                    lastShootEvent.damage = 100000;
                    lastShootEvent.penaltyScore = event_1.penalty;
                    game.events.push(lastShootEvent);
                    lastShootEvent = null;
                }
                break;
            case "AGENT_CHANGE_SCORE":
                scoreChange[event_1.player] = event_1.finalScore;
                break;
            case "AGENT_CHANGE_MONEY":
                moneyChange[event_1.player] = event_1.finalMoney;
                break;
        }
        if (event_1.eventType != 'AGENT_CHANGE_SCORE' && event_1.eventType != 'AGENT_CHANGE_MONEY' &&
            game.events.length > 0) {
            game.events[game.events.length - 1].addMoneyChanges(moneyChange);
            game.events[game.events.length - 1].addScoreChanges(scoreChange);
            moneyChange = {};
            scoreChange = {};
        }
    }
    Site.cellWidth = 640 / Math.max(game.map.height, game.map.width);
    Site.cellOffset = Site.cellWidth / 20;
    Site.gridWidth = game.map.width * Site.cellWidth + 2 * Site.cellOffset;
    Site.gridHeight = game.map.height * Site.cellWidth + 2 * Site.cellOffset;
    // create grid
    Site.paper.rect(0, 0, Site.gridWidth, Site.gridHeight, 4)
        .attr({
        'fill': '#bbada0',
        'stroke': 'rgba(0,0,0,0)'
    });
    for (var i = 0; i < game.map.width; i++) {
        for (var j = 0; j < game.map.height; j++) {
            Site.paper.rect(Site.getCellPos(i, j).x, Site.getCellPos(i, j).y, Site.getCellPos(i, j).w, Site.getCellPos(i, j).h, 4)
                .attr({
                'fill': '#cec1b4',
                'stroke': 'rgba(0,0,0,0)'
            });
        }
    }
    // create right menu:
    Site.paper.image("assets/imgs/SoltoonGUI.png", 650, 0, 350, 225);
    Site.paper.text(995, 260, 'تنظیمات:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '32px',
        'font-weight': 'bold'
    });
    Site.paper.rect(685, 300, 100, 30);
    Site.paper.rect(895, 300, 100, 30);
    Site.paper.text(995, 355, 'بازی‌کن «' + game.players[0].name + '»:')
        .attr({
        'text-anchor': 'start',
        'align': 'right',
        'font-family': 'Samim',
        'font-size': '22px',
        'font-weight': 'bold',
        'fill': playerColors[0],
    });
    Site.paper.text(965, 390, 'امتیاز:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    game.players[0].scoreElement = Site.paper.text(850, 390, "" + game.players[0].score)
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    Site.paper.text(965, 420, 'دارایی:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    game.players[0].moneyElement = Site.paper.text(850, 420, "" + game.players[0].money)
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    Site.paper.text(995, 475, 'بازی‌کن «' + game.players[1].name + '»:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '22px',
        'font-weight': 'bold',
        'fill': playerColors[1],
    });
    Site.paper.text(965, 510, 'امتیاز:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    game.players[1].scoreElement = Site.paper.text(850, 510, "" + game.players[1].score)
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    Site.paper.text(965, 540, 'دارایی:')
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    game.players[1].moneyElement = Site.paper.text(850, 540, "" + game.players[1].money)
        .attr({
        'text-anchor': 'start',
        'font-family': 'Samim',
        'font-size': '18px',
    });
    Site.game = game;
    /*    let gameInterval = setInterval(function () {
            if (currentEvent < game.events.length) {
                game.events[currentEvent++].run();
            }
            else {
                clearInterval(gameInterval);
            }

        }, Site.eventTime);*/
});
