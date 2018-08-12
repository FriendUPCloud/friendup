
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
 * Friend Watch
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 31/01/2018
 * 
 */

/**
 * Watch
 *
 * Main face of the watch
 */
function Watch( tree, name, flags )
{
	Friend.Tree.Items.init( this, tree, name, 'Watch', flags );

	// Background image
	var xCenter = this.width / 2;
	var yCenter = this.height / 2;
	this.background = new Friend.Tree.UI.Bitmap( this.tree, 'Watch Face',
	{
		root: this.root,
		parent: this,
		x: xCenter,
		y: yCenter,
		z: 0,
		image: 'watch'
	} );

	// Starts the tree
	this.tree.start();
	return this;
}

