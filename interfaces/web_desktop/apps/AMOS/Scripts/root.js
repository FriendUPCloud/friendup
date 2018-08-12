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
function Root( tree, name, properties )
{
	// Initialize the root item
	Friend.Tree.Items.init( this, tree, 'Friend Create 2', 'Root', properties );

	// Load the extra sources
	var self = this;
	Friend.Tree.include( [ 'Progdir:Scripts/main.js' ], function( response )
	{
		if ( response == 'OK' )
		{			
			// Loads the images
			self.tree.resources.loadImages(
			[
				{ name: 'arrowRight', path: 'Progdir:Resources/arrowRight.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'arrowDown', path: 'Progdir:Resources/arrowDown.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_unknown', path: 'Progdir:Resources/unknown.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_source', path: 'Progdir:Resources/source.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_html', path: 'Progdir:Resources/html.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_image', path: 'Progdir:Resources/picture.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_sound', path: 'Progdir:Resources/sound.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_css', path: 'Progdir:Resources/css.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'file_text', path: 'Progdir:Resources/text.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'tab_close', path: 'Progdir:Resources/close.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolBookmark', path: 'Progdir:Resources/toolBookmark.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolBuild', path: 'Progdir:Resources/toolBuild.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolEditor', path: 'Progdir:Resources/toolEditor.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolFind', path: 'Progdir:Resources/toolFind.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolFile', path: 'Progdir:Resources/toolFile.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolFindInFiles', path: 'Progdir:Resources/toolFindInFiles.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolFolder', path: 'Progdir:Resources/toolFolder.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolKeyboard', path: 'Progdir:Resources/toolKeyboard.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolNew', path: 'Progdir:Resources/toolNew.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolNextBookmark', path: 'Progdir:Resources/toolNextBookmark.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolOpen', path: 'Progdir:Resources/toolOpen.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolPreferences', path: 'Progdir:Resources/toolPreferences.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolPreviousBookmark', path: 'Progdir:Resources/toolPreviousBookmark.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolProject', path: 'Progdir:Resources/toolProject.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolReplace', path: 'Progdir:Resources/toolReplace.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolRun', path: 'Progdir:Resources/toolRun.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolSave', path: 'Progdir:Resources/toolSave.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolSaveAs', path: 'Progdir:Resources/toolSaveAs.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolToolbar', path: 'Progdir:Resources/toolToolbar.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolArrow', path: 'Progdir:Resources/toolArrow.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
				{ name: 'toolUpdate', path: 'Progdir:Resources/toolUpdate.png', hotSpot: Friend.Tree.HOTSPOT_TOPLEFT },
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
					{ name: 'empty', path: 'Progdir:Resources/empty.mp3', volume: 0.8 },
				],
				{
					caller: self,
					loadCompleted: soundLoadCompleted
				} );

				// When all the sounds are loaded, start the game!
				function soundLoadCompleted()
				{
					// Adds the main 
					new Main( self.tree, 'main',
					{
						root: self,
						parent: self,
						x: 0,
						y: 0,
						z: 0,
						width: self.width,
						height: self.height,
						fuiJson: self.fuiJson
					} );
				}
			}
		}
	} );
};

// Message Up
Root.prototype.messageUp = function ( message )
{
	// Nothing to process
	return false;
};
Root.prototype.messageDown = function ( message )
{
	return false;
};
