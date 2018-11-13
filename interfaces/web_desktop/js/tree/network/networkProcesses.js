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
 * Tree engine network elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Network = Friend.Tree.Network || {};
Friend.Tree.Network.RenderItems = Friend.Tree.Network.RenderItems || {};

/**
* Process: TreeShareEmitter
*
* Append this process to an object and it will be transmitted through the network
*
* @param tree (object) The Tree engine
* @param name (string) The name of the object
* @param flags (object) Creation flags
*
* Flags
*/
Friend.Tree.TreeShareEmitter = function( tree, object, properties )
{
    this.treeShare = 0;
    this.created = 0;
   Friend.Tree.Processes.init( this, tree, object, 'Friend.Tree.TreeShareEmitter', properties )
}
Friend.Tree.TreeShareEmitter.processUp = function ( message )
{
    if ( message.itemEvent == this.object )
    {
        switch ( message.command )
        {
            case 'create':
                var response =
                {
                    userName: Application.username,
                    creationFlags: this.utilities.replaceObjectsByNames( this.object.root, flags.creationFlags ), // Transmits the whole object creation flags
                    name: message.name,
                    identifier: this.object.identifier,
                    parentName: this.object.parent.name,
                    className: this.object.className
                };
                this.treeShare.send( 'create', response );
                break;
            case 'destroy':
                var response =
                {
                    userName: Application.username,
                    identifier: this.object.identifier
                };
                this.network.send( 'destroy', response );
                break;
        }
    }
   return true;
};
Friend.Tree.TreeShareEmitter.processDown = function ( message )
{
   var flag = false;
   if ( message.refresh )
   {
       // Copy only the modified properties
       var toSend = {};
       for ( var p in message )
       {
           if ( flags[ p ] != Friend.Tree.NOTINITIALIZED )
               toSend[ p ] = flags[ p ];
       }
       var response =
       {
           identifier: this.object.identifier,
           flags: this.network.replaceObjectsByNames( this.object.root, toSend )
       };
       var time = new Date().getTime();
       this.network.send( 'update', response );
   }
   return true;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
* Process: TreeShareReceiver
*
* Append this process to an object and it will be controller by the emitter object from the other player's machine
*
* @param tree (object) The Tree engine
* @param name (string) The name of the object
* @param flags (object) Creation flags
*
* Flags
*/
Friend.Tree.TreeShareReceiver = function( tree, object, properties )
{
   this.network = 0;
   Friend.Tree.Processes.init( this, tree, object, 'Friend.Tree.TreeShareReceiver', properties )	
}
Friend.Tree.TreeShareReceiver.processUp = function ( message )
{
    return true;
};
Friend.Tree.TreeShareReceiver.processDown = function ( message )
{
    return true;
};
