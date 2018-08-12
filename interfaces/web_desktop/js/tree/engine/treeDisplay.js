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
 * Tree engine : display a dstant tree
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 28/03/2018
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};

Friend.Tree.TreeDisplay = function( tree, name, p2p )
{
    this.tree = tree;
    var flags = { p2p: p2p };
    this.treePassword = 'A_fucking_complex_password_not_in_clear_in_the_code_6545465!';
	FriendNetwork.connect( name, 'tree', flags, handleMessages );

	var self = this;
	function handleMessages( msg )
	{
		if ( msg.command == 'friendnetwork' )
		{
			switch ( msg.subCommand )
			{
				case 'getCredentials':
					FriendNetwork.sendCredentials( msg.key, self.treePassword );
					break;
                case 'connected':
                    this.key = msg.key;
                    this.hostName = msg.hostName;

                    // Intiate the display
                    FriendNetwork.send( this.key, { command: 'treeDisplay', subCommand: 'start' } );
					break;
                case 'hostDisconnected':
                    if ( msg.key == this.key )
                    {
                        this.key = false;
                        this.hostName = false;
                    }
					break;
				case 'messageFromHost':
					switch ( msg.data.command )
					{
                        case 'treeDisplayInfo':
                            break;
						default:
							break;
					}
					break;

				case 'fileTransfer':
					switch ( msg.response )
					{
						case 'fileDownloadProgress':
							console.log( 'Friend.Tree.Network.Manager - fileTransfer downloading: ' +  msg.fileProgress, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
						default:
							console.log( 'Friend.Tree.Network.Manager - File transfer: ' + msg.response, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
					};
					break;

				case 'treeShare':
					switch ( msg.response )
					{
						default:
							console.log( 'Friend.Tree.Network.Manager.connectToTree - treeShare: ' + msg.response, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
					};
					break;
				
				default:
					// Relays to the application
					if ( self.caller && self.messages )
						self.messages.apply( self.caller, [ msg ] );
					break;
			}
		}
	}

	this.
	for ( var o = 0; o < this.postProcesses.length; o ++ )
	{
		this.postProcesses[ o ].process( delay );
	}
	return true;
};

}