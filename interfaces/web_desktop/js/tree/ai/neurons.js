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
 * Friend AI engine, based on the Tree engine
 * 
 * Neuron items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 1/1/2018
 */
Friend = window.Friend || {};
Friend.AI = Friend.AI || {};
Friend.Tree = Friend.Tree || {};
Friend.Flags = Friend.Flags || {};

/**
 * Neuron
 *
 * A 'decision' node in the tree
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *      connectionsDefinition:
 *      [
 *          { 
 *              identifier: identifier of the notion to connect to
 *              name:       or name of the notion
 *              weigth:     weight of the connection
 *          }   
 *      ]
 */
Friend.AI.Neuron = function( tree, name, flags )
{
    this.tree = false;
    this.connectionsDefinition = [];
    this.notionName = name; 
    this.rendererType = 'Canvas';    
    this.color = '#FFFFFF';
    this.borderColor = '#000000';
    this.borderSize = 1;
    this.handleColor = '#000000'; 
    this.handleSize = 1;
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Neuron', flags );
	Object.assign( this, Friend.Tree.Neuron );

    this.impulseCount = 0;
    this.minFrequency = Friend.Flags.AIFLAG_BASEFREQUENCYSTART;
    this.maxFrequency = Friend.Flags.AIFLAG_MAXFREQUENCYSTART;
    this.topFrequency = Friend.Flags.AIFLAG_TOPFREQUENCY;           // Don't get mad please!
    this.bottomFrequency = Friend.Flags.AIFLAG_BOTTOMFREQUENCY;

    this.impulses = {};
    this.impulsions = [];
    this.connections = {};
};

// AI default values and flags.
Friend.Flags.Neuron.TOPSPEED = 360;                 // Degrees per seconds, don't get mad please, not too fast!
Friend.Flags.Neuron.BOTTOMSPEED = 1;                // If 0, notion will go back to sleep (with all links above). Erase possible... Do we want that? Old memories, wipe -> set to zero.
Friend.Flags.Neuron.MAXSPEED = 5;                   // ? Not too much at start, avoid tree 'explosion' 
                                                    // If value is reached at impulse -> increase!
                                                    // Value of increase since same impulse from same path = indicator of 'something going on'
                                                    // Investigate, start taping differences between progression since first message
                                                    // from this path. If exponantial -> wrong. If stable and constant this is a  
                                                    // 'primitive' of the complex tree responses from top to there)... should be OK
                                                    // Create a new notion for the established path with all the notions (including words) up to the top 
                                                    // + other notions in the same state for the same 'question'.
                                                    // AI: 'Should I create an new command for "Please save everything and put the computer to sleep", you say it everyday in the evening?'
                                                    // USER: 'Yes please call it Sandman'
                                                    // AI: 'Done'
                                                    // USER: 'Thank you. Sandman.'
                                                    // AI: 'Good night Francois'
Friend.Flags.Neuron.MINSPEED = 0;                   // Not active at start. First message will 'wake up' the notion.
Friend.Flags.Neuron.KICKSPEED = 10;                 // In percent. Multiplied by message intensity -> 'kick in the wheel'...
Friend.Flags.Neuron.DECAYSPEED = 0.01;              // In percent. Notion will last for longuer is small. Can evolve for very active and positive notions. Will be always active.
Friend.Flags.neuron.IMPULSIONFADE = 3;              // An impulsion will be displayed during 3 fps

