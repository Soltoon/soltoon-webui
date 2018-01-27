class Site {
    static cellWidth: number;
    static cellOffset: number;
    static gridWidth: number;
    static gridHeight: number;
    static paperWidth: number = 1000;
    static paperHeight: number = 650;
    static paper: RaphaelPaper = Raphael("game-viewer", Site.paperWidth, Site.paperHeight);
    static eventTime = 1000;
    static currentEvent = 0;

    static game: Game;

    static getCellPos(i, j): any {
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
    }

    static run(): void {
        if (this.currentEvent < this.game.events.length) {
            this.game.events[this.currentEvent++].run();
        }
    }

    static next(): void {
        if (this.currentEvent < this.game.events.length) {
            this.game.events[this.currentEvent++].runWithoutAnimation();
        }
    }

    static prev(): void {
        if (this.currentEvent > 0) {
            this.game.events[--this.currentEvent].rollback();
        }
    }
}

Site.paper.setViewBox(0, 0, Site.paperWidth, Site.paperHeight, true);
Site.paper.setSize('100%', '100%');

class Player {
    id: number;
    name: string;
    color: string;
    score: number = 0;
    money: number = 0;
    scoreElement: RaphaelElement = null;
    moneyElement: RaphaelElement = null;

    constructor(id: number, name: string, color: string, score: number, money: number) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = score;
        this.money = money;
    }

    private change(elm: RaphaelElement, newVal: string, noAnimation: boolean): void {
        let oldVal = elm.attr('text');
        if (newVal == oldVal)
            return;
        if (noAnimation == false) {
            let ch = (parseInt(newVal) - parseInt(oldVal));
            let changeText: RaphaelElement = Site.paper.text(elm.attr('x'),
                elm.attr('y'), ((ch > 0) ? '+' : '') + ch)
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
    }

    changeMoney(newVal: number, noAnimation: boolean = false): void {
        this.money = newVal;

        return this.change(this.moneyElement, "" + newVal, noAnimation);
    }

    changeScore(newVal: number, noAnimation: boolean = false): void {
        this.score = newVal;

        return this.change(this.scoreElement, "" + newVal, noAnimation);
    }
}

class Map {
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

class GamePosition {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class KhadangHelper {
    static khadangs: Khadang[] = [];

    static get(position: GamePosition): Khadang {
        for (let i in this.khadangs) {
            let khadang = this.khadangs[i];
            if (khadang.position.x == position.x && khadang.position.y == position.y)
                return khadang;
        }
        return null;
    }

    static getId(position: GamePosition): number {
        for (let i in this.khadangs) {
            let khadang = this.khadangs[i];
            if (khadang.position.x == position.x && khadang.position.y == position.y)
                return parseInt(i);
        }
        return -1;
    }
}

enum Direction {
    UP,
    LEFT,
    RIGHT,
    DOWN
}

class Khadang {
    khadangType: string;
    owner: Player;
    position: GamePosition;
    health: number;
    element: any;
    healthBar: any;

    constructor(khadangType: string, owner: Player, position: GamePosition, health: number) {
        this.khadangType = khadangType;
        this.owner = owner;
        this.position = position;
        this.health = health;
        this.element = Site.paper.set();
        this.healthBar = null;
    }

    getImage(): string {
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
    }

    getMaxHealth(): number {
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
    }
}

class GameEvent {
    type: string;
    moneyChanges: object = {}; // player id -> new money
    scoreChanges: object = {};
    oldMoney: object = {};
    oldScore: object = {};


    addMoneyChanges(changes: object) {
        for (let id in changes) {
            this.addMoneyChange(parseInt(id), changes[id]);
        }
    }

    addScoreChanges(changes: object) {
        for (let id in changes) {
            this.addScoreChange(parseInt(id), changes[id]);
        }
    }

    addMoneyChange(playerId: number, newMoney: number): void {
        this.moneyChanges[playerId] = newMoney;
    }

    addScoreChange(playerId: number, newScore: number): void {
        this.scoreChanges[playerId] = newScore;
    }

    constructor(type: string) {
        this.type = type;
    }

    run(): void {
        for (let playerId in this.moneyChanges) {
            let newMoney = this.moneyChanges[playerId];
            this.oldMoney[playerId] = Site.game.getPlayerById(parseInt(playerId)).money;
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(newMoney);
        }

        for (let playerId in this.scoreChanges) {
            let newScore = this.scoreChanges[playerId];
            this.oldScore[playerId] = Site.game.getPlayerById(parseInt(playerId)).score;
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(newScore);
        }
    }

    rollback(): void {
        for (let playerId in this.oldMoney) {
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(this.oldMoney[playerId], true);
        }
        for (let playerId in this.oldScore) {
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(this.oldScore[playerId], true);
        }
    }

    runWithoutAnimation(): void {
        for (let playerId in this.moneyChanges) {
            let newMoney = this.moneyChanges[playerId];
            this.oldMoney[playerId] = Site.game.getPlayerById(parseInt(playerId)).money;
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(newMoney, true);
        }

        for (let playerId in this.scoreChanges) {
            let newScore = this.scoreChanges[playerId];
            this.oldScore[playerId] = Site.game.getPlayerById(parseInt(playerId)).score;
            Site.game.getPlayerById(parseInt("" + playerId)).changeScore(newScore, true);
        }
    }
}

class RoundEvent extends GameEvent {
    number: number;

