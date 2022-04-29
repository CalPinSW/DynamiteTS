import {Bot} from "./types/bot";
import {GameState} from "./types/gameState";
import {Move} from "./types/move";
import exp from "constants";



class MyBot implements Bot {
    myDynamite = 100;
    theirDynamite = 100;
    round = 0;
    possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
    mcmcComplex = new MCMCProbsUpdatingPoint();
    mcmcBasic = new MCMCBasic();
    currentBot = 1;
    winPercentLast10 : number = 0;

    makeMove(gamestate: GameState): Move {

        let myMove : Move;
        if (this.round > 1){

            this.winPercentLast10 += this.pointsFromLast(gamestate.rounds[gamestate.rounds.length-1])/10;

            this.mcmcBasic.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);
            this.mcmcComplex.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);

            if(this.currentBot === 1){
                myMove = this.possibleMoves[this.mcmcBasic.getMoveIndex(gamestate.rounds[gamestate.rounds.length - 1])];
            }
            else {
                myMove = this.possibleMoves[this.mcmcComplex.getMoveIndex(gamestate.rounds[gamestate.rounds.length - 1])];
            }
            console.log(`myMove = ${myMove}`)
        }
        else {myMove = this.getRandomRPSMove();}

        this.round ++
        if (this.round % 10 === 0) {
            if (this.winPercentLast10 < 0.5){
                this.currentBot = this.currentBot === 1 ? 2 : 1;
            }
            this.winPercentLast10 = 0;
        }
/*        console.log(`Round = ${this.round}; myMove = ${myMove}; Dynamite remaining = ${this.myDynamite}; possible moves = ${this.possibleMoves}`);
        if (myMove === 'D') this.myDynamite--;
        if (this.myDynamite === 0) {
            this.possibleMoves.pop();
            this.myDynamite = -1;
        }*/

        return myMove;

    }

    pointsFromLast(lastRound : Round){
        let possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
        let pointArray : number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [1, 1, 1, 0, 0.5]];
        return pointArray[possibleMoves.indexOf(lastRound.p1)][possibleMoves.indexOf(lastRound.p2)];
    }

    getRandomMove() {
        return this.possibleMoves[Math.floor(Math.random() * this.possibleMoves.length)];
    }
    getRandomRPSMove() {
        return this.possibleMoves[Math.floor(Math.random() * 3)];
    }

}

class model {
    potentialWinCount : number;
    suggestedMoveList : Move[];
    constructor() {
        this.potentialWinCount = 0;
        this.suggestedMoveList = [];
    }

}

class MCMCProbsUpdatingPoint extends model {
    listNodes : Node[];
    allMoves : Move[] = ['R', 'P', 'S', 'W', 'D']
    myDynamite = 100;
    theirDynamite = 100;
    pointArray : number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];
    constructor() {
        super()
        this.listNodes = [];
        for (let moveP1 of this.allMoves){
            for (let moveP2 of this.allMoves){
                this.listNodes.push(new Node(moveP1, moveP2));
            }
        }
    }

    updateProbabilities(lastRound : Round, thisRound : Round){

        this.updatePointArray(thisRound);

        let updateNode = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
        })];
        updateNode.nextMoveProbabilitiesUpdateWithOccurences(thisRound.p2);
    }

    updatePointArray (thisRound: Round){
        if (thisRound.p1 === 'D'){
            this.myDynamite--;
            this.pointArray[4][0] = this.pointArray[4][0] - 0.0025;
            this.pointArray[4][1] = this.pointArray[4][1] - 0.0025;
            this.pointArray[4][2] = this.pointArray[4][2] - 0.0025;
            this.pointArray[4][4] = this.pointArray[4][4] - 0.0025;
            if (this.myDynamite === 0 ){
                this.pointArray[4] = [0, 0 , 0, 0, 0];
            }
        }
        if (thisRound.p2 === 'D'){
            this.theirDynamite--;
            this.pointArray[3][4] = this.pointArray[3][4] - 0.01;
            this.pointArray[4][4] = this.pointArray[4][4] + 0.0025;
            if (this.myDynamite === 0 ){
                this.pointArray[4] = [0, 0 , 0, 0, 0];
            }
        }
    }

    getMoveIndex (lastRound : Round) : number {

        let expectedPoints : number[] = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2)
        })];

        for (let i :number = 0; i < 5; i++){
            for (let j:number  = 0; j < 5; j++) {
                expectedPoints[i] += this.pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        //console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`)
        const maxExpectedPoints = Math.max(...expectedPoints);
        return  expectedPoints.indexOf(maxExpectedPoints);
    }
}

class MCMCBasic extends model{
    listNodes : Node[];
    allMoves : Move[] = ['R', 'P', 'S', 'W', 'D']
    myDynamite = 100;
    theirDynamite = 100;
    pointArray : number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];
    constructor() {
        super ();
        this.listNodes = [];
        for (let moveP1 of this.allMoves){
            for (let moveP2 of this.allMoves){
                this.listNodes.push(new Node(moveP1, moveP2));
            }
        }
    }

    updateProbabilities(lastRound : Round, thisRound : Round){
        let updateNode = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2);
        })];

        updateNode.nextMoveProbabilitiesUpdateLastOccurrence(thisRound.p2);

    }


    getMoveIndex (lastRound : Round) : number {

        let expectedPoints : number[] = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2)
        })];

        for (let i :number = 0; i < 5; i++){
            for (let j:number  = 0; j < 5; j++) {
                expectedPoints[i] += this.pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        //console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`)
        const maxExpectedPoints = Math.max(...expectedPoints);
        return  expectedPoints.indexOf(maxExpectedPoints);
    }
}

class Node {
    lastP1 : Move;
    lastP2 : Move;
    nextMoveProbabilities : number[];
    nextMoveOccurrences : number[] ;
    encounterCount : number = 0;
    allMoves : Move[] = ['R', 'P', 'S', 'W', 'D']
    constructor(lastP1 : Move, lastP2: Move) {
        this.lastP1 = lastP1;
        this.lastP2 = lastP2;
        this.nextMoveProbabilities = [0.25, 0.25, 0.25, 0.05, 0.2];
        this.nextMoveOccurrences= [0,0,0,0,0];
    }
    nextMoveProbabilitiesUpdateWithOccurences (move : Move){
        this.encounterCount++;
        for (let i = 0; i < 5; i++ ){
            if (i === this.allMoves.indexOf(move)){
                this.nextMoveOccurrences[i] += 1;
            }
            else {
                this.nextMoveProbabilities[i] = 0;
            }
            this.nextMoveProbabilities[i] = this.nextMoveOccurrences[i]/this.encounterCount;
        }

        //console.log(`Node: {${this.lastP1}, ${this.lastP2}} updated: next move Probabilities = [${this.nextMoveProbabilities}]`)
    }
    nextMoveProbabilitiesUpdateLastOccurrence (move : Move){
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

interface Round {
    p1: Move;
    p2: Move;
}

module.exports = new MyBot();