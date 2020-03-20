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
 *  USB web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/01/2017
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
 * Network handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* USBManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lb;
	Log( FLOG_DEBUG, "USB Request %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	Http *response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usb/help</H2>Return information about avaiable usb funtions
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
			"listports - return all usb ports\n \
			listdevices - list all usb devices\n \
			queryport - query for usb port\n \
			releaseport - release usb port\n \
			");
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usb/listports</H2>List all available usb ports
	*
	* @param sessionid - (required) session id of logged user
	* @return return information about avaiable usb ports in JSON format when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "listports") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usb/queryport</H2>Query FriendCore for avaiable usb port
	*
	* @param sessionid - (required) session id of logged user
	* @return { USBDeviceID: <number> } when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "queryport") == 0)
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
	* <HR><H2>system.library/usb/releaseport</H2>Release USB port
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of usb port which you want to release
	* @return { USBDeviceID: <number> } when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "releaseport") == 0)
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
		
		if (id > 0)
		{
			USBDevice *dev = USBManagerGetDeviceByID(l->sl_USB, id);
			//
			int size = 0;
			int error = -1;

			if (dev != NULL)
			{
				error = USBManagerUnLockPort(l->sl_USB, dev);
			}
			else
			{
				error = -2;
			}

			if (error == 0)
			{
				char buffer[512];
				int size = sprintf(buffer, "{ \"USBDeviceID\": \"%lu\" }", dev->usbd_ID);
				HttpAddTextContent(response, buffer);
			}
			else
			{
				if (error == -1)
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_UNLOCK_PORT], error );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_UNLOCK_PORT );
					HttpAddTextContent( response, dictmsgbuf );
				}
				else 
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_FIND_DEVICE], id );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_FIND_DEVICE );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usb/addport</H2>Add USB port
	*
	* @param sessionid - (required) session id of logged user
	* @return code 0 when success, otherwise error number
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "addport") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};
		char *port = NULL;
		char *description = NULL;
		
		response = HttpNewSimple(HTTP_200_OK, tags);
		
		HashmapElement *el = HttpGetPOSTParameter(request, "port");
		if (el != NULL)
		{
			port = (char *)el->hme_Data;
		}
		
		char buffer[512];
		
		if (port != NULL)
		{
			int err = USBManagerAddNewPort( l->sl_USB, port );
			
			char buffer[512];
			int size = sprintf(buffer, "{ \"code\": \"%d\" }", err );
			HttpAddTextContent(response, buffer);
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "port" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	//
	// function releated to devices not found
	//
	
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		response = HttpNewSimple( HTTP_200_OK, tags );
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_NOT_FOUND] , DICT_FUNCTION_NOT_FOUND );
		HttpAddTextContent( response, dictmsgbuf );
	}
	
	return response;
}