Friend.AI.Neuron.renderUp = function( flags )
{
    // Change the color when impulsion
    var color = this.color;
    if ( this.impulsions.length )
        this.impulsionFade = Friend.AI.Neuron.IMPULSIONFADE;
    if ( this.impulsionFade )
    {
        this.impulsionFade--;
        if ( this.impulsionFade > 0 )
            color = this.impulsionColor;
    }

    // Draw the notion, a circle with one rotating handle
    this.thisRect.drawEllipse( flags, color, this.borderColor, this.borderSize );
    this.thisRect.drawRay( flags, this.rotation, this.handleColor, this.handleSize );

    // Draws the impulsions
    if ( this.impulsions.length )
    {
        var count;
        for ( count = 0; count < this.impulsions.length; count++ )
        {
            var impulsion = this.impulsions[ count ];

            if ( impulsion.fade )
            {
                impulsion.fade--;
                if ( impulsion.fade )
                {
                    // For the mommet, just a dot on the circle
                    // After: draw a ray of light toward the destination (simple with coordinates)
                    var rect = new Friend.Utilities.rect( this.thisRect );
                    rect.shrink( this.impulsionSize );
                    var coords = rect.getRayCoords( flags, impulsion.angle );
                    rect = new Friend.Utilities.Rect( coords.x - this.impulsionSize / 2, coords.y - this.impulsionSize / 2, this.impulsionSize, this.impulsionSize );
                    rect.drawEllipse( flags, this.impulsionColor )
                }
                else
                {
                    // Removes impulsion from display list
                    this.impulsions.splice( count, 1 );
                    count--;
                }
            }
        }
    }
	return flags;
};
Friend.AI.Neuron.renderDown = function( flags )
{
    return flags;
};
Friend.AI.Neuron.processUp = function( message )
{
    // A new impulse coming?
    if ( message.command )
    {
        var impulseIdentifier = message.impulseIdentifier;
        switch ( message.command )
        {
            case 'impulse':
                this.impulseCount++;
                var impulseIdentifier = message.impulse.identifier;                
                if ( !this.impulse[ impulseIdentier ] )
                {
                    var newImpulse = 
                    {
                        path: [],
                        notionPath: [],
                        intensityPath: [],
                        speed: Friend.Flags.AI.Neuron.MINSPEED,
                        minSpeed: Friend.Flags.AI.Neuron.MINSPEED,
                        maxSpeed: Friend.Flags.AI.Neuron.MAXSPEED,
                        bottomSpeed: Friend.Flags.AI.Neuron.BOTTOMSPEED,    // Can be adjusted with global happiness of robot!
                        topSpeed: Friend.Flags.AI.Neuron.TOPSPEED,
                        kickSpeed: Friend.Flags.AI.Neuron.KICKSPEED,
                        decaySpeed: Friend.Flags.AI.Neuron.DECAYSPEED
                    };
                    newImpulse.path = message.impulse.path.splice( 0, 0, this.identifier );                 // new element at the start
                    newImpulse.notionPath = message.impulse.notionPath.splice( 0, 0, this.notionName ? this.notionName : this.name );
                    newImpulse.intensityPath = message.impulse.notionPath.splice( 0, 0, message.intensity );
                    this.impulses[ impulseIdentifier ] = newImpulse;                    

                    // Calculates the new angle difference between connections for the life of neuron.
                    this.deltaRotation = 360 / this.dendrides.length;
                }

                // Launches the emission 'wheel'
                var impulse = this.impulses[ impulseIdentifier ];

                // Changes speed of rotation of neuron
                // Intensity of the impulsion. Bigger -> faster.
                // Intensity can be zero, and will cut any response (not worth transmitting)
                // For 'blocking' notions (related to accident, I don't like, bad things, taboos)
                // should be negative, with logic: -1 * -1 = -1
                impulse.speed += impulse.kickSpeed * impulse.intensityPath[ 0 ];              
                if ( impulse.speed < impulse.minSpeed )
                {
                    // Neuron is going to sleep for this path
                    impulse.speed = impulse.minSpeed;
                    Friend.Tree.log( this, { 'Neuron going to sleep.', level: Friend.Flags.ERRORLEVEL_LOW } );
                }
                if ( impulse.speed > inpulse.maxSpeed )
                {
                    // Neuron is excited! Do something on feed back!
                    this.readyToCome = true;   

                    // It is a kind of jouissance... Sex = synchronicity (implement resonnance). 
                    // For alerts too? Synchronised series of repeating events... investigate this path please :)   
                    impulse.speed = impulse.maxSpeed;                       // Not over the top this time!
                }
                break;

            // Sent by the tree engine when the tree is constructed, all subitems present.
            case 'start':
                // Initialisation of the connections array
                var count;
                for ( count = 0; count < flags.connections; count++ )
                {
                    var connectionDef = flags.connections[ count ];

                    // Finds target
                    var target;
                    if ( connectionDef.identifier )
                        target = this.tree.findItem( connectionDef.identifier );
                    else
                        target = this.tree.findItemFromName( connectionDef.name );
                    if ( !target )
                    {
                        Friend.Tree.log( this, { message: 'Connection not found!', data: connectionDef, level: Friend.flags.ERRORLEVEL_BREAK } );
                        continue;
                    }

                    // A new connection!
                    this.connections.push
                    (
                        {
                            target: target,
                            weight: connectionDef.weight          
                        }
                    );
                }

            // Eventually use
            case 'destroy':
                break;

            default:
                break;
        }
    }

    // Life of the neuron
    // Principle. A 'wheel' turns. For each connection, in one turn:
    // - generate random number
    // - generate probability map (simple)
    // - find connection
    // - send impulse
    // Constantly slowing down.
    for ( impulseId in this.impulses )
    {
        var impulse = this.impulse[ impulseId ];

        // Makes the wheel turn!
        if ( impulse.speed )
        {
            // Rotates the angle, keep difference of angle
            this.oldRotation = impulse.rotation;
            impulse.rotation += ( this.rotation + this.rotationSpeedCalc * flags.delay );         // Like in a game! :)
            var delta = impulse.rotation - this.oldRotation;
            impulse.rotation %= 360;                        // Stays low (could be free-> overload after a while).
            
            // Calculate the unique identifier for this rotation
            var identifier = 'nothing';
            var oldIdentifier = '';
            while( this.rotationIdentifier == identifier )
                identifier = 'rotation' + Math.random();                
            this.rotationidentifier = identifier;

            // Reduces speed
            impulse.speed -= impulse.speed * impulse.decaySpeed;
        
            // Send a message?
            if ( delta >= this.deltaRotation )
            {
                var infos;
                while ( delta >= 0  )
                {
                    infos = this.sendImpulsion( impulse );

                    // For display
                    this.impulsions.push
                    (
                        {
                            infos: infos,
                            fade: Friend.Flags.AI.Neuron.IMPULSIONFADE 
                        } 
                    );

                    // Updates the connection -> watch and use this number, and its evolution in time!
                    infos.connection.useCount++;

                    // Next one?
                    delta -= this.deltaRotation;
                }
                this.deltaRotation = -delta;
            }

            // Do a screen refresh
            flags.refresh = true;
        }
    }
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'color', 'borderColor', 'handleColor' ] );
};

