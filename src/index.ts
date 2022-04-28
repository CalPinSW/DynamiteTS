import {Bot} from "./types/bot";
import {GameState} from "./types/gameState";
import {Move} from "./types/move";

class MyBot implements Bot {
    possibleMoves : Move[] = ['R' , 'P' , 'S' , 'W' , 'D']
    makeMove(gamestate: GameState): Move {
        return this.getRandomMove();
    }

    getRandomMove(){
        return this.possibleMoves[Math.floor(Math.random() * 5)];
    }

}

module.exports = new MyBot();