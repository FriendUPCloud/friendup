/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  Properties are items of information in the brain
 *
 *  ...and containers of other properties. Most internal indicators in Friend Mind
 *  are derived from the Property class, included in this file...
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 12/12/2016
 *  @warning: work in progress... toward intelligence!
 */

/**
 * Class holding information about the created properties
 *
 * @param reader the reader used
 * @param parent the parent PropertyReport object
 * @param className string with the name of the created class
 * @param name string with the name of the class
 * @constructor
 */
function PropertyReport(brain, property, reader)
{
    mergeObjects(this, PropertyReport);

    this.brain = brain;
    this.reader = reader;
    this.property = property;
    this.parent = null;
    this.reports = new Array();
    this.totalNumberOfReports = 0;
}
PropertyReport.getShortResult = function(debuggingLevel)
{
    var result = "";
    var property = this.property;
    if (typeof debuggingLevel == 'undefined' || debuggingLevel < 0)
        debuggingLevel = this.brain.debuggingLevel;

    // Actualise the total numbers
    var total = PropertyReport.countTotals(property.report, 0);

    // Starts the ouput
    result =    'Mind-Script Parser Report\n';
    result +=   '----------------------------------------------------------------------------\n';
    result +=   'Total number of properties created: ' + total + '\n';
    //result +=   PropertyReport.getTreeResults("", property.report, debuggingLevel);
    result +=   '----------------------------------------------------------------------------\n'
    result +=   'Parser Report End\n';
    return result;
};
PropertyReport.getTreeResults = function(result, report, debuggingLevel)
{
    var n;
    for (n = 0; n < report.reports.length; n++)
        result += report.reports[n].property.getResult(debuggingLevel);
};
PropertyReport.countTotals = function(report, total)
{
    total++;

    var n;
    for (n = 0; n < report.reports.length; n++)
        total = PropertyReport.countTotals(report.reports[n], total);

    report.totalNumberOfReports = total;
    return total;
};

/**
 * Property reader
 *
 * Only 'Mind-Script' for now.
 * FL>FL FL>HT implement JSON with Hogne's help
 *
 * @param brain
 * @constructor
 */
function PropertyReader(brain)
{
    mergeObjects(this, PropertyReader);
    this.brain = brain;
    this.states = Array();
    this.position = 0;
    this.reportOn = false;
    this.depth = 0;
}
PropertyReader.init = function(reportOnOff)
{
    this.reportOn = reportOnOff;
    this.depth = 0;
};
PropertyReader.parseString = function(parent, text, callBack)
{
    this.text = text;
    this.callBack = callBack;
    this.brackets = 0;
    return this.parse(parent);
};
PropertyReader.push = function()
{
    var state =
    {
        'text': this.text,
        'callBack': this.callBack,
        'brackets': this.brackets,
        'position': this.position,
        'report': this.report,
    };
    this.states.push(state);
};
PropertyReader.pull = function()
{
    var state = this.states[this.states.length - 1];
    this.states.pop();
    this.text = state.text;
    this.callBack = state.callBack;
    this.brackets = state.brackets;
    this.position = state.position;
    this.report = state.report;
};
PropertyReader.newReport = function(property)
{
    if (this.reportOn)
    {
        property.report = new PropertyReport(this.brain, property, this);
    }
};

