
class CreateHandCardsDraggableUtils {

    static CardPreview = null;
    static _locationMessageId = 0

    static clearTargets(sDraggableCardType)
    {
        document.body.classList.remove("on-drag-event-generic");
        
        if (sDraggableCardType !== null)
            document.body.classList.remove("on-drag-event-" + sDraggableCardType);

        CreateHandCardsDraggableUtils.CardPreview.hideAll();
    }

    static initTargets(sDraggableCardType)
    {
        if (sDraggableCardType !== null)
            document.body.classList.add("on-drag-event-" + sDraggableCardType);

        document.body.classList.add("on-drag-event-generic");
        CreateHandCardsDraggableUtils.CardPreview.hideAll();
    }
    
    static removeDraggableInContainer(jElem)
    {
        jElem.find(".ui-draggable").each(function()
        {
            CreateHandCardsDraggableUtils.removeElementDraggable(jQuery(this));
        });
        
        jElem.find(".ui-droppable").each(function()
        {
            CreateHandCardsDraggableUtils.removeElementDroppable(jQuery(this));
        });
        
        DomUtils.removeNode(jElem.get(0));
    }
    
    static removeElementDroppable(jElem)
    {
        try
        {
            if (jElem.hasClass("ui-droppable"))
                jElem.removeClass('ui-droppable').droppable('destroy');
        }
        catch(e)
        {
            MeccgUtils.logError(e);
        }
    }

    static removeElementDraggable(jElem)
    {
        try
        {
            if (jElem.hasClass("ui-droppable"))
                jElem.removeClass('ui-droppable').droppable('destroy');
        }
        catch(e)
        {
            MeccgUtils.logError(e);
        }

    }

    /**
     * 
     * @param {jQuery} jElem
     * @return {undefined}
     */
    static removeDraggable(jElem)
    {   
        CreateHandCardsDraggableUtils.removeElementDraggable(jElem);
        CreateHandCardsDraggableUtils.removeElementDroppable(jElem);
        DomUtils.removeNode(jElem.get(0));
    }

    static requireMessageId()
    {
        return (++CreateHandCardsDraggableUtils._locationMessageId);
    }
}

class HandCardsDraggableBoard {

    static getCompanyAreaPlayerAddNew()
    {
        return document.getElementById("create_new_company");
    }

}

class TaskBarIconsObjects {

    static get(sId)
    {
        return document.getElementById(sId); 
    }

    static discardpile() 
    { 
        return TaskBarIconsObjects.get("icon_bar_discardpile"); 
    }
    
    static sideboard() 
    { 
        return TaskBarIconsObjects.get("icon_bar_sideboard"); 
    }
    
    static playdeck() 
    { 
        return TaskBarIconsObjects.get("icon_bar_playdeck"); 
    }
    
    static hand() 
    { 
        return TaskBarIconsObjects.get("icon_hand"); 
    }
    
    static victory() 
    { 
        return TaskBarIconsObjects.get("icon_bar_victory"); 
    }
}

class PlayerStagingAreaObjects {

    static droparea() 
    { 
        return document.getElementById("staging_area_drop"); 
    }

}

