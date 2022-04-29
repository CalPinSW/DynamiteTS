import {Bot} from "./types/bot";
import {GameState} from "./types/gameState";
import {Move} from "./types/move";

class MyBot implements Bot {
    myDynamite = 100;
    round = 0;

    possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
    drawCount = 0;
    mcmcComplex = new MCMCComplex();
    mcmcBasic = new MCMCBasic();

    makeMove(gamestate: GameState): Move {

        let myMove: Move;
        if (this.round > 1) {

            this.updateDrawCount(gamestate.rounds[gamestate.rounds.length - 1])

            if (this.round > 2) {
                this.mcmcComplex.updatePotentialScore(gamestate.rounds[gamestate.rounds.length - 1]);
                this.mcmcBasic.updatePotentialScore(gamestate.rounds[gamestate.rounds.length - 1]);
            }
            this.mcmcBasic.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);
            this.mcmcComplex.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);

            this.mcmcBasic.addSuggestedMove(gamestate);
            this.mcmcComplex.addSuggestedMove(gamestate);

            if (this.mcmcBasic.potentialScore > this.mcmcComplex.potentialScore) {
                myMove = this.mcmcBasic.suggestedMoveList[this.mcmcBasic.suggestedMoveList.length - 1];
                //console.log(`myMove from Basic = ${myMove} with potential score: ${this.mcmcBasic.potentialScore}`)
            } else {
                myMove = this.mcmcComplex.suggestedMoveList[this.mcmcComplex.suggestedMoveList.length - 1];
                //console.log(`myMove from Complex = ${myMove} with potential score: ${this.mcmcComplex.potentialScore}`)
            }
            //console.log(`basic score = ${this.mcmcBasic.potentialScore}. complex score = ${this.mcmcComplex.potentialScore}`)
        } else {
            myMove = this.getRandomRPSMove();
        }

        if ((Math.random() * 5 ) < this.drawCount&& this.myDynamite > 0) {
            myMove = "D"
        }

        this.round++


        if (myMove === "D") this.myDynamite --;
        return myMove;

    }

    getRandomMove() {
        return this.possibleMoves[Math.floor(Math.random() * this.possibleMoves.length)];
    }

    getRandomRPSMove() {
        return this.possibleMoves[Math.floor(Math.random() * 3)];
    }

    updateDrawCount(lastRound : Round){
        let possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
        let pointArray: number[][] = [[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]];
        if (pointArray[possibleMoves.indexOf(lastRound.p1)][possibleMoves.indexOf(lastRound.p2)] === 1){
            this.drawCount += 1;
        }
        else {this.drawCount = 0;
        }
    }
}

class model {
    potentialScore: number;
    suggestedMoveList: Move[];
    allMoves: Move[];
    myDynamite: number;

    constructor() {
        this.potentialScore = 0;
        this.suggestedMoveList = [];
        this.allMoves = ['R', 'P', 'S', 'W', 'D'];
        this.myDynamite = 100;
    }

    pointsFromLastAndDynamiteUpdate(lastRound: Round) {
        let suggestedMove: Move = this.suggestedMoveList[this.suggestedMoveList.length - 1]
        if (lastRound.p1 === "D") this.myDynamite--;
        let possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
        let pointArray: number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [1, 1, 1, 0, 0.5]];
        this.potentialScore += pointArray[possibleMoves.indexOf(suggestedMove)][possibleMoves.indexOf(lastRound.p2)];
    }

    updatePotentialScore(round: Round) {
        this.pointsFromLastAndDynamiteUpdate(round)
    }
}

