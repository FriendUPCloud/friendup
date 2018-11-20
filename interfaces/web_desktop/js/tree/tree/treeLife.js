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
 * Tree engine Tree management elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.RenderItems = Friend.Tree.RenderItems || {};

Friend.Tree.initTreeLife = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/tree/treeEmpty.js",
        "/webclient/js/tree/tree/treeRendererImage.js",
        "/webclient/js/tree/tree/treeTree.js",
        "/webclient/js/tree/tree/treePixelizer.js",
        "/webclient/js/tree/tree/treeAsciiArt.js",
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
