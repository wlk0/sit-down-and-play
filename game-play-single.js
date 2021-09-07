
const GamePlayRouteHandler = require("./game-play-standard");

class GamePlayRouteHandlerArda extends GamePlayRouteHandler
{
    constructor(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage)
    {
        super(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage)
    }

    validateDeck(jDeck)
    {
        return this.m_pServerInstance.cards.validateDeckSingleplayer(jDeck);
    }

    isSinglePlayer()
    {
        return true;
    }

    isArda()
    {
        return true;
    }
}

module.exports = GamePlayRouteHandlerArda;