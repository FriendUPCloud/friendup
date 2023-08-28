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
        // Do stuff
        
        this.messageList = {};
        this.messageListOrder = [];
        this.lastId = 0;
        
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
        ';
        
        this.domElement.innerHTML = data;
        
        this.domTopic = this.domElement.querySelector( '.Topic' );
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
            vid.innerHTML = '';
            vid.onclick = function()
            {
            	self.setVideoCall( false );
            }
            this.domTopic.appendChild( vid );
        }
        
        this.domMessages.addEventListener( 'scroll', function( e )
        {
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
    	    	self.domElement.classList.remove( 'Search' );
    	        this.classList.remove( 'Active' );
    	        self.clearSearchFilter();
    	    }
    	    else
    	    {
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
		        val = self.domTextarea.innerHTML;
			    self.domTextarea.innerHTML = '';	
    			cancelBubble( e );
    			
    			// Strip scripts and such
    			val = val.split( /<script.*?\>[\w\W]*?\<\/script\>/i ).join( '' );
    			val = val.split( /<style.*?\>[\w\W]*?\<\/style\>/i ).join( '' );
    			val = val.split( /<link.*?\>/i ).join( '' );
    			
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
				if( messages[ a ].querySelector( '.Text' ).innerText.toLowerCase().indexOf( searchString ) < 0 )
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
    parseDate( instr )
    {
        let now = new Date();
        let time = new Date( instr );
        let test = time.getFullYear() + '-' + StrPad( time.getMonth() + 1, 2, '0' ) + '-' + StrPad( time.getDate(), 2, '0' ) + 
        	' ' + StrPad( time.getHours(), 2, '0' ) + ':' + StrPad( time.getMinutes(), 2, '0' ) + ':' + StrPad( time.getSeconds(), 2, '0' );
        let secs = Math.floor( now.getTime() / 1000 ) - Math.floor( time.getTime() / 1000 );
        let mins = Math.floor( secs / 60 );
        
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
    setVideoCall( data, init = false )
    {
    	// initVideoCall( data )
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    		contacts.setVideoCall( data, init );
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
    				t.innerHTML = self.replaceUrls( self.replaceEmojis( text ) );
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
        
        if( self.busyMessages )
        {
        	return setTimeout( function(){ self.addMessages( messageList, flags ); }, 150 );
        }
        self.busyMessages = true;
        
        // Fix the unread messages
        if( self.options.type == 'chatroom' && window.unreadMessages && unreadMessages.rooms[ self.options.cid ] )
        {
        	unreadMessages.rooms[ self.options.cid ] = [];
        	let cnvs = FUI.getElementByUniqueId( 'convos' );
        	cnvs.updateActivityBubble();
        }
        else if( self.options.type == 'dm-user' && window.unreadMessages && unreadMessages.dms[ self.options.cid ] )
        {
        	unreadMessages.dms[ self.options.cid ] = [];
        	let cts = FUI.getElementByUniqueId( 'contacts' );
        	cts.updateActivityBubble();
        }
        
        let history = false;
        if( flags && flags.history )
        	history = true;
        
        let scrolled = this.checkScrolled();
       
       	// Current scroll height
        let currScrollHeight = self.domMessages.scrollHeight;
        let newMessages = [];
        let firstMessage = self.domMessages.querySelector( '.Message' );
        
        for( let a = messageList.length - 1; a >= 0; a-- )
        {
            let m = messageList[a];
            
            if( !m.ID ) continue; // Skip unregistered ones
            
            // Find highest message ID
            if( parseInt( m.ID ) > self.lastId )
                self.lastId = parseInt( m.ID );
            
            let d = document.createElement( 'div' );
            d.className = 'Message';
            d.classList.add( 'Showing' );
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
            
            // Trap video calls
            if( !m.Own )
            {
            	let vidc = text.indexOf( '<videocall' ) == 0;
            	let vidh = text.indexOf( '<videohangup' ) == 0;
            	// Expire after 3 secs
            	if( ( new Date().getTime() / 1000 ) - ( new Date( m.Date ).getTime() / 1000 ) < 3 )
            	{
				    if( vidc )
				    {
				    	// Only take new calls (expire after 30 seconds)
				    	// Take video calls
				    	let string = text;
						let res = string.match( /[\s]{0,1}\<videocall\ type\=\"video\"\ callid\=\"(.*?)\"\/\>/i );
						if( res != null )
						{
							self.setVideoCall( res[1] );
						}
						Notify( {
				        	title: i18n( 'i18n_video_invite' ),
				        	text: m.Name + ' ' + i18n( 'i18n_video_invite_desc' )
				        }, false, function()
				        {
				        	self.setVideoCall( res[1], true );     	
				        } );
				        continue;
				    }
				    else if( vidh )
				    {
				    	// Only take new calls (expire after 30 seconds)
				    	// Take video calls
				    	self.setVideoCall( false );
						continue;
				    }
			    }
			    else
			    {
			    	if( vidc || vidh )
			    		continue;
			    }
	        }
	        // Skip own video calls and hangups
	        else
	        {
	        	if( text.indexOf( '<videocall' ) == 0 || text.indexOf( '<videohangup' ) == 0 )
			    {
			    	continue;
			    }			   
	        }
            
            let mess = md5( m.Message );
            d.setAttribute( 'message-hash', mess );
            d.setAttribute( 'mid', m.ID );
            
            // Get toolbar to handle own messages
            let toolbar = FUI.getFragment( 'chat-message-toolbar' );
            //let toolbarAdmin = FUI.getFragment( 'chat-message-admin' ); // <- todo
            if( !m.Own )
            	toolbar = '';
            
            let replacements = {
                message: self.replaceUrls( self.replaceEmojis( text ) ),
                i18n_date: i18n( 'i18n_date' ),
                i18n_fullname: i18n( 'i18n_fullname' ),
                date: self.parseDate( m.Date ),
                signature: '',
                fullname: m.Own ? i18n( 'i18n_you' ) : ( m.FullName ? m.FullName : m.Name ),
                toolbar: toolbar
            };
            d.innerHTML = FUI.getFragment( 'chat-message-head', replacements );
            
            ( function( message, par )
            {
		        let td = par.querySelector( '.Delete' );
		        if( td )
		        {
				    td.onclick = function()
				    {
				    	Confirm( i18n( 'i18n_deleting_message' ), i18n( 'i18n_deleting_message_text' ), function( response )
				    	{
				    		if( response.data == true )
				    		{
				    			let mo = new Module( 'system' );
				    			mo.onExecuted = function( me, md )
				    			{
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
			    		t.onkeydown = function( e ){ if( e.which == 27 ){ t.removeAttribute( 'contenteditable' ); t.innerHTML = original; return cancelBubble( e ); }; if( !e.shiftKey && e.which == 13 ){ edt(); return cancelBubble( e ); } }
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
							
							t.innerHTML = self.replaceUrls( self.replaceEmojis( val ) );
							
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
                //console.log( 'Add message to existing slot: ' + slot, m.Message );
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
		            	//console.log( 'Replacing because ' + mess + ' != ' + found.getAttribute( 'message-hash' ) );
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
                //let dy = new Date( slot * 1000 );
                //grp.title = dy.getFullYear() + '-' + ( dy.getMonth() + 1 ) + '-' + dy.getDate() + '(' + slot + ')';
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
            }
        }
        
        //console.log( this.messageListOrder );
        
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
        else
        {
		    if( !scrolled )
			    this.toBottom();
		}
        this.refreshDom();
        
		self.busyMessages = false;
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
    checkScrolled = function()
    {
    	return  this.domMessages.scrollTop + 50 < this.domMessages.scrollHeight - this.domMessages.offsetHeight;
    }
    // Scroll to the bottom of messages
    toBottom( way = false )
    {
    	let self = this;
        if( way == 'smooth' )
        {
            this.domMessages.scrollTop = this.domMessages.scrollHeight;
            return;
        }
        this.domMessages.style.scrollBehavior = 'inherit';
        this.domMessages.scrollTop = this.domMessages.scrollHeight;
        setTimeout( function(){ self.domMessages.style.scrollBehavior = 'smooth'; }, 5 );
    }
    queueMessage( string )
    {
        let self = this;
        
        // When in a lock, just wait
        if( self.lock )
        {
            return setTimeout( function(){ self.queueMessage( string ); }, 250 );
        }
        
        let scrolled = this.checkScrolled();
        
    	let dom = document.createElement( 'div' );
    	dom.className = 'Message Own';
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
		
		if( !scrolled )
			this.toBottom( 'smooth' );
    }
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
        
        self.checkSeen();
        
        // Let's do some message owner management for styling
        let source = this.domElement.getElementsByClassName( 'Message' );
        let messages = [];
        for( let a = 0; a < source.length; a++ )
        {
        	// Skip hiddens
        	if( source[ a ].getAttribute( 'hidden' ) ) 
        		continue;
        	
        	messages.push( source[ a ] );
        }
        
        let lastOwner = false;
        let lastDate = false;
        
        for( let a = 0; a < messages.length; a++ )
        {
        	let date = messages[ a ].querySelector( '.Date' );
            let tstm = messages[ a ].getAttribute( 'slotid' );
            if( tstm )
            {
                let newDate = self.parseDate( parseInt( tstm.split( '-' )[2] ) * 1000 );
                date.innerHTML = newDate;
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
        
        this.checkLinks();
        this.domElement.classList.add( 'Initialized' );
       
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
    checkLinks()
    {
        let self = this;
        
        let eles = this.domElement.getElementsByClassName( 'WebLink' );
        for( let a = 0; a < eles.length; a++ )
        {
            if( !eles[ a ].classList.contains( 'LinkChecked' ) )
            {
                eles[ a ].classList.add( 'LinkChecked' );
                ( function( el )
                {
                    let m = new Module( 'system' );
                    m.onExecuted = function( me, md )
                    {
                        if( !el.parentNode ) return;
                        if( me != 'ok' )
                            return;
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
                            n.onload = function()
                            {
                                n.style.position = '';
                                ne.classList.add( 'Showing' );
                                self.toBottom();
                            }
                            if( n.width ) n.onload();
                            d.appendChild( n );
                        }
                        else
                        {
                            ne.classList.add( 'Showing' );
                        }
                        
                        ne.appendChild( ln );
                    }
                    m.execute( 'websitegraph', { 'link': el.getAttribute( 'href' ) } );
                } )( eles[ a ] );
            }
        }
    }
    replaceUrls( string )
    {
       	let self = this;
        let fnd = 0;
        while( 1 )
        {
            let res = string.match( /[\s]{0,1}http([s]{0,1}\:\/\/[^\s]*)/i );
            if( res != null )
            {
                string = string.split( res[0] ).join( '<a class="WebLink" href="fnd' + res[1] + '" target="_blank">fnd' + res[1] + '</a>' );
                fnd++;
                continue;
            }
            break;
        }
        if( fnd )
        {
            string = string.split( 'fnds://' ).join( 'https://' ).split( 'fnd://' ).join( 'http://' );
        }
        // Take attachments
        while( 1 )
        {
        	// Images
        	let res = string.match( /[\s]{0,1}\<attachment\ type\=\"image\"\ image\=\"(.*?)\"(.*?)\/\>/i );
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
        		
        		string = string.split( res[ 0 ] ).join( '<div class="AttachmentElement" contenteditable="false"><a class="Download" target="_blank" href="' + od + '"></a><img width="' + w + '" height="' + h + '" onload="Application.handleImageLoad( this )" onerror="Application.handleImageError( this )" src="' + res[1] + '&authid=' + Application.authId + '" class="Attachment"/></div>' );
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
        		
        		string = string.split( res[ 0 ] ).join( '<div class="AttachmentElement" contenteditable="false"><iframe src="' + lod + '" class="Attachment"/></iframe><a class="DownloadFull" target="_blank" href="' + od + '">' + res[2] + '</a></div>' );
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
}
FUI.registerClass( 'chatlog', FUIChatlog );

Application.handleImageError = function( ele )
{
	let newnode = document.createElement( 'div' );
	newnode.className = 'ImageError';
	ele.parentNode.replaceChild( newnode, ele );
}

Application.handleImageLoad = function( ele )
{
	let mes = document.querySelector( '.Messages' );
	if( !mes ) return;
	if( ele.naturalWidth < ele.parentNode.offsetWidth )
		ele.style.width = ele.naturalWidth + 'px';
	mes.style.scrollBehavior = 'initial';
	mes.scrollTop = mes.scrollHeight;
	setTimeout( function()
	{
		mes.style.scrollBehavior = '';
		ele.classList.add( 'Loaded' );
	}, 10 );
	// Open the image in image viewer
	ele.onclick = function()
	{
		let ms = {
			type: 'dos',
			method: 'openWindowByFilename',
			args: {
				fileInfo: { Path: ele.src, Filename: 'Convos - Image' },
				ext: 'jpg'
			}
		};
		Application.sendMessage( ms );
	}
	
}

