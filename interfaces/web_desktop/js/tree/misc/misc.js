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
 * Tree engine interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 16/04/2018
 */
Friend = window.Friend || {};
Friend.Tree.Misc = Friend.Tree.Misc || {};
Friend.Tree.Misc.RenderItems = Friend.Tree.Misc.RenderItems || {};

Friend.Tree.Misc.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/misc/ace.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};

