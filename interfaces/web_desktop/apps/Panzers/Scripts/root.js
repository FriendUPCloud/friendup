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
 * Main game
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */


/**
 * Game root
 * The root of the game tree
 */
function Root( tree, name, flags )
{
	var self = this;

	// Initialize the root item
	Friend.Tree.Items.init( this, tree, 'Panzers', 'Root', flags );

	// Load the extra sources
	Friend.Tree.include( [ 'Progdir:Scripts/title.js', 'Progdir:Scripts/battle.js' ], function( response )
	{
		if ( response == 'OK' )
		{
			// Loads the images
			self.tree.resources.loadImages(
			[
				{ name: 'tank', path: 'Progdir:Resources/tank.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'tank3D', path: 'Progdir:Resources/tank.png', start: 1, end: 6, hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'tankEnnemy', path: 'Progdir:Resources/tank.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'tileTopLeft', path: 'Progdir:Resources/tileTopLeft.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileTop', path: 'Progdir:Resources/tileTop.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileTopRight', path: 'Progdir:Resources/tileTopRight.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileRight', path: 'Progdir:Resources/tileRight.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileBottomRight', path: 'Progdir:Resources/tileBottomRight.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileBottom', path: 'Progdir:Resources/tileBottom.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileBottomLeft', path: 'Progdir:Resources/tileBottomLeft.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileLeft', path: 'Progdir:Resources/tileLeft.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileBack', path: 'Progdir:Resources/tileBack.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'tileBuilding', path: 'Progdir:Resources/tileBuilding.png', start: 1, end: 3, hotSpot: Friend.Tree.HOTSPOT_LEFTTOP }, 	// Image #3 will be included
				{ name: 'bullet', path: 'Progdir:Resources/bullet.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'bullet3D', path: 'Progdir:Resources/bullet.png', start: 1, end: 1, hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'explosion', path: 'Progdir:Resources/explosion.png', start: 1, end: 7, hotSpot: Friend.Tree.HOTSPOT_CENTER },    		// Image #7 will be included
				{ name: 'title', path: 'Progdir:Resources/title.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'bubble', path: 'Progdir:Resources/bubble.png', hotSpot: Friend.Tree.HOTSPOT_CENTERBOTTOM },
				{ name: 'playfield', path: 'Progdir:Resources/playfield.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'speed', path: 'Progdir:Resources/speed.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'teleport', path: 'Progdir:Resources/teleport.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'wrench', path: 'Progdir:Resources/wrench.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'frnd', path: 'Progdir:Resources/frnd.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'grass', path: 'Progdir:Resources/grass.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'quest', path: 'Progdir:Resources/quest.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'applicationIcon', path: 'Progdir:icon.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
				{ name: 'friendQuest', path: 'Progdir:Resources/friendQuest.png', hotSpot: Friend.Tree.HOTSPOT_LEFTTOP },
			],
			{
				caller: self,
				loadCompleted: imageLoadCompleted
			} );

			// When all icons are loaded, start!
			function imageLoadCompleted()
			{
				// Loads the sounds
				self.tree.resources.loadSounds(
				[
					{ name: 'explosion', path: 'Progdir:Resources/explosion.mp3', volume: 0.8 },
					{ name: 'cannon', path: 'Progdir:Resources/cannon.mp3', volume: 0.8 },
					{ name: 'bonus', path: 'Progdir:Resources/bonus.mp3', volume: 1 },
					{ name: 'diesel', path: 'Progdir:Resources/diesel.mp3', loops: 0, volume: 0.6 },
					{ name: 'music', path: 'Progdir:Resources/music.mp3', loops: 0, volume: 0.6 },
					{ name: 'fast', path: 'Progdir:Resources/fast.mp3', loops: 0, volume: 1 },
					{ name: 'cash', path: 'Progdir:Resources/cashRegister.mp3', loops: 0, volume: 1 },
					{ name: 'winning', path: 'Progdir:Resources/winning.mp3', loops: 10, volume: 0.8 },
					{ name: 'applause', path: 'Progdir:Resources/applause.mp3', loops: 10, volume: 1 },
				],
				{
					caller: self,
					loadCompleted: soundLoadCompleted
				} );

				// When all the sounds are loaded, start the game!
				function soundLoadCompleted()
				{
					// Creates the network object
					var image = self.resources.getApplicationIcon();
					var base64 = self.utilities.convertImageToBase64( image );
					self.friendNetworkReady = false;
					self.network = new Friend.Tree.Network.Manager( this.tree, 'network',
					{
						root: self,
						parent: self,
						appName: 'Panzers',
						password: 'HelloThisIsMe!',
						caller: this,
						messages: waitForReady,				// Will only receive INIT message
						appInformation:
						{
							name: 'Panzers',
							title: 'A multiplayer game created with the Tree engine on Friend. (www.friendup.cloud)',
							image: base64,
							description: 'Destroy your ennemies in this fast-paced tank game!</BR>Sources on GIT! _url_',
							version: 1
						}
					} );
				}
				function waitForReady( command, data )
				{
					if ( command == 'ready' )
					{
						self.friendNetworkReady = data;
						
						// Authorise Friend Quest!
						self.friendQuest = true;

						// Theme
						self.theme =
						{
							'Friend.Tree.UI.Button':
							{
								textColor: '#000000',
								backColor: '#7FC9FF',
								downColor: '#5E90B5',
								mouseOverColor: '#B3DFFF',
								brightColor: '#D1E6F5',
								darkColor: '#098EF1'
							},
							'Friend.Tree.UI.Dialog':
							{
								color: '#15ECE4',
								backColor: '#004A7F',
								brightColor: '#A5BDCE',
								darkColor: '#003458'
							},
							'Friend.Tree.UI.MessageBox':
							{
								backColor: '#004A7F',
								brightColor: '#A5BDCE',
								darkColor: '#003458',
								textColor: '#000000',
								titleColor: '#FFFFFF'
							},
							'Friend.Tree.UI.List':
							{
								backColor: '#7FC9FF',
								color: '#000000'
							}
						};

						// Creates the Dormant door
						self.dormant = new Friend.Tree.Network.Dormant( this.tree, 'dormant',
						{
							root: self,
							parent: self,
							appName: 'Panzers',
							functions: []
						} );

						// Adds the Title page
						new Title( self.tree, 'title',
						{
							root: self,
							parent: self,
							x: 0,
							y: 0,
							z: 0,
							width: '100%',
							height: '100%',
							playMusic: true,
							playSounds: true,
							network: self.network,
							dormant: self.dormant,
							theme: self.theme
						} );
					}
				}
			}
		}
	} );
};

// Message Up
Root.prototype.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Root.prototype.messageDown = function ( message )
{
	return this.endProcess( message );
};
