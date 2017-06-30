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
 *  Artificial intelligence handling
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 12/12/2016
 *  @warning: work in progress... toward intelligence!
 */


/**
 * Brain class
 */

// Definitions
Brain.BRAINDEF_UNDEFINED = Brain.BRAINDEF_MINIMUM - 1;
Brain.BRAINDEF_REFUSE = Brain.BRAINDEF_MINIMUM;
Brain.BRAINDEF_PONDERATIONMINIMUM = Brain.BRAINDEF_MINIMUM;
Brain.BRAINDEF_MINIMUM = -100;
Brain.BRAINDEF_ZERO = 0;
Brain.BRAINDEF_MAXIMUM = 100;
Brain.BRAINDEF_ASK = Brain.BRAINDEF_MAXIMUM + 1;
Brain.BRAINDEF_FOUND = Brain.BRAINDEF_MAXIMUM + 2;
Brain.BRAINDEF_NOTFOUND = Brain.BRAINDEF_MAXIMUM + 3;
Brain.BRAINDEF_BREAK = Brain.BRAINDEF_MAXIMUM + 4;
Brain.BRAINDEF_DEBUGLEVELFINAL = Brain.BRAINDEF_MAXIMUM + 5;
Brain.BRAINDEF_DEBUGLEVELBETA = Brain.BRAINDEF_MAXIMUM + 6;
Brain.BRAINDEF_DEBUGLEVELVERBOSE = Brain.BRAINDEF_MAXIMUM + 7;
Brain.BRAINDEF_DEBUGLEVELEXTRAVERBOSE = Brain.BRAINDEF_MAXIMUM + 8;
Brain.BRAINDEF_DEBUGLEVELDEVELOPPEMENT = Brain.BRAINDEF_MAXIMUM + 9;

// Flags
Brain.BRAINFLAG_STOP                = 0x00000001;
Brain.BRAINFLAG_STOPTREE            = 0x00000002;
Brain.BRAINFLAG_STOPBROTHERS        = 0x00000004;
Brain.BRAINFLAG_IGNORE              = 0x00000008;
Brain.BRAINFLAG_NONEWEXPLORE        = 0x00000010;
Brain.BRAINFLAG_FOUND               = 0x00000020;
Brain.BRAINFLAG_IGNORECHILDREN      = 0x00000040;

// Masks
Brain.BRAINMASK_QUITEXPLORE = ~(Brain.BRAINFLAG_STOPBROTHERS | Brain.BRAINFLAG_STOPTREE | Brain.BRAINFLAG_IGNORE);
Brain.BRAINMASK_QUITPARSE = ~(Brain.BRAINFLAG_STOPBROTHERS | Brain.BRAINFLAG_STOPTREE | Brain.BRAINFLAG_IGNORE);

function Brain(parent)
{
    mergeObjects(this, Property);
    mergeObjects(this, Brain);
    this.parent = parent;
    this.language = "US";
    this.debuggingLevel = Brain.BRAINDEF_DEBUGLEVELDEVELOPPEMENT;
    this.propertyReaders = new Array();
    this.output = "";
    this.outputPosition = 0;
}

