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
 *  Entry point of the application
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 12/12/2016
 *  @warning: work in progress... toward intelligence!
 */


function Friend()
{
    var scripts =
    [
        'Scripts/services.js',
        'Scripts/properties.js',
        'Scripts/brain.js',
        'Scripts/mind.js',
        'Scripts/actions.js',
        'Scripts/demands.js',
        'Scripts/destinations.js',
        'Scripts/emotions.js',
        'Scripts/interrogations.js',
        'Scripts/notions.js',
        'Scripts/objects.js',
        'Scripts/outputs.js',
        'Scripts/places.js',
        'Scripts/rewards.js',
        'Scripts/speeds.js',
        'Scripts/tags.js',
        'Scripts/timers.js',
        'Scripts/vocabularies.js',
        'Scripts/wordlists.js'
    ];
    var p;
    for (p in Friend)
        this[p] = Friend[p];

    LoadSources(this, scripts, function(that)
    {
        that.brain = new Brain(window);
    });
}
Friend.getStatus = function()
{
    if (this.brain) return "Ready.";
    return "Initializing.";
};
Friend.populate = function()
{
    return this.brain.populate();
};
Friend.getReport = function()
{
    return this.brain.getReport();
};
Friend.understand = function(sentence)
{
    return this.brain.understand();
};
Friend.cleanSentence = function(sentence)
{
    return this.brain.cleanSentence();
};

/**
 * Loads the sources - Based on Hogne's game loading function
 *
 * @param callback callback function to run after the scripts have loaded
 */
function LoadSources(that, scripts, callback )
{
    var scriptsLoaded = 0;

    for( var a = 0; a < scripts.length; a++ )
    {
        var s = document.createElement( 'script' );
        s.src = scripts[a];
        s.onload = function()
        {
            if( ++scriptsLoaded == scripts.length )
            {
                if( callback ) callback(that);
            }
        };
        scripts[a] = s;
    }
    for( a = 0; a < scripts.length; a++ )
    {
        document.body.appendChild( scripts[a] );
    }
}