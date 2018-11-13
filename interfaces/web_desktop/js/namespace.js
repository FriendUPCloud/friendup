/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( window.friendUP )
	throw new Error( 'namespace.js - friendUP namespace is already defined, make sure this is the first script executed' );

window.friendUP = {
	app : {},
	component : {},
	gui : {},
	io : {},
	media : {},
	system : {},
	tool : {},
	util : {}
};
window.Friend = window.Friend || {};

