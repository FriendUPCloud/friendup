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
 * Tree engine main processes
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/09/2017
 */
Friend = window.Friend || {};
Friend.Flags = Friend.Flags || {};
Friend.Tree = Friend.Tree || {};

/**
 * Common functions
 */
Friend.Tree.Processes =
{
	/**
	 * init
	 *
	 * Process initialisation, must be called from the process constructor
	 *
	 * @param (object) self the process itself
	 * @param (object) treethe Tree engine
	 * @param (object) object the item handled by the process
	 * @param (string) className the name of the process class
	 * @param (object) flags process creation flags
	 */
	init: function ( tree, self, item, className, properties )
	{
		self.tree = tree;
		self.isProcess = true;
		self.utilities = tree.utilities;
		self.item = item;
		self.root = item.root;
		self.className = className;
		self.utilities.setFlags( self, properties );
		self.resources = tree.resources;
		self.addProcess = Friend.Tree.Items.addProcess;
		self.removeProcess = Friend.Tree.Items.removeProcess;
		self.getTemporaryFunctions = Friend.Tree.Items.getTemporaryFunctions;
		self.getTemporaryFunctionsCount = Friend.Tree.Items.getTemporaryFunctionsCount;
		self.setTemporaryProperty = Friend.Tree.Items.setTemporaryProperty;
		self.setAfter = Friend.Tree.Items.setAfter;
		self.callAfter = Friend.Tree.Items.callAfter;
		self.temporaryFunctions = [];

        // Assign the functions of the class
        Friend.Tree.Utilities.assignToObject( self, className );
	}
};


