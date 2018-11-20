/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Friend AI engine, based on the Tree engine
 * 
 * Brain
 * - Root of the decision tree
 * - Handles the nodes
 * - Organise the display
 * - Expose control of parameters of the brain (for test and tuning) 
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 1/1/2018
 */
Friend = window.Friend || {};
Friend.AI = Friend.AI || {};
Friend.Tree = Friend.Tree || {};
Friend.Flags = Friend.Flags || {};

/**
 * Brain
 *
 * Root of the brain
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 * treeDefinition: see recreateTree command
 */
Friend.AI.Brain = function( tree, name, flags )
{
    this.tree = false;
    this.rendererType = 'Canvas';    
    this.color = '#FFFFFF';
    this.borderColor = '#000000';
    this.borderSize = 1;
    this.displayType = 'flat';          // Circle notions
    this.displayOffsetX = 0;
    this.displayOffsetY = 0;
    this.displayLayerHeight = 100;      // Percentage of the neuron height (can change) 
    Friend.Tree.Items.init( this, tree, name, 'Friend.AI.Brain', flags );
	this.registerEvents( 'refresh' );
};

Friend.AI.Brain.render = function( flags )
{
    switch ( this.display )
    {
        case 'flat':
            this.renderDisplayFlat( flags );
            break;
        case 'circle':
            break;
        default:
            break;
    }
    return flags;
};
Friend.AI.Brain.renderDisplayFlatEntry = function( item )
{
    var z = 0;
    if ( item )
        z = item.z;
    
    // Fills the array
    if ( !this.layers[ z ] )
        this.layers[ z ] = [];
    this.layers.[ z ].push
    (
        {
            neuron: item;
        }
    );

    // Sets the Y position
    item.y = this.rect.height - this.displayOffsetY - item.z * ( item.height * this.displayLayerHeight / 100 );

    // All the childrens, recursive
    for ( var count = 0; count < item.items.length; count++ )
    {
        var childItem = item.items[ count ];
        if ( childItem.className == 'Friend.AI.Neuron' )
        {
            this.renderDisplayFlatEntry( childItem );
        }
    }    
} 
Friend.AI.Brain.renderDisplayFlat = function( flags )
{
    if ( this.calculateDisplay )
    {
        this.layers = [];
        var layerCount = 0;
        var x = 0;
        var y = 0;
        for ( z = 0; z < Friend.Flags.AI.Brain.LAYERSMAX; z++ )
        {
            if ( !this.layers[ z ] )
                this.layers[ z ] = [];
            for ( var count = 0; count < this.items.length; count++ )
            {
                var item = this.items[ count ];
                if ( item.className == 'Friend.AI.Neuron' )
                {
                    if ( item.z == z )
                    {
                        this.layers[ z ].push
                        (
                            {
                                neuron: item
                            }
                        );
                        item.y = this.rect.height - this.displayOffsetY - y;
                    }
                } );
            }
        }
    }
    return flags;
}
Friend.AI.Brain.messageUp = function( message )
{
    if ( message.command )
    {
        switch( message.command )
        {
            case 'start':
                break;
        }
    }
    return this.startProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.AI.Brain.messageDown = function( flags )
{
    return this.endProcess( message, [ 'x', 'y', 'z' ] );
}
Friend.AI.Brain.understandSentence = function( flags )
{
    return 'Please wait...';
}

