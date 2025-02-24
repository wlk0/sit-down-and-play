const CardNameCodeSuggestions = require("./CardNameCodeSuggestions");
const CardRepositoryUnderdeeps = require("./CardRepositoryUnderdeeps")
const Logger = require("../Logger");

const getRemovableKeysArray = function()
{
    try
    {
        let data = require("fs").readFileSync("./data-local/obsoleteCardKeys.json", 'utf8');
        if (data !== "")
            return JSON.parse(data);
    }
    catch (err)
    {
        Logger.error(err);
    }

    return [];
};

class CardRepository {

    constructor()
    {
        this._raw = [];
        this._CardRepository = {};
        this._types = { };
        this._agentList = [];
        this._nameCodeAlternatives = {};
        this._cardsDeckbuilder = [];
        this._listAvatars = [];
    }

    getCards()
    {
        return this._raw;
    }

    getCardsDeckbuilder()
    {
        return this._cardsDeckbuilder;
    }

    createCardsDeckbuilder()
    {
        const assertString = function(val)
        {
            if (typeof val !== "string")
                return "";
            else
                return val.trim();
        }

        this._cardsDeckbuilder = [];

        let listStrings = ["set_code", "full_set", "Secondary", "alignment", "type",  "code", "uniqueness"]
        let listOther = ["uniqueness", "skills", "keywords"];

        for (let card of this._raw) 
        {
            let candidate = { };

            const title = card.normalizedtitle + (card.title !== card.normalizedtitle ? " " + card.title : "");
            const text = assertString(card.text);

            candidate.title = title.toLowerCase();
            candidate.text = text.toLowerCase();

            for (let key of listStrings)
                candidate[key] = assertString(card[key]);
            for (let key of listOther)
                candidate[key] = card[key];

            this._cardsDeckbuilder.push(candidate);
        }

    }

    getCardRepository()
    {
        return this._raw;
    }