class MCMCComplex extends model {
    listNodes: Node[];
    theirDynamite = 100;
    pointArray: number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];

    constructor() {
        super()
        this.listNodes = [];
        for (let moveP1 of this.allMoves) {
            for (let moveP2 of this.allMoves) {
                this.listNodes.push(new Node(moveP1, moveP2));
            }
        }
    }

    updateProbabilities(lastRound: Round, thisRound: Round) {
        if (!!thisRound) {
            this.updatePointArray(thisRound);
        }
        if (!!lastRound) {
            let updateNode = this.listNodes[this.listNodes.findIndex(node => {
                return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
            })];
            updateNode.nextMoveProbabilitiesUpdateWithOccurences(thisRound.p2);
        }
    }


    addSuggestedMove(gamestate: GameState) {
        let lastRound: Round = gamestate.rounds[gamestate.rounds.length - 1];
        let expectedPoints: number[] = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2)
        })];

        for (let i: number = 0; i < 5; i++) {
            for (let j: number = 0; j < 5; j++) {
                expectedPoints[i] += this.pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        //console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`)
        const maxExpectedPoints = Math.max(...expectedPoints);
        this.suggestedMoveList.push(this.allMoves[expectedPoints.indexOf(maxExpectedPoints)]);
    }

    updatePointArray(thisRound: Round) {
        if (thisRound.p1 === 'D') {
            this.pointArray[4][0] = this.pointArray[4][0] - 0.0025;
            this.pointArray[4][1] = this.pointArray[4][1] - 0.0025;
            this.pointArray[4][2] = this.pointArray[4][2] - 0.0025;
            this.pointArray[4][4] = this.pointArray[4][4] - 0.0025;
            if (this.myDynamite === 0) {
                this.pointArray[4] = [0, 0, 0, 0, 0];
            }
        }
        if (thisRound.p2 === 'D') {
            this.theirDynamite--;
            this.pointArray[3][4] = this.pointArray[3][4] - 0.01;
            this.pointArray[4][4] = this.pointArray[4][4] + 0.0025;
            if (this.myDynamite === 0) {
                this.pointArray[4] = [0, 0, 0, 0, 0];
            }
        }
    }
}

class MCMCBasic extends model {
    listNodes: Node[];
    pointArray: number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];

    constructor() {
        super();
        this.listNodes = [];
        for (let moveP1 of this.allMoves) {
            for (let moveP2 of this.allMoves) {
                this.listNodes.push(new Node(moveP1, moveP2));
            }
        }
    }

    updateProbabilities(lastRound: Round, thisRound: Round) {
        let updateNode = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
        })];
        updateNode.nextMoveProbabilitiesUpdateLastOccurrence(thisRound.p2);
    }

    addSuggestedMove(gamestate: GameState) {
        let lastRound: Round = gamestate.rounds[gamestate.rounds.length - 1];
        let expectedPoints: number[] = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2)
        })];

        for (let i: number = 0; i < 5; i++) {
            for (let j: number = 0; j < 5; j++) {
                expectedPoints[i] += this.pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        //console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`)
        const maxExpectedPoints = Math.max(...expectedPoints);
        this.suggestedMoveList.push(this.allMoves[expectedPoints.indexOf(maxExpectedPoints)]);
    }

}

class Node {
    lastP1: Move;
    lastP2: Move;
    nextMoveProbabilities: number[];
    nextMoveOccurrences: number[];
    encounterCount: number = 0;
    allMoves: Move[] = ['R', 'P', 'S', 'W', 'D']

    constructor(lastP1: Move, lastP2: Move) {
        this.lastP1 = lastP1;
        this.lastP2 = lastP2;
        this.nextMoveProbabilities = [0.25, 0.25, 0.25, 0.05, 0.2];
        this.nextMoveOccurrences = [0, 0, 0, 0, 0];
    }

    nextMoveProbabilitiesUpdateWithOccurences(move: Move) {
        this.encounterCount++;
        for (let i = 0; i < 5; i++) {
            if (i === this.allMoves.indexOf(move)) {
                this.nextMoveOccurrences[i] += 1;
            } else {
                this.nextMoveProbabilities[i] = 0;
            }
            this.nextMoveProbabilities[i] = this.nextMoveOccurrences[i] / this.encounterCount;
        }

        //console.log(`Node: {${this.lastP1}, ${this.lastP2}} updated: next move Probabilities = [${this.nextMoveProbabilities}]`)
    }

    nextMoveProbabilitiesUpdateLastOccurrence(move: Move) {
        for (let i = 0; i < 5; i++) {
            if (i === this.allMoves.indexOf(move)) {
                this.nextMoveProbabilities[i] = 1;
            } else {
                this.nextMoveProbabilities[i] = 0;
            }
        }
        //console.log(`Node: {${this.lastP1}, ${this.lastP2}} updated: next move Probabilities = [${this.nextMoveProbabilities}]`)
    }
}

interface Round {
    p1: Move;
    p2: Move;
}

module.exports = new MyBot();