PropertyReader.parse = function(destination)
{
    this.position = 0;
    var beginning = this.position

    var c;
    var name, weight, className;
    var start, end;
    var property;
    var extras;
    var ok = true, errorMessage = "";
    this.depth++;
    while (this.position < this.text.length)
    {
        // Creates the object from its name (thanks Javascript!)
        try
        {
            // Skips spaces to the next meaningful character
            if (!this.skipSpaces()) break;

            // Looks for a capital, signe of a new property object
            start = this.position;
            c = this.text.charAt(this.position);
            if (c < 65 || c > 90)
            {
                ok = false;
                break;
            }

            // Extracts the name of the class, till the bracket
            end = this.position + 1;
            while (end < this.text.length && this.text.charAt(end) != '(')
                end++;
            className = this.text.substring(start, end);
            this.position = end + 1;

            // Gets the name and weight
            name = this.getString();
            if (!this.nextValue()) {error= true; break;}
                weight = this.getNumber();

            this.push();
            property = eval("new " + className + "(this.brain, destination.parent, name, weight, null, this)");
            this.pull();
        }
        catch(msg)
        {
            debugger;
            errorMessage = msg;
            ok = false;
            break;
        }
        if (!property)
        {
            errorMessage = "Cannot create object";
            ok = false;
            break;
        }

        // Populates the object
        this.brackets = 1;
        while (this.nextValue() == Brain.BRAINDEF_FOUND && ok)
        {
            if (!property.properties)
                property.properties = new Array();
            extras = this.getExtras();
            this.push();
            ok = property.addExtras(extras, this);
            this.pull();
        }

        // Pushes created object in parent array
        if (destination)
        {
            //if (this.depth == 1 && name == "close" ) debugger;
            destination.properties.push(property);
            if (this.reportOn)
            {
                property.report.parent = destination.report;
                destination.report.reports.push(property.report)
            }
        }

        // Skips last bracket
        this.position++;
        this.skipSpaces();
        if (this.brackets == 0)
        {
            if (this.nextValue() != Brain.BRAINDEF_FOUND)
                break;
        }
        else if (this.nextValue() != Brain.BRAINDEF_FOUND)
            break;
    }
    if (!ok)
    {
        errorMessage += " at line " + this.position + '\n' + this.text.substr(beginning, 80);
        window.alert(errorMessage);
        debugger;
    }
    this.depth--;
    return ok;
};

PropertyReader.nextValue = function()
{
    if (!this.skipSpaces()) return Brain.BRAINDEF_NOTFOUND;
    if (this.text.charAt(this.position) == ')')
    {
        this.brackets--;
        // if (this.brackets == 0)                 FL>FL implement counting brackets when Mind-Script evolves
        return Brain.BRAINDEF_BREAK;
    }
    if (this.text.charAt(this.position) != ',')
        return Brain.BRAINDEF_NOTFOUND;
    this.position++;
    return Brain.BRAINDEF_FOUND;
};

PropertyReader.findSeparator = function()
{
    if (!this.skipSpaces()) return false;
    if (this.text.charAt(this.position) != ',')
        return false;
    this.position++;
    return true;
};

PropertyReader.getString = function()
{
    this.skipSpaces();
    var character = this.text.charAt(this.position++);
    var start = this.position;
    if (this.findNextCharacter(character))
        return this.text.substring(start, this.position++);

    return null;
};

PropertyReader.skipString = function()
{
    if (!this.skipSpaces()) return false;
    var c = this.text.charAt(this.position);
    if (c == '"' || c == "'")
    {
        this.position++;
        if (this.findNextCharacter(c))
        {
            this.position++;
            return true;
        }
    }
    return false;
};

PropertyReader.findNextCharacter = function(character)
{
    while (this.position < this.text.length)
    {
        if (this.text.charAt(this.position) == character)
            return true;
        this.position++;
    }
    return false;
};

PropertyReader.getNumber = function()
{
    this.skipSpaces();
    var numberString = "";
    while (this.position < this.text.length)
    {
        var c = this.text.charAt(this.position);
        if (c == '-' || (c >= '0' && c <= '9' ))
            numberString += c;
        else if (c == ' ')
            continue;
        else
            break;
        this.position++;
    }
    if (numberString.length > 0)
        return Number(numberString);
    return undefined;
};

PropertyReader.skipSpaces = function()
{
    if (this.position >= this.text.length)
        return false;
    while (this.position < this.text.length)
    {
        if (this.text.charAt(this.position) != ' ')
            break;
        this.position++;
    }
    return true;
};

PropertyReader.getExtras = function()
{
    if (!this.skipSpaces()) return false;

    var c;
    var result = "";
    var quit = false;
    var start = this.position;
    while (!quit && this.position < this.text.length)
    {
        c = this.text.charAt(this.position);
        if (c >= 'A' && c <= 'Z')
        {
            start = this.position++;
            while(start < this.text.length && this.text.charAt(this.position) != '(')
                this.position++;
            if (this.text.charAt(this.position) == '(')
            {
                if (this.findMatchingBracket())
                    result += this.text.substring(start, this.position + 1);
            }
            quit = true;
        }
        this.position++;
    }
    return result;
};