    constructor(number: number) {
        super("round");
        this.number = number;
    }

    run(): void {
        super.run();
        let mask = Site.paper.rect(0, 0, Site.gridWidth, Site.gridHeight)
            .attr({
                'fill': 'rgba(0, 0, 0, 0.8)',
                'opacity': 0
            });
        let maskText = Site.paper.text(Site.gridWidth / 2, Site.gridHeight / 2, "Round " + this.number)
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
    }

    rollback(): void {
        super.rollback();
    }

    runWithoutAnimation(): void {
        super.runWithoutAnimation();
    }
}

class AddEvent extends GameEvent {
    khadangId: number;
    khadangType: string;
    owner: Player;
    position: GamePosition;
    health: number;
    addToScore: number;
    cost: number;

    constructor(khadangId: number, khadangType: string, owner: Player, position: GamePosition, health: number,
                addToScore: number, cost: number) {
        super("add");
        this.khadangId = khadangId;
        this.khadangType = khadangType;
        this.addToScore = addToScore;
        this.health = health;
        this.owner = owner;
        this.position = position;
        this.cost = cost;
    }

    private addKhadang(): Khadang {
        let pos = Site.getCellPos(this.position.x, this.position.y); // TODO: fix it
        let khadang: Khadang = new Khadang(
            this.khadangType,
            this.owner,
            this.position,
            this.health,
        );

        // let player = Site.game.getPlayerById(this.owner.id);
        // player.changeMoney(player.money - this.cost);
        // player.changeScore(player.score + this.addToScore);

        khadang.element.push(Site.paper.rect(pos.x, pos.y,
            pos.w, pos.h).attr({
            'fill': khadang.owner.color,
            'stroke': 'rgba(0,0,0,0)'
        }));
        khadang.element.push(Site.paper.image("assets/imgs/" + khadang.getImage(),
            pos.x2, pos.y2, pos.w2, pos.h2));
        khadang.healthBar = Site.paper.rect(
            pos.x, pos.y + pos.h - Site.cellOffset,
            (khadang.health / khadang.getMaxHealth()) * (pos.w),
            Site.cellOffset
        ).attr({
            'fill': 'red',
            'stroke': 'transparent'
        });
        khadang.element.push(khadang.healthBar);
        return khadang;
    }

    run(): void {
        super.run();

        let khadang = this.addKhadang();

        khadang.element.transform('S0.1, 0.1');
        khadang.element.animate({
            'transform': "S1, 1"
        }, 200 / 2000 * Site.eventTime);
        KhadangHelper.khadangs.push(khadang);
    }

    runWithoutAnimation(): void {
        super.runWithoutAnimation();

        let khadang = this.addKhadang();

        KhadangHelper.khadangs.push(khadang);
    }

    rollback(): void {
        super.rollback();
        let id = KhadangHelper.getId(this.position);
        KhadangHelper.khadangs[id].element.remove();
        delete KhadangHelper.khadangs[id];
    }
}

class ShootEvent extends GameEvent {
    from: GamePosition;
    to: GamePosition;
    damage: number;
    oldHealth: number = 0;
    oldKhadang: Khadang = null;

    constructor(from: GamePosition, to: GamePosition) {
        super("shoot");
        this.from = from;
        this.to = to;
    }

