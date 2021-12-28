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

	Application Library
	
	@Pawel Stefanski

*/

#ifndef __USB_LIBRARY_H_
#define __USB_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <db/sqllib.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/application/application.h>
#include <z/zlibrary.h>


//
//	library
//

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct USBLibrary
{
	char 		*l_Name;			// library name
	FULONG 		l_Version;			// version information
	void 		*l_Handle;
	void						*sb; // system base
	void *		(*libInit)( void *sb );
	void 		(*libClose)( struct Library *l );
	FULONG 		(*GetVersion)(void);
	FULONG 		(*GetRevision)(void);
	
	void		*sl_USBManager;

	Http 							*(*USBWebRequest)( struct USBLibrary *usblib, char **urlpath, Http* request, UserSession *loggedSession );
	int								(*USBManagerRemoveUserPorts)( void *usbm, char *username );

	SQLLibrary						*usb_sqllib;
	ZLibrary						*usb_zlib;

} USBLibrary;



#endif	// __USB_LIBRARY_H_
