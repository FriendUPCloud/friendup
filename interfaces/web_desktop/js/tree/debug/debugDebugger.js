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
 * Tree engine debugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Debug = Friend.Tree.Debug || {};

Friend.Tree.Debug.Debugger = function ( tree, name, flags )
{
    this.tree = tree;
    this.alphaIdle = 1;
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Debug.Debugger', flags );
	this.registerEvents( [ 'keyboard' ] );
    this.x = 0;
    this.y = 0;
};
Friend.Tree.Debug.Debugger.messageUp = function ( message )
{
    if ( message.command == 'keydown' )
    {
        // De bugger keys
        var refreshAll = false;
        if ( message.code = 90 )            			    // Display Z Map?
        {
            this.tree.renderer.setRenderZ( true );
            this.doRefresh( -1 );
        }
        if ( message.code = 82 )			                // Display Renderer control?
        {
            if ( !this.rendererControl )
            {
                this.rendererControl = new Friend.Tree.Debug.RendererControl( this.tree, 'rendererControl',
                {
                    root: this.root,
                    parent: this,
                    x: 0,
                    y: 0,
                    width: 250,
                    height: 100,
                    alphaIdle: this.alphaIdle
                } );		
            }
            else
            {
                this.rendererControl.destroy();
                this.rendererControl = null;
            }
            this.doRefresh( -1 );
        }
    }
    else if ( message.command == 'keyup' )
    {
        if ( message.code == 90 )			// Erase Z Map?
        {
            this.renderer.setRenderZ( false );
            this.doRefresh( -1 );
        }
    }
	return this.startProcess( message, [] );
};
Friend.Tree.Debug.Debugger.messageDown = function ( message )
{
	return this.endProcess( message, [] );
};
Friend.Tree.Debug.Debugger.render = function ( flags )
{
    return flags;
};