Brain.populate = function ()
{
    /**
     * Brain properties macro language (yet another language, json is too sensitive for me!)
     *
     * A:
     * B: creates a Demands object (derived from PropertyLive), contains the links to other notions associated with a notion
     * C:
     * D:
     * E: creates a PropertyElement object (smallest, just name/weight pair)
     * F:
     * P: creates a Property object (same + brain/parent access)
     * L: creates a PropertyLive object (same + callBack)
     * N: creates a Notion object (derived from PropertyLive), that stores all the information about actions, objects, places, directions, speed etc...
     * C: creates a Collection object (derived from PropertyLive), that accepts a collection of objects
     * S: creates a Speech object (derived from PropertyLive), all that deals with talking to the user
     * R: creates a Reward object (derived from PropertyLive) to control feedback to the AI and their consequences in the properties
     * T: creates a Timer object (derived from PropertyLive) to control the evolution of a property based on time
     * V: creates a Vocabularies object (derived from PropertyLive), contains the different languages for one notion
     * W: creates a WordList object (derived from PropertyLive), contains the list of words in a language for a notion
     * Z: creates a Word object (derived from Property), contains one word
     *
     * FB: Feedback
     * LF: Learn from
     * TE: teach
     * IM: imagination
     *
     *
     * Syntax: "P"roperty("name", weight, "extras")
     *
     * "P": the name of the class to create in lower-case,
     *      upper-case letters are ignored (you can write "Demands" for example, just like in AMAL! :)
     *      (no upper-case letters in this version)
     * name: the name of the property
     * weight: its weight in the engine,
     *      general rule: -100 (refuses) < 50 (avoids) < 0 (ignores) < 50 (prefers having it) < 100 (needs always),
     *      101 (tries first and then evolves later)
     * extras: string containing nested properties to create for this property
     *
     * All classes (but PropertyElement) contain the addExtras function to add sub-properties from a string.
     * You can use single or double quotes in the strings.
     * Spaces are ignored.
     * Quotes are optional, strongly advised for extras strings containing other separators...
     * (quotes are mandatory in this version)
     */
    var reader = this.getPropertyReader('Mind-Script');
    reader.init(true);

    this.properties = new Array();
    this.properties[0] = new Mind(this, this, "mind", 100,

        // Objects that the mind knows
        "Objects('file', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('file*', 100)), " +
               "WordLists('FR', 100, Words('fichier*', 100)), " +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('folder', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('folder*', 100), Words('drawer*', 100)), " +
               "WordLists('FR', 100, Words('dossier*', 100), Words('tiroir*', 100)), " +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('image', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('image*', 100), Words('picture*', 100)), Words('photo*', 80)" +
               "WordLists('FR', 100, Words('image*', 100)), Words('photo*', 80)" +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('sound', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('sound*', 100)), " +
               "WordLists('FR', 100, Words('son*', 100)), " +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('dish', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('dish*', 100)), " +
               "WordLists('FR', 100, Words('dish*', 100), Words('assiette*', 100)), " +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('trigger', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('trigger*', 100)), " +
               "WordLists('FR', 100, Words('trigger*', 100), Words('declencheur*', 100)), " +
               "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
               ")" +
           "), " +
        "Objects('output', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('output*', 100)), " +
               "WordLists('FR', 100, Words('sortie*', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Objects('input', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('input*', 100)), " +
               "WordLists('FR', 100, Words('entree*', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Objects('application', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('application*', 100), Words('executable*', 100)), " +
               "WordLists('FR', 100, Words('application*', 100), Words('executable*', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Objects('machineKeyboard', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('machine keyboard', 100), Words('the keyboard', 100)), " +
               "WordLists('FR', 100, Words('le clavier', 100), Words('clavier de la machine', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Objects('editor', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('editor', 100)), " +
               "WordLists('FR', 100, Words('editeur', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Objects('dishConfiguration', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('dish configuration', 100), Words('dish configuration dialog', 100), Words('dish setup', 100)), " +
               "WordLists('FR', 100, Words('configuration * assiete', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +

        // Tags
        "Tags('free', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('free', 100)), " +
               "WordLists('FR', 100, Words('gratuit', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +
        "Tags('animated', 100, " +
           "Vocabularies('usual', 100, " +
               "WordLists('US', 100, Words('animat*', 100)), " +
               "WordLists('FR', 100, Words('anime', 100)), " +
               "WordLists('NO', 100, Words('To translate', 100))" +
               ")" +
           "), " +

        // Locations in machine
        "Places('documentFolder', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('document folder', 100), Words('document', 100)), " +
                "WordLists('FR', 100, Words('document* folder', 100), Words('document*', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +
        "Places('home', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('home', 90), Words('home folder', 100))," +
                "WordLists('FR', 100, Words('home', 90), Words('dossier home', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +
        "Places('desktop', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('desktop folder', 100), Words('desktop', 100)), " +
                "WordLists('FR', 100, Words('dossier bureau', 100), Words('bureau', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +

        // Sources and destinations
        "Destinations('origin', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('from', 100), Words('in', 100), Words('out of', 100)), " +
                "WordLists('FR', 100, Words('depuis', 100), Words('a partir', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +
        "Destinations('destination', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('to', 100), Words('toward', 100)), " +
                "WordLists('FR', 100, Words('vers', 100), Words('destination de', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +

        // Speeds
        "Speeds('speed', 100, " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('quick', 100), Words('quickly', 100), Words('slow', 100), Words('slowly', 100)), " +
                "WordLists('FR', 100, Words('vite', 100), Words('rapidement', 100), Words('plus vite que ça', 100), Words('lentement', 100), Words('prend* ton temps', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            "), " +

        // Collections
        "Collections('collection', 100, Property('file', 100), Property('folder', 100), Property('image', 100), Property('sound', 100), Property('source', 100), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('all of them', 100), Words('altogether', 100), Words('all', 99)), " +
                "WordLists('FR', 100, Words('tous', 100), Words('tout', 100), Words('le contenu', 100)), " +
                "WordLists('NO', 100, Words('unknown', 100))" +
                ")" +
            ")," +

        // Timers
        "Timers('timer', 100, Property('fade', 100), Property('cancelIfUsed', 100), Property('comeBack', 100)), " +

        // Question
        "Interrogations('tellMe', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('file', 100), Property('folder', 100), Property('dish', 100), Property('trigger', 100)), " +
            "Demands('implies', 100, Property('answer', 100)), " +
            "Demands('consequences', 101, Property('speak', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('information', 100), Words('information on', 100), Words('tell me', 100), Words('can you tell', 100), Words('tell', 100)), " +
                "WordLists('FR', 100, Words('information', 100), Words('information* sur', 100), Words('dis moi', 100), Words('me dire', 100), Words('lis la', 90), Words('dire', 100)), " +
                "WordLists('NO', 100, Words('Hogne or Thomas please help me!', 100))" +
                ")" +
            "), " +

        // Rewards
        "Rewards('reward', 100, " +
            "Bravos('bravo', 100, " +
                "Vocabularies('usual', 100, " +
                    "WordLists('US', 100, Words('bravo', 100), Words('fantastic job', 100), Words('extraordinary', 100)), " +
                    "WordLists('FR', 100, Words('bravo', 100), Words('fantastique', 100), Words('extraordinaire', 100)), " +
                    "WordLists('NO', 100, Words('unknown', 100))" +
                    ")" +
                "), " +
            "GoodWorks('goodWork', 100, " +
                "Vocabularies('usual', 100, " +
                    "WordLists('US', 100, Words('good work', 100), Words('well done', 100), Words('not bad', 100)), " +
                    "WordLists('FR', 100, Words('bon travail', 100), Words('bien joue', 100), Words('pas mal', 100)), " +
                    "WordLists('NO', 100, Words('unknown', 100))" +
                    ")" +
                "), " +
            "BadWorks('badWork', 100, " +
                "Vocabularies('usual', 100, " +
                    "WordLists('US', 100, Words('bad work', 100), Words('not good', 100), Words('horrible', 100)), " +
                    "WordLists('FR', 100, Words('mauvais travail', 100), Words('pas bien', 100), Words('horrible', 100)), " +
                    "WordLists('NO', 100, Words('unknown', 100))" +
                    ")" +
                "), " +
            "Thanks('thankYou', 100, " +
                "Vocabularies('usual', 100, " +
                    "WordLists('US', 100, Words('thank you', 100), Words('thank*', 100), Words('good', 100)), " +
                    "WordLists('FR', 100, Words('merci', 100), Words('bien', 100), Words('ok', 100)), " +
                    "WordLists('NO', 100, Words('unknown', 100))" +
                    ")" +
                "), " +
            "Pleases('please', 100, " +
                "Vocabularies('usual', 100, " +
                    "WordLists('US', 100, Words('please', 100), Words('if you please', 100), Words('could you', 100)), " +
                    "WordLists('FR', 100, Words('s'il te plait', 100), Words('s'il vous plait', 100)), " +
                    "WordLists('NO', 100, Words('unknown', 100))" +
                    ")" +
                ")" +
            "), " +

        // Actions
        "Actions('take', 100, " +
            "Demands('needs', 100, Property('object', 100), Property('origin', 100)), " +
            "Demands('accepts', 100, Property('folder', 100), Property('file', 100), Property('image', 100), Property('sound', 100), Property('source', 100)), " +
            "Demands('implies', 100, " +
                "Outputs('inform', 101, Property('undo', 100), Timers('fade', 100), Timers('cancelIfUsed', 100), Timers('comeBack', 100))" +
                "), " +
            "Demands('consequences', 100, Property('undo', 100)), " +
            "Demands('should_it', 101, Property('put', 100), Property('copy', 100), Property('move', 10)), " +
            "Demands('rewards', 101, Property('please', 100), Property('thankyou', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('take', 100), Words('grab', 100), Words('hold', 80), Words('seize', 80), Words('bite', 60)), " +
                "WordLists('FR', 100, Words('prend*', 100), Words('attrape*', 90), Words('agrippe*', 80), Words('emporte*', 75), Words('mord*', 60)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('takeAll', 100, " +
            "Demands('needs', 100, Property('multipleFiles', 100), Property('origin', 100))," +
            "Demands('accepts', 100, " +
                "Collections('multipleFiles', 100, Property('folder', 100), Property('file', 100), Property('image', 100), Property('sound', 100), Property('source', 100))" +
                "), " +
            "Demands('implies', 100, " +
                "Outputs('inform', 101, Property('undo', 100), Timers('fade', 100), Timers('cancelIfUsed', 100), Timers('comeBack', 100))" +
                "), " +
            "Demands('consequences', 100, Property('undo', 100)), " +
            "Demands('should_it', 101, Property('put', 100), Property('copy', 100), Property('move', 10)), " +
            "Demands('rewards', 101, Property('bravo', 100), Property('goodWork', 100), Property('badWork', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('take', 100), Words('grab', 100), Words('hold', 80), Words('seize', 80), Words('bite', 60)), " +
                "WordLists('FR', 100, Words('prend*', 100), Words('attrape*', 90), Words('agrippe*', 80), Words('emporte*', 75), Words('mord*', 60)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('connect', 100, " +
            "Demands('needs', 100, Property('source', 100), Property('destination', 100)), " +
            "Demands('accepts', 100, Property('dishOuput', 100), Property('dishInput', 100), Property('triggerOutput', 100), Property('triggerInput', 100), Property('machineKeyboard', 100)), " +
            "Demands('implies', 100, Property('undo', 100)), " +
            "Demands('consequences', 100, Property('undo', 100)), " +
            "Demands('should_it', 101, Property('put', 100), Property('copy', 100), Property('move', 10)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('connect', 100)), " +
                "WordLists('FR', 100, Words('connecte*', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('run', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('application', 100)), " +
            "Demands('implies', 100, Property('stop', 100)), " +
            "Demands('consequences', 100, Property('stop', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('run', 100), Words('launch', 100)), " +
                "WordLists('FR', 100, Words('lance*', 100), Words('fait marcher*', 100), Words('marche*', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('goto', 100, " +
            "Demands('needs', 100, Property('destination', 100)), " +
            "Demands('accepts', 100, Property('bracket', 100)), " +
            "Demands('implies', 100, Property('undo', 100)), " +
            "Demands('consequences', 100, Property('undo', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('goto', 100), Words('go to', 100)), " +
                "WordLists('FR', 100, Words('goto', 100), Words('go to', 100), Words('vas', 100), Words('va a*', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('liquidify', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('variable', 100)), " +
            "Demands('implies', 100, Property('undo', 100)), " +
            "Demands('consequences', 100, Property('undo', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('liquidify', 100), Words('make liquid', 100)), " +
                "WordLists('FR', 100, Words('liquidifi*', 100), Words('rend* liquide', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('showMe', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('file', 100), Property('folder', 100), Property('dish', 100), Property('trigger', 100), Property('dishConfiguration', 100)), " +
            "Demands('implies', 100, Property('answer', 100)), " +
            "Demands('consequences', 101, Property('speak', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('show', 100), Words('show me', 100)), " +
                "WordLists('FR', 100, Words('montre', 100), Words('affiche', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('readMe', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('file', 100), Property('folder', 100), Property('dish', 100), Property('trigger', 100)), " +
            "Demands('implies', 100, Property('answer', 100)), " +
            "Demands('consequences', 101, Property('speak', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('read', 100), Words('information on', 100)), " +
                "WordLists('FR', 100, Words('information', 100), Words('information* sur', 100), Words('dis moi', 100), Words('me dire', 100), Words('lis la', 90), Words('dire', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('open', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('file', 100), Property('folder', 100), Property('dish', 100), Property('trigger', 100), Property('dishConfiguration', 100), Property('editor', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('open', 100)), " +
                "WordLists('FR', 100, Words('ouvre*', 100), Words('ouvrir', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
                ")" +
            "), " +
        "Actions('close', 100, " +
            "Demands('needs', 100, Property('object', 100)), " +
            "Demands('accepts', 100, Property('file', 100), Property('folder', 100), Property('dish', 100), Property('trigger', 100), Property('dishConfiguration', 100), Property('editor', 100), Property('dialog', 100), Property('application', 100)), " +
            "Loves('wish', 100, Property('bravo', 100), Property('goodWork', 75), Property('thankYou', 100)), " +
            "Fears('fear', 100, Property('badWork', 100)), " +
            "Vocabularies('usual', 100, " +
                "WordLists('US', 100, Words('close', 100)), " +
                "WordLists('FR', 100, Words('ferme*', 100)), " +
                "WordLists('NO', 100, Words('To translate', 100))" +
            ")" +
        ")", reader);

    this.output = this.properties[0].report.getShortResult(this.debuggingLevel);
    console.log(this.output);
};

