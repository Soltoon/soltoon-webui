class Site {
    static cellWidth: number;
    static cellOffset: number;
    static gridWidth: number;
    static gridHeight: number;
    static paperWidth: number = 1000;
    static paperHeight: number = 650;
    static paper: RaphaelPaper = Raphael("game-viewer", Site.paperWidth, Site.paperHeight);
    static actionTime = 1000;

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

    private change(elm: RaphaelElement, newVal: string): void {
        let oldVal = elm.attr('text');
        if (newVal == oldVal)
            return;
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
        }, Site.actionTime / 4, 'linear', function () {
            this.remove();
        });
        elm.attr({
            'text': newVal
        });
    }

    changeMoney(newVal: number): void {
        this.money = newVal;
        return this.change(this.moneyElement, "" + newVal);
    }

    changeScore(newVal: number): void {
        this.score = newVal;
        return this.change(this.scoreElement, "" + newVal);
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

class Action {
    type: string;

    constructor(type: string) {
        this.type = type;
    }

    run(): void {
    }
}

class RoundAction extends Action {
    number: number;
    moneyChanges: object; // player id ->  new score

    constructor(number: number, moneyChanges: object) {
        super("round");
        this.number = number;
        this.moneyChanges = moneyChanges;
    }

    run(): void {
        for (let playerId in this.moneyChanges) {
            let newScore = this.moneyChanges[playerId];
            Site.game.getPlayerById(parseInt("" + playerId)).changeMoney(newScore);
        }
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
        }, 200 / 2000 * Site.actionTime);
        maskText.animate({
            opacity: 1
        }, 200 / 2000 * Site.actionTime);

        setTimeout(function () {
            mask.stop().animate({
                opacity: 0
            }, 200 / 2000 * Site.actionTime, "linear", function () {
                this.remove();
            });
            maskText.stop().animate({
                opacity: 0
            }, 200 / 2000 * Site.actionTime, "linear", function () {
                this.remove();
            });

        }, 500 / 2000 * Site.actionTime);
    }
}

class AddAction extends Action {
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

    run(): void {
        let pos = Site.getCellPos(this.position.x, this.position.y); // TODO: fix it
        let khadang: Khadang = new Khadang(
            this.khadangType,
            this.owner,
            this.position,
            this.health,
        );

        let player = Site.game.getPlayerById(this.owner.id);
        player.changeMoney(player.money - this.cost);
        player.changeScore(player.score + this.addToScore);

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
        khadang.element.transform('S0.1, 0.1');
        khadang.element.animate({
            'transform': "S1, 1"
        }, 200 / 2000 * Site.actionTime);
        KhadangHelper.khadangs.push(khadang);
    }
}

class ShootAction extends Action {
    from: GamePosition;
    to: GamePosition;
    damage: number;
    penaltyScore: number = 0;

    constructor(from: GamePosition, to: GamePosition) {
        super("shoot");
        this.from = from;
        this.to = to;
    }

    run(): void {
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
        let toKhadang = KhadangHelper.get(this.to);
        if (fromKhadang == null) {
            console.error("fromKhadang is null!!");
        }
        fromKhadang.element.animate({
            'transform': "S1.2, 1.2"
        }, 200 / 2000 * Site.actionTime);

        if (toKhadang != null) {
            toKhadang.health -= this.damage;
            if (toKhadang.health < 0)
                toKhadang.health = 0;

            KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)] = toKhadang;

            toKhadang.element.animate({
                'transform': "S0.9, 0.9"
            }, 200 / 2000 * Site.actionTime).innerShadow(10, 0, 0, "red", 0.7);


            toKhadang.healthBar.animate({
                'width': (toKhadang.health / toKhadang.getMaxHealth()) * (Site.getCellPos(this.to.x, this.to.y).w)
            }, 1000 / 2000 * Site.actionTime);
        }

        setTimeout(() => {
            fromKhadang.element.animate({
                'transform': "S1, 1"
            }, 200 / 2000 * Site.actionTime);
            if (toKhadang != null) {
                if (toKhadang.health != 0) {
                    // back it to normal size
                    KhadangHelper.get(this.to).element.animate({
                        'transform': "S1, 1"
                    }, 200 / 2000 * Site.actionTime).innerShadow("none");
                } else {
                    // remove it
                    let player = Site.game.getPlayerById(toKhadang.owner.id);
                    player.changeScore(player.score - this.penaltyScore);


                    KhadangHelper.get(this.to).element.animate({
                        'transform': "S0, 0"
                    }, 200 / 2000 * Site.actionTime, function () {
                        this.remove();
                        // TODO: change score of owner
                        delete KhadangHelper.khadangs[KhadangHelper.getId(toKhadang.position)];
                    });
                }
            }

            attackLine.animate({
                'opacity': 0
            }, 200 / 2000 * Site.actionTime, "linear", function () {
                this.remove();
            });

        }, 800 / 2000 * Site.actionTime);

    }
}

class MoveAction extends Action {
    position: GamePosition;
    direction: Direction;

    constructor(position: GamePosition, direction: Direction) {
        super("move");
        this.position = position;
        this.direction = direction;
    }

    run(): void {
        let id = KhadangHelper.getId(this.position);
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
        let nx = this.position.x + dx, ny = this.position.y + dy;
        let from = Site.getCellPos(this.position.x, this.position.y);
        let to = Site.getCellPos(nx, ny);
        KhadangHelper.khadangs[id].position.x = nx;
        KhadangHelper.khadangs[id].position.y = ny;
        KhadangHelper.khadangs[id].element.forEach(function (e) {
            e.animate({
                x: e.attr('x') + to.x2 - from.x2,
                y: e.attr('y') + to.y2 - from.y2
            }, 500 / 2000 * Site.actionTime);
        });
    }
}

class Game {
    map: Map;
    rounds: number;
    players: Player[];
    actions: Action[];

    constructor(map: Map, rounds: number, players: Player[], actions: Action[]) {
        this.map = map;
        this.rounds = rounds;
        this.players = players;
        this.actions = actions;
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
    //console.log(data);

    let playerColors = ['#5ab97e', '#f2b179'];

    let game = new Game(
        new Map(data.misc.mapWidth, data.misc.mapHeight),
        data.misc.rounds,
        [],
        []);
    let lastShootAction = null;

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
                game.actions.push(new RoundAction(
                    event.round,
                    event.moneyByPlayer
                ));
                break;
            case "AGENT_ADD":
                game.actions.push(new AddAction(
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
                game.actions.push(new MoveAction(
                    new GamePosition(event.fromX, event.fromY),
                    direction
                ));
                break;
            case "AGENT_SHOOT":
                lastShootAction = new ShootAction(
                    new GamePosition(event.x, event.y),
                    new GamePosition(event.targetX, event.targetY));

                break;
            case "AGENT_DAMAGED":
                if (lastShootAction != null) {
                    lastShootAction.damage = event.damage;
                    game.actions.push(lastShootAction);
                    lastShootAction = null;
                }
                break;
            case "AGENT_DIE":
                if (lastShootAction != null) {
                    lastShootAction.damage = 100000;
                    lastShootAction.penaltyScore = event.penalty;
                    game.actions.push(lastShootAction);
                    lastShootAction = null;
                }
                break;

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


    let currentAction = 0;

    let gameInterval = setInterval(function () {
        if (currentAction < game.actions.length) {
            game.actions[currentAction++].run();
        }
        else {
            clearInterval(gameInterval);
        }

    }, Site.actionTime);


});
