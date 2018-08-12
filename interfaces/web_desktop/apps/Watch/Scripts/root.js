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
 * Friend Watch main entry
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 30/01/2018
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
	Friend.Tree.include( [ 'Progdir:Scripts/watch.js' ], function( response )
	{
		if ( response == 'OK' )
		{
			// Loads the images
			self.tree.resources.loadImages(
			[
				{ name: 'face', path: 'Progdir:Resources/face.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'watch', path: 'Progdir:Resources/watch.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'infoSpaceDate', path: 'Progdir:Resources/infoSpaceDate.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'infoSpaceRound', path: 'Progdir:Resources/infoSpaceRound.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'battery', path: 'Progdir:Resources/battery.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'temperature', path: 'Progdir:Resources/temperature.png', hotSpot: Friend.Tree.HOTSPOT_CENTER },
				{ name: 'heart', path: 'Progdir:Resources/heart.png', hotSpot: Friend.Tree.HOTSPOT_CENTER }
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
					{ name: 'bonus', path: 'Progdir:Resources/bonus.mp3', volume: 1 },
				],
				{
					caller: self,
					loadCompleted: soundLoadCompleted
				} );

				// When all the sounds are loaded, start the game!
				function soundLoadCompleted()
				{
					// Adds the Title page
					new Watch( self.tree, 'Friend Watch',
					{
						root: self,
						parent: self,
						x: 0,
						y: 0,
						z: 0,
						width: self.width,
						height: self.height
					} );
				}
			}
		}
	} );
};
