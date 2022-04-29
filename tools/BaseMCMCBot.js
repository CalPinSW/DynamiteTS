"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

class MyBot {
    constructor() {
        this.myDynamite = 100;
        this.round = 0;
        this.possibleMoves = ['R', 'P', 'S', 'W', 'D'];
        this.mcmc = new MCMCProbs();
    }
    makeMove(gamestate) {
        let myMove;
        if (this.round > 1) {
            this.mcmc.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);
            myMove = this.possibleMoves[this.mcmc.getMoveIndex(gamestate.rounds[gamestate.rounds.length - 1])];
        }
        else {
            myMove = this.getRandomRPSMove();
        }
        this.round++;

        if (myMove === 'D')
            this.myDynamite--;
        if (this.myDynamite === 0) {
            this.possibleMoves.pop();
            this.myDynamite = -1;
        }
        return myMove;
    }
    getRandomMove() {
        return this.possibleMoves[Math.floor(Math.random() * this.possibleMoves.length)];
    }
    getRandomRPSMove() {
        return this.possibleMoves[Math.floor(Math.random() * 3)];
    }
}
class MCMCProbs {
    constructor() {
        this.allMoves = ['R', 'P', 'S', 'W', 'D'];
        this.listNodes = [];
        for (let moveP1 of this.allMoves) {
            for (let moveP2 of this.allMoves) {
                this.listNodes.push(new Node(moveP1, moveP2));
            }
        }
    }
    updateProbabilities(lastRound, thisRound) {
        let updateNode = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
        })];
        updateNode.nextMoveProbabilitiesUpdate(thisRound.p2);
    }
    getMoveIndex(lastRound) {
        const pointArray = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];
        let expectedPoints = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
        })];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                expectedPoints[i] += pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        //console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`);
        const maxExpectedPoints = Math.max(...expectedPoints);
        return expectedPoints.indexOf(maxExpectedPoints);
    }
}
class Node {
    constructor(lastP1, lastP2) {
        this.allMoves = ['R', 'P', 'S', 'W', 'D'];
        this.lastP1 = lastP1;
        this.lastP2 = lastP2;
        this.nextMoveProbabilities = [0.25, 0.25, 0.25, 0.05, 0.2];
    }
    nextMoveProbabilitiesUpdate(move) {
        for (let i = 0; i < 5; i++) {
            if (i === this.allMoves.indexOf(move)) {
                this.nextMoveProbabilities[i] = 1;
            }
            else {
                this.nextMoveProbabilities[i] = 0;
            }
        }
        //console.log(`Node: {${this.lastP1}, ${this.lastP2}} updated: next move Probabilities = [${this.nextMoveProbabilities}]`)
    }
}
module.exports = new MyBot();
//# sourceMappingURL=index.js.map