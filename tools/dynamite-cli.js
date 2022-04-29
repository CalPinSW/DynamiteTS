!function (e) {
    var t = {};

    function r(o) {
        if (t[o]) return t[o].exports;
        var s = t[o] = {i: o, l: !1, exports: {}};
        return e[o].call(s.exports, s, s.exports, r), s.l = !0, s.exports
    }

    r.m = e, r.c = t, r.d = function (e, t, o) {
        r.o(e, t) || Object.defineProperty(e, t, {enumerable: !0, get: o})
    }, r.r = function (e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {value: "Module"}), Object.defineProperty(e, "__esModule", {value: !0})
    }, r.t = function (e, t) {
        if (1 & t && (e = r(e)), 8 & t) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var o = Object.create(null);
        if (r.r(o), Object.defineProperty(o, "default", {
            enumerable: !0,
            value: e
        }), 2 & t && "string" != typeof e) for (var s in e) r.d(o, s, function (t) {
            return e[t]
        }.bind(null, s));
        return o
    }, r.n = function (e) {
        var t = e && e.__esModule ? function () {
            return e.default
        } : function () {
            return e
        };
        return r.d(t, "a", t), t
    }, r.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, r.p = "", r(r.s = 4)
}([function (e, t) {
    e.exports = {
        BotError: class extends Error {
            constructor(e, t, r) {
                super(t), this.status = 400, Error.captureStackTrace(this), r && (this.stack += "\nCaused by:\n" + (r.stack || r)), this.name = this.constructor.name, this.errorPlayer = e, this.errorReason = t
            }
        }, TournamentInProgressError: class extends Error {
            constructor() {
                super(), this.status = 409, Error.captureStackTrace(this), this.name = this.constructor.name, this.message = "Tournament already running"
            }
        }, TimeoutError: class extends Error {
            constructor(e) {
                super(e), this.status = 500, Error.captureStackTrace(this), this.name = this.constructor.name
            }
        }
    }
}, function (e, t, r) {
    const {BotError: o} = r(0), s = ["R", "P", "S", "W", "D"];
    e.exports = class {
        constructor(e, t, r, o) {
            this.instanceIds = {1: e[0], 2: e[1]}, this.score = {1: 0, 2: 0}, this.dynamite = {
                1: o.dynamite,
                2: o.dynamite
            }, this.gamestate = {
                1: {rounds: []},
                2: {rounds: []}
            }, this.scoreToWin = o.scoreToWin, this.roundLimit = o.roundLimit, this.runnerClient1 = t, this.runnerClient2 = r, this.nextRoundPoints = 1
        }

        updateDynamite(e) {
            for (let t = 1; t <= 2; t++) if ("D" === e[t] && (this.dynamite[t] -= 1), this.dynamite[t] < 0) throw new o(t, "dynamite")
        }

        updateGamestate(e) {
            this.gamestate[1].rounds.push({p1: e[1], p2: e[2]}), this.gamestate[2].rounds.push({p1: e[2], p2: e[1]})
        }

        updateScore(e) {
            if (!s.includes(e[1])) throw new o(1, "invalidMove", e[1]);
            if (!s.includes(e[2])) throw new o(2, "invalidMove", e[2]);
            e[1] !== e[2] ? ("D" === e[1] && "W" !== e[2] || "W" === e[1] && "D" === e[2] || "R" === e[1] && "S" === e[2] || "S" === e[1] && "P" === e[2] || "P" === e[1] && "R" === e[2] || "D" !== e[1] && "W" === e[2] ? this.score[1] += this.nextRoundPoints : this.score[2] += this.nextRoundPoints, this.nextRoundPoints = 1) : this.nextRoundPoints += 1
        }

        getOutput(e, t) {
            const r = {
                winner: this.score[1] > this.score[2] ? 1 : 2,
                score: this.score,
                gamestate: this.gamestate[1],
                reason: e
            };
            return t && t.errorPlayer && (r.errorBot = t.errorPlayer, r.errorReason = t.errorReason, r.errorStack = t.stack, r.winner = 3 - t.errorPlayer), r
        }

        play() {
            return this.scoreToWin <= Math.max(this.score[1], this.score[2]) ? this.getOutput("score") : this.gamestate[1].rounds.length >= this.roundLimit ? this.getOutput("round limit") : Promise.all([this.runnerClient1.makeMove(this.instanceIds[1], this.gamestate[1]).catch(e => this.handleBotError(e, 1)), this.runnerClient2.makeMove(this.instanceIds[2], this.gamestate[2]).catch(e => this.handleBotError(e, 2))]).then(e => {
                const t = {1: e[0], 2: e[1]};
                this.updateGamestate(t), this.updateDynamite(t), this.updateScore(t)
            }).then(() => this.play()).catch(e => this.getOutput("error", e))
        }

        handleBotError(e, t) {
            throw new o(t, "error", e)
        }

        deleteBots() {
            return Promise.all([this.runnerClient1.deleteInstance(this.instanceIds[1]), this.runnerClient2.deleteInstance(this.instanceIds[2])])
        }
    }
}, function (e, t, r) {
    const o = r(1);

    function s(e, t, r) {
        return {
            botIds: {1: e, 2: t},
            winner: 3 - r,
            score: {1: 0, 2: 0},
            gamestate: {rounds: []},
            reason: "error",
            errorBot: r,
            errorReason: "startupError"
        }
    }

    e.exports = function (e, t, r, n, a, i) {
        return r.createInstance(e).then(c => n.createInstance(t).then(s => (s => {
            const i = new o(s, r, n, a);
            return i.play().then(r => (i.deleteBots(), r.botIds = {1: e, 2: t}, r))
        })([c, s]), o => (i.error(`Error creating bot ${t}: \n${o.stack || ""}`), r.deleteInstance(c), s(e, t, 2)))).catch(r => (i.error(`Error creating bot ${e}: ${r}\n${r.stack || ""}`), s(e, t, 1)))
    }
}, function (e, t) {
    e.exports = require("fs")
}, function (module, exports, __webpack_require__) {
    const fs = __webpack_require__(3), play = __webpack_require__(2);
    (process.argv[4] && isNaN(process.argv[4]) || process.argv[5] && isNaN(process.argv[5]) || process.argv[6] && isNaN(process.argv[6]) || process.argv.length < 4) && (console.log("Specify 2 arguments with the file path to the bots:"), console.log("\n\tnode dynamite-cli.js myBot1.js myBot2.js\n"), console.log("You may also optionally specify the number of matches, score to win, and number of dynamite (in that order)"), console.log("\n\tnode dynamite-cli.js myBot1.js myBot2.js 10 1000 100\n"), process.exit(1));
    const args = {
        botPath1: process.argv[2],
        botPath2: process.argv[3],
        games: process.argv[4],
        scoreToWin: process.argv[5],
        dynamite: process.argv[6]
    };
    let games = args.games ? process.argv[4] : 1, scoreToWin = args.scoreToWin ? process.argv[5] : 1e3,
        dynamite = args.dynamite ? process.argv[6] : 100;
    const options = {scoreToWin: scoreToWin, roundLimit: null, dynamite: dynamite, games: games};

    function loadBot(path) {
        const botContent = fs.readFileSync(path, "utf-8"), module = {};
        return eval(botContent), module.exports
    }

    options.roundLimit = 2.5 * options.scoreToWin;
    const bot1 = loadBot(args.botPath1), bot2 = loadBot(args.botPath2);

    class CliRunnerClient {
        createInstance(e) {
            return Promise.resolve(e)
        }

        makeMove(e, t) {
            try {
                switch (e) {
                    case 1:
                        return Promise.resolve(bot1.makeMove(t));
                    case 2:
                        return Promise.resolve(bot2.makeMove(t));
                    default:
                        return Promise.reject("No such bot")
                }
            } catch (e) {
                return Promise.reject(e)
            }
        }

        deleteInstance(e) {
            return Promise.resolve()
        }
    }

    const cliRunnerClient = new CliRunnerClient;

    function playGames(e) {
        e > 0 && play(1, 2, cliRunnerClient, cliRunnerClient, options, console).then(t => {
            console.log(`Game ${options.games - e + 1} results:`), console.log(`Winner: p${t.winner}`), console.log(`Score: ${t.score[1]} - ${t.score[2]}`), console.log(`Reason: ${t.reason}`), t.errorBot && console.log(`Player ${t.errorBot} failed:\n${t.errorStack}`), playGames(e - 1)
        }).catch(e => console.error("UNEXPECTED ERROR:", e))
    }

    playGames(options.games)
}]);