
exports.setupArdaSpecials = function(Game)
{
    let Arda = { };

    Arda.game = Game;

    Arda.assignOpeningChars7 = function()
    {
        const players = Arda.game._playboardManager.decks.getPlayers();
        if (players.length === 0)
            return;

        for (let userid of players)
        {
            const deck = Arda.game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                continue;
                
            const uuid1 = deck.drawOpeningCharacterMind7();
            const uuid2 = deck.drawOpeningCharacterMind7();

            if (uuid1 !== "")
                Arda.game.callbacks.card.onCardDrawSingle(userid);

            if (uuid2 !== "")
                Arda.game.callbacks.card.onCardDrawSingle(userid);
        }

        Arda.game._playboardManager.decks.getAdminDeck().mergeCharacterListsOnce();
    };

    Arda.assignOpeningChars = function(nCount)
    {
        const players = Arda.game._playboardManager.decks.getPlayers();
        for (let userid of players)
        {
            const deck = Arda.game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                continue;

            let nDraw = 0;
            for (let i = 0; i < nCount; i++)
            { 
                const uuid = deck.drawOpeningCharacterToHand()
                if (uuid !== "")
                    nDraw++;
            }

            for (let i = 0; i < nDraw; i++)
                Arda.game.callbacks.card.onCardDrawSingle(userid);
        }

        Arda.game._playboardManager.decks.getAdminDeck().addSpecialCharacers();
        Arda.game._playboardManager.decks.getAdminDeck().shuffleCharacterDeck();
    };

    Arda.callbacks = { 

        onRecycle : function(userid, socket, obj)
        {
            const deck = Arda.game._playboardManager.decks.getAdminDeck();
            let isMinor = false;

            if (obj.type === "minor")
            {
                deck.recycleMinorItems();
                Arda.game.apis.chat.send(userid, "recycled all minor items");
                isMinor = true;
            }
            else if (obj.type === "charackters")
            {
                deck.recycleCharacter();
                Arda.game.apis.chat.send(userid, "recycled all characters");
            }
            else
                return;

            for (let i = 0; i < 4; i++)
            {
                const uuid = isMinor ? deck.drawCardMinorItems() : deck.drawCardCharacter();
                if (uuid === "")
                    continue;
                    
                const card = Arda.game._playboardManager.decks.getFullPlayerCard(uuid);
                if (card !== null)
                {
                    const data = {uuid:uuid, code:card.code, hand:obj.type, clear : i == 0};
                    Arda.game.apis.meccgApi.publish("/game/arda/draw", userid, data);
                    Arda.game.apis.chat.send(userid, "drew common card " + card.code);
                }
            }
        },

        onAssignCharacters : function(userid)
        {
            Arda.assignOpeningChars7();
            Arda.assignOpeningChars(8);

            for (let i = 0; i < 5; i++)
                Arda.game._playboardManager.decks.getAdminDeck().drawCardCharacter();
                
            const listMinor = Arda.game._playboardManager.getCardList(Arda.game._playboardManager.decks.getAdminDeck().getHandCharacters());
            Arda.game.apis.meccgApi.publish("/game/arda/hand/characters", userid, {list: listMinor});
        },
      
        onDrawCard : function(userid, socket, obj)
        {
            const deck = Arda.game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                return;

            let uuid = "";
            const type = obj.type;
            if (type === "minor")
                uuid = deck.drawCardMinorItems();
            else if (type === "mps")
                uuid = deck.drawCardMarshallingPoints();
            else if (type === "charackters")
                uuid = deck.drawCardCharacter();
            else
                return;

            if (uuid === "")
            {
                let sDeck = "There are no cards left in the ";
                if (type === "mps")
                    sDeck += "marshalling points deck";
                else if (type === "minor")
                    sDeck += "minor items offering deck";
                else
                    sDeck += "roving characters deck";

                Arda.game.apis.meccgApi.publish("/game/notification", userid, { type: "warning", message: sDeck } );
                return;
            }
                

            const card = Arda.game._playboardManager.decks.getFullPlayerCard(uuid);
            if (card === null)
                return;

            Arda.game._playboardManager.UpdateOwnership(userid, card);

            const data = {uuid:uuid, code:card.code, hand:obj.type, clear : false};
            Arda.game.apis.meccgApi.publish("/game/arda/draw", userid, data);
            Arda.game.apis.chat.send(userid, "drew 1 " + obj.type + " item card");
        },

        onGetHandMinorItems : function(userid, socket, obj)
        {
            const listMinor = Arda.game._playboardManager.getCardList(Arda.game._playboardManager.decks.getCards().handMinorItems(userid));
            Arda.game.apis.meccgApi.publish("/game/arda/hand/minor", userid, {list: listMinor});

            const listMP = Arda.game._playboardManager.getCardList(Arda.game._playboardManager.decks.getCards().handMarshallingPoints(userid));
            Arda.game.apis.meccgApi.publish("/game/arda/hand/marshallingpoints", userid, {list: listMP});

            const listChars = Arda.game._playboardManager.getCardList(Arda.game._playboardManager.decks.getAdminDeck().getHandCharacters());
            Arda.game.apis.meccgApi.publish("/game/arda/hand/characters", userid, {list: listChars});
        },

        onMoveArdaHandCard: function(userid, socket, obj)
        {
            if (obj.to !== "hand" && obj.to !== "discardpile")
                return;

            const uuid = obj.uuid;
            const deck = Arda.game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
            {
                console.log("Cannot find deck of player " + userid);
                return;
            }

            let bOk = false;

            if (obj.type === "minor")
                bOk = deck.pop().fromHandMinor(uuid)
            else if (obj.type === "mps")
                bOk = deck.pop().fromHandMps(uuid)
            else if (obj.type === "charackters")
                bOk = deck.pop().fromHandCharacters(uuid)

            if (!bOk)
                return;

            const card = Arda.game._playboardManager.decks.getFullPlayerCard(uuid);
            if (card === null)
                return;

            /** this is essential, otherwise a card will not be removed from the respective hand */
            Arda.game._playboardManager.UpdateOwnership(userid, card);

            Arda.game.apis.meccgApi.publish("/game/arda/hand/card/remove", userid, { uuid: obj.uuid });
            if (obj.to === "hand")
            {
                deck.push().toPlaydeckSpecific(uuid);
                Arda.game.callbacks.card.onCardDrawSingle(userid, socket, {});
                Arda.game.apis.chat.send(userid, "moved 1 arda " + obj.type + " item card to their hand");
            }
            else if (obj.to === "discardpile")
            {
                deck.push().toDiscardpile(uuid);
                Arda.game.apis.chat.send(userid, "discarded 1 card from arda hand " + obj.type);
            }
        }
    };

    Game.apis.meccgApi.addListener("/game/arda/hands", Arda.callbacks.onGetHandMinorItems);
    Game.apis.meccgApi.addListener("/game/arda/from-hand", Arda.callbacks.onMoveArdaHandCard);
    Game.apis.meccgApi.addListener("/game/arda/draw", Arda.callbacks.onDrawCard);
    Game.apis.meccgApi.addListener("/game/arda/recycle", Arda.callbacks.onRecycle);
    Game.apis.meccgApi.addListener("/game/arda/assign-characters", Arda.callbacks.onAssignCharacters);
    
}
