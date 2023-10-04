/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIChatlog extends FUIElement
{
    constructor( options )
    {
        super( options );
        let self = this;
        
        // We use this on our calls
        this.ajaxUniqueId = md5( UniqueHash() );
        if( window.currentChatLog )
        	window.currentChatLog.destroy();
        window.currentChatLog = this
        
        // Dividers for new dates
        self.messageDateDividers = {};
        
        // Do stuff
        this.messageList = {};
        this.messageListOrder = [];
        this.lastId = 0;
        
        // Scrolling
        this.prevScrollTop = 0;
        
        // Load events
        this.loadingData = 0;
        this.loadObjects = {};
        
        this.hasScrolled = false;
        this.scrollEndEvent = function()
        {
        	self.refreshDom();
        }
        
        this.emojis = {
            'Smilies': '😀😃😄😁😆😅😂🤣🥲🥹☺️😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥸🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😮‍💨😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🫣🤗🫡🤔🫢🤭🤫🤥😶😶‍🌫️😐😑😬🫨🫠🙄😯😦😧😮😲🥱😴🤤😪😵😵‍💫🫥🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾',
            'Gestures and bodyparts': '👋🤚🖐✋🖖👌🤌🤏✌️🤞🫰🤟🤘🤙🫵🫱🫲🫸🫷🫳🫴👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🫶🙌👐🤲🤝🙏✍️💅🤳💪🦾🦵🦿🦶👣👂🦻👃🫀🫁🧠🦷🦴👀👁👅👄🫦💋🩸',
            'People and fantasy': '👶👧🧒👦👩🧑👨👩‍🦱🧑‍🦱👨‍🦱👩‍🦰🧑‍🦰👨‍🦰👱‍♀️👱👱‍♂️👩‍🦳🧑‍🦳👨‍🦳👩‍🦲🧑‍🦲👨‍🦲🧔‍♀️🧔🧔‍♂️👵🧓👴👲👳‍♀️👳👳‍♂️🧕👮‍♀️👮👮‍♂️👷‍♀️👷👷‍♂️💂‍♀️💂💂‍♂️🕵️‍♀️🕵️🕵️‍♂️👩‍⚕️🧑‍⚕️👨‍⚕️👩‍🌾🧑‍🌾👨‍🌾👩‍🍳🧑‍🍳👨‍🍳👩‍🎓🧑‍🎓👨‍🎓👩‍🎤🧑‍🎤👨‍🎤👩‍🏫🧑‍🏫👨‍🏫👩‍🏭🧑‍🏭👨‍🏭👩‍💻🧑‍💻👨‍💻👩‍💼🧑‍💼👨‍💼👩‍🔧🧑‍🔧👨‍🔧👩‍🔬🧑‍🔬👨‍🔬👩‍🎨🧑‍🎨👨‍🎨👩‍🚒🧑‍🚒👨‍🚒👩‍✈️🧑‍✈️👨‍✈️👩‍🚀🧑‍🚀👨‍🚀👩‍⚖️🧑‍⚖️👨‍⚖️👰‍♀️👰👰‍♂️🤵‍♀️🤵🤵‍♂️👸🫅🤴🥷🦸‍♀️🦸🦸‍♂️🦹‍♀️🦹🦹‍♂️🤶🧑‍🎄🎅🧙‍♀️🧙🧙‍♂️🧝‍♀️🧝🧝‍♂️🧛‍♀️🧛🧛‍♂️🧟‍♀️🧟🧟‍♂️🧞‍♀️🧞🧞‍♂️🧜‍♀️🧜🧜‍♂️🧚‍♀️🧚🧚‍♂️🧌👼🤰🫄🫃🤱👩‍🍼🧑‍🍼👨‍🍼🙇‍♀️🙇🙇‍♂️💁‍♀️💁💁‍♂️🙅‍♀️🙅🙅‍♂️🙆‍♀️🙆🙆‍♂️🙋‍♀️🙋🙋‍♂️🧏‍♀️🧏🧏‍♂️🤦‍♀️🤦🤦‍♂️🤷‍♀️🤷🤷‍♂️🙎‍♀️🙎🙎‍♂️🙍‍♀️🙍🙍‍♂️💇‍♀️💇💇‍♂️💆‍♀️💆💆‍♂️🧖‍♀️🧖🧖‍♂️💅🤳💃🕺👯‍♀️👯👯‍♂️🕴👩‍🦽🧑‍🦽👨‍🦽👩‍🦼🧑‍🦼👨‍🦼🚶‍♀️🚶🚶‍♂️👩‍🦯🧑‍🦯👨‍🦯🧎‍♀️🧎🧎‍♂️🏃‍♀️🏃🏃‍♂️🧍‍♀️🧍🧍‍♂️👭🧑‍🤝‍🧑👬👫👩‍❤️‍👩💑👨‍❤️‍👨👩‍❤️‍👨👩‍❤️‍💋‍👩💏👨‍❤️‍💋‍👨👩‍❤️‍💋‍👨👪👨‍👩‍👦👨‍👩‍👧👨‍👩‍👧‍👦👨‍👩‍👦‍👦👨‍👩‍👧‍👧👨‍👨‍👦👨‍👨‍👧👨‍👨‍👧‍👦👨‍👨‍👦‍👦👨‍👨‍👧‍👧👩‍👩‍👦👩‍👩‍👧👩‍👩‍👧‍👦👩‍👩‍👦‍👦👩‍👩‍👧‍👧👨‍👦👨‍👦‍👦👨‍👧👨‍👧‍👦👨‍👧‍👧👩‍👦👩‍👦‍👦👩‍👧👩‍👧‍👦👩‍👧‍👧🗣👤👥🫂',
            'Clothing and accessories': '🧳🌂☂️🧵🪡🪢🪭🧶👓🕶🥽🥼🦺👔👕👖🧣🧤🧥🧦👗👘🥻🩴🩱🩲🩳👙👚👛👜👝🎒👞👟🥾🥿👠👡🩰👢👑👒🎩🎓🧢⛑🪖💄💍💼',
            'Pale emojis': '👋🏻🤚🏻🖐🏻✋🏻🖖🏻👌🏻🤌🏻🤏🏻✌🏻🤞🏻🫰🏻🤟🏻🤘🏻🤙🏻🫵🏻🫱🏻🫲🏻🫸🏻🫷🏻🫳🏻🫴🏻👈🏻👉🏻👆🏻🖕🏻👇🏻☝🏻👍🏻👎🏻✊🏻👊🏻🤛🏻🤜🏻👏🏻🫶🏻🙌🏻👐🏻🤲🏻🙏🏻✍🏻💅🏻🤳🏻💪🏻🦵🏻🦶🏻👂🏻🦻🏻👃🏻👶🏻👧🏻🧒🏻👦🏻👩🏻🧑🏻👨🏻👩🏻‍🦱🧑🏻‍🦱👨🏻‍🦱👩🏻‍🦰🧑🏻‍🦰👨🏻‍🦰👱🏻‍♀️👱🏻👱🏻‍♂️👩🏻‍🦳🧑🏻‍🦳👨🏻‍🦳👩🏻‍🦲🧑🏻‍🦲👨🏻‍🦲🧔🏻‍♀️🧔🏻🧔🏻‍♂️👵🏻🧓🏻👴🏻👲🏻👳🏻‍♀️👳🏻👳🏻‍♂️🧕🏻👮🏻‍♀️👮🏻👮🏻‍♂️👷🏻‍♀️👷🏻👷🏻‍♂️💂🏻‍♀️💂🏻💂🏻‍♂️🕵🏻‍♀️🕵🏻🕵🏻‍♂️👩🏻‍⚕️🧑🏻‍⚕️👨🏻‍⚕️👩🏻‍🌾🧑🏻‍🌾👨🏻‍🌾👩🏻‍🍳🧑🏻‍🍳👨🏻‍🍳👩🏻‍🎓🧑🏻‍🎓👨🏻‍🎓👩🏻‍🎤🧑🏻‍🎤👨🏻‍🎤👩🏻‍🏫🧑🏻‍🏫👨🏻‍🏫👩🏻‍🏭🧑🏻‍🏭👨🏻‍🏭👩🏻‍💻🧑🏻‍💻👨🏻‍💻👩🏻‍💼🧑🏻‍💼👨🏻‍💼👩🏻‍🔧🧑🏻‍🔧👨🏻‍🔧👩🏻‍🔬🧑🏻‍🔬👨🏻‍🔬👩🏻‍🎨🧑🏻‍🎨👨🏻‍🎨👩🏻‍🚒🧑🏻‍🚒👨🏻‍🚒👩🏻‍✈️🧑🏻‍✈️👨🏻‍✈️👩🏻‍🚀🧑🏻‍🚀👨🏻‍🚀👩🏻‍⚖️🧑🏻‍⚖️👨🏻‍⚖️👰🏻‍♀️👰🏻👰🏻‍♂️🤵🏻‍♀️🤵🏻🤵🏻‍♂️👸🏻🫅🏻🤴🏻🥷🏻🦸🏻‍♀️🦸🏻🦸🏻‍♂️🦹🏻‍♀️🦹🏻🦹🏻‍♂️🤶🏻🧑🏻‍🎄🎅🏻🧙🏻‍♀️🧙🏻🧙🏻‍♂️🧝🏻‍♀️🧝🏻🧝🏻‍♂️🧛🏻‍♀️🧛🏻🧛🏻‍♂️🧜🏻‍♀️🧜🏻🧜🏻‍♂️🧚🏻‍♀️🧚🏻🧚🏻‍♂️👼🏻🤰🏻🫄🏻🫃🏻🤱🏻👩🏻‍🍼🧑🏻‍🍼👨🏻‍🍼🙇🏻‍♀️🙇🏻🙇🏻‍♂️💁🏻‍♀️💁🏻💁🏻‍♂️🙅🏻‍♀️🙅🏻🙅🏻‍♂️🙆🏻‍♀️🙆🏻🙆🏻‍♂️🙋🏻‍♀️🙋🏻🙋🏻‍♂️🧏🏻‍♀️🧏🏻🧏🏻‍♂️🤦🏻‍♀️🤦🏻🤦🏻‍♂️🤷🏻‍♀️🤷🏻🤷🏻‍♂️🙎🏻‍♀️🙎🏻🙎🏻‍♂️🙍🏻‍♀️🙍🏻🙍🏻‍♂️💇🏻‍♀️💇🏻💇🏻‍♂️💆🏻‍♀️💆🏻💆🏻‍♂️🧖🏻‍♀️🧖🏻🧖🏻‍♂️💃🏻🕺🏻🕴🏻👩🏻‍🦽🧑🏻‍🦽👨🏻‍🦽👩🏻‍🦼🧑🏻‍🦼👨🏻‍🦼🚶🏻‍♀️🚶🏻🚶🏻‍♂️👩🏻‍🦯🧑🏻‍🦯👨🏻‍🦯🧎🏻‍♀️🧎🏻🧎🏻‍♂️🏃🏻‍♀️🏃🏻🏃🏻‍♂️🧍🏻‍♀️🧍🏻🧍🏻‍♂️👭🏻🧑🏻‍🤝‍🧑🏻👬🏻👫🏻🧗🏻‍♀️🧗🏻🧗🏻‍♂️🏇🏻🏂🏻🏌🏻‍♀️🏌🏻🏌🏻‍♂️🏄🏻‍♀️🏄🏻🏄🏻‍♂️🚣🏻‍♀️🚣🏻🚣🏻‍♂️🏊🏻‍♀️🏊🏻🏊🏻‍♂️⛹🏻‍♀️⛹🏻⛹🏻‍♂️🏋🏻‍♀️🏋🏻🏋🏻‍♂️🚴🏻‍♀️🚴🏻🚴🏻‍♂️🚵🏻‍♀️🚵🏻🚵🏻‍♂️🤸🏻‍♀️🤸🏻🤸🏻‍♂️🤽🏻‍♀️🤽🏻🤽🏻‍♂️🤾🏻‍♀️🤾🏻🤾🏻‍♂️🤹🏻‍♀️🤹🏻🤹🏻‍♂️🧘🏻‍♀️🧘🏻🧘🏻‍♂️🛀🏻🛌🏻',
            'Cream white emojis': '👋🏼🤚🏼🖐🏼✋🏼🖖🏼👌🏼🤌🏼🤏🏼✌🏼🤞🏼🫰🏼🤟🏼🤘🏼🤙🏼🫵🏼🫱🏼🫲🏼🫸🏼🫷🏼🫳🏼🫴🏼👈🏼👉🏼👆🏼🖕🏼👇🏼☝🏼👍🏼👎🏼✊🏼👊🏼🤛🏼🤜🏼👏🏼🫶🏼🙌🏼👐🏼🤲🏼🙏🏼✍🏼💅🏼🤳🏼💪🏼🦵🏼🦶🏼👂🏼🦻🏼👃🏼👶🏼👧🏼🧒🏼👦🏼👩🏼🧑🏼👨🏼👩🏼‍🦱🧑🏼‍🦱👨🏼‍🦱👩🏼‍🦰🧑🏼‍🦰👨🏼‍🦰👱🏼‍♀️👱🏼👱🏼‍♂️👩🏼‍🦳🧑🏼‍🦳👨🏼‍🦳👩🏼‍🦲🧑🏼‍🦲👨🏼‍🦲🧔🏼‍♀️🧔🏼🧔🏼‍♂️👵🏼🧓🏼👴🏼👲🏼👳🏼‍♀️👳🏼👳🏼‍♂️🧕🏼👮🏼‍♀️👮🏼👮🏼‍♂️👷🏼‍♀️👷🏼👷🏼‍♂️💂🏼‍♀️💂🏼💂🏼‍♂️🕵🏼‍♀️🕵🏼🕵🏼‍♂️👩🏼‍⚕️🧑🏼‍⚕️👨🏼‍⚕️👩🏼‍🌾🧑🏼‍🌾👨🏼‍🌾👩🏼‍🍳🧑🏼‍🍳👨🏼‍🍳👩🏼‍🎓🧑🏼‍🎓👨🏼‍🎓👩🏼‍🎤🧑🏼‍🎤👨🏼‍🎤👩🏼‍🏫🧑🏼‍🏫👨🏼‍🏫👩🏼‍🏭🧑🏼‍🏭👨🏼‍🏭👩🏼‍💻🧑🏼‍💻👨🏼‍💻👩🏼‍💼🧑🏼‍💼👨🏼‍💼👩🏼‍🔧🧑🏼‍🔧👨🏼‍🔧👩🏼‍🔬🧑🏼‍🔬👨🏼‍🔬👩🏼‍🎨🧑🏼‍🎨👨🏼‍🎨👩🏼‍🚒🧑🏼‍🚒👨🏼‍🚒👩🏼‍✈️🧑🏼‍✈️👨🏼‍✈️👩🏼‍🚀🧑🏼‍🚀👨🏼‍🚀👩🏼‍⚖️🧑🏼‍⚖️👨🏼‍⚖️👰🏼‍♀️👰🏼👰🏼‍♂️🤵🏼‍♀️🤵🏼🤵🏼‍♂️👸🏼🫅🏼🤴🏼🥷🏼🦸🏼‍♀️🦸🏼🦸🏼‍♂️🦹🏼‍♀️🦹🏼🦹🏼‍♂️🤶🏼🧑🏼‍🎄🎅🏼🧙🏼‍♀️🧙🏼🧙🏼‍♂️🧝🏼‍♀️🧝🏼🧝🏼‍♂️🧛🏼‍♀️🧛🏼🧛🏼‍♂️🧜🏼‍♀️🧜🏼🧜🏼‍♂️🧚🏼‍♀️🧚🏼🧚🏼‍♂️👼🏼🤰🏼🫄🏼🫃🏼🤱🏼👩🏼‍🍼🧑🏼‍🍼👨🏼‍🍼🙇🏼‍♀️🙇🏼🙇🏼‍♂️💁🏼‍♀️💁🏼💁🏼‍♂️🙅🏼‍♀️🙅🏼🙅🏼‍♂️🙆🏼‍♀️🙆🏼🙆🏼‍♂️🙋🏼‍♀️🙋🏼🙋🏼‍♂️🧏🏼‍♀️🧏🏼🧏🏼‍♂️🤦🏼‍♀️🤦🏼🤦🏼‍♂️🤷🏼‍♀️🤷🏼🤷🏼‍♂️🙎🏼‍♀️🙎🏼🙎🏼‍♂️🙍🏼‍♀️🙍🏼🙍🏼‍♂️💇🏼‍♀️💇🏼💇🏼‍♂️💆🏼‍♀️💆🏼💆🏼‍♂️🧖🏼‍♀️🧖🏼🧖🏼‍♂️💃🏼🕺🏼🕴🏼👩🏼‍🦽🧑🏼‍🦽👨🏼‍🦽👩🏼‍🦼🧑🏼‍🦼👨🏼‍🦼🚶🏼‍♀️🚶🏼🚶🏼‍♂️👩🏼‍🦯🧑🏼‍🦯👨🏼‍🦯🧎🏼‍♀️🧎🏼🧎🏼‍♂️🏃🏼‍♀️🏃🏼🏃🏼‍♂️🧍🏼‍♀️🧍🏼🧍🏼‍♂️👭🏼🧑🏼‍🤝‍🧑🏼👬🏼👫🏼🧗🏼‍♀️🧗🏼🧗🏼‍♂️🏇🏼🏂🏼🏌🏼‍♀️🏌🏼🏌🏼‍♂️🏄🏼‍♀️🏄🏼🏄🏼‍♂️🚣🏼‍♀️🚣🏼🚣🏼‍♂️🏊🏼‍♀️🏊🏼🏊🏼‍♂️⛹🏼‍♀️⛹🏼⛹🏼‍♂️🏋🏼‍♀️🏋🏼🏋🏼‍♂️🚴🏼‍♀️🚴🏼🚴🏼‍♂️🚵🏼‍♀️🚵🏼🚵🏼‍♂️🤸🏼‍♀️🤸🏼🤸🏼‍♂️🤽🏼‍♀️🤽🏼🤽🏼‍♂️🤾🏼‍♀️🤾🏼🤾🏼‍♂️🤹🏼‍♀️🤹🏼🤹🏼‍♂️🧘🏼‍♀️🧘🏼🧘🏼‍♂️🛀🏼🛌🏼',
            'Brown emojis': '👋🏽🤚🏽🖐🏽✋🏽🖖🏽👌🏽🤌🏽🤏🏽✌🏽🤞🏽🫰🏽🤟🏽🤘🏽🤙🏽🫵🏽🫱🏽🫲🏽🫸🏽🫷🏽🫳🏽🫴🏽👈🏽👉🏽👆🏽🖕🏽👇🏽☝🏽👍🏽👎🏽✊🏽👊🏽🤛🏽🤜🏽👏🏽🫶🏽🙌🏽👐🏽🤲🏽🙏🏽✍🏽💅🏽🤳🏽💪🏽🦵🏽🦶🏽👂🏽🦻🏽👃🏽👶🏽👧🏽🧒🏽👦🏽👩🏽🧑🏽👨🏽👩🏽‍🦱🧑🏽‍🦱👨🏽‍🦱👩🏽‍🦰🧑🏽‍🦰👨🏽‍🦰👱🏽‍♀️👱🏽👱🏽‍♂️👩🏽‍🦳🧑🏽‍🦳👨🏽‍🦳👩🏽‍🦲🧑🏽‍🦲👨🏽‍🦲🧔🏽‍♀️🧔🏽🧔🏽‍♂️👵🏽🧓🏽👴🏽👲🏽👳🏽‍♀️👳🏽👳🏽‍♂️🧕🏽👮🏽‍♀️👮🏽👮🏽‍♂️👷🏽‍♀️👷🏽👷🏽‍♂️💂🏽‍♀️💂🏽💂🏽‍♂️🕵🏽‍♀️🕵🏽🕵🏽‍♂️👩🏽‍⚕️🧑🏽‍⚕️👨🏽‍⚕️👩🏽‍🌾🧑🏽‍🌾👨🏽‍🌾👩🏽‍🍳🧑🏽‍🍳👨🏽‍🍳👩🏽‍🎓🧑🏽‍🎓👨🏽‍🎓👩🏽‍🎤🧑🏽‍🎤👨🏽‍🎤👩🏽‍🏫🧑🏽‍🏫👨🏽‍🏫👩🏽‍🏭🧑🏽‍🏭👨🏽‍🏭👩🏽‍💻🧑🏽‍💻👨🏽‍💻👩🏽‍💼🧑🏽‍💼👨🏽‍💼👩🏽‍🔧🧑🏽‍🔧👨🏽‍🔧👩🏽‍🔬🧑🏽‍🔬👨🏽‍🔬👩🏽‍🎨🧑🏽‍🎨👨🏽‍🎨👩🏽‍🚒🧑🏽‍🚒👨🏽‍🚒👩🏽‍✈️🧑🏽‍✈️👨🏽‍✈️👩🏽‍🚀🧑🏽‍🚀👨🏽‍🚀👩🏽‍⚖️🧑🏽‍⚖️👨🏽‍⚖️👰🏽‍♀️👰🏽👰🏽‍♂️🤵🏽‍♀️🤵🏽🤵🏽‍♂️👸🏽🫅🏽🤴🏽🥷🏽🦸🏽‍♀️🦸🏽🦸🏽‍♂️🦹🏽‍♀️🦹🏽🦹🏽‍♂️🤶🏽🧑🏽‍🎄🎅🏽🧙🏽‍♀️🧙🏽🧙🏽‍♂️🧝🏽‍♀️🧝🏽🧝🏽‍♂️🧛🏽‍♀️🧛🏽🧛🏽‍♂️🧜🏽‍♀️🧜🏽🧜🏽‍♂️🧚🏽‍♀️🧚🏽🧚🏽‍♂️👼🏽🤰🏽🫄🏽🫃🏽🤱🏽👩🏽‍🍼🧑🏽‍🍼👨🏽‍🍼🙇🏽‍♀️🙇🏽🙇🏽‍♂️💁🏽‍♀️💁🏽💁🏽‍♂️🙅🏽‍♀️🙅🏽🙅🏽‍♂️🙆🏽‍♀️🙆🏽🙆🏽‍♂️🙋🏽‍♀️🙋🏽🙋🏽‍♂️🧏🏽‍♀️🧏🏽🧏🏽‍♂️🤦🏽‍♀️🤦🏽🤦🏽‍♂️🤷🏽‍♀️🤷🏽🤷🏽‍♂️🙎🏽‍♀️🙎🏽🙎🏽‍♂️🙍🏽‍♀️🙍🏽🙍🏽‍♂️💇🏽‍♀️💇🏽💇🏽‍♂️💆🏽‍♀️💆🏽💆🏽‍♂️🧖🏽‍♀️🧖🏽🧖🏽‍♂️💃🏽🕺🏽🕴🏽👩🏽‍🦽🧑🏽‍🦽👨🏽‍🦽👩🏽‍🦼🧑🏽‍🦼👨🏽‍🦼🚶🏽‍♀️🚶🏽🚶🏽‍♂️👩🏽‍🦯🧑🏽‍🦯👨🏽‍🦯🧎🏽‍♀️🧎🏽🧎🏽‍♂️🏃🏽‍♀️🏃🏽🏃🏽‍♂️🧍🏽‍♀️🧍🏽🧍🏽‍♂️👭🏽🧑🏽‍🤝‍🧑🏽👬🏽👫🏽🧗🏽‍♀️🧗🏽🧗🏽‍♂️🏇🏽🏂🏽🏌🏽‍♀️🏌🏽🏌🏽‍♂️🏄🏽‍♀️🏄🏽🏄🏽‍♂️🚣🏽‍♀️🚣🏽🚣🏽‍♂️🏊🏽‍♀️🏊🏽🏊🏽‍♂️⛹🏽‍♀️⛹🏽⛹🏽‍♂️🏋🏽‍♀️🏋🏽🏋🏽‍♂️🚴🏽‍♀️🚴🏽🚴🏽‍♂️🚵🏽‍♀️🚵🏽🚵🏽‍♂️🤸🏽‍♀️🤸🏽🤸🏽‍♂️🤽🏽‍♀️🤽🏽🤽🏽‍♂️🤾🏽‍♀️🤾🏽🤾🏽‍♂️🤹🏽‍♀️🤹🏽🤹🏽‍♂️🧘🏽‍♀️🧘🏽🧘🏽‍♂️🛀🏽🛌🏽',
            'Dark brown emojis': '👋🏾🤚🏾🖐🏾✋🏾🖖🏾👌🏾🤌🏾🤏🏾✌🏾🤞🏾🫰🏾🤟🏾🤘🏾🤙🏾🫵🏾🫱🏾🫲🏾🫸🏾🫷🏾🫳🏾🫴🏾👈🏾👉🏾👆🏾🖕🏾👇🏾☝🏾👍🏾👎🏾✊🏾👊🏾🤛🏾🤜🏾👏🏾🫶🏾🙌🏾👐🏾🤲🏾🙏🏾✍🏾💅🏾🤳🏾💪🏾🦵🏾🦶🏾👂🏾🦻🏾👃🏾👶🏾👧🏾🧒🏾👦🏾👩🏾🧑🏾👨🏾👩🏾‍🦱🧑🏾‍🦱👨🏾‍🦱👩🏾‍🦰🧑🏾‍🦰👨🏾‍🦰👱🏾‍♀️👱🏾👱🏾‍♂️👩🏾‍🦳🧑🏾‍🦳👨🏾‍🦳👩🏾‍🦲🧑🏾‍🦲👨🏾‍🦲🧔🏾‍♀️🧔🏾🧔🏾‍♂️👵🏾🧓🏾👴🏾👲🏾👳🏾‍♀️👳🏾👳🏾‍♂️🧕🏾👮🏾‍♀️👮🏾👮🏾‍♂️👷🏾‍♀️👷🏾👷🏾‍♂️💂🏾‍♀️💂🏾💂🏾‍♂️🕵🏾‍♀️🕵🏾🕵🏾‍♂️👩🏾‍⚕️🧑🏾‍⚕️👨🏾‍⚕️👩🏾‍🌾🧑🏾‍🌾👨🏾‍🌾👩🏾‍🍳🧑🏾‍🍳👨🏾‍🍳👩🏾‍🎓🧑🏾‍🎓👨🏾‍🎓👩🏾‍🎤🧑🏾‍🎤👨🏾‍🎤👩🏾‍🏫🧑🏾‍🏫👨🏾‍🏫👩🏾‍🏭🧑🏾‍🏭👨🏾‍🏭👩🏾‍💻🧑🏾‍💻👨🏾‍💻👩🏾‍💼🧑🏾‍💼👨🏾‍💼👩🏾‍🔧🧑🏾‍🔧👨🏾‍🔧👩🏾‍🔬🧑🏾‍🔬👨🏾‍🔬👩🏾‍🎨🧑🏾‍🎨👨🏾‍🎨👩🏾‍🚒🧑🏾‍🚒👨🏾‍🚒👩🏾‍✈️🧑🏾‍✈️👨🏾‍✈️👩🏾‍🚀🧑🏾‍🚀👨🏾‍🚀👩🏾‍⚖️🧑🏾‍⚖️👨🏾‍⚖️👰🏾‍♀️👰🏾👰🏾‍♂️🤵🏾‍♀️🤵🏾🤵🏾‍♂️👸🏾🫅🏾🤴🏾🥷🏾🦸🏾‍♀️🦸🏾🦸🏾‍♂️🦹🏾‍♀️🦹🏾🦹🏾‍♂️🤶🏾🧑🏾‍🎄🎅🏾🧙🏾‍♀️🧙🏾🧙🏾‍♂️🧝🏾‍♀️🧝🏾🧝🏾‍♂️🧛🏾‍♀️🧛🏾🧛🏾‍♂️🧜🏾‍♀️🧜🏾🧜🏾‍♂️🧚🏾‍♀️🧚🏾🧚🏾‍♂️👼🏾🤰🏾🫄🏾🫃🏾🤱🏾👩🏾‍🍼🧑🏾‍🍼👨🏾‍🍼🙇🏾‍♀️🙇🏾🙇🏾‍♂️💁🏾‍♀️💁🏾💁🏾‍♂️🙅🏾‍♀️🙅🏾🙅🏾‍♂️🙆🏾‍♀️🙆🏾🙆🏾‍♂️🙋🏾‍♀️🙋🏾🙋🏾‍♂️🧏🏾‍♀️🧏🏾🧏🏾‍♂️🤦🏾‍♀️🤦🏾🤦🏾‍♂️🤷🏾‍♀️🤷🏾🤷🏾‍♂️🙎🏾‍♀️🙎🏾🙎🏾‍♂️🙍🏾‍♀️🙍🏾🙍🏾‍♂️💇🏾‍♀️💇🏾💇🏾‍♂️💆🏾‍♀️💆🏾💆🏾‍♂️🧖🏾‍♀️🧖🏾🧖🏾‍♂️💃🏾🕺🏾🕴🏿👩🏾‍🦽🧑🏾‍🦽👨🏾‍🦽👩🏾‍🦼🧑🏾‍🦼👨🏾‍🦼🚶🏾‍♀️🚶🏾🚶🏾‍♂️👩🏾‍🦯🧑🏾‍🦯👨🏾‍🦯🧎🏾‍♀️🧎🏾🧎🏾‍♂️🏃🏾‍♀️🏃🏾🏃🏾‍♂️🧍🏾‍♀️🧍🏾🧍🏾‍♂️👭🏾🧑🏾‍🤝‍🧑🏾👬🏾👫🏾🧗🏾‍♀️🧗🏾🧗🏾‍♂️🏇🏾🏂🏾🏌🏾‍♀️🏌🏾🏌🏾‍♂️🏄🏾‍♀️🏄🏾🏄🏾‍♂️🚣🏾‍♀️🚣🏾🚣🏾‍♂️🏊🏾‍♀️🏊🏾🏊🏾‍♂️⛹🏾‍♀️⛹🏾⛹🏾‍♂️🏋🏾‍♀️🏋🏾🏋🏾‍♂️🚴🏾‍♀️🚴🏾🚴🏾‍♂️🚵🏾‍♀️🚵🏾🚵🏾‍♂️🤸🏾‍♀️🤸🏾🤸🏾‍♂️🤽🏾‍♀️🤽🏾🤽🏾‍♂️🤾🏾‍♀️🤾🏾🤾🏾‍♂️🤹🏾‍♀️🤹🏾🤹🏾‍♂️🧘🏾‍♀️🧘🏾🧘🏾‍♂️🛀🏾🛌🏾',
            'Black emojis': '👋🏿🤚🏿🖐🏿✋🏿🖖🏿👌🏿🤌🏿🤏🏿✌🏿🤞🏿🫰🏿🤟🏿🤘🏿🤙🏿🫵🏿🫱🏿🫲🏿🫸🏿🫷🏿🫳🏿🫴🏿👈🏿👉🏿👆🏿🖕🏿👇🏿☝🏿👍🏿👎🏿✊🏿👊🏿🤛🏿🤜🏿👏🏿🫶🏿🙌🏿👐🏿🤲🏿🙏🏿✍🏿💅🏿🤳🏿💪🏿🦵🏿🦶🏿👂🏿🦻🏿👃🏿👶🏿👧🏿🧒🏿👦🏿👩🏿🧑🏿👨🏿👩🏿‍🦱🧑🏿‍🦱👨🏿‍🦱👩🏿‍🦰🧑🏿‍🦰👨🏿‍🦰👱🏿‍♀️👱🏿👱🏿‍♂️👩🏿‍🦳🧑🏿‍🦳👨🏿‍🦳👩🏿‍🦲🧑🏿‍🦲👨🏿‍🦲🧔🏿‍♀️🧔🏿🧔🏿‍♂️👵🏿🧓🏿👴🏿👲🏿👳🏿‍♀️👳🏿👳🏿‍♂️🧕🏿👮🏿‍♀️👮🏿👮🏿‍♂️👷🏿‍♀️👷🏿👷🏿‍♂️💂🏿‍♀️💂🏿💂🏿‍♂️🕵🏿‍♀️🕵🏿🕵🏿‍♂️👩🏿‍⚕️🧑🏿‍⚕️👨🏿‍⚕️👩🏿‍🌾🧑🏿‍🌾👨🏿‍🌾👩🏿‍🍳🧑🏿‍🍳👨🏿‍🍳👩🏿‍🎓🧑🏿‍🎓👨🏿‍🎓👩🏿‍🎤🧑🏿‍🎤👨🏿‍🎤👩🏿‍🏫🧑🏿‍🏫👨🏿‍🏫👩🏿‍🏭🧑🏿‍🏭👨🏿‍🏭👩🏿‍💻🧑🏿‍💻👨🏿‍💻👩🏿‍💼🧑🏿‍💼👨🏿‍💼👩🏿‍🔧🧑🏿‍🔧👨🏿‍🔧👩🏿‍🔬🧑🏿‍🔬👨🏿‍🔬👩🏿‍🎨🧑🏿‍🎨👨🏿‍🎨👩🏿‍🚒🧑🏿‍🚒👨🏿‍🚒👩🏿‍✈️🧑🏿‍✈️👨🏿‍✈️👩🏿‍🚀🧑🏿‍🚀👨🏿‍🚀👩🏿‍⚖️🧑🏿‍⚖️👨🏿‍⚖️👰🏿‍♀️👰🏿👰🏿‍♂️🤵🏿‍♀️🤵🏿🤵🏿‍♂️👸🏿🫅🏿🤴🏿🥷🏿🦸🏿‍♀️🦸🏿🦸🏿‍♂️🦹🏿‍♀️🦹🏿🦹🏿‍♂️🤶🏿🧑🏿‍🎄🎅🏿🧙🏿‍♀️🧙🏿🧙🏿‍♂️🧝🏿‍♀️🧝🏿🧝🏿‍♂️🧛🏿‍♀️🧛🏿🧛🏿‍♂️🧜🏿‍♀️🧜🏿🧜🏿‍♂️🧚🏿‍♀️🧚🏿🧚🏿‍♂️👼🏿🤰🏿🫄🏿🫃🏿🤱🏿👩🏿‍🍼🧑🏿‍🍼👨🏿‍🍼🙇🏿‍♀️🙇🏿🙇🏿‍♂️💁🏿‍♀️💁🏿💁🏿‍♂️🙅🏿‍♀️🙅🏿🙅🏿‍♂️🙆🏿‍♀️🙆🏿🙆🏿‍♂️🙋🏿‍♀️🙋🏿🙋🏿‍♂️🧏🏿‍♀️🧏🏿🧏🏿‍♂️🤦🏿‍♀️🤦🏿🤦🏿‍♂️🤷🏿‍♀️🤷🏿🤷🏿‍♂️🙎🏿‍♀️🙎🏿🙎🏿‍♂️🙍🏿‍♀️🙍🏿🙍🏿‍♂️💇🏿‍♀️💇🏿💇🏿‍♂️💆🏿‍♀️💆🏿💆🏿‍♂️🧖🏿‍♀️🧖🏿🧖🏿‍♂️💃🏿🕺🏿🕴🏿👩🏿‍🦽🧑🏿‍🦽👨🏿‍🦽👩🏿‍🦼🧑🏿‍🦼👨🏿‍🦼🚶🏿‍♀️🚶🏿🚶🏿‍♂️👩🏿‍🦯🧑🏿‍🦯👨🏿‍🦯🧎🏿‍♀️🧎🏿🧎🏿‍♂️🏃🏿‍♀️🏃🏿🏃🏿‍♂️🧍🏿‍♀️🧍🏿🧍🏿‍♂️👭🏿🧑🏿‍🤝‍🧑🏿👬🏿👫🏿🧗🏿‍♀️🧗🏿🧗🏿‍♂️🏇🏿🏂🏿🏌🏿‍♀️🏌🏿🏌🏿‍♂️🏄🏿‍♀️🏄🏿🏄🏿‍♂️🚣🏿‍♀️🚣🏿🚣🏿‍♂️🏊🏿‍♀️🏊🏿🏊🏿‍♂️⛹🏿‍♀️⛹🏿⛹🏿‍♂️🏋🏿‍♀️🏋🏿🏋🏿‍♂️🚴🏿‍♀️🚴🏿🚴🏿‍♂️🚵🏿‍♀️🚵🏿🚵🏿‍♂️🤸🏿‍♀️🤸🏿🤸🏿‍♂️🤽🏿‍♀️🤽🏿🤽🏿‍♂️🤾🏿‍♀️🤾🏿🤾🏿‍♂️🤹🏿‍♀️🤹🏿🤹🏿‍♂️🧘🏿‍♀️🧘🏿🧘🏿‍♂️🛀🏿🛌🏿',
            'Animals and nature': '🐶🐱🐭🐹🐰🦊🐻🐼🐻‍❄️🐨🐯🦁🐮🐷🐽🐸🐵🙈🙉🙊🐒🐔🐧🐦🐦‍⬛🐤🐣🐥🦆🦅🦉🦇🐺🐗🐴🦄🐝🪱🐛🦋🐌🐞🐜🪰🪲🪳🦟🦗🕷🕸🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🪼🪸🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🫏🦍🦧🦣🐘🦛🦏🐪🐫🦒🦘🦬🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🫎🐕🐩🦮🐕‍🦺🐈🐈‍⬛🪽🪶🐓🦃🦤🦚🦜🦢🪿🦩🕊🐇🦝🦨🦡🦫🦦🦥🐁🐀🐿🦔🐾🐉🐲🌵🎄🌲🌳🌴🪹🪺🪵🌱🌿☘️🍀🎍🪴🎋🍃🍂🍁🍄🐚🪨🌾💐🌷🪷🌹🥀🌺🌸🪻🌼🌻🌞🌝🌛🌜🌚🌕🌖🌗🌘🌑🌒🌓🌔🌙🌎🌍🌏🪐💫⭐️🌟✨⚡️☄️💥🔥🌪🌈☀️🌤⛅️🌥☁️🌦🌧⛈🌩🌨❄️☃️⛄️🌬💨💧💦🫧☔️☂️🌊🌫',
            'Food and drink': '🍏🍎🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🫛🥬🥒🌶🫑🌽🥕🫒🧄🧅🫚🥔🍠🫘🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🫓🥪🥙🧆🌮🌯🫔🥗🥘🫕🥫🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜🍯🥛🍼🫖☕️🍵🧃🥤🧋🫙🍶🍺🍻🥂🍷🫗🥃🍸🍹🧉🍾🧊🥄🍴🍽🥣🥡🥢🧂',
            'Activity and sports': '⚽️🏀🏈⚾️🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🪃🥅⛳️🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸🥌🎿⛷🏂🪂🏋️‍♀️🏋️🏋️‍♂️🤼‍♀️🤼🤼‍♂️🤸‍♀️🤸🤸‍♂️⛹️‍♀️⛹️⛹️‍♂️🤺🤾‍♀️🤾🤾‍♂️🏌️‍♀️🏌️🏌️‍♂️🏇🧘‍♀️🧘🧘‍♂️🏄‍♀️🏄🏄‍♂️🏊‍♀️🏊🏊‍♂️🤽‍♀️🤽🤽‍♂️🚣‍♀️🚣🚣‍♂️🧗‍♀️🧗🧗‍♂️🚵‍♀️🚵🚵‍♂️🚴‍♀️🚴🚴‍♂️🏆🥇🥈🥉🏅🎖🏵🎗🎫🎟🎪🤹🤹‍♂️🤹‍♀️🎭🩰🎨🎬🎤🎧🎼🎹🥁🪘🪇🎷🎺🪗🎸🪕🎻🪈🎲♟🎯🎳🎮🎰🧩',
            'Travel and places': '🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🛻🚚🚛🚜🦯🦽🦼🛴🚲🛵🏍🛺🚨🚔🚍🚘🚖🛞🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉✈️🛫🛬🛩💺🛰🚀🛸🚁🛶⛵️🚤🛥🛳⛴🚢⚓️🛟🪝⛽️🚧🚦🚥🚏🗺🗿🗽🗼🏰🏯🏟🎡🎢🛝🎠⛲️⛱🏖🏝🏜🌋⛰🏔🗻🏕⛺️🛖🏠🏡🏘🏚🏗🏭🏢🏬🏣🏤🏥🏦🏨🏪🏫🏩💒🏛⛪️🕌🕍🛕🕋⛩🛤🛣🗾🎑🏞🌅🌄🌠🎇🎆🌇🌆🏙🌃🌌🌉🌁',
            'Objects': '⌚️📱📲💻⌨️🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎️📟📠📺📻🎙🎚🎛🧭⏱⏲⏰🕰⌛️⏳📡🔋🪫🔌💡🔦🕯🪔🧯🛢🛍️💸💵💴💶💷🪙💰💳💎⚖️🪮🪜🧰🪛🔧🔨⚒🛠⛏🪚🔩⚙️🪤🧱⛓🧲🔫💣🧨🪓🔪🗡⚔️🛡🚬⚰️🪦⚱️🏺🔮📿🧿🪬💈⚗️🔭🔬🕳🩹🩺🩻🩼💊💉🩸🧬🦠🧫🧪🌡🧹🪠🧺🧻🚽🚰🚿🛁🛀🧼🪥🪒🧽🪣🧴🛎🔑🗝🚪🪑🛋🛏🛌🧸🪆🖼🪞🪟🛍🛒🎁🎈🎏🎀🪄🪅🎊🎉🪩🎎🏮🎐🧧✉️📩📨📧💌📥📤📦🏷🪧📪📫📬📭📮📯📜📃📄📑🧾📊📈📉🗒🗓📆📅🗑🪪📇🗃🗳🗄📋📁📂🗂🗞📰📓📔📒📕📗📘📙📚📖🔖🧷🔗📎🖇📐📏🧮📌📍✂️🖊🖋✒️🖌🖍📝✏️🔍🔎🔏🔐🔒🔓',
            'Symbols': '❤️🩷🧡💛💚💙🩵💜🖤🩶🤍🤎❤️‍🔥❤️‍🩹💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🪯🕉☸️✡️🔯🕎☯️☦️🛐⛎♈️♉️♊️♋️♌️♍️♎️♏️♐️♑️♒️♓️🆔⚛️🉑☢️☣️📴📳🈶🈚️🈸🈺🈷️✴️🆚💮🉐㊙️㊗️🈴🈵🈹🈲🅰️🅱️🆎🆑🅾️🆘❌⭕️🛑⛔️📛🚫💯💢♨️🚷🚯🚳🚱🔞📵🚭❗️❕❓❔‼️⁉️🔅🔆〽️⚠️🚸🔱⚜️🔰♻️✅🈯️💹❇️✳️❎🌐💠Ⓜ️🌀💤🏧🚾♿️🅿️🛗🈳🈂️🛂🛃🛄🛅🚹🚺🚼⚧🚻🚮🎦🛜📶🈁🔣ℹ️🔤🔡🔠🆖🆗🆙🆒🆕🆓0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟🔢#️⃣*️⃣⏏️▶️⏸⏯⏹⏺⏭⏮⏩⏪⏫⏬◀️🔼🔽➡️⬅️⬆️⬇️↗️↘️↙️↖️↕️↔️↪️↩️⤴️⤵️🔀🔁🔂🔄🔃🎵🎶➕➖➗✖️🟰♾💲💱™️©️®️〰️➰➿🔚🔙🔛🔝🔜✔️☑️🔘🔴🟠🟡🟢🔵🟣⚫️⚪️🟤🔺🔻🔸🔹🔶🔷🔳🔲▪️▫️◾️◽️◼️◻️🟥🟧🟨🟩🟦🟪⬛️⬜️🟫🔈🔇🔉🔊🔔🔕📣📢👁‍🗨💬💭🗯♠️♣️♥️♦️🃏🎴🀄️🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧',
            'Non-emoji symbols': '✢✣✤✥✦✧★☆✯✡︎✩✪✫✬✭✮✶✷✵✸✹→⇒⟹⇨⇾➾⇢☛☞➔➜➙➛➝➞♠︎♣︎♥︎♦︎♤♧♡♢♚♛♜♝♞♟♔♕♖♗♘♙⚀⚁⚂⚃⚄⚅🂠⚈⚉⚆⚇𓀀𓀁𓀂𓀃𓀄𓀅𓀆𓀇𓀈𓀉𓀊𓀋𓀌𓀍𓀎𓀏𓀐𓀑𓀒𓀓𓀔𓀕𓀖𓀗𓀘𓀙𓀚𓀛𓀜𓀝',
            'Flags': '🏳️🏴🏁🚩🏳️‍🌈🏳️‍⚧️🏴‍☠️🇦🇫🇦🇽🇦🇱🇩🇿🇦🇸🇦🇩🇦🇴🇦🇮🇦🇶🇦🇬🇦🇷🇦🇲🇦🇼🇦🇺🇦🇹🇦🇿🇧🇸🇧🇭🇧🇩🇧🇧🇧🇾🇧🇪🇧🇿🇧🇯🇧🇲🇧🇹🇧🇴🇧🇦🇧🇼🇧🇷🇮🇴🇻🇬🇧🇳🇧🇬🇧🇫🇧🇮🇰🇭🇨🇲🇨🇦🇮🇨🇨🇻🇧🇶🇰🇾🇨🇫🇹🇩🇨🇱🇨🇳🇨🇽🇨🇨🇨🇴🇰🇲🇨🇬🇨🇩🇨🇰🇨🇷🇨🇮🇭🇷🇨🇺🇨🇼🇨🇾🇨🇿🇩🇰🇩🇯🇩🇲🇩🇴🇪🇨🇪🇬🇸🇻🇬🇶🇪🇷🇪🇪🇪🇹🇪🇺🇫🇰🇫🇴🇫🇯🇫🇮🇫🇷🇬🇫🇵🇫🇹🇫🇬🇦🇬🇲🇬🇪🇩🇪🇬🇭🇬🇮🇬🇷🇬🇱🇬🇩🇬🇵🇬🇺🇬🇹🇬🇬🇬🇳🇬🇼🇬🇾🇭🇹🇭🇳🇭🇰🇭🇺🇮🇸🇮🇳🇮🇩🇮🇷🇮🇶🇮🇪🇮🇲🇮🇱🇮🇹🇯🇲🇯🇵🎌🇯🇪🇯🇴🇰🇿🇰🇪🇰🇮🇽🇰🇰🇼🇰🇬🇱🇦🇱🇻🇱🇧🇱🇸🇱🇷🇱🇾🇱🇮🇱🇹🇱🇺🇲🇴🇲🇰🇲🇬🇲🇼🇲🇾🇲🇻🇲🇱🇲🇹🇲🇭🇲🇶🇲🇷🇲🇺🇾🇹🇲🇽🇫🇲🇲🇩🇲🇨🇲🇳🇲🇪🇲🇸🇲🇦🇲🇿🇲🇲🇳🇦🇳🇷🇳🇵🇳🇱🇳🇨🇳🇿🇳🇮🇳🇪🇳🇬🇳🇺🇳🇫🇰🇵🇲🇵🇳🇴🇴🇲🇵🇰🇵🇼🇵🇸🇵🇦🇵🇬🇵🇾🇵🇪🇵🇭🇵🇳🇵🇱🇵🇹🇵🇷🇶🇦🇷🇪🇷🇴🇷🇺🇷🇼🇼🇸🇸🇲🇸🇦🇸🇳🇷🇸🇸🇨🇸🇱🇸🇬🇸🇽🇸🇰🇸🇮🇬🇸🇸🇧🇸🇴🇿🇦🇰🇷🇸🇸🇪🇸🇱🇰🇧🇱🇸🇭🇰🇳🇱🇨🇵🇲🇻🇨🇸🇩🇸🇷🇸🇿🇸🇪🇨🇭🇸🇾🇹🇼🇹🇯🇹🇿🇹🇭🇹🇱🇹🇬🇹🇰🇹🇴🇹🇹🇹🇳🇹🇷🇹🇲🇹🇨🇹🇻🇻🇮🇺🇬🇺🇦🇦🇪🇬🇧🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿🇺🇳🇺🇸🇺🇾🇺🇿🇻🇺🇻🇦🇻🇪🇻🇳🇼🇫🇪🇭🇾🇪🇿🇲🇿🇼'
        };  
    }
    base64ToBytes( base64 )
    {
        const binString = atob( base64 );
        return Uint8Array.from( binString, ( m ) => m.codePointAt( 0 ) );
    }
    bytesToBase64( bytes ) 
    {
        const binString = Array.from( bytes, ( x ) => String.fromCodePoint( x ) ).join( '' );
        return btoa( binString );
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIChatlog';
        
        let data = '\
        <div class="Topic"></div>\
        <div class="Messages"><div class="Incoming"></div><div class="Queue"></div></div>\
        <div class="Input"></div>\
        <div class="ChannelInfo"><div class="ChannelTopic"><div class="Close"></div><div class="Title"></div></div><div class="Info"></div></div>\
        ';
        
        // Hide the chat icon by adding the Chatroom class
        // TODO: Don't do this once we got group video chat
        if( this.options.type == 'chatroom' )
		{
			data = data.split( '"Topic"' ).join( '"Topic Chatroom"' );
		}
        
        this.domElement.innerHTML = data;
        
        this.domTopic = this.domElement.querySelector( '.Topic' );
        this.domChannelInfo = this.domElement.querySelector( '.ChannelInfo' );
        this.domChannelInfo.querySelector( '.Close' ).onclick = function()
        {
        	self.domChannelInfo.classList.remove( 'Showing' );
        	self.domElement.classList.remove( 'ChannelInfoShowing' );
        }
        
        this.domTopic.onclick = function()
        {
        	let tt = self.options.type == 'chatroom' ? i18n( 'i18n_group_info' ) : i18n( 'i18n_user_info' );
        	self.domChannelInfo.querySelector( '.Title' ).innerHTML = tt;
        
        	let info = self.domChannelInfo.querySelector( '.Info' );
        	info.innerHTML = '';
        
        	if( self.options.type == 'chatroom' )
        	{
        		let contacts = FUI.getElementByUniqueId( 'contacts' );
        		if( !contacts ) return;
		    	let i = new Image();
				let std = {
					"method": "getroomavatar",
					"groupid": self.options.cid
				};
				i.src = '/system.library/module/?module=system&command=convos&args=' + encodeURIComponent( JSON.stringify( std ) ) + '&authid=' + Application.authId;
				let d = document.createElement( 'div' );
			    d.className = 'Avatar';
				i.onload = function()
				{
				    d.classList.add( 'Loaded' );
				    d.style.backgroundImage = 'url(' + this.src + ')';
				}
			    info.appendChild( d );
			    
			    let ds = document.createElement( 'div' );
			    ds.className = 'Description';
			    ds.innerHTML = '<p>' + contacts.record.Description.split( "\n" ).join( "<br>" ) + '</p>';
			    info.appendChild( ds );
        	}
        	else
        	{
        		let contacts = FUI.getElementByUniqueId( 'contacts' );
        		if( !contacts ) return;
		    	let i = new Image();
				i.src = '/system.library/module/?module=system&command=getavatar&userid=' + contacts.userList[ self.options.cid ].userid + '&width=128&height=128&authid=' + Application.authId;
				i.onload = function()
				{
				    let d = document.createElement( 'div' );
				    d.className = 'Avatar';
				    d.style.backgroundImage = 'url(' + this.src + ')';
				    info.appendChild( d );
				}
			}
        
        	self.domChannelInfo.classList.add( 'Showing' );
        	self.domElement.classList.add( 'ChannelInfoShowing' );
        }
        
        this.domMessages = this.domElement.querySelector( '.Messages' );
        this.domInput = this.domElement.querySelector( '.Input' );
        
        if( this.options.name )
        {
        	if( this.options.type == 'jeanie' )
        	{
        		let text = this.options.name;
		        try
		        {
		            let dec = new TextDecoder().decode( self.base64ToBytes( text ) );
		            text = dec;
		        }
		        catch( e ){};
		        this.domTopic.innerHTML = text;
        	}
        	else
        	{
		        this.domTopic.innerHTML = this.options.name;
	        }
        }
            
        if( this.options.parentElement )
        {
            let par = document.createElement( 'div' );
            par.className = 'ParentLink';
            par.innerHTML = '';
            par.onclick = function()
            {
                let p = FUI.getElementByUniqueId( self.options.parentElement );
                p.contactsMode();
            }
            this.domTopic.appendChild( par );
            
            let us = document.createElement( 'div' );
            us.className = 'Users';
            us.innerHTML = '';
            us.onclick = function()
            {
                let p = FUI.getElementByUniqueId( self.options.parentElement );
                p.toggleUsers();
            }
            this.domTopic.appendChild( us );
            
            let vid = document.createElement( 'div' );
            vid.className = 'Video';
            vid.title = i18n( 'i18n_init_video_call' );
            vid.innerHTML = '';
            vid.onclick = function( e )
            {
            	let c = FUI.getElementByUniqueId( 'contacts' );
            	if( c )
            	{
            		cancelBubble( e );
            		return c.initVideoChat( false );
        		}
            }
            this.domTopic.appendChild( vid );
        }
        
        this.domMessages.addEventListener( 'scrollend', function( e )
        {
        	// We are at bottom
        	if( Math.ceil( self.domMessages.scrollTop ) == self.domMessages.scrollHeight - self.domMessages.offsetHeight )
        	{
        		self.hasScrolled = false;
        	}
        } );
        
        this.domMessages.addEventListener( 'scroll', function( e )
        {
        	// Did we scroll up?
        	if( self.domMessages.scrollTop < self.prevScrollTop )
        		self.hasScrolled = true;
    		
    		self.prevScrollTop = self.domMessages.scrollTop;
    		
    		if( self.scrollEndTimeo )
    			clearTimeout( self.scrollEndTimeo );
			self.scrollEndTimeo = setTimeout( function()
			{
				self.scrollEndTimeo = null;
				if( self.scrollEndEvent )
				{
					self.scrollEndEvent();
					self.scrollEndEvent = null;
				}
			}, 50 );
    		
    		self.checkUnloadedVisibleElements();
        	self.checkSeen();
        	
        	if( self.scrollFunction )
        	{
        		self.scrollFunction();
        		return cancelBubble( e );
        	}
        	if( self.domMessages.scrollTop == 0 )
        	{
        		function fetchHistory()
        		{
        			let firstMessage = self.domMessages.querySelector( '.Incoming' ).querySelector( '.Slot' );
        			if( !firstMessage ) return;
        			firstMessage = firstMessage.querySelector( '.Message' );
        			firstMessage = firstMessage.getAttribute( 'slotid' );
        			if( !firstMessage ) return;
	    			firstMessage = firstMessage.split( '-' )[1];
	    			let m = new Module( 'system' );
	    			m.onExecuted = function( me, md )
	    			{
	    				if( self.destroying ) return;
	    				if( me == 'ok' )
	    				{
	    					let news = JSON.parse( md );
	    					self.addMessages( news.messages, { history: true } );
	    				}
	    			}
	    			m.execute( 'convos', { method: 'messages', mode: 'history', startMessage: firstMessage, roomType: self.options.type, cid: self.options.cid } );
        		}
        		if( self.scrollTimeo )
        		{
        			clearTimeout( self.scrollTimeo );
        			self.scrollTimeo = setTimeout( function(){ fetchHistory(); }, 250 );
        			return;
    			}
    			self.scrollTimeo = true;
    			fetchHistory();
        	}
        } );
        
        this.initDomInput();
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    initDomInput()
    {
    	let self = this;
    	
    	function clearActive( exception )
    	{
    	    let divs = self.domInput.getElementsByClassName( 'InputButton' );
    	    for( let a = 0; a < divs.length; a++ )
    	    {
    	        if( divs[ a ] == exception )
    	            divs[ a ].classList.add( 'Active' );
                else 
                {
                    divs[ a ].classList.remove( 'Active' );
                    if( divs[ a ].popWidget )
                        divs[ a ].popWidget.destroy();
                }
    	    }
    	}
    	
    	this.domInput.innerHTML = '\
    		<div class="Tools"><div class="MobileMen InputButton"></div><div class="Upload InputButton"></div><div class="Search InputButton"></div><div class="Emote InputButton"></div></div><div contenteditable="true" class="Textarea"></div><div class="Send"></div>\
    	';
    	this.domTextarea = this.domInput.querySelector( '.Textarea' );
    	this.domInput.querySelector( '.MobileMen' ).onclick = function()
    	{
    	    if( this.classList.contains( 'Active' ) )
    	    {
    	        this.classList.remove( 'Active' );
    	        if( this.popWidget )
    	            this.popWidget.destroy();
    	        this.popWidget = null;
    	    }
    	    else
    	    {
    	        clearActive( this );
	        }
    	}
    	this.domInput.querySelector( '.Send' ).onclick = function()
    	{
    	    let val = self.domTextarea.innerText;
    	    if( val.split( ' ' ).join( '' ).length <= 0 )
		        return;
		    val = self.domTextarea.innerHTML;
			self.domTextarea.innerHTML = '';	
			self.domTextarea.checkHeight();
			self.queueMessage( val );
    	}
    	this.domInput.querySelector( '.Emote' ).onclick = function()
    	{
    	    if( this.classList.contains( 'Active' ) )
    	    {
    	        this.classList.remove( 'Active' );
    	        if( this.popWidget )
    	            this.popWidget.destroy();
    	        this.popWidget = null;
    	    }
    	    else
    	    {
    	        clearActive( this );
    	        
    	        let str = '';
                for( let a in self.emojis )
                {
                    str += '<p><strong class="Header">' + a + '</strong></p><div class="EmojiList">';
                    let emojilist = self.emojis[ a ];
                    for( let b = 0; b < emojilist.length; b++ )
                    {
                        let code = emojilist.codePointAt( b );
                        str += '<span class="Emoticon" attr="' + code + '">' + emojilist[ b ] + '</span>';
                    }
                    str += '</div>';
                }
    	        
    	        this.classList.add( 'Active' );
    	        let d = document.createElement( 'div' );
    	        document.body.appendChild( d );
    	        let s = this;
    	        this.popWidget = new FUIPopwidget( { 
    	            placeholderElement: d, 
    	            originElement: isMobile ? self.domInput.querySelector( '.MobileMen' ) : this, 
    	            width: 480, 
    	            height: 480, 
    	            content: str,
    	            blocker: true,
    	            clickCallback: function( e )
    	            {
    	                if( e.target && e.target.nodeName == 'SPAN' )
    	                {
    	                    let code = e.target.getAttribute( 'attr' );
                            let sel, range;
                            let node = document.createElement( 'span' );
                            node.setAttribute( 'contenteditable', 'false' );
                            node.className = 'Emoticon';
                            node.innerHTML = String.fromCodePoint( code );
                            
                            s.popWidget.destroy();
    	                    s.classList.remove( 'Active' );
    	                    let ele = isMobile ? self.domInput.querySelector( '.MobileMen' ) : false;
	                        if( ele ) ele.classList.remove( 'Active' );
                            
                            if( window.getSelection )
                            {
                                sel = window.getSelection();
                                if( sel.getRangeAt && sel.rangeCount )
                                {
                                    e.target.setAttribute( 'contenteditable', 'false' );
                                    range = sel.getRangeAt( 0 );
                                    range.deleteContents();
                                    range.insertNode( node );
                                    range.collapse( true );
                                    self.domTextarea.focus();
                                    return;
                                }
                            } 
                            self.domTextarea.appendChild( node );
                            self.domTextarea.focus();
	                    }
	                    else
	                    {
	                        s.popWidget.destroy();
	                        s.classList.remove( 'Active' );
	                        let ele = isMobile ? self.domInput.querySelector( '.MobileMen' ) : false;
	                        if( ele ) ele.classList.remove( 'Active' );
                        }
    	            }
	            } );
	            this.popWidget.onDestroy = function()
	            {
	            	s.classList.remove( 'Active' );
	            }
    	    }
    	}
    	this.domInput.querySelector( '.Upload' ).onclick = function()
    	{
    		if( isMobile )
    		{
    			DirectUpload( 'Home:Uploads/', function( response )
    			{
    				if( response.path && response.result )
    				{
    					let ext = GetFilenameExtension( response.path );
						switch( ext )
						{
							case 'jpeg':
							case 'jpg':
							case 'png':
							case 'gif':
								self.shareImageAndPost( response.path );
								break;
							default:
								self.shareFileAndPost( response.path );
								break;
						}
    				}
    			} );
    			return;
    		}
    	    let s = this;
    	    if( this.classList.contains( 'Active' ) )
    	    {
    	        this.classList.remove( 'Active' );
    	        if( this.popWidget )
    	            this.popWidget.destroy();
    	        this.popWidget = null;
    	    }
    	    else
    	    {
    	        clearActive( this );
    	        this.classList.add( 'Active' );
    	        
    	        let flags = {
					multiSelect: false,
					triggerFunction: function( arr )
					{
						s.classList.remove( 'Active' );
						
						for( let a = 0; a < arr.length; a++ )
						{
							let ext = GetFilenameExtension( arr[ a ].Path );
							switch( ext )
							{
								case 'jpeg':
								case 'jpg':
								case 'png':
								case 'gif':
									self.shareImageAndPost( arr[ a ].Path );
									break;
								default:
									self.shareFileAndPost( arr[ a ].Path );
									break;
							}
						}
					},
					path: false,
					rememberPath: true,
					type: 'load'
				};
			
				new Filedialog( flags );
    	    }
    	}
    	this.domInput.querySelector( '.Search' ).onclick = function()
    	{
    	    if( this.classList.contains( 'Active' ) )
    	    {
    	    	document.body.classList.remove( 'Search' );
    	    	self.domElement.classList.remove( 'Search' );
    	        this.classList.remove( 'Active' );
    	        self.clearSearchFilter();
    	    }
    	    else
    	    {
    	        document.body.classList.add( 'Search' );
    	        self.domElement.classList.add( 'Search' );
    	        clearActive( this );
    	        self.executeSearchFilter();
    	    }   
    	}
    	this.domTextarea.checkHeight = function()
    	{
    	    if( this.offsetHeight > 50 )
    	    {
    	        this.style.top = 50 - this.offsetHeight + 'px';
    	        this.classList.add( 'Grown' );
    	    }
    	    else
    	    {
    	        this.style.top = 0;
    	        this.classList.remove( 'Grown' );
    	    }
    	}
    	this.domTextarea.addEventListener( 'keyup', function( e )
    	{
    	    let s = this;
    	    
    	    if( e.which == 16 )
    	    {
    	        this.shiftKey = false;
	        }
	        this.checkHeight();
	        
	        let str = s.innerHTML.split( /\<.*?\>/i ).join( '' ).split( "\n" ).join( '' ).split( ' ' ).join( '' );
	        
	        // Leave this for now
	        if( document.body.classList.contains( 'Search' ) )
	        {
	        	return;
	        }
	        
	        if( str.length > 0 )
    		{
    			if( s.timeo )
    			{
    				clearTimeout( s.timeo );
    			}
				s.timeo = setTimeout( function()
				{
					s.timeo = false;
					let strnow = s.innerHTML.split( /\<.*?\>/i ).join( '' ).split( "\n" ).join( '' ).split( ' ' ).join( '' );
					if( strnow.length > 0 )
					{
						if( s.lastMessage == 'writing' ) return;
						s.lastMessage = 'writing';
						
						Application.SendChannelMsg( {
							command: 'signal',
							signal: 'writing',
							sender: Application.fullName,
							senderId: Application.uniqueId
						} );
					}
				}, 250 );
			}
    		else
    		{
    			if( s.timeo )
    			{
	    			clearTimeout( s.timeo );
	    			s.timeo = false;
    			}
    			if( s.lastMessage == 'not-writing' ) return;
    			s.lastMessage = 'not-writing';
    			
    			Application.SendChannelMsg( {
					command: 'signal',
					signal: 'not-writing',
					sender: Application.fullName,
					senderId: Application.uniqueId
				} );
    		}
    	} );
    	this.domTextarea.addEventListener( 'paste', function( e )
    	{
    		let s = this;
    		self.handlePasteEvent( e, s );
    	} );
    	this.domTextarea.addEventListener( 'keydown', function( e )
    	{
    	    if( e.which == 16 )
    	    {
    	        this.shiftKey = true;
	        }
    		else if( e.which == 13 )
    		{
    		    if( this.shiftKey )
    		    {
    		        this.checkHeight();
    		        return;
		        }
		        
    		    let val = self.domTextarea.innerText;
        	    if( val.split( ' ' ).join( '' ).length <= 0 )
        	    {
        	        this.checkHeight();
		            return;
	            }
	            
	            // Leave this for now
			    if( document.body.classList.contains( 'Search' ) )
			    {
			    	return;
			    }
	            
		        val = self.domTextarea.innerHTML;
			    self.domTextarea.innerHTML = '';	
    			cancelBubble( e );
    			
    			// Check white space
    			let candidate = val.split( /\<.*?\>/ ).join( '' );
    			candidate = candidate.split( /[\s]/ ).join( '' ).split( '&nbsp;' ).join( '' );
    			
    			if( candidate.length )
    			{
    				self.queueMessage( val );
				}
    		}
    		this.checkHeight();
		} );
    	this.domTextarea.addEventListener( 'keyup', function( e )
    	{
    		if( self.domElement.classList.contains( 'Search' ) )
    		{
    			self.executeSearchFilter();
			}
			else
			{
				self.domElement.searchString = '';
				self.clearSearchFilter();
			}
    		
    	} );
    }
    executeSearchFilter()
    {
    	let self = this;
    	let searchString = Trim( self.domTextarea.innerText ).toLowerCase();
			self.domElement.searchString = searchString;
    	if( this.esfTimeo ) clearTimeout( this.esfTimeo );
    	this.esfTimeo = setTimeout( function()
    	{
			let searchString = self.domElement.searchString;
			let messages = self.domElement.querySelector( '.Messages' ).getElementsByClassName( 'Message' );
			for( let a = 0; a < messages.length; a++ )
			{
				let t = messages[ a ].querySelector( '.Text' );
				if( t && t.innerText.toLowerCase().indexOf( searchString ) < 0 )
				{
					messages[ a ].style.display = 'none';
					messages[ a ].setAttribute( 'hidden', 'hidden' );
				}
				else
				{
					messages[ a ].style.display = '';
					messages[ a ].removeAttribute( 'hidden' );
				}
			}
			self.refreshDom();
		}, 250 );
    }
    clearSearchFilter()
    {
    	let self = this;
    	if( this.csfTimeo ) clearTimeout( this.csfTimeo );
    	this.csfTimeo = setTimeout( function()
    	{
    		self.csfTimeo = null;
			let messages = self.domElement.querySelector( '.Messages' ).getElementsByClassName( 'Message' );
			for( let a = 0; a < messages.length; a++ )
			{
				messages[ a ].style.display = '';
				messages[ a ].removeAttribute( 'hidden' );
			}
			self.refreshDom();
		}, 250 );
    }
    parseDate( instr, full = false, tz = false )
    {
        let now  = tz ? ( new Date( new Date(       ).toLocaleString( 'en-US', { timeZone: tz } ) ) ) : new Date();        
        
        // Make diff
        let dif1 = tz ? ( new Date( new Date().toLocaleString( 'en-US', { timeZone: tz } ) ) ) : new Date( instr );
        let dif2 = new Date();
        
        // Fix the time difference
        instr -= ( dif1.getTime() - dif2.getTime() );
        
        let time = tz ? ( new Date( new Date( instr ).toLocaleString( 'en-US', { timeZone: tz } ) ) ) : new Date( instr );
        
        let test = time.getFullYear() + '-' + StrPad( time.getMonth() + 1, 2, '0' ) + '-' + StrPad( time.getDate(), 2, '0' ) + 
        	' ' + StrPad( time.getHours(), 2, '0' ) + ':' + StrPad( time.getMinutes(), 2, '0' ) + ':' + StrPad( time.getSeconds(), 2, '0' );
        
        let secs = Math.floor( now.getTime() / 1000 ) - Math.floor( time.getTime() / 1000 );
        let mins = Math.floor( secs / 60 );
        
        if( !full )
        {
		    if( secs <= 60 )
		    {
		        if( secs < 1 )
		        {
		            return i18n( 'i18n_just_now' );
		        }
		        return secs.toFixed( 0 ) + ' ' + i18n( 'i18n_seconds_ago' ) + '.';
		    }
		    else if( secs <= 3600 )
		    {
		        return mins + ' ' + i18n( 'i18n_minutes_ago' ) + '.';
		    }
		    else if( secs <= 86400 )
		    {
		        return Math.floor( secs / 60 / 60 ) + ' ' + i18n( 'i18n_hours_ago' );
		    }
	    }
        instr = this.getMonthName( time.getMonth() ) + ' ' + this.getDay( time.getDate() ) + ', ' + time.getFullYear();
        if( test == instr.substr( 0, test.length ) )
            return instr.substr( test.length, instr.length - test.length );
        return instr;
    }
    getMonthName( num )
    {
    	let months = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ];
    	return i18n( 'i18n_' + months[ num ] );
    }
    getDay( num )
    {
    	return num;
    }
    // Share an image and post it
    shareImageAndPost( path )
    {
    	let self = this;
    	let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( self.destroying ) return;
			if( me == 'ok' )
			{
				let res = JSON.parse( md );
				let i = new Image();
				i.src = res.url + '&authid=' + Application.authId;
				i.onload = function()
				{
					self.queueMessage( '<attachment type="' + res.type + '" image="' + res.url + '" width="' + this.naturalWidth + '" height="' + this.naturalHeight + '"/>' );
				}
			}
		}
		let zmsg = { method: 'addupload', path: path, type: 'image' };
		if( self.options.type == 'dm-user' )
		{
			zmsg.userId = self.options.cid;
		}
		else if( self.options.type == 'jeanie' )
		{
			zmsg.context = 'jeanie';
		}
		else
		{
			zmsg.groupId = self.options.cid;
		}
		m.execute( 'convos', zmsg );
    }
    // Share a file and post it
    shareFileAndPost( path )
    {
    	let self = this;
    	let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( self.destroying ) return;
			if( me == 'ok' )
			{
				let res = JSON.parse( md );
				if( GetFilenameExtension( path ) == 'pdf' )
				{
					self.queueMessage( '<attachment type="pdf" file="' + res.url + '" filename="' + GetFilename( path ) + '"/>' );
				}
				else self.queueMessage( '<attachment type="download" file="' + res.url + '" filename="' + GetFilename( path ) + '"/>' );
			}
		}
		let zmsg = { method: 'addupload', path: path, type: 'file' };
		if( self.options.type == 'dm-user' )
		{
			zmsg.userId = self.options.cid;
		}
		else if( self.options.type == 'jeanie' )
		{
			zmsg.context = 'jeanie';
		}
		else
		{
			zmsg.groupId = self.options.cid;
		}
		m.execute( 'convos', zmsg );
    }
    // Just updates a message
    updateMessage( messageId, content )
    {
    	let self = this;
    	let messages = self.domMessages.getElementsByClassName( 'Message' );
    	for( let a = 0; a < messages.length; a++ )
    	{
    		if( messages[ a ].getAttribute( 'mid' ) == messageId )
    		{
    			let t = messages[ a ].querySelector( '.Text' );
    			if( t )
    			{
    				let text = content;
    				try
				    {
				        let dec = new TextDecoder().decode( self.base64ToBytes( text ) );
				        text = dec;
				    }
				    catch( e ){};
    				t.innerHTML = self.replaceEmojis( self.replaceUrls( text ) );
    			}
    		}
    	}
    }
    // Just updates a message
    removeMessage( messageId )
    {
    	let self = this;
    	let messages = self.domMessages.getElementsByClassName( 'Message' );
    	for( let a = 0; a < messages.length; a++ )
    	{
    		if( messages[ a ].getAttribute( 'mid' ) == messageId )
    		{
    			messages[ a ].parentNode.removeChild( messages[ a ] );
    		}
    	}
    	this.refreshDom();
    }
    // Adds messages to a list locked by sorted timestamps
    addMessages( messageList, flags = false )
    {
        let self = this;
        
        // We are busy adding messages, try later
        if( self.busyMessages )
        {
        	return setTimeout( function(){ self.addMessages( messageList, flags ); }, 100 );
        }
        
        // Now we are busy
        self.busyMessages = true;
        
        // Fix the unread messages
        if( self.options.type == 'chatroom' && window.unreadMessages && unreadMessages.rooms[ self.options.cid ] )
        {
        	unreadMessages.rooms[ self.options.cid ] = [];
        	let cnvs = FUI.getElementByUniqueId( 'convos' );
        	cnvs.updateActivityBubble();
        }
        // Same for users
        else if( self.options.type == 'dm-user' && window.unreadMessages && unreadMessages.dms[ self.options.cid ] )
        {
        	unreadMessages.dms[ self.options.cid ] = [];
        	let cts = FUI.getElementByUniqueId( 'contacts' );
        	cts.updateActivityBubble();
        }
        
        let history = false;
        if( flags && flags.history )
        	history = true;
        
        // Check if we have scrolled
        let scrolled = this.checkScrolled();
       
       	// Current scroll height
        let currScrollHeight = self.domMessages.scrollHeight;
       
        let newMessages = [];
        let firstMessage = self.domMessages.querySelector( '.Message' );
        
        // Add oldest messages first
        for( let a = messageList.length - 1; a >= 0; a-- )
        {
            let m = messageList[a];
            
            if( !m.ID ) continue; // Skip unregistered messages
            
            // Find highest message ID
            if( parseInt( m.ID ) > self.lastId )
                self.lastId = parseInt( m.ID );
            
            let d = document.createElement( 'div' );
            d.className = 'Message';
            d.classList.add( 'Showing' );
            d.setAttribute( 'tz', m.Timezone );
            d.setAttribute( 'owner', m.Name );
	        d.setAttribute( 'seen', m.Seen == 1 ? 'yes' : 'no' );
            if( history )
            	d.style.display = 'none';
        	newMessages.push( d );
            
            let text = m.Message;
            try
            {
                let dec = new TextDecoder().decode( self.base64ToBytes( m.Message ) );
                text = dec;
            }
            catch( e ){};
            
            let mess = md5( m.Message );
            d.setAttribute( 'message-hash', mess );
            d.setAttribute( 'mid', m.ID );
            
            // Get toolbar to handle own messages
            let toolbar = FUI.getFragment( 'chat-message-toolbar' );
            
            if( !m.Own )
            	toolbar = '';
            
            let replacements = {
                message: self.replaceEmojis( self.replaceUrls( text ) ),
                i18n_date: i18n( 'i18n_date' ),
                i18n_fullname: i18n( 'i18n_fullname' ),
                date: self.parseDate( m.Date, false, m.Timezone ),
                signature: '',
                fullname: m.Own ? i18n( 'i18n_you' ) : ( m.FullName ? m.FullName : m.Name ),
                toolbar: toolbar
            };
		    d.innerHTML = FUI.getFragment( 'chat-message-head', replacements );
	                    
            // Setup message input events static function
            ( function( message, par )
            {
		        let td = par.querySelector( '.Delete' );
		        if( td )
		        {
				    td.onclick = function()
				    {
				    	Confirm( i18n( 'i18n_deleting_message' ), i18n( 'i18n_deleting_message_text' ), function( response )
				    	{
				    		if( self.destroying ) return;
				    		if( response.data == true )
				    		{
				    			let mo = new Module( 'system' );
				    			mo.onExecuted = function( me, md )
				    			{
				    				if( self.destroying ) return;
				    				if( me == 'ok' )
				    				{
										d.parentNode.removeChild( par );
										Application.holdConnection( { 
											method: 'messages', 
											roomType: self.options.type ? self.options.type : '', 
											cid: self.options.cid ? self.options.cid : ''
										} );
										Application.SendChannelMsg( {
											command: 'message-remove',
											mid: m.ID,
											sender: Application.fullName,
											senderId: Application.uniqueId
										} );
									}
				    			}
				    			mo.execute( 'convos', { method: 'deletemessage', mid: message.ID } );
				    		}
				    	} );
				    }
			    }
			    let te = par.querySelector( '.Edit' );
			    if( te )
			    {
			    	te.onclick = function()
			    	{
			    		let cc = this;
			    		document.body.classList.add( 'Editmode' );
			    		let t = d.querySelector( '.Text' );
			    		t.setAttribute( 'contenteditable', 'true' );
			    		t.focus();
			    		let original = t.innerHTML;
			    		let edited = false;
			    		t.onblur = function(){ edt(); }
			    		t.onkeydown = function( e )
			    		{ 
			    			if( e.which == 27 )
			    			{ 
			    				t.removeAttribute( 'contenteditable' ); t.innerHTML = original; 
		    					return cancelBubble( e ); 
	    					}
	    					if( !e.shiftKey && e.which == 13 )
	    					{ 
	    						edt(); return cancelBubble( e ); 
    						} 
    					}
			    		function edt()
			    		{
			    			if( edited ) return;
			    			edited = true;
			    			t.setAttribute( 'contenteditable', 'false' );
			    			document.body.classList.remove( 'Editmode' );
			    			cc.onblur = null;
			    			
			    			// Strip scripts and such
							let val = t.innerHTML.split( /<script.*?\>[\w\W]*?\<\/script\>/i ).join( '' );
							val = val.split( /<style.*?\>[\w\W]*?\<\/style\>/i ).join( '' );
							val = val.split( /<link.*?\>/i ).join( '' );
							
							t.innerHTML = self.replaceEmojis( self.replaceUrls( val ) );
							
							// Check white space
							let candidate = val.split( /\<.*?\>/ ).join( '' );
							candidate = candidate.split( /[\s]/ ).join( '' ).split( '&nbsp;' ).join( '' );
			    			
			    			// TODO: If empty, run delete on the method..
			    			if( candidate.length )
			    			{
								let text = self.bytesToBase64( new TextEncoder().encode( val ) );
								
								let mo = new Module( 'system' );
								mo.onExecuted = function( mm, mr )
								{
									if( self.destroying ) return;
									// Signal others!
									if( mm == 'ok' )
									{
										Application.SendChannelMsg( {
											command: 'message-update',
											mid: m.ID,
											sender: Application.fullName,
											senderId: Application.uniqueId,
											content: text
										} );
									}
								}
								mo.execute( 'convos', { method: 'message-edit', mid: m.ID, message: encodeURIComponent( text ) } );
							} 
			    		}
			    	}
			    }
	        } )( m, d );
            
            let timestamp = Math.floor( ( new Date( m.Date ) ).getTime() / 1000 );
            if( m.Own ) d.classList.add( 'Own' );
            
            // Get slot
            let slot = StrPad( m.ID, 16, '0' );
            let slotId = slot + '-' + m.ID + '-' + timestamp;
            d.setAttribute( 'slotId', slotId ); // If we will use this new element, give slotid
            
            // Update a message in a time slot
            if( this.messageList[ slot ] && this.messageList[ slot ].parentNode )
            {
                let found = false;
                for( let b = 0; b < this.messageList[ slot ].childNodes.length; b++ )
                {
                    if( this.messageList[ slot ].childNodes[ b ].getAttribute( 'slotId' ) == slotId )
                    {
                        found = this.messageList[ slot ].childNodes[ b ];
                        break;
                    }
                }
                // Replace existing node
                if( found )
                {
                	// Only update content that changed
                	if( found.getAttribute( 'message-hash' ) != mess )
                	{
		                this.messageList[ slot ].replaceChild( d, found );
	                }
                }
                // Add a new node to this group slot
                else
                {
                    this.messageList[ slot ].appendChild( d );
                }
            }
            // Insert a message in a timestamp slot
            else
            {
                let grp = document.createElement( 'div' );
                grp.className = 'Slot';
                grp.appendChild( d );
                
                this.messageList[ slot ] = grp;
                
                // Just holds a list of slot identifiers
                this.messageListOrder.push( slot );
                this.messageListOrder.sort();

                // First message
                if( this.messageListOrder.length == 1 )
                {
                    // Create group
                    this.domMessages.querySelector( '.Incoming' ).appendChild( grp );
                }
                // We are looking for a place to add
                else
                {
                    for( let b = 0; b < this.messageListOrder.length; b++ )
                    {
                        let last = b == this.messageListOrder.length - 1;
                        let slotHere = this.messageListOrder[ b ];
                        // We found our slot
                        if( slotHere == slot )
                        {
                            // Add since we're the last in the list
                            if( last )
                            {
                                 this.domMessages.querySelector( '.Incoming' ).appendChild( grp );
                            }
                            else if( b == 0 )
                            {
                            	// add to existing slot
                            	let sl = this.domMessages.querySelector( '.Slot' );
                            	if( sl )
                            	{
                            		sl.parentNode.insertBefore( grp, sl );
                        	 	}
                        	 	// First element!
                        	 	else
                        	 	{
                        	 		this.domMessages.querySelector( '.Incoming' ).appendChild( grp );
                    	 		}
                            }
                            // Insert before previous
                            else
                            {
                                this.domMessages.querySelector( '.Incoming' ).insertBefore( grp, this.messageList[ this.messageListOrder[ b + 1 ] ] );
                            }
                            break;
                        }
                    }
                }
                if( !this.checkScrolled() )
				{
					this.toBottom();
				}
            }
        }
        
        // New scroll height
        if( history )
        {
			self.scrollFunction = function()
			{	
				self.domMessages.style.scrollBehavior = 'inherit';
				self.domMessages.scrollTop = firstMessage.offsetTop - 27;
				self.domMessages.style.scrollBehavior = '';
				setTimeout( function()
				{
					self.scrollFunction = null;
				}, 200 );
			};
			for( let a = 0; a < newMessages.length; a++ )
			{
        		newMessages[ a ].style.display = '';
        		self.scrollFunction();
    		}
			self.scrollFunction();
	    }
        
        this.refreshDom();
        
		self.busyMessages = false;
    }
    handlePasteEvent( evt, textarea )
	{
		let self = this;
		let pastedItems = ( evt.clipboardData || evt.originalEvent.clipboardData ).items;
		for( let i in pastedItems )
		{
			let item = pastedItems[i];
			if( item.kind === 'file' )
			{
				let blob = item.getAsFile();
				self.uploadBlob = blob;
				self.uploadPastedFile( self.uploadBlob );
				setTimeout( function(){ textarea.innerHTML = ''; textarea.checkHeight(); }, 100 );
			} 
		}
	}
	uploadPastedFile( file )
	{
		let self = this;
		
		function fileExists( filename, cbk )
		{
			let d = new Door( 'Home:Uploads/' );
			d.getIcons( function( list )
			{
				let ext = filename.split( '.' ).pop();
				let original = filename.substr( 0, filename.length - ( ext.length + 1 ) );
				
				let exists = false;
				let num = 0;
				let cand = '';
				do
				{
					exists = false;
					cand = original + ( num > 0 ? ( '_' + num ) : '' ) + '.' + ext;
					for( let a = 0; a < list.length; a++ )
					{
						if( list[a].Type == 'File' && list[a].Filename == cand )
						{
							exists = true;
							break;
						}
					}
					num++;
				}
				while( exists );
				
				if( cbk )
				{
					cbk( cand );
				}
			} );
		}
	
		// Check if file exists
		fileExists( file.name, function( resname )
		{
			let formData = new FormData();
			formData.append( resname, file, resname );
			let xhr = new XMLHttpRequest();
			xhr.open( 'POST', '/system.library/file/upload?authid=' + Application.authId + '&filename=' + resname + '&path=Home:Uploads/', true);
			xhr.onload = function (e) {
				if (xhr.readyState === 4 && xhr.status === 200) 
				{
					self.shareImageAndPost( 'Home:Uploads/' + resname );
				}
			};
			xhr.send( formData );
		} );
	}
    setTopic( topic, type = false )
    {
    	// Jeanie is a top level chat
    	// TODO: Figure out if we are showing contacts or not while running 
    	//       this topic
    	if( type != 'jeanie' )
    	{
    		let p = this.domTopic.querySelector( '.ParentLink' );
    		let u = this.domTopic.querySelector( '.Users' );
    		this.domTopic.innerHTML = topic;
			if( p ) this.domTopic.appendChild( p );
			if( u ) this.domTopic.appendChild( u );
		}
		else
		{
			this.domTopic.innerHTML = topic;
		}
    }
    // Did we scroll?
    checkScrolled()
    {
    	return self.hasScrolled && Math.ceil( this.domMessages.scrollTop ) + 100 < this.domMessages.scrollHeight - this.domMessages.offsetHeight;
    }
    // Scroll to the bottom of messages
    toBottom( way = false )
    {
    	let self = this;
    	this.checkUnloadedVisibleElements();
        if( way == 'smooth' )
        {
            this.domMessages.scrollTop = this.domMessages.scrollHeight;
            return;
        }
        this.domMessages.style.scrollBehavior = 'inherit';
        this.domMessages.scrollTop = this.domMessages.scrollHeight;
        setTimeout( function(){ self.domMessages.style.scrollBehavior = 'smooth'; }, 5 );
    }
    // Message is added via input gui
    queueMessage( string )
    {
        let self = this;
        
        // When in a lock, just wait
        if( self.lock )
        {
            return setTimeout( function(){ self.queueMessage( string ); }, 250 );
        }
        
        // Strip scripts and such
		string = string.split( /<script.*?\>[\w\W]*?\<\/script\>/i ).join( '' );
		string = string.split( /<style.*?\>[\w\W]*?\<\/style\>/i ).join( '' );
		string = string.split( /<link.*?\>/i ).join( '' );
        
        // Etherpad links
        let ebase = document.location.host.split( '.' );
        if( ebase.length > 2 )
        	ebase = ebase[ ebase.length - 2 ] + '.' + ebase[ ebase.length - 1 ];
        else ebase = ebase.join( '.' );
        ebase = document.location.protocol + '//'+ 'etherpad.' + ebase;
        let eb = string.indexOf( ebase );
        if( eb >= 0 )
        {
        	let repl = '';
        	for( let i = eb; i < string.length; i++ )
        	{
        		if( string[ i ] == ' ' || string[ i ] == "\t" || string[ i ] == "\n" )
        			break;
        		repl += string[ i ];
        	}
        	string = string.split( repl ).join( '<attachment etherpad="' + repl + '"/>' );
        }
        
        let scrolled = this.checkScrolled();
        
    	let dom = document.createElement( 'div' );
    	dom.className = 'Message Own Queue';
    	dom.innerHTML = '<p>' + string + '</p>';
    	dom.setAttribute( 'timestamp', ( new Date() ).getTime() );
    	this.domMessages.querySelector( '.Queue' ).appendChild( dom );
    	
    	// Add queue to Convos
    	if( window.Convos )
    	{
    	    let text = self.bytesToBase64( new TextEncoder().encode( string ) );
    	    let ms = {
    	        timestamp: parseInt( parseFloat( dom.getAttribute( 'timestamp' ) ) / 1000 ),
    	        message: encodeURIComponent( text ),
    	        type: this.options.type ? this.options.type : '',
    	        targetId: this.options.cid
    	    };
    	    Convos.outgoing.push( ms );
    	    Application.holdConnection( { 
    	        method: 'messages', 
    	        roomType: this.options.type ? this.options.type : '', 
    	        cid: this.options.cid ? this.options.cid : '',
    	        lastId: this.lastId,
    	        force: true
	        } );
    	}
    	
    	// Play a sound when sending
    	Sounds.sendMessage.play();
    	self.domTextarea.focus();
    	
    	setTimeout( function()
    	{
    		dom.classList.add( 'Showing' );
		}, 2 );
    }
    // Just do a message refresh from the last id
    refreshMessages()
    {
        let msg = { 
            method: 'messages', 
            roomType: this.options.type ? this.options.type : '', 
            cid: this.options.cid ? this.options.cid : '',
            lastId: this.lastId
        };
        Application.holdConnection( msg );
    }
    // Add element of loading data
    addDataLoading( id )
    {
    	if( !this.loadObjects[ id ] )
    	{
			this.loadObjects[ id ] = true;
			this.loadingData++;
		}
    }
    // Element stopped loading data
    remDataLoading( id )
    {
    	let o = {};
    	let cnt = 0;
    	for( let a in this.loadObjects )
    	{
    		if( a != id )
    		{
    			o[ a ] = this.loadObjects[ a ];
    			cnt++;
    		}
    	}
    	this.loadObjects = o;
    	this.loadingData = cnt;
    	
    	// Check if all is loaded
		if( cnt == 0 )
		{
			if( !this.checkScrolled() )
			{
				this.toBottom();
			}
		}
    }
    // Clear input submission queue
    clearQueue()
    {
        let self = this;
        self.lock = true;
        let queue = this.domMessages.querySelector( '.Queue' );
        let messages = queue.getElementsByClassName( 'Message' );
        for( let a = 0; a < messages.length; a++ )
        {
            ( function( mess )
            {
                if( mess.parentNode )
                    mess.parentNode.removeChild( mess );
            } )( messages[ a ] );
        }
        setTimeout( function()
        {
            self.lock = false;
        }, 250 );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
        
        let type = domElement.getAttribute( 'type' );
        if( type ) this.options.type = type;
        
        let cid = domElement.getAttribute( 'cid' );
        if( cid ) this.options.cid = cid;
        
        let context = domElement.getAttribute( 'context' );
        if( context ) this.options.context = context;
        
        let name = domElement.getAttribute( 'name' );
        if( name ) this.options.name = name;
        
        let parentElement = domElement.getAttribute( 'parentelement' );
        if( parentElement ) this.options.parentElement = parentElement;
    }
    // Check the elements that haven't loaded, but should be visible
    checkUnloadedVisibleElements()
    {
    	let self = this;
    	// Delayed check
    	let messages = self.domMessages.getElementsByClassName( 'Message' );
		for( let a = 0; a < messages.length; a++ )
		{
			if( self.elementVisible( messages[ a ] ) )
			{
				self.checkQueuedImage( messages[a] );
				self.checkLink( messages[a] );
			}
		}
    }
    // Check if a message was seen
    checkSeen( setYes = false )
    {
    	let self = this;
    	if( this.seenTimeo )
    		clearTimeout( this.seenTimeo );
    	this.seenTimeo = setTimeout( function()
    	{
    		let messages = self.domMessages.getElementsByClassName( 'Message' );
    		let top = self.domMessages.scrollTop;
    		let bottom = self.domMessages.offsetHeight + top;
    		let updates = [];
    		for( let a = 0; a < messages.length; a++ )
    		{
    			// We are setting seen
    			if( setYes )
    			{
    				let found = false;
    				for( let b = 0; b < setYes.length; b++ )
    				{
						if( messages[ a ].getAttribute( 'mid' ) == setYes[ b ] )
						{
							messages[ a ].setAttribute( 'seen', 'yes' );
							found = true;
							break;
						}
					}
					if( found ) continue;
				}
    			// These are invisible
    			if( messages[ a ].offsetTop > bottom || messages[ a ].offsetTop + messages[ a ].offsetHeight < top )
    			{
    				continue;
    			}
    			// These are visible
    			else
    			{
    				if( messages[ a ].getAttribute( 'seen' ) == 'no' )
    				{
    					if( !messages[ a ].classList.contains( 'Own' ) )
    					{
							messages[ a ].setAttribute( 'seen', 'yes' );
							updates.push( messages[ a ].getAttribute( 'mid' ) );
						}
    				}
    			}
    		}
    		let m = new Module( 'system' );
    		m.execute( 'convos', { method: 'message-seen', messages: updates } );
    	}, 250 );
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        if( this.refreshing ) return setTimeout( function(){ self.refreshDom( evaluated ); }, 50 );
        this.refreshing = true;
        
        // Check if messages were seen
        self.checkSeen();
        
        // Let's do some message owner management for styling
        let source = this.domElement.getElementsByClassName( 'Message' );
        let messages = [];
        
        // Fix links
        for( let a = source.length - 1; a > 0; a-- )
        {
        	if( !source[ a ].getAttribute( 'hidden' ) )     	
	        	self.checkLink( source[ a ] );
    	}
    	// Add new message array
        for( let a = 0; a < source.length; a++ )
        {
        	// Skip hiddens
        	if( !source[ a ].getAttribute( 'hidden' ) && !source[ a ].classList.contains( 'Queue' ) ) 
        		messages.push( source[ a ] );
        }
        
        let lastOwner = false;
        let lastDate = false;
        let prevDate = false;
        
        // Make date dividers
        let outMessages = [];
        for( let a = 0; a < messages.length; a++ )
        {
        	if( messages[ a ].classList.contains( 'MessageDateDivider' ) )
        	{
        		outMessages.push( messages[ a ] );
        		continue;
        	}
        	let date = messages[ a ].querySelector( '.Date' );
        	let tstm = messages[ a ].getAttribute( 'slotid' )
        	let day = parseInt( tstm.split( '-' )[2] ) * 1000;
        	let dt = new Date( day );
        	let dateCand = dt.getDate() + '-' + ( dt.getMonth() + 1 );
        	if( !self.messageDateDividers[ dateCand ] && prevDate != dateCand )
        	{
        		let tz = messages[ a ].getAttribute( 'tz' );
	        	let s = document.createElement( 'div' );
	        	s.className = 'Slot';
	        	messages[a].parentNode.parentNode.insertBefore( s, messages[a].parentNode );
	        	let nd = document.createElement( 'div' );
	        	nd.className = 'Message MessageDateDivider Showing';
	        	nd.innerHTML = self.parseDate( day, true, tz );
	        	nd.setAttribute( 'owner', '--' );
	        	nd.setAttribute( 'slotid', tstm + '-divider' );
	        	s.appendChild( nd );
	        	outMessages.push( nd );
	        	prevDate = dateCand;
	        	
		    	self.messageDateDividers[ dateCand ] = true;
	    	}
	    	outMessages.push( messages[ a ] );
	    	prevDate = dateCand;
        }
        
        // Parsed
        messages = outMessages;
        
        for( let a = 0; a < messages.length; a++ )
        {
        	let date = messages[ a ].querySelector( '.Date' );
            let tstm = messages[ a ].getAttribute( 'slotid' );
            
            if( tstm && date )
            {
	            let tz = messages[ a ].getAttribute( 'tz' );
	            let day = parseInt( tstm.split( '-' )[2] ) * 1000;
                let newDate = self.parseDate( day, false, tz );
                date.innerHTML = newDate;
                if( self.elementVisible( messages[ a ] ) )
                {
                	self.checkQueuedImage( messages[ a ] );
					self.checkLink( messages[ a ] );
                }
            }
            
            let owner = messages[ a ].getAttribute( 'owner' ); // current user
            let powner = a > 0 ? messages[ a - 1 ].getAttribute( 'owner' ) : false; // previous user
            let nowner = a + 1 < messages.length ? messages[ a + 1 ].getAttribute( 'owner' ) : false; // next user
            
            messages[a].classList.remove( 'FirstForOwner', 'LastForOwner', 'ConceilOwner', 'OnlyMessage' );
            
            if( owner == lastOwner ) // Don't show owner name twice
            {
                messages[ a ].classList.add( 'ConceilOwner' );
                if( a + 1 < messages.length && nowner != owner )
                {
                    messages[ a ].classList.add( 'LastForOwner' );
                }
            }
            else if( a + 1 < messages.length && nowner == owner && ( !powner || powner != owner ) )
            {
                messages[ a ].classList.add( 'FirstForOwner' );
            }
            
            // First message
            if( ( !powner && !nowner ) || ( !powner && !lastOwner && nowner && nowner != owner ) )
            {
            	messages[ a ].classList.add( 'OnlyMessage' );
            }
            // Prev message has different owner and next message has different owner
            if( powner && powner != owner && nowner && nowner != owner )
            {
            	messages[ a ].classList.add( 'OnlyMessage' );
            }
            // Prev owner is different, and it's the last message
            if( powner && powner != owner && !nowner )
            {
            	messages[ a ].classList.add( 'OnlyMessage' );
            }
            
            if( a + 1 >= messages.length && messages[ a ].classList.contains( 'ConceilOwner' ) )
            {
                messages[ a ].classList.add( 'LastForOwner' );
            }
            lastOwner = owner;
        }
        
        this.domElement.classList.add( 'Initialized' );
        
        this.refreshing = false;
       
    }
    elementVisible( ele )
    {
    	let t = GetElementTop( ele );
    	if( t + ele.offsetHeight > this.domMessages.scrollTop && t < this.domMessages.scrollTop + this.domMessages.offsetHeight )
    		return true;
    	return false;
    }
    // Get markup for object
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let props = '';
    	let n = 0;
    	for( let a in this.options )
    	{
    	    if( n++ > 0 ) props += ' ';
    	    props += a + '="' + props[ a ] + '"';
    	}
    	return '<fui-chatlist' + props + '></fui-chatlist>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
    checkQueuedImage( div )
    {
    	let self = this;
    	
        let q = div.getElementsByTagName( 'queued-img' );
    	if( q && q[0] )
    	{
    		q = q[0]; 
    		
    		let i = document.createElement( 'img' );
    		self.addDataLoading( i );
    		for( let a in q.attributes )
    		{
    			let n = q.attributes[a].nodeName;
    			if( q.attributes[a].nodeValue && n != 'onload' && n != 'prestr' && n != 'od' )
	    			i.setAttribute( q.attributes[a].nodeName, q.attributes[a].nodeValue );
    		}
    		i.onload = function()
    		{
    			self.remDataLoading( i );
    			Application.handleImageLoad( this, q.getAttribute( 'prestr' ) + q.getAttribute( 'od' ), false );
			}
			i.onerror= function()
			{
				self.remDataLoading();
				Application.handleImageError( this );
			}
    		q.parentNode.replaceChild( i, q );
    		if( i.naturalWidth )
	    		i.onload();
    	}
    }
    checkLink( div )
    {
        let self = this;
        
        let ele = div.querySelector( '.WebLink' );
        if( !ele ) return;
        
        if( !ele.classList.contains( 'LinkChecked' ) )
        {
            ele.classList.add( 'LinkChecked' );
            ( function( el )
            {
                let m = new Module( 'system' );
                self.addDataLoading( m );
                m.onExecuted = function( me, md )
                {
                	if( self.destroying ) return self.remDataLoading( m );
                    if( !el.parentNode ) return self.remDataLoading( m );
                    if( me != 'ok' )
                    {
                    	self.remDataLoading( m );
                        return;
                    }
                    let ne = document.createElement( 'div' );
                    ne.className = 'WebLinkPreview';
                    el.parentNode.replaceChild( ne, el );
                    let ln = document.createElement( 'p' );
                    ln.className = 'WebLinkP';
                    ln.appendChild( el );
                    
                    let ogs = {};
                    while( 1 )
                    {
                        let res = md.match( /\sproperty\=\"og\:(.*?)\".*?content\=\"(.*?)\"/i );
                        if( res != null )
                        {
                            ogs[ res[1] ] = res[2];
                            md = md.split( res[0] ).join( '' );
                            continue;
                        }
                        break;
                    }
                    
                    let w = false;
                    let h = false;
                    if( ogs[ 'image:height' ] ) h = ogs[ 'image:height' ];
                    if( ogs[ 'image:width' ] ) w = ogs[ 'image:width' ];
                    
                    let sn = false;
                    if( ogs.site_name )
                    {
                        sn = document.createElement( 'p' );
                        sn.innerHTML = ogs.site_name;
                        sn.className = 'OGSite';
                        sn.onclick = function()
                        {
                            window.open( el.getAttribute( 'href' ), '_blank' );
                        }
                        ne.appendChild( sn );
                    }
                    if( ogs.title && ( !ogs.site_name || ogs.site_name != ogs.title ) )
                    {
                        if( sn )
                        {
                            sn.innerHTML += ' - ' + ogs.title;
                        }
                        else
                        {
                            let p = document.createElement( 'p' );
                            p.innerHTML = ogs.title;
                            p.className = 'OGSite';
                            ne.appendChild( p );
                            p.onclick = function()
                            {
                                window.open( el.getAttribute( 'href' ), '_blank' );
                            }
                        }
                    }
                    if( ogs.image )
                    {
                        let d = document.createElement( 'div' );
                        d.className = 'OGImage';
                        ne.appendChild( d );
                        d.onclick = function()
                        {
                            window.open( el.getAttribute( 'href' ), '_blank' );
                        }
                        
                        let n = document.createElement( 'img' );
                        n.src = ogs.image;
                        n.style.position = 'absolute';
                        n.style.pointerEvents = 'none';
                        self.addDataLoading( n );
                        n.onload = function()
                        {
                            n.style.position = '';
                            ne.classList.add( 'Showing' );
                            n.width = n.naturalWidth;
                            n.height = n.naturalHeight;
                           	self.remDataLoading( n );
                        }
                        if( w && h )
                        {
                        	n.width = w;
                        	n.height = h;
                    	}
                    	else
                    	{
                    		n.width = 1920;
                    		n.height = 1080;
                    	}
                        if( n.width ) n.onload();
                        d.appendChild( n );
                    }
                    else
                    {
                        ne.classList.add( 'Showing' );
                    }
                    
                    ne.appendChild( ln );
                    self.remDataLoading( m );
                }
                m.forceHTTP = true;
                m.execute( 'websitegraph', { 'link': el.getAttribute( 'href' ) } );
            } )( ele );
        }
    }
    replaceUrls( string )
    {
       	let self = this;
       	
       	// Remove all redundant HTML
       	string = string.split( /\<br[\/]{0,1}\>/i ).join( "\n" );
       	string = string.split( /\<[\/]{0,1}div.*?\>/i ).join( "\r" );
       	string = string.split( "\r\r" ).join( "\n" );
       	
        let fnd = 0;
        while( 1 )
        {
            let res = string.match( /[\s]{0,1}http([s]{0,1}\:\/\/[^\s]*)/i );
            if( res != null )
            {
            	if( res[0].indexOf( '"' ) < 0 )
            	{
		            string = string.split( res[0] ).join( '<a class="WebLink" href="fnd' + res[1] + '" contenteditable="false" target="_blank">fnd' + res[1] + '</a>' );
		            fnd++;
		            continue;
	            }
            }
            break;
        }
        
        if( fnd )
        {
            string = string.split( 'fnds://' ).join( 'https://' ).split( 'fnd://' ).join( 'http://' );
        }
        
        // Fix code blocks
        let replacements = 0;
        while( 1 )
        {
		    let tr = string.match( /(```\n([^`]*?)```)/ );
		    if( tr )
		    {
		    	string = string.split( tr[0] ).join( '<codeblock><pre>' + Trim( tr[2] ) + '</pre></codeblock>' );
		    	string = string.split( '<codeblock><br>' ).join( '<codeblock>' );
		    	continue;
			}
			break;
        }
        
        // Restore line breaks
        string = string.split( "\n" ).join( "<br>" );
        
        // Take attachments
        while( 1 )
        {
        	// Etherpad
        	let res = string.match( /[\s]{0,1}\<attachment\ .*?etherpad\=\"(.*?)\"(.*?)\/\>/i );
        	if( res != null )
        	{
        		string = string.split( res[ 0 ] ).join( '<a class="WebLink Centered Bold" contenteditable="false" onclick="ExecuteIt(\'Etherpad\',\'' + res[1] + '\')">' + i18n( 'i18n_collaborate_in_etherpad' ) + '</a>' );
        		continue;
        	}
        	// Images
        	res = string.match( /[\s]{0,1}\<attachment\ .*?image\=\"(.*?)\"(.*?)\/\>/i );
        	if( res != null )
        	{
        		let od = res[1].split( 'getattachment' ).join( 'getoriginal' ) + '&authid=' + Application.authId;
        		
        		let w = 'auto';
        		let h = 'auto';
        		if( typeof res[2] != undefined )
        		{
        			let wh = string.match( /[\s]{0,1}\ width\=\"(.*?)\"\ height\=\"(.*?)\"/i );
        			if( wh && wh.length && parseInt( wh[1] ) > 0 )
        			{
		    			w = wh[1];
		    			h = wh[2];
	    			}
        		}
        		let prestr = document.location.href.split( '/webclient/' )[0] + '/';
        		string = string.split( res[ 0 ] ).join( '<div class="AttachmentElement" contenteditable="false"><a class="Download" target="_blank" href="' + od + '"></a><queued-img od="' + od + '" prestr="' + prestr + '" width="' + w + '" height="' + h + '" src="' + res[1] + '&authid=' + Application.authId + '" class="Attachment"/></div>' );
        		continue;
        	}
        	// Files
        	res = string.match( /[\s]{0,1}\<attachment\ type\=\"download\"\ file\=\"(.*?)\"\ filename=\"(.*?)"\/\>/i );
        	if( res != null )
        	{
        		let od = res[1].split( 'getattachment' ).join( 'getupload' ) + '&authid=' + Application.authId;
        		
        		string = string.split( res[ 0 ] ).join( '<div class="AttachmentElement" contenteditable="false"><a class="DownloadFull" target="_blank" href="' + od + '">' + res[2] + '</a></div>' );
        		continue;
        	}
        	// PDFs
        	res = string.match( /[\s]{0,1}\<attachment\ type\=\"pdf\"\ file\=\"(.*?)\"\ filename=\"(.*?)"\/\>/i );
        	if( res != null )
        	{
        		let od = res[1].split( 'getattachment' ).join( 'getupload' ) + '&authid=' + Application.authId;
        		let lod = '/webclient/3rdparty/pdfjs/web/viewer.html?file=' + encodeURIComponent( od );
        		string = string.split( res[ 0 ] ).join( '<div class="AttachmentElement" contenteditable="false"><div class="Preview PDF" onclick="this.innerHTML = \'<iframe src=\\\'' + lod + '\\\' class=\\\'Attachment\\\'/></iframe>\'"><p>' + i18n( 'i18n_click_to_view_pdf' ) + '</p></div><a class="DownloadFull" target="_blank" href="' + od + '">' + res[2] + '</a></div>' );
        		continue;
        	}
        	break;
        }
        return string;
    }
    replaceEmojis( string )
    {
        let smilies = [ '8)', '8-)', ':-)', ':)', ':-D', ':D', 'X)', 'B)', 'B-)', 'X-)', ':|', ':-|', ':-o', ':o', ':O', ':O', ':(', ':-(',  ';)', ';-)' ];
        let emotes  = [ '🤓', '🤓', '🙂',  '🙂', '😀', '😀', '😆', '😎', '😎', '😆', '😐', '😐', '😮', '😮', '😮', '😮', '😒', '😒', '😏', '😏' ];
        
        // Fix code blocks
        let codeblocks = [];
        while( 1 )
        {
        	let res = string.match( /(\<codeblock\>.*?\<\/codeblock\>)/i );
        	if( !res ) break;
        	codeblocks.push( res[1] );
        	string = string.split( res[1] ).join( '<!--block--' + codeblocks.length + '>' );
        }
        // Fix code divs
        let divblocks = [];
        while( 1 )
        {
        	let res = string.match( /(\<div[^>]*?\>.*?\<\/div\>)/i );
        	if( !res ) break;
        	divblocks.push( res[1] );
        	string = string.split( res[1] ).join( '<!--divblock--' + divblocks.length + '>' );
        }
        
        // Fix links
        let hrefs = [];
        while( 1 )
        {
        	let res = string.match( /(\<a .*?\>.*?\<\/a\>)/i );
        	if( !res ) break;
        	hrefs.push( res[1] );
        	string = string.split( res[1] ).join( '<!--hrefs--' + hrefs.length + '>' );
        }
        
        // Fix emos!
        for( let a = 0; a < smilies.length; a++ )
        {
            string = string.split( smilies[a] ).join( '<span contenteditable="false" class="Emoji">' + emotes[a] + '</span>' );
        }        
        
        while( 1 )
        {
            let res = string.match( /\:(.*?)\:/i );
            if( res && res[0] )
            {
                string = string.split( res[0] ).join( this.emoji( res[1] ) );
            }
            else break;
        }
        
        // Reconstitute div blocks
        if( divblocks.length )
        {
        	let n = 0;
        	while( 1 )
        	{
        		let res = string.match( /\<\!\-\-divblock\-\-([0-9]*?)\>/i );
        		if( !res ) break;
        		string = string.split( res[0] ).join( divblocks[ n++ ] );
        	}
	    }
        
        // Reconstitute code blocks
        if( codeblocks.length )
        {
        	let n = 0;
        	while( 1 )
        	{
        		let res = string.match( /\<\!\-\-block\-\-([0-9]*?)\>/i );
        		if( !res ) break;
        		string = string.split( res[0] ).join( codeblocks[ n++ ] );
        	}
	    }
	    
	    // Reconstitute hrefs
        if( hrefs.length )
        {
        	let n = 0;
        	while( 1 )
        	{
        		let res = string.match( /\<\!\-\-hrefs\-\-([0-9]*?)\>/i );
        		if( !res ) break;
        		string = string.split( res[0] ).join( hrefs[ n++ ] );
        	}
	    }
        
        return string;
    }
    emoji( type )
    {
        let s = '';
        switch( type )
        {
            case 'bug': s = '🪲'; break;
            case 'sun': s = '☀️'; break;
            case 'heart': s = '❤️'; break;
            case 'kiss': s = '💋'; break;
            case 'y': s = '👍'; break;
            case 'beers': s = '🍻'; break;
            case 'beer': s = '🍺'; break;
            case 'wine': s = '🍷'; break;
            case 'sick': s = '😷'; break;
            case 'fire': s = '🔥'; break;
            default: break;
        }
        return '<span contenteditable="false" class="Emoji">' + s + '</span>';
    }
    destroy()
    {
    	this.destroying = true;
    }
}
FUI.registerClass( 'chatlog', FUIChatlog );

Application.handleImageError = function( ele )
{
	let newnode = document.createElement( 'div' );
	newnode.className = 'ImageError';
	ele.parentNode.replaceChild( newnode, ele );
}

function ExecuteIt( app, arg )
{
	Application.sendMessage( {
		type: 'system',
		command: 'executeapplication',
		executable: app,
		args: arg
	} );
}

Application.handleImageLoad = function( ele, originalFileSrc = false, filename = false )
{
	let messages = FUI.getElementByUniqueId( 'messages' );
	if( messages.destroying ) return;
	
	let mes = document.querySelector( '.Messages' );
	if( !mes ) return;
	if( ele.naturalWidth < ele.parentNode.offsetWidth )
	{
		ele.style.width = ele.naturalWidth + 'px';
		ele.classList.add( 'ActualSize' );
	}
	
	setTimeout( function()
	{
		ele.classList.add( 'Loaded' );
	}, 10 );
	
	// Open the image in image viewer
	ele.onclick = function()
	{
		let ms = {
			type: 'dos',
			method: 'openWindowByFilename',
			args: {
				fileInfo: { Path: originalFileSrc ? originalFileSrc : ele.src, Filename: filename ? filename : 'Convos - Image' },
				ext: 'jpg'
			}
		};
		Application.sendMessage( ms );
	}
	
}