PropertyReader.findMatchingBracket = function()
{
    var close;
    var open = this.text.charAt(this.position++);
    if (open == '(') close = ')';
    if (open == '[') close = ']';
    if (open == '{') close = '}';

    var c;
    var count = 1;
    var result = false;
    while (this.position < this.text.length)
    {
        c = this.text.charAt(this.position);
        switch (c)
        {
            case open:
                count++;
                break;
            case close:
                count--;
                if (count == 0)
                    result = true;
                break;
            case '"':
            case "'":
                this.skipString();
                break;
            default:
                break;
        }
        if (result)
            break;
        this.position++;
    }
    return result;
};




/**
 *
 * Property tree exploration functions (global)
 *
 * Recursive, supports transversal simultaneous searches if the properties
 * support it themselves...
 */

/**
 * Property exploration information zone
 * @constructor
 *
 * Any search can add its results in this class.
 * Any search can run at the same time as another one.
 * Searches can follow the tree or be transversal and won't collide.
 */
function PropertyExplore(property, maxDepth)
{
    this.property = property;           ///< property starting the search
    this.maxDepth = maxDepth;           ///< depth of the search
    this.number = 0;                    ///< total number of properties explored
    this.count = 0;                     ///< total number of objects found
    this.depth = 0;                     ///< depth of the exploration
    this.depthMax = 0;                  ///< maximum depth of exploration
    this.flags = 0;                     ///> urgency flags + flags
}

/**
 * Finds a property from its name
 *
 * @param explore (object) PropertyExplore object holding the search
 * @param property (object) first property to explore
 * @param name (string) name of the class of the property to find
 * @param callBack (function) function to call when found, with parameter = property object
 * @returns Brain.BRAINDEF_ZERO if no indication, Brain.BRAINFLAG_STOP: immediate flags,
 *          Brain.BRAINFLAG_STOPTREE: don't go deeper,
 *          Brain.BRAINFLAG_STOPBROTHERS: flags look at same-level
 */
function PropertyExploreFromName(explore, property, name, callBack)
{
    var n;
    for (n = 0; n < property.properties.length && (explore.flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_STOPBROTHERS)) == 0; n++)
    {
        explore.number++;
        if (property.properties[n].name == name)
        {
            explore.depth++;
            explore.depthMax = Math.max(explore.depthMax, explore.depth);
            if (callBack)
                explore.flags |= callBack(explore, property);
            if (explore.depth <= explore.maxDepth && (explore.flags & Brain.BRAINFLAG_STOPTREE) == 0)
                explore.flags |= PropertyExploreFromName(explore, property, name, callBack);
            explore.depth--;
        }
    }

    if (explore.depth == 0 && (explore.flags & Brain.BRAINFLAG_STOP) == 0)
    {
        if (callBack)
            callBack(explore, null);
    }
    return explore.flags & Brain.BRAINMASK_QUITEXPLORE;
}

function PropertyExploreFromClassname(explore, property, name, callBack)
{
    var n;
    for (n = 0; n < property.properties.length && (explore.flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_STOPBROTHERS)) == 0; n++)
    {
        explore.count++;
        if (property.properties[n].className == name)
        {
            explore.depth++;
            explore.depthMax = Math.max(explore.depthMax, explore.depth);
            if (callBack)
                explore.flags |= callBack(explore, property);
            if (explore.depth <= explore.maxDepth && (stop & Brain.BRAINFLAG_STOPTREE) == 0)
                explore.flags |= PropertyExploreFromClassname(explore, property, name, callBack);
            explore.depth--;
        }
    }

    if (explore.depth == 0 && (explore.flags & Brain.BRAINFLAG_STOP) == 0)
    {
        if (callBack)
            callBack(explore, null);
    }
    return explore.flags & Brain.BRAINMASK_QUITEXPLORE;
}

function PropertyExploreFromClassnameAndName(explore, property, className, name, callBack)
{
    var n;
    for (n = 0; n < property.properties.length && (explore.flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_STOPBROTHERS)) == 0; n++)
    {
        explore.count++;
        if (property.properties[n].className == className && property.properties[n].name == name)
        {
            explore.depth++;
            explore.depthMax = Math.max(explore.depthMax, explore.depth);
            if (callBack)
                explore.flags |= callBack(explore, property);
            if (explore.depth <= explore.maxDepth && (explore.flags & (Brain.BRAINFLAG_STOPTREE)) == 0)
                explore.flags |= PropertyExploreFromClassnameAndName(explore, property, className, name, callBack);
            explore.depth--;
        }
    }

    if (explore.depth == 0 && (explore.flags & Brain.BRAINFLAG_STOP) == 0)
    {
        if (callBack)
            callBack(explore, null);
    }
    return explore.flags & Brain.BRAINMASK_QUITEXPLORE;
}

