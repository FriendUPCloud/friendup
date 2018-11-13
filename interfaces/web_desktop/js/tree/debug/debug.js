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
 * Tree engine debiugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Debug = Friend.Tree.Debug || {};
Friend.Tree.Debug.RenderItems = Friend.Tree.Debug.RenderItems || {};

Friend.Tree.Debug.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/debug/debugDebugger.js",
        "/webclient/js/tree/debug/debugFps.js",
        "/webclient/js/tree/debug/debugRendererControl.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