Friend.AI.Neuron.processDown = function( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'color', 'borderColor', 'handleColor' ] );
};

Friend.AI.Neuron.receiveMessage = function( flags, impulse )
{
    switch ( message.command )
    {
        case 'impulse':
            this.impulseCount++;
            var impulseIdentifier = message.impulse.identifier;                
            if ( !this.impulses[ impulseIdentier ] )
            {
                var newImpulse = 
                {
                    path: [],
                    notionPath: [],
                    intensityPath: [],
                    speed: Friend.Flags.AI.Neuron.MINSPEED,
                    minSpeed: Friend.Flags.AI.Neuron.MINSPEED,
                    maxSpeed: Friend.Flags.AI.Neuron.MAXSPEED,
                    bottomSpeed: Friend.Flags.AI.Neuron.BOTTOMSPEED,    // Can be adjusted with global happiness of robot!
                    topSpeed: Friend.Flags.AI.Neuron.TOPSPEED,
                    kickSpeed: Friend.Flags.AI.Neuron.KICKSPEED,
                    decaySpeed: Friend.Flags.AI.Neuron.DECAYSPEED
                };
                newImpulse.path = message.impulse.path.splice( 0, 0, this.identifier );                 // new element at the start
                newImpulse.notionPath = message.impulse.notionPath.splice( 0, 0, this.notionName ? this.notionName : this.name );
                newImpulse.intensityPath = message.impulse.notionPath.splice( 0, 0, message.intensity );
                this.impulses[ impulseIdentifier ] = newImpulse;                    

                // Calculates the new angle difference between connections for the life of neuron.
                this.deltaRotation = 360 / this.dendrides.length;
            }
            var impulse = this.impulses[ impulseIdentifier ];

            // Accelerate the emission 'wheel'
            // Changes speed of rotation of neuron
            // Intensity of the impulsion. Bigger -> faster.
            // Intensity can be zero, and will cut any response (not worth transmitting)
            // For 'blocking' notions (related to accident, I don't like, bad things, taboos)
            // should be negative, with logic: -1 * -1 = -1
            this.speed += impulse.kickSpeed * impulse.intensityPath[ 0 ];              
            if ( this.speed < impulse.minSpeed )
            {
                // Neuron is going to sleep for this path
                this.speed = impulse.minSpeed;
                Friend.Tree.log( this, { 'Neuron going to sleep.', level: Friend.Flags.ERRORLEVEL_LOW } );
            }
            if ( this.speed > inpulse.maxSpeed )
            {
                // Neuron is excited! Do something on feed back!
                this.readyToCome = true;   

                // It is a kind of jouissance... Sex = synchronicity (implement resonnance). 
                // For alerts too? Synchronised series of repeating events... investigate this path please :)   
                this.speed = impulse.maxSpeed;            // Not over the top this time! Will be higher/lower after feedback...
            }
            break;
        default:
            break;
    }
};