/**
 * Default property parsers
 *
 * Will return the highest weight properties (negative or positive).
 * Can be replaced by each property if it wants.
 */

function PropertyParser(parent, property, id, sentence, language, depth, callBack)
{
    mergeObjects(this, PropertyParser);

    this.id = id;
    this.property = property;
    this.parent = parent;
    this.sentence = sentence;
    this.language = language;
    this.flags = Brain.BRAINDEF_ZERO;
    this.depth = 0;
    this.depthMax = 0;
    this.maxDepth = depth;
    this.weightMaximum = Brain.BRAINDEF_ZERO;
    this.weightMinimum = Brain.BRAINDEF_ZERO;
    this.foundMaximum = null;
    this.foundMinimum = null;
    this.found = null;
    this.foundParsersArray = new Array();
    this.stop = 0;
    this.weight = Brain.BRAINDEF_ZERO;
    if (callBack)
        callBack(this);
}
PropertyParser.parseClassnameAndNameMaxMin = function(className, name, flags, callBack)
{
    if (flags == -1)
        flags = Brain.BRAINDEF_ZERO;

    // Test if the current property is OK and calls callBack
    if (className && className.length > 0)
    {
        if (this.property.className != className)
            return flags;
    }
    if (name && name.length > 0)
    {
        if (this.property.name != name)
            return flags;
    }

    // Explores children
    this.subParser = new PropertyParser(this, null, this.id, this.sentence, this.language, this.maxDepth, null);
    this.subParser.depth = this.depth;
    if ((flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_IGNORECHILDREN)) == 0)
    {
        if (this.maxDepth == -1 || this.depth < this.maxDepth)
        {
            this.depth++;
            this.depthMax = Math.max(this.depthMax, this.depth);

            var n;
            for (n = 0; n < this.property.properties.length && (flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_STOPBROTHERS)) == 0; n++)
            {
                var propertyParsed = this.property.properties[n];
                this.subParser.property = propertyParsed;
                if (propertyParsed.parse)
                {
                    flags |= propertyParsed.parse(this.subParser, flags, function(parserParent, parserCurrent, propertyCurrent, weightCurrent, flags)
                    {
                        if ((flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_IGNORE)) == 0)
                        {
                            if (weightCurrent > parserCurrent.weightMaximum)
                            {
                                parserCurrent.foundMaximum = propertyCurrent;
                                parserCurrent.weightMaximum = weightCurrent;
                                parserParent.foundParsersArray.push(parserCurrent);
                                parserParent.stop++;
                            }
                            if (weightCurrent < parserCurrent.weightMinimum)
                            {
                                parserCurrent.foundMinimum = propertyCurrent;
                                parserCurrent.weightMinimum = weightCurrent;
                                parserParent.foundParsersArray.push(parserCurrent);
                                parserParent.stop++;
                            }
                        }
                    });
                }
                else if (propertyParsed.properties && (flags & (Brain.BRAINFLAG_IGNORECHILDREN)) == 0)
                {
                    var subName = name;
                    if (propertyParsed.className == "WordLists")
                    {
                        subName = this.subParser.language;
                    }
                    flags |= this.subParser.parseClassnameAndNameMaxMin(className, subName, flags, function(parserParent, parserCurrent, propertyCurrent, weightCurrent, flagsCurrent)
                    {
                        flags |= flagsCurrent;
                        parserParent.depthMax = Math.max(parserParent.depthMax, parserCurrent.maxDepth);
                        if (propertyCurrent && (flags & (Brain.BRAINFLAG_STOP | Brain.BRAINFLAG_IGNORE)) == 0)
                        {
                            if (weightCurrent > parserCurrent.weightMaximum)
                            {
                                parserCurrent.foundMaximum = propertyCurrent;
                                parserCurrent.weightMaximum = weightCurrent;
                                parserParent.foundParsersArray.push(parserCurrent);
                                parserParent.stop++;
                           }
                            if (weightCurrent < parserCurrent.weightMinimum)
                            {
                                parserCurrent.foundMinimum = propertyCurrent;
                                parserCurrent.weightMinimum = weightCurrent;
                                parserParent.foundParsersArray.push(parserCurrent);
                                parserParent.stop++;
                            }
                        }
                        flags &= ~ Brain.BRAINFLAG_IGNORE;
                    });
                }
            }
            flags &= ~ Brain.BRAINFLAG_STOPBROTHERS;
            this.depth--;
        }
    }
    flags &= ~Brain.BRAINFLAG_IGNORECHILDREN;
    //
    // Computes the result of what is inside and its own value itself and sends it
    // back to the root, multiplying its own weight with the weight of the
    // evaluated elements that are part of the tree... This is were intelligence is in
    // evaluating all the elements of a notion and combining them together
    // as a response which validity can be examined.
    // This is how the brain will understand better with time....
    //
    // FL>FL(P) FL>HT(P) Heavy work needed on this part to calculate the way to integrate the
    // various sub-properties inside of the final result.
    //
    if (this.stop)
    {
        this.stop = 0;
        //debugger;
    }
    flags = this.calculateFinalWeight(this.subParser, flags);
    if (callBack)
        flags |= callBack(this.parent, this, this.property, this.property.weight * this.weight, flags);

    return flags;
};