Brain.getReport = function()
{
    var c, n = 0, line = "";
    while(n < this.output.length)
    {
        c = this.output.charCodeAt(n);
        if (c < 32)
        {
            n++;
            while (n < this.output.length)
            {
                if (this.output.charCodeAt(n) > 32)
                        break;
                n++;
            }
            break;
        }
        line += String.fromCharCode(c);
        n++;
    }
    if (n)
        this.output = this.output.substr(n, 1000);
    return line;
};


/**
 * Creates a property ready for each kind oof type of file
 *
 * @param string with the name fo the reader
 * @return object property reader
 */
Brain.getPropertyReader = function(typeString)
{
    if (!this.propertyReaders[typeString])
    {
        this.propertyReaders[typeString] = new PropertyReader(this);
    }
    return this.propertyReaders[typeString];
};

/**
 * Computes a text, and constructs a table with pointers to
 * Computes a text, and constructs a table with pointers to
 * actions and parameters understood...
 * No notion of order
 */
Brain.cleanSentence = function(sentence)
{
    if (sentence.length == 0)
        this.output += "Cleaning sentence: <empty>\n";
    else
        this.output += "Cleaning sentence: " + sentence + "\n";

    // Cleans sentence : remove extra spaces and control characters
    var spaces = 0;
    var chars = 0;
    var s, c;
    var cleanSentence = "";
    for (s = 0; s < sentence.length; s++)
    {
        c = sentence.charCodeAt(s);
        if (c <= 32)
        {
            if (spaces == 1) continue;
            cleanSentence += ' ';
            spaces++;
        }
        else if (c >= 32 && c <128)
        {
            cleanSentence += String.fromCharCode(c);
            spaces = 0;
            chars++;
        }
    }
    if (chars == 0)
    {
        this.output += "Sentence returned: <empty>\n";
        cleanSentence = "";
    }
    else
    {
        cleanSentence.toLowerCase();
        this.output += "Sentence returned: " + cleanSentence + "\n";
    }
    return cleanSentence;
};
Brain.understand = function(sentence)
{
    if (sentence != "")
    {
        //sentence = this.cleanSentence(sentence);
        this.output += "Processing: " + sentence + "\n";

        // Send this to all the minds of the brain (schizophrenia)
        var n;
        for (n = 0; n < this.properties.length; n++)
            this.properties[n].understand(sentence, this.language);

        this.output += "Understood: not yet!\n";
    }
    return "";
};


/**
 * Calculates ponderation multiplier, to be applied everywhere
 *
 * FL>FL 2do: apply a global greater ponderation to exagerate everything (nervous?)
 *
 * @param ponderation number greater than Brain.BRAINDEF_PONDERATIONMINIMUM (-100) with no maximum.
 *        undefined -> no effect (returns 1)
 * @return multiplier number ot multiple weights with
 */
Brain.getPonderationMultiplier = function(ponderation)
{
    if (typeof ponderation == "undefined" || ponderation == Brain.BRAINDEF_UNDEFINED)
        return 1;

    if (ponderation < Brain.BRAINDEF_PONDERATIONMINIMUM)
        return 0;

    return (ponderation + BRAINDEF_PONDERATIONMINIMUM) / (BRAINDEF_PONDERATIONMAXIMUM - BRAINDEF_PONDERATIONMINIMUM);        // -100 > 0, 100 -> 1, no upper limit: increase response (crazy?)
};

