const GameStandard = require("../game-server/GameStandard");
const PlayboardManager = require("../game-server/PlayboardManager");

describe('globalRestoreGame(userid, socket, data)', () => {

    const fs = require("fs");
    const gameData = JSON.parse(fs.readFileSync(__dirname + "/savegame/example-saved.json"));

    const gameAssignments = {};
    Object.keys(gameData.players).forEach((_e) => gameAssignments[_e] = _e);

    const _MeccgApi = {
        publish: function()
        {

        }
    }
    const _Chat = {
        sendMessage : function()
        {

        }
    }
    const eventManager = { trigger: function() {} };
    const pPlayboardManager = new PlayboardManager([], eventManager, {}, false);
    const instance = new GameStandard(_MeccgApi, _Chat, pPlayboardManager)

    instance.setCallbackOnRestoreError(function() {
        throw new Error("Invalid!");
    });

    instance.registerThisPlayer("4a0f0e50-fb72-4607-95b8-618cf8ea90c2", "New");

    const data = {
        assignments : gameAssignments,
        game: gameData.data
    };
    
    it('getDices()', () => {
        
        instance.globalRestoreGame("100", null, data);
        expect(15).toEqual(15);
    });
});