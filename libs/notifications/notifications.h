/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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