/**
 * Calculates the stronger property, positive or negative FL>FL work on this, this has to be ponderated somehow!
 */
PropertyParser.calculateFinalWeight = function(parser, flags)
{
    this.found = null;
    this.weight = Brain.BRAINDEF_ZERO;
    if ((flags & Brain.BRAINFLAG_STOP) == 0)
    {
        if (parser.foundMaximum || parser.foundMinimum)
        {
            if (!parser.foundMaximum)
            {
                this.found = parser.foundMinimum;
                this.weight = parser.weightMinimum;
            }
            else if (!parser.foundMinimum)
            {
                this.found = parser.foundMaximum;
                this.weight = parser.weightMaximum;
            }
            else if (Math.abs(parser.weightMinimum) > Math.abs(parser.weightMaximum))       // FL>FL see to enforce negative over positive, or vice-versa?
            {
                this.found = parser.foundMinimum;
                this.weight = parser.weightMinimum;
            }
            else
            {
                this.found = parser.foundMaximum;
                this.weight = parser.weightMaximum;
            }
        }
    }
    return flags & ~Brain.BRAINMASK_QUITPARSE;
};

/**
 * Minimal brain property
 *
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string containing properties to define
 */
function PropertyElement(name, weight)
{
    mergeObjects(this, Property);

    this.className = "PropertyElement";
    this.name = name;
    this.weight = weight;
}

/**
 * Brain property handling classes
 *
 * Properties are simple properties with pointers to brain and parent classes
 *
 * Allows you to climb the tree to the ... roots!
 *
 * @param brain pointer to the main brain class
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param extras string with optional properties to create
 * @param weight number containing the global weight of the class
 */
function Property(brain, parent, name, weight, extras, propertyReader)
{
    mergeObjects(this, PropertyElement);

    this.brain = brain;
    this.parent = parent;
    PropertyElement.call(this, name, weight);

    if (propertyReader)
    {
        propertyReader.newReport(this);
        if (typeof extras == 'string' && extras.length > 0)
        {
            this.properties = new Array();
            propertyReader.parseString(this, extras, null);
        }
    }
    this.className = "Property";
}
Property.addExtras = function(extras, propertyReader)
{
    return propertyReader.parseString(this.parent, extras);
};
Property.getResult = function(debuggingLevel)
{
    if (debuggingLevel >= Brain.BRAINDEF_DEBUGLEVELVERBOSE && this.report)
        return 'Property created: ' + this.className + ', total number of created items: ' + this.report.totalNumberOfReports + '\n';
    return "";
};


/**
 * Brain live-property handling classes
 *
 * Live properties are simple properties associated with callbacks that
 * can evolve during time, or during the life of the AI.
 * FL>HT Notions can fade away with time, or can appear at random (dreams, by associating random
 * other notions during idle time, make the AI "dream" - we have to discuss about that together
 * you and I Hogne the master of your dreams, there need to be a watch-dog somewhere...
 * when you were talking about "double brains watching its other", it need to be implemented for dreams)
 *
 * @param brain pointer to the main brain class
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 * @param callBack pointer to the handling function
 */
function PropertyLive(brain, parent, name, weight, extras, callBack, propertyReader)
{
    mergeObjects(this, Property);

    this.callBack = callBack;
    Property.call(this, brain, parent, name, weight, extras, propertyReader);

    this.className = "PropertyLive";
}