    sort() 
    {
        this._raw.sort( (card1, card2) => card1.title.replace(/"/g, '').localeCompare(card2.title.replace(/"/g, ''), "de-DE"));
    }

    stripQuotes()
    {
        for (let card of this._raw) 
        {
            card.code = this.removeQuotes(card.code);
            card.title = this.removeQuotes(card.title);
        }
    }

    codesLowercase()
    {
        for (let card of this._raw) 
        {
            card.code = card.code.toLowerCase();
            card.title = card.title.toLowerCase();

            if (card.Region !== undefined)
                card.Region = card.Region.toLowerCase();
        }
    }

    removeQuotes(sCode) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    }

    addIndices() 
    {
        let index = 0;
        for (let card of this._raw) 
            card.index = ++index;
    }

    temp(jMap)
    {
        let _temp = { };

        for (let key in jMap)
        {
            if (jMap[key].area.length !== 0)
                _temp[key] = jMap[key].area;

            for (let sitekey in jMap[key].sites)
            {
                if (jMap[key].sites[sitekey].area.length !== 0)
                    _temp[sitekey] = jMap[key].sites[sitekey].area;
            }

        }

        require("fs").writeFileSync("./data/map-positions.json", JSON.stringify(_temp, null, '\t'), 'utf-8');
    }

    prepareArda()
    {
        this._CardRepository = {};
        for (let card of this._raw)
            this._CardRepository[card.code] = card;
    }

    buildFlipCardsMap()
    {
        const questsB = { };
        const quests = { };

        for (let card of this._raw)
        {
            if (card["flip-title"] !== undefined && card["flip-title"] !== card.normalizedtitle)
                questsB[card["flip-title"]] = card.code;
        }

        for (let card of this._raw)
        {
            if (questsB[card.normalizedtitle] !== undefined)
            {
                const cardCodeA = card.code;
                const cardCodeB = questsB[card.normalizedtitle];
                quests[cardCodeA] = cardCodeB;
                quests[cardCodeB] = cardCodeA;
            }
            else if (card.Race === "Quest" && card.normalizedtitle === card["flip-title"])
            {
                quests[card.code] = card.code;
            }
        }

        return quests;
    }

    identifyAvatars()
    {
        let nCount = 0;
        for (let card of this._raw)
        {
            if (card["Secondary"] === "Avatar")
            {
                this._listAvatars.push(card.code);
                nCount++;
            }
        }
        
        Logger.info("\t- Avatars: " + nCount);
    }

    identifyQuests()
    {
        let nCount = 0;
        for (let card of this._raw)
        {
            card.isQuest = card.Race && card.Race.toLowerCase().startsWith("quest") ? true : false;
            if (card.isQuest)
                nCount++;
        }
        
        Logger.info("\t- Quests: " + nCount);
    }

    identifyInLieuItems()
    {
        let text = "";
        for (let card of this._raw) 
        {
            if (card.code === "Towers Destroyed (FB)")
                card.isStartable = false;
            else if (card.code === "Heirlooms of Eärendil (ML)")
                card.isStartable = true;
            else
            {
                text = card.text.toLowerCase();
                card.isStartable = text.indexOf("in lieu of") !== -1 && text.indexOf(" minor ") !== -1 ;
            }
        }            
    }

    removeUnusedFields()
    {
        const vsUnused = getRemovableKeysArray();

        let rem = 0;
        for (let card of this._raw) 
        {
            vsUnused.forEach(key => 
            {
                if (key !== "" && card[key] !== undefined)
                {
                    delete card[key];
                    rem++;
                }
            });
        }

        if (rem > 0)
            Logger.info("\t- properties removed from cards: " + rem);
    }

    removeFlavourText()
    {
        let rem = 0;

        for (let card of this._raw) 
        {
            if (card.text === undefined || card.text === "" || card.text === null)
                continue;

            let sText = card.text.trim();

            let nLast = sText.lastIndexOf("\"-");
            if (nLast  === -1)
                continue;

            let _can = sText.substring(nLast+2).trim();
            if (!_can.startsWith("Hob") && !_can.startsWith("LotR") && !_can.startsWith("Eliz") && !_can.startsWith("Kuduk Lore"))
                continue;

            let nStart = sText.lastIndexOf("\"", nLast-1);
            if (nStart !== -1)
            {             
                rem++;
                sText = sText.substring(0, nStart).trim();
            }

            card.text = sText;
        }

        if (rem > 0)
            Logger.info("\t- flavour texts removed from cards: " + rem);
    }

    removeUnwantedCardRepository(_raw)
    {
        let countUl = 0;
        let countAL = 0;
        let _arr = [];
        for (let elem of _raw)
        {
            if (elem.set_code === "MEUL") 
                countUl++;
            else if (elem.code.indexOf(" AL (") !== -1)
                countAL++;
            else 
                _arr.push(elem);
        }

        if (countUl > 0)
            Logger.info("\t- cards removed (unlimited): " + countUl);
        if (countAL > 0)
            Logger.info("\t- cards removed (AL): " + countAL);

        return _arr;
    }

    integrityCheck(_raw)
    {
        let invalids = { };

        const addInvalid = function(card, field)
        {
            if (card[field] !== "" || card[field] === undefined)
                return;

            if (invalids[card.code] === undefined)
                invalids[card.code] = [field];
            else
                invalids[card.code].push(field);
        }

        for (let card of this._raw) 
        {
            if (card.code === "")
                continue;

            addInvalid(card, "ImageName");
            addInvalid(card, "title");
            addInvalid(card, "normalizedtitle");
        }

        Logger.info("\t- invalid card(s) found: " + Object.keys(invalids).length);
    }

    updateMps()
    {
        for (let card of this._raw) 
        {
            if (card.MPs === undefined && card.mp !== undefined)
            {
                card.MPs = card.mp;
                delete card.mp;
            }

            if (card.MPs === undefined || typeof card.MPs === "number")
                continue;
            else if (card.MPs === "" || card.normalizedtitle === "grim voiced and grim faced")
                delete card.MPs;
            else
            {
                if (card.MPs.indexOf("(") >= 0)
                    card.MPs = card.MPs.replace("(", "").replace(")", "");
            
                card.MPs = this.toInt(card.MPs);
            }
        }
    }

    updateMind()
    {
        for (let card of this._raw) 
        {
            if (card.Mind === undefined && card.mind !== undefined)
            {
                card.Mind = card.mind;
                delete card.mind;
            }

            if (card.Mind === undefined || typeof card.Mind === "number")
                continue;
            else if (card.Mind === "")
                delete card.Mind;
            else
            {
                if (card.Mind.indexOf("(") >= 0)
                    card.Mind = card.Mind.replace("(", "").replace(")", "");
            
                card.Mind = this.toInt(card.Mind);
            }
        }
    }    

    toInt(sVal)
    {
        try
        {
            return parseInt(sVal);
        }
        catch (errIgnore)
        {

        }

        return 0;
    }

    createCardNameCodeSuggestionsList()
    {
        const res = new CardNameCodeSuggestions().create(this._raw);
        if (res)
            this._nameCodeAlternatives = res;

        return Object.keys(this._nameCodeAlternatives).length;
    }

    identifyUnderdeeps()
    {
        new CardRepositoryUnderdeeps().create(this._raw);
    }

    setup(_raw)
    {
        Logger.info("Setting up card data.");

        this._raw = this.removeUnwantedCardRepository(_raw);
        this.stripQuotes();
        this.codesLowercase();
        this.identifyQuests();
        this.identifyAvatars();
        this.identifyUnderdeeps();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.updateMps();
        this.updateMind();

        this.createTypes();
        this.createCardsDeckbuilder();
        this.prepareArda();
        this.createAgentList();
        this.createCardNameCodeSuggestionsList();

        Logger.info("\t- " + this._raw.length + " cards available in total.");
        return this._raw;
    }    

    createTypes()
    {
        for (let card of this._raw) 
            this._types[card.code] = card["type"];
    }
    
    getCardType(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this._types[code] === undefined ? "" : this._types[code];
    }

    getCardByCode(code)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this._CardRepository[code] === undefined ? null : this._CardRepository[code];
    }

    getCardMind(code)
    {
        const card = this.getCardByCode(code);
        return card !== null && card.Mind !== undefined ? card.Mind : -1;
    }

    getCardTypeSpecific(code)
    {
        const card = this.getCardByCode(code);
        return card !== null && card.Secondary !== undefined ? card.Secondary : "";
    }

    getMarshallingPoints(code)
    {
        let data = {
            type: "",
            points: 0
        }

        const card = this.getCardByCode(code);
        if (card === null || card.Secondary === undefined || card.Secondary === "")
            return data;

        const secondary = card.Secondary.toLowerCase();
        const cardTyoe = card.type.toLowerCase();

        data.points = card.MPs === undefined ? 0 : card.MPs;

        if (cardTyoe === "hazard")
            data.type = "kill";
        else if (secondary === "character")
        {
            data.type = "character";
            data.points = 0;
        }
        else if (secondary === "ally")
            data.type = "ally";
        else if (secondary === "faction")
            data.type = "faction";
        else if (cardTyoe === "resource")
        {
            if (secondary.endsWith("item"))
                data.type = "item";
            else 
                data.type = "misc";
        }

        return data;
    }

    isCardAvailable(code)
    {
        return code !== undefined && code !== "" && this._types[code.toLowerCase()] !== undefined;
    }

    isCardAvailableGuessed(code)
    {
        if (code === undefined || code === "")
            return false;

        let sCode = code.toLowerCase();
        if (this._types[sCode.replace(" (", " [h] (")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" (", " [m] (")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" [h] (", "( ")] !== undefined)
            return true;
        else if (this._types[sCode.replace(" [m] (", "( ")] !== undefined)
            return true;
        else
            return false;
    }

    getVerifiedCardCode(code)
    {
        if (code === undefined || code === "" || code === null)
            return "";

        let sCode = code.toLowerCase();
        if (this._types[sCode] !== undefined)
            return sCode;
        else if (this._types[sCode.replace(" (", " [h] (")] !== undefined)
            return sCode.replace(" (", " [h] (");
        else if (this._types[sCode.replace(" (", " [m] (")] !== undefined)
            return sCode.replace(" (", " [m] (");
        else if (this._types[sCode.replace(" [h] (", "( ")] !== undefined)
            return sCode.replace(" [h] (", "( ");
        else if (this._types[sCode.replace(" [m] (", "( ")] !== undefined)
            return sCode.replace(" [m] (", "( ");
        else
            return "";
    }

    postProcessCardList()
    {
        this.identifyInLieuItems();
        this.removeUnusedFields();
        this.removeFlavourText();
        Logger.info("\t-- all data card loaded --");
    }

    isAgent(card)
    {
        if (card["type"] !== "Character")
            return false;  
        else
            return card["Secondary"] === "Agent" || card["agent"] === "yes";
    }

    isAvatar(code)
    {
        return code !== "" && this._listAvatars.includes(code);
    }

    createAgentList()
    {
        for (let card of this._raw) 
        {
            if (this.isAgent(card))
                this._agentList.push(card.code);
        }

        Logger.info("\t- " + this._agentList.length + " agents identified.");
    }

    getAgents()
    {
        return this._agentList;
    }

    onProcessCardData()
    {
        /** overwrite */
    }

    onCardsReceived(body)
    {
        
        try 
        {
            this.setup(JSON.parse(body));
            this.onProcessCardData();
        } 
        catch (error) 
        {
            Logger.error(error);
        }
    }

    getNameCodeSuggestionMap()
    {
        return this._nameCodeAlternatives;
    }
}

module.exports = CardRepository;