    run(): void {
        super.run();
        let from = Site.getCellPos(this.from.x, this.from.y);
        let to = Site.getCellPos(this.to.x, this.to.y);
        let attackLine = Site.paper.path("M" + (from.x + (from.w / 2)) + "," + (from.y + (from.h / 2)) +
            "L" + (to.x + (to.w / 2)) + "," + (to.y + (to.h / 2))
        ).attr({
            'stroke': 'red',
            'stroke-dasharray': '--.',
            'stroke-width': 2
        });
        let fromKhadang = KhadangHelper.get(this.from);
        let toKhadangId = KhadangHelper.getId(this.to);
        let toKhadang = KhadangHelper.khadangs[toKhadangId];

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

        setTimeout(() => {
            fromKhadang.element.animate({
                'transform': "S1, 1"
            }, 200 / 2000 * Site.eventTime);
            if (toKhadang != null) {
                toKhadang.element.innerShadow("none");
                if (toKhadang.health != 0) {
                    // back it to normal size
                    toKhadang.element.animate({
                        'transform': "S1, 1"
                    }, 200 / 2000 * Site.eventTime)
                } else {
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

    }


    runWithoutAnimation(): void {
        super.runWithoutAnimation();
        let toKhadang = KhadangHelper.get(this.to);

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

    }


    rollback(): void {
        super.rollback();

        if (this.oldKhadang != null) {
            this.oldKhadang.element.transform("S1, 1");
            this.oldKhadang.element.show();
            KhadangHelper.khadangs.push(this.oldKhadang);
        }

        let toKhadang = KhadangHelper.get(this.to);

        if (toKhadang != null) {
            toKhadang.health = this.oldHealth;

            KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)] = toKhadang;


            toKhadang.healthBar.attr({
                'width': (toKhadang.health / toKhadang.getMaxHealth()) * (Site.getCellPos(this.to.x, this.to.y).w)
            });
        }

    }
}

class MoveEvent extends GameEvent {
    position: GamePosition;
    direction: Direction;

    constructor(position: GamePosition, direction: Direction) {
        super("move");
        this.position = position;
        this.direction = direction;
    }

    private move(animate: boolean, rollback: boolean = false): void {
        let dx = 0, dy = 0;
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
        let x = this.position.x, y = this.position.y;
        let nx = this.position.x + dx, ny = this.position.y + dy;
        let from = Site.getCellPos(this.position.x, this.position.y);
        let to = Site.getCellPos(nx, ny);


        if (rollback) {
            let temp;
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

        let id = KhadangHelper.getId(new GamePosition(x, y));

        KhadangHelper.khadangs[id].position.x = nx;
        KhadangHelper.khadangs[id].position.y = ny;
        KhadangHelper.khadangs[id].element.forEach(function (e) {
            if (animate) {
                e.animate({
                    x: e.attr('x') + to.x2 - from.x2,
                    y: e.attr('y') + to.y2 - from.y2
                }, 500 / 2000 * Site.eventTime);
            } else {
                e.attr({
                    x: e.attr('x') + to.x2 - from.x2,
                    y: e.attr('y') + to.y2 - from.y2
                });
            }
        });
    }

    run(): void {
        super.run();
        this.move(true);
    }

    runWithoutAnimation(): void {
        super.runWithoutAnimation();
        this.move(false);
    }

    rollback(): void {
        super.rollback();
        this.move(false, true);
    }
}

class Game {
    map: Map;
    rounds: number;
    players: Player[];
    events: GameEvent[];

    constructor(map: Map, rounds: number, players: Player[], events: GameEvent[]) {
        this.map = map;
        this.rounds = rounds;
        this.players = players;
        this.events = events;
    }

    getPlayerById(id: number): Player {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id == id)
                return this.players[i];
        }
        return null;
    }
}


$.getJSON('game.json').always((data) => {


    let playerColors = ['#5ab97e', '#f2b179'];

    let game = new Game(
        new Map(data.misc.mapWidth, data.misc.mapHeight),
        data.misc.rounds,
        [],
        []);
    let lastShootEvent = null;
    let moneyChange: object = {}, scoreChange: object = {};

    for (let eventIterator in data.events) {
        let event = data.events[eventIterator];
        switch (event.eventType) {
            case "PLAYER_JOIN":
                game.players.push(new Player(
                    event.id,
                    event.remoteInfo.displayName,
                    playerColors[game.players.length],
                    0,
                    event.initialMoney
                ));
                break;
            case "ROUND_START":
                game.events.push(new RoundEvent(
                    event.round
                ));
                game.events[game.events.length - 1].addMoneyChanges(event.moneyByPlayer);
                break;
            case "AGENT_ADD":
                game.events.push(new AddEvent(
                    event.agent,
                    event.agentType,
                    game.getPlayerById(event.player),
                    new GamePosition(event.x, event.y),
                    event.hp,
                    event.score,
                    event.cost
                ));
                break;
            case "AGENT_MOVE":
                let direction: Direction = Direction.UP;
                if (event.toX == event.fromX + 1)
                    direction = Direction.RIGHT;
                if (event.toX == event.fromX - 1)
                    direction = Direction.LEFT;
                if (event.toY == event.fromY + 1)
                    direction = Direction.DOWN;
                game.events.push(new MoveEvent(
                    new GamePosition(event.fromX, event.fromY),
                    direction
                ));
                break;
            case "AGENT_SHOOT":
                lastShootEvent = new ShootEvent(
                    new GamePosition(event.x, event.y),
                    new GamePosition(event.targetX, event.targetY));

                break;
            case "AGENT_DAMAGED":
                if (lastShootEvent != null) {
                    lastShootEvent.damage = event.damage;
                    game.events.push(lastShootEvent);
                    lastShootEvent = null;
                }
                break;
            case "AGENT_DIE":
                if (lastShootEvent != null) {
                    lastShootEvent.damage = 100000;
                    lastShootEvent.penaltyScore = event.penalty;
                    game.events.push(lastShootEvent);
                    lastShootEvent = null;
                }
                break;
            case "AGENT_CHANGE_SCORE":
                scoreChange[event.player] = event.finalScore;
                break;
            case "AGENT_CHANGE_MONEY":
                moneyChange[event.player] = event.finalMoney;
                break;
        }
        if (event.eventType != 'AGENT_CHANGE_SCORE' && event.eventType != 'AGENT_CHANGE_MONEY' &&
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

    for (let i = 0; i < game.map.width; i++) {
        for (let j = 0; j < game.map.height; j++) {
            Site.paper.rect(Site.getCellPos(i, j).x, Site.getCellPos(i, j).y,
                Site.getCellPos(i, j).w, Site.getCellPos(i, j).h, 4)
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
