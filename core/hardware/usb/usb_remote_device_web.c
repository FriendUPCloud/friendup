/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  USB Remote web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>

/**
 * USB Remote network handler
 *
 * @param lb pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* USBRemoteManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lb;
	Log( FLOG_DEBUG, "USBRemote Request %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	Http *response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usbremote/help</H2>Return information about avaiable usb funtions
	*
	* @param sessionid - (required) session id of logged user
	* @return return information about avaiable usb functions
	*/
	/// @endcond
	if (strcmp(urlpath[0], "help") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		HttpAddTextContent(response, \
			"add - add usb remote device" \
			"delete - delete usb remote device" \
			"list - list of usb remote devices" \
			");" );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usbremote/add</H2>List all available usb ports
	*
	* @param sessionid - (required) session id of logged user
	* @return return information about avaiable usb ports in JSON format when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp(urlpath[0], "add" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		char *username = NULL;
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if (el != NULL)
		{
			username = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( username != NULL )
		{
			int error = 0;
			
			USBRemoteDevice *actdev = USBRemoteManagerCreatePort( l->sl_USBRemoteManager, username, &error );
			if( actdev != NULL )
			{
				char buffer[ 512 ];
				
				/*
					char						*usbrd_Name;
	int							usbrd_IPPort;				// ip port
	char						*usbrd_Login;				// login and password (if set)
	char						*usbrd_Password;
	char						*usbrd_NetworkAddress;		// internet address
				 */

				int size = sprintf( buffer, "{\"deviceid\":\"%lu\",\"address\":\"%s\",\"port\":%d,\"uname\":\"%s\",\"password\":\"%s\"}", actdev->usbrd_ID, actdev->usbrd_NetworkAddress, actdev->usbrd_IPPort, actdev->usbrd_Login, actdev->usbrd_Password );
				HttpAddTextContent(response, buffer);
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\",\"error\":%d}", l->sl_Dictionary->d_Msg[DICT_USB_REMOTE_CANNOT_BE_CREATED] , DICT_USB_REMOTE_CANNOT_BE_CREATED, error );
				HttpAddTextContent( response, dictmsgbuf );
				
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		
		if( username != NULL )
		{
			FFree( username );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usbremote/delete</H2>Query FriendCore for avaiable usb port
	*
	* @param sessionid - (required) session id of logged user
	* @return { USBDeviceID: <number> } when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "delete") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		char buffer[512];

		USBDevice *dev = USBManagerLockPort(l->sl_USB, loggedSession);
		if (dev != NULL)
		{
			int size = sprintf(buffer, "{ \"USBDeviceID\": \"%lu\" }", dev->usbd_ID );
			HttpAddTextContent(response, buffer);
		}
		else
		{
			int size = sprintf(buffer, "{ \"response\": \"%s\" }", "All ports are busy");
			HttpAddTextContent(response, buffer);
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usbremote/list</H2>Release USB port
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of usb port which you want to release
	* @return { USBDeviceID: <number> } when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "list") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		FULONG id = 0;

		response = HttpNewSimple(HTTP_200_OK, tags);

		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if (el != NULL)
		{
			char *next;
			id = (FLONG)strtol((char *)el->hme_Data, &next, 0);
		}
		
		BufString *bs = BufStringNew();
		if (bs != NULL)
		{
			int pos = 0;

			BufStringAdd(bs, " { \"USBPorts\": [");
			
			for( pos = 0; pos < l->sl_USB->usbm_MaxPort ; pos++ )
			{
				USBDevice *dev =  l->sl_USB->usbm_Ports[ pos ];
				
				if( dev != NULL )
				{
					char tempBuffer[ 1024 ];

					if (pos > 0)
					{
						BufStringAdd(bs, ", ");
					}
				
					int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"Name\":\"%s\",\"Port\":\"%s\",\"Connected\":\"%d\"", dev->usbd_Name, dev->usbd_NetworkAddress, dev->usbd_State );

					BufStringAddSize(bs, tempBuffer, msgsize);
				}
				else
				{
					FERROR("USBPort not found\n");
				}
			}
			//INFO("JSON INFO 2: %s\n", bs->bs_Buffer );

			BufStringAdd(bs, "  ]}");

			INFO("USBPORTS JSON INFO: %s\n", bs->bs_Buffer);

			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;

			BufStringDelete(bs);
		}
		else
		{
			FERROR("ERROR: Cannot allocate memory for BufferString\n");
		}
	}
	
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		response = HttpNewSimple( HTTP_200_OK, tags );
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_FUNCTION_NOT_FOUND] , DICT_FUNCTION_NOT_FOUND );
		HttpAddTextContent( response, dictmsgbuf );
	}
	
	return response;
}
