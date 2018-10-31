/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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