// Note to myself: use processes to orient the decision
// Use tags in path of decision
// Tags selected by the user. One tag, find the same in possible path
// (slighly) (or strongly) orient probability by action on the random generator and the result toward one exit.
// Artificially increase/decrease the weigth of the exit of the decision toward one element, 
// on all path (or not, just a section, like 'time' -> faster / slower). AI will find
// solutions that match orientation more.
Friend.AI.Neuron.sendImpulsion = function( flags, impulse )
{
    // Creates an array with the 'distances', based on the weight of each connection
    // Warning: default Javascript random is crap (more around zero)
    var count;
    var distance = 0;
    if ( this.calculateMap )
    {
        for ( count = 0; count < this.connections.length; count++ )
        {
            var connection = this.connections[ count ];
            connection.distance = distance;
            distance += connection.weight;        
        }
        this.calculateMap = false;
        this.distanceTotal = distance;
    }
    
    // Sends the message!
    var infos = null;
    if ( this.distanceTotal > 0 )
    {
        var connectionFound;

        // Find the destination
        var number = Math.random() * this.totalDistance;
        if ( distance > this.connections[ 0 ] && this.connections[ 0 ].rotationIdentifier != this.rotationIdentifier )
            connectionFound = this.connection;
        else
        {
            for ( count = 1; count < this.connections.length; count++ ) 
            {
                var connection = this.connections[ count ];

                // Between the previous and the next
                if ( ( distance > this.connections[ count - 1 ] && distance <= this.connections[ count ] ) && this.connections[ 0 ].rotationIdentifier != this.rotationIdentifier )
                {
                    // Found!
                    connectionFound = this.connections[ count ];
                    break;
                }
            }
        }
        if ( connectionFound )
        {
            // Block for this rotation (find a better algorythm)
            connectionFound.rotationIdentifier = this.rotationIdentifier;

            // Sends the message!
            connectionFound.target.receiveMessage.apply( connectionFound.target, [ flags, impulse ] );

            // Returns infos
            infos = {};
            infos.time = new Date().getTime();
            infos.connection = connectionFound;
            infos.impulse = impulse;
        }
    }
    return infos;
};

Friend.AI.Neuron.updateValues = function( flags )
{
    var refresh = false;

    // The properties of the neuron itself (check no common names between all the elements!)
    refresh |= Friend.Utilities.updateCommonProperties( this, flags );

    // For all the connections
    var count;
    for ( count = 0; count < this.connnections.length; count++ )
    {
        refresh |= Friend.Utilities.updateCommonProperties( this.connections[ count ], flags );
    }

    // For all the base flags (changing constants = not good! Thank you Javascript! :)
    refresh |= Friend.Utilities.updateCommonProperties( Friend.Flags.AI.Neuron, flags );

    // For all the current impulses (?)
    for ( var impulse in this.impulses )
        refresh |= Friend.Utilities.updateCommonProperties( this.impulses[ identifier ], flags );

    // Call all children neurons (only). Recursive.
    for ( identifier in this.items )
    {
        var item = this.items[ identifier ];
        if ( item.classname == 'Friend.AI.Neuron' )
            refresh |= item.updateValues( flags );
    }

    // At the end, indicates if 'something' has been updated above -> recalculates everything
    if ( refresh )
    {
        this.calculateMap = true;
    }
    return refresh;
}

