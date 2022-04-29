/*
class RockBot {
    makeMove(gamestate) {
        return 'R';
    }
}
*/
class RockBot {
    round = 0;
    RPS = ['R', 'P', 'S'];
    makeMove(gamestate) {

        this.round++;

        return this.RPS[this.round % 3];
    }
}
module.exports = new RockBot();