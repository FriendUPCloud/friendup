/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
 * This library allows JS code to send native notifications to mobile applications.
 * Notification websocket (for the mobile app) has to be enabled in core/network/websocket.c
 *
 * Test in workspace developer JS console with:
 * new Library('notifications.library').execute("notify?message=your_message_here&extra=something&title=sometitle");
*/
#pragma once

#include <core/types.h>
#include <core/library.h>
#include <network/http.h>

typedef struct NotificationsLibrary
{
	char   *l_Name;    // library name
	FULONG  l_Version; // version information
	void   *handle;
	void   *sb;			// pointer to systembase
	void   *(*libInit)( void );
	void    (*libClose)( struct Library* l );
	long    (*GetVersion)(void);
	long    (*GetRevision)(void);
	Http   *(*WebRequest)( struct Library *l, char* func, Http *request ); // Return HTTP code. 0 means Internal Server Error.
} NotificationsLibrary_t;

_Static_assert(offsetof(NotificationsLibrary_t, WebRequest) == offsetof(Library, WebRequest), "Struct fields must match Library type from library.h");
