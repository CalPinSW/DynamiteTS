import {Bot} from "./types/bot";
import {GameState} from "./types/gameState";
import {Move} from "./types/move";
import exp from "constants";



class MyBot implements Bot {
    myDynamite = 100;
    round = 0;
    possibleMoves: Move[] = ['R', 'P', 'S', 'W', 'D']
    mcmc = new MCMCProbs();

    makeMove(gamestate: GameState): Move {
        let myMove :Move;
        if (this.round > 1){
            this.mcmc.updateProbabilities(gamestate.rounds[gamestate.rounds.length - 2], gamestate.rounds[gamestate.rounds.length - 1]);
            myMove = this.possibleMoves[this.mcmc.getMoveIndex(gamestate.rounds[gamestate.rounds.length - 1])];
        }
        else {myMove = this.getRandomRPSMove();}

        this.round ++

        console.log(`Round = ${this.round}; myMove = ${myMove}; Dynamite remaining = ${this.myDynamite}; possible moves = ${this.possibleMoves}`);
        if (myMove === 'D') this.myDynamite--;
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
    listNodes : Node[];
    allMoves : Move[] = ['R', 'P', 'S', 'W', 'D']
    constructor() {
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
        updateNode.nextMoveProbabilitiesUpdate(thisRound.p2);
    }

    getMoveIndex (lastRound : Round) : number {
        const pointArray : number[][] = [[0.5, 0, 1, 1, 1], [1, 0.5, 0, 1, 0], [0, 1, 0.5, 1, 0], [0, 0, 0, 0.5, 1], [0.75, 0.75, 0.75, 0, 0.5]];
        let expectedPoints : number[] = [0, 0, 0, 0, 0];
        let node = this.listNodes[this.listNodes.findIndex(node => {
            return (node.lastP1 === lastRound.p1 && node.lastP2 === lastRound.p2)
        })];

        for (let i :number = 0; i < 5; i++){
            for (let j:number  = 0; j < 5; j++) {
                expectedPoints[i] += pointArray[i][j] * node.nextMoveProbabilities[j];
            }
        }
        console.log(`node { Last p1 = ${node.lastP1} , last p2 = ${node.lastP2} , next Move Probabilities = ${node.nextMoveProbabilities} ; expected Points = ${expectedPoints}`)
        const maxExpectedPoints = Math.max(...expectedPoints);
        return  expectedPoints.indexOf(maxExpectedPoints);
    }


}

class Node {
    lastP1 : Move;
    lastP2 : Move;
    nextMoveProbabilities : number[];
    allMoves : Move[] = ['R', 'P', 'S', 'W', 'D']
    constructor(lastP1 : Move, lastP2: Move) {
        this.lastP1 = lastP1;
        this.lastP2 = lastP2;
        this.nextMoveProbabilities = [0.25, 0.25, 0.25, 0.05, 0.2];
    }
    nextMoveProbabilitiesUpdate (move : Move){

        for (let i = 0; i < 5; i++ ){
            if (i === this.allMoves.indexOf(move)){
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