function createHandCardsDraggable(_CardPreview, _MeccgApi, _Scoring)
{
    CreateHandCardsDraggableUtils.CardPreview = _CardPreview;

    const MeccgApi = _MeccgApi;
    const Scoring = _Scoring;
    
    document.body.setAttribute("data-class", document.body.getAttribute("class"));
  
    const DropFunctions = {

        removeDraggable(ui, uuid, src)
        {
            if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            else
                CreateHandCardsDraggableUtils.removeDraggableInContainer(ui.draggable.closest(".company-character"));
        },

        /**
         * Drop card on discard pile
         */
        dropOnDiscard : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");
            
            DropFunctions.removeDraggable(ui);
            
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "discardpile", source: src, drawTop : false});

            /** 
             * usually, this would also have to be checked for every card that gets removed,
             * however, the basic idea is really that you can see what has been discarded from the hand, so 
             * this should suffice for now
             */
            if (Preferences.discardOpenly())
                MeccgApi.send("/game/discardopenly", {uuid: uuid });

            return false;
        },
        
        dropOnVicotry : function( event, ui ) 
        {
            /** it is OK to use jQuery object ui->raggable here */
            const uuid = ui.draggable.attr("data-uuid");
            const code = ui.draggable.attr("data-card-code");
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            
            MeccgApi.send("/game/card/store", { uuid: uuid });
            Scoring.scoreCard(code);
            return false;
        },
        
        dropOnSideboard : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");

            DropFunctions.removeDraggable(ui);
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "sideboard", source: src, drawTop : false});
            return false;
        },
        
        dropOnPlaydeck : function( event, ui ) 
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");
            
            if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            else
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
            
            MeccgApi.send("/game/card/move", {uuid: uuid, target: "playdeck", source: src, drawTop : false});
            return false;
        },
        
        dropOnHand : function( event, ui ) 
        {
            if (ui.draggable.attr("data-location") !== "hand")
            {
                const uuid = ui.draggable.attr("data-uuid");
                const src = ui.draggable.attr("data-location");

                if (ui.draggable.attr("data-card-type") !== "character")
                    CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                else
                    CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
                
                MeccgApi.send("/game/card/move", {uuid: uuid, target: "hand", source: src, drawTop : true});
            }
            
            return false;
        },
        
        dropOnStageArea : function( event, ui ) 
        {
            if (ui.draggable.attr("data-location") === "hand")
            {
                const uuid = ui.draggable.attr("data-uuid");
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddGenericCardToStagingArea(uuid, true);
            }
            
            return false;
        },
        
        dropOnAddNew : function( event, ui ) 
        {
            if (ui.draggable.attr("data-card-type") !== "character")
                return false;
            
            const uuid = ui.draggable.attr("data-uuid");
            const source = ui.draggable.attr("data-location");
            
            if (source === "hand")
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);

            HandCardsDraggable.onCreateNewCompany(uuid, source);
            return false;
        },
        
        dropOnAddCompanyCharacter :  function( event, ui, companyUuid ) 
        {
            const pCard = ui.draggable[0];
            if (pCard.getAttribute("data-card-type") !== "character")
                return false;

            const source = pCard.getAttribute("data-location");
            const uuid = pCard.getAttribute("data-uuid");
            if (source === "hand")
                DomUtils.removeNode(pCard);

            HandCardsDraggable.onJoinCompany(uuid, source, companyUuid);
            MeccgApi.send("/game/draw/company", companyUuid);
            return false;
        }
    };

    var HandCardsDraggable = {

        _locationMessageId : 0,

        /**
         * Get the company path. This will fail for onguard cards, but it is ok, because it will simply return an empty data
         * object
         * 
         * @param {JQuery} jCardContainer
         * @returns {createHandCardsDraggable.HandCardsDraggable.getCompanyPath.handcards-draggableAnonym$0}
         */
        getCompanyPath : function(pCardContainer)
        {
            let pCompanyCharacter = DomUtils.closestByClass(pCardContainer, "company-character");

            const character_uuid = pCompanyCharacter === null ? "" : pCompanyCharacter.getAttribute("data-character-uuid")

            /**
             * this character is either host or influenced
             */
            const isHostCharacter = pCompanyCharacter === null ? false : pCompanyCharacter.classList.contains("character-is-company-host");

            /**
             * This characters company ID
             * @type String
             */
            const companySourceId = DomUtils.closestByClass(pCardContainer, "company").getAttribute("data-company-id");
            
            var parentCharacterUuid = "";
            if (!isHostCharacter && pCompanyCharacter !== null)
            {
                pCompanyCharacter = DomUtils.closestByClass(pCompanyCharacter.parentNode, "company-character");
                if (pCompanyCharacter !== null)
                    parentCharacterUuid = pCompanyCharacter.getAttribute("data-character-uuid");
            }

            return {
                character_uuid : character_uuid,
                company_uuid : companySourceId === null ? "" : companySourceId,
                is_host : isHostCharacter,
                parent_character_uuid : parentCharacterUuid
            };
        },

        onLocationSelectClick : function(sCode, companyUuid)
        {
            const data = {
                company : companyUuid,
                code : sCode,
                id : CreateHandCardsDraggableUtils.requireMessageId()
            };

            document.body.dispatchEvent(new CustomEvent("meccg-map-show", { "detail":  data }));
        },
        
        onLocationRevealClick : function(elem, companyUuid)
        {
            const sites = DomUtils.findParentByClass(elem, "company-site-list");
            if (sites === null)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot find companies' sites." }));
                return;
            }

            if (sites.querySelector(".site-target img") === null)
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Please organize movement first." }));
            else
                MeccgApi.send("/game/company/location/reveal", {companyUuid: companyUuid});
        },
        
        /**
         * Init Company events (add host character)
         * 
         * @param {Object} jCompany
         * @returns {void}
         */
        initOnCompany : function(jCompany)
        {
            if (jCompany === null)
                return;

            const companyUuid = jCompany.getAttribute("data-company-id");
            
            ArrayList(jCompany).find(".company-characters-add").each(function(e)
            {
                jQuery(e).droppable(
                {
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAcceptCharacter,
                    drop: (event, ui) => DropFunctions.dropOnAddCompanyCharacter(event, ui, companyUuid)
                });
            });
            
            ArrayList(jCompany).find(".location-select").each(function (_elem) 
            {
                _elem.setAttribute("data-company-uuid", companyUuid);
                _elem.onclick = (e) => 
                {
                    e.stopPropagation();
                    e.preventDefault();

                    const _companyUuid = e.target.getAttribute("data-company-uuid");
                    const sCode = HandCardsDraggable.getStartingLocation(DomUtils.closestByClass(e.target, "company-site-list"))
                    HandCardsDraggable.onLocationSelectClick(sCode, _companyUuid);
                    return false;
                }
            });
            
            ArrayList(jCompany).find(".location-reveal").each( function(_elem) 
            {
                _elem.setAttribute("data-company-uuid", companyUuid);
                _elem.onclick = (e) => 
                {
                    const _companyUuid = e.target.getAttribute("data-company-uuid");
                    HandCardsDraggable.onLocationRevealClick(e.target, _companyUuid);
                    e.stopPropagation();
                    return false;
                };

            });
        },
        
        getStartingLocation : function(pCompany)
        {
            if (pCompany === null)
                return "";

            const pSite = pCompany.querySelector(".site-current .card");
            if (pSite === null)
                return "";
            else
            {
                const val = pSite.getAttribute("data-card-code");
                return val === null ? "" : val;
            }
                
        },
        
        initOnCardCharacter : function(cardDiv)
        {
            if (cardDiv === null)
                return;

            const isHost = this.getCompanyPath(cardDiv).is_host;
            if (isHost) /* if this character is a host, he/she may accept characters under direct influence */
            {
                jQuery(cardDiv).droppable(
                {
                    tolerance: "pointer",
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAccept,
                    
                    drop: function(event, ui ) 
                    {
                        const elemDraggable = ui.draggable[0];
                        const source = elemDraggable.getAttribute("data-location");
                        const receivingCharacter = HandCardsDraggable.getCompanyPath(this);
                        receivingCharacter.character_uuid = this.getAttribute("data-uuid");
                        
                        var redrawReceivingCompanyId = receivingCharacter.company_uuid;
                        var redrawDonatingCompanyId = "";
                        
                        if (elemDraggable.getAttribute("data-card-type") === "character")
                        {
                            var donatingCharacter;
                            if (source === "hand")
                                donatingCharacter = { character_uuid : elemDraggable.getAttribute("data-uuid"), company_uuid : "" };
                            else
                                donatingCharacter = HandCardsDraggable.getCompanyPath(elemDraggable);

                            if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
                                redrawDonatingCompanyId = donatingCharacter.company_uuid;
                            
                            const params = {
                                    uuid : elemDraggable.getAttribute("data-uuid"),
                                    targetcharacter: receivingCharacter.character_uuid,
                                    companyId : receivingCharacter.company_uuid,
                                    fromHand : source === "hand"
                            };
                              
                            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                            MeccgApi.send("/game/character/join/character", params, true);
                        }
                        else if (source === "hand" || source === "stagingarea")
                        {
                            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                            const pThis = this;
                            HandCardsDraggable.onAddResourcesToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
                        }
                        else 
                        {
                            var donatingCharacter = HandCardsDraggable.getCompanyPath(elemDraggable);
                            donatingCharacter.character_uuid = elemDraggable.getAttribute("data-uuid");
                            
                            if (donatingCharacter.character_uuid === receivingCharacter.character_uuid) /* oneself cannot be the target */
                                return;

                            if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
                                redrawDonatingCompanyId = donatingCharacter.company_uuid;
                            
                            if (elemDraggable.getAttribute("data-card-type") === "resource")
                            {
                                const pThis = this;
                                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                                HandCardsDraggable.onAddResourceToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, false);
                            }
                            else if (elemDraggable.getAttribute("data-card-type") === "hazard")
                            {   
                                const pThis = this;
                                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                                HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, source === "hand");
                            }
                        }

                        if (redrawReceivingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", redrawReceivingCompanyId);
                        
                        if (redrawDonatingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", redrawDonatingCompanyId);
                    }
                    
                });
            }
            else /* influenced character */
            {
                jQuery(cardDiv).droppable(
                {
                    tolerance: "pointer",
                    classes: HandCardsDraggable.droppableParams,
                    accept: HandCardsDraggable.droppableAcceptResrouceAndHazards,
                    drop: function(event, ui ) 
                    {
                        const elemDraggable = ui.draggable[0];
                        const source = elemDraggable.getAttribute("data-location");
                        const receivingCharacter = HandCardsDraggable.getCompanyPath(this);
                        receivingCharacter.character_uuid = this.getAttribute("data-uuid");
                        
                        var drawReceivingCompanyId = receivingCharacter.company_uuid;
                        var drawDonatingCompanyId = "";
                        
                        if (elemDraggable.getAttribute("data-card-type") === "character")
                            return;
 
                        if (source === "hand" || source === "stagingarea")
                        {
                            const pThis = this;
                            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                            HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
                        }
                        else
                        {
                            var donatingCharacter = HandCardsDraggable.getCompanyPath(elemDraggable);
                            if (receivingCharacter.character_uuid === donatingCharacter.character_uuid) /*oneself cannot be the target*/
                                return;
                            else if (receivingCharacter.company_uuid !== donatingCharacter.character_uuid)
                                drawDonatingCompanyId = donatingCharacter.character_uuid;

                            const draggableType = elemDraggable.getAttribute("data-card-type");
                            if (draggableType === "resource")
                            {
                                const pThis = this;
                                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                                HandCardsDraggable.onAddResourceToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, false);
                            }
                            else if (draggableType === "hazard")
                            {
                                const pThis = this;
                                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                                HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
                            }
                            else
                                return;
                        }

                        if (drawReceivingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", drawReceivingCompanyId);
                        
                        if (drawDonatingCompanyId !== "")
                            MeccgApi.send("/game/draw/company", drawDonatingCompanyId);
                    }
                });
            }

            HandCardsDraggable.initDraggableCard(cardDiv);
        },
        
        /**
         * Init a jquery draggable event
         * @param {jQuery} jCardContainer
         * @return {void}
         */
        initDraggableCard : function(pCardContainer)
        {
            let sAllow = pCardContainer === null ? null : pCardContainer.getAttribute("draggable");
            if (sAllow === null || sAllow !== "true")
                return;
            
            jQuery(pCardContainer).draggable(
            {
                cursor: 'move',
                revert: true,
                opacity: 0.5,
                revertDuration : 200,
                
                start: function() 
                {
                    CreateHandCardsDraggableUtils.initTargets(this.getAttribute("data-card-type"));
                },
                
                stop: function() 
                {
                    CreateHandCardsDraggableUtils.clearTargets(this.getAttribute("data-card-type"));
                }
            });
        },
        
        /**
         * Setup drag event for resource card in play
         * @param {Object} jCardContainer Card Container of card in play
         * @returns {void}
         */
        initOnCardResource: function (pCardContainer)
        {
            HandCardsDraggable.initDraggableCard(pCardContainer);
        },

        /**
         * Add a card to the staging area
         * 
         * @param {String} cardId Card Container Id
         * @param {String} target
         * @param {String} type
         * @returns {void}
         */
        initCardInStagingArea: function (cardId, target, type)
        {
            if (cardId === "")
                return;

            var isResource;
            if (type === "hazard")
                isResource = false;
            else if (type === "resource")
                isResource = true;
            else
                return;

            var elemDiv = document.getElementById(cardId);
            if (elemDiv === null)
            {
                MeccgUtils.logWarning("Cannot find card container " + cardId);
                return;
            }
            
            elemDiv.setAttribute("data-location", "stagingarea");
            HandCardsDraggable.initDraggableCard(elemDiv);
        },

        /**
         * visualize drag area for a new company
         * @param {String} idPrefix
         * @param {String} uuid
         * @param {String} type
         * @returns {void}
         */
        initDragEventsForHandCard: function (idPrefix, uuid, type)
        {
            var pCardContainer = document.getElementById(idPrefix + uuid);
            pCardContainer.setAttribute("data-location", "hand");
            HandCardsDraggable.initDraggableCard(pCardContainer);
        },

        onAddGenericCardToStagingArea: function (_uuid, bPlayer)
        {
            if (_uuid === "")
                return;
            
            MeccgApi.send("/game/stagingarea/add/card", {
                uuid: _uuid,
                resource : true,
                target: bPlayer ? "player" : "opponent"
            });
        },
        

        onAddResourcesToStagingArea: function (_uuid, bPlayer)
        {
            this.onAddGenericCardToStagingArea(_uuid, bPlayer);
        },
        
        /**
         * Add a hazard to the staging area
         * @param {String} _uuid card uui
         * @param {boolean} bPlayer is host_players staging area
         * @return {void}
         */
        onAddHazardsToStagingArea: function (_uuid, bPlayer)
        {
            this.onAddGenericCardToStagingArea(_uuid, bPlayer);
        },
        
        /**
         * Add a resource to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elementCharacterCard
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddResourceToCharacter : function (uuid, elementCharacterCard, bFromHand)
        {
            this.onAddHazardsToCharacter(uuid, elementCharacterCard, bFromHand);
        },

        /**
         * Add a hazard to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elem
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddHazardsToCharacter: function (uuid, elem, bFromHand)
        {
            if (uuid === "")
                return false;

            const pHost = DomUtils.findParentByClass(elem, "company-character");
            const company = DomUtils.findParentByClass(pHost, "company");
            const characterUuid = pHost === null ? null : pHost.getAttribute("data-character-uuid");
            const companyId = company === null ? null : company.getAttribute("data-company-id");

            if (characterUuid !== null && companyId !== null)
                MeccgApi.send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand }, true);
        },

        /**
         * Add a resource to a given character
         * 
         * @param {String} uuid Card UUID
         * @param {Object} elem
         * @param {Boolean} bFromHand From hand (true) or staging area (false)
         * @returns {undefined|Boolean}
         */
        onAddResourcesToCharacter: function (uuid, elem, bFromHand)
        {
            if (uuid === "")
                return false;

            const pHost = DomUtils.findParentByClass(elem, "company-character");
            const company = DomUtils.findParentByClass(pHost, "company");
            const characterUuid = pHost === null ? null : pHost.getAttribute("data-character-uuid");
            const companyId = company === null ? null : company.getAttribute("data-company-id");

            if (characterUuid !== null && companyId !== null)
                MeccgApi.send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand}, true);
        },

        /**
         * Create a new company 
         * @param {String} _uuid Character card uuid
         * @param {String} source "hand" or "inplay"
         * @returns {void}
         */
        onCreateNewCompany: function (_uuid, source)
        {
            if (_uuid !== "" && source !== "")
                MeccgApi.send("/game/company/create", {source: source, uuid: _uuid});
        },
        
        /**
         * Join a company from hand
         * @param {String} _joiningCharacterUuid
         * @param {String} source
         * @param {String} targetCompanyId
         * @returns {Boolean}
         */
        onJoinCompany: function (_joiningCharacterUuid, source, targetCompanyId)
        {
            if (_joiningCharacterUuid === "")
                MeccgUtils.logWarning("no uuid");
            else if (targetCompanyId === "" || typeof targetCompanyId === "undefined")
                MeccgUtils.logWarning("no target company found ");
            else
                MeccgApi.send("/game/character/join/company", {source: source, uuid: _joiningCharacterUuid, companyId: targetCompanyId});
        },
        
        droppableParams : {
            "ui-droppable-hover": "on-drag-over",
            addClasses: false
        },
        
        droppableAccept : function(elem)
        {
            return true;
        },
        
        droppableAcceptResrouceAndHazards : function(elem)
        {
            let sType = elem.attr("data-card-type");
            return sType === "resource" || sType === "hazard";
        },
        
        droppableAcceptCharacter : function(elem)
        {
            return elem.attr("data-card-type") === "character";
        },
        
        droppableAcceptStagingArea : function(elem)
        {
            let sAttr = elem.attr("data-card-type");
            return sAttr === "resource" || sAttr === "hazard";
        }
    };

    jQuery(TaskBarIconsObjects.discardpile()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnDiscard
    });
    
    jQuery(TaskBarIconsObjects.victory()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnVicotry
    });

    jQuery(TaskBarIconsObjects.sideboard()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnSideboard
    });

    jQuery(TaskBarIconsObjects.playdeck()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnPlaydeck
    });
    
    jQuery(TaskBarIconsObjects.hand()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        drop: DropFunctions.dropOnHand
    });
    
    jQuery(PlayerStagingAreaObjects.droparea()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnStageArea,
        accept: HandCardsDraggable.droppableAcceptStagingArea
    });
    
    jQuery(HandCardsDraggableBoard.getCompanyAreaPlayerAddNew()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnAddNew,
        accept: HandCardsDraggable.droppableAcceptCharacter
    });

    {
        const _handSizer = document.getElementById("playercard-hand-content").querySelector(".hand-card-sizer")
        let _sizerId = ResolveHandSizeContainer.create(_handSizer, "Always ask to resolve to", 8, "cards.");
        if (_sizerId !== "")
            ResolveHandSizeFirst.create("playercard_hand_container", _sizerId, "cards");

        ResolveHandSizeContainer.create(_handSizer, "Stage points are ", 0, "");
        ResolveHandSizeContainer.create(_handSizer, "Unused general influence is", 20, "");
    }

    return HandCardsDraggable;
}
