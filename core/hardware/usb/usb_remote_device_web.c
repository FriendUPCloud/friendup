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
			"create - create usb remote device" \
			"delete - delete usb remote device" \
			"list - list of usb remote devices" \
			");" );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/usbremote/create</H2>Create usb port
	*
	* @param sessionid - (required) session id of logged user
	* @param username - (required) user name which points to user to which usb remote device will be attached
	* @return return information about avaiable usb ports in JSON format when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[0], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		char *username = NULL;
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if (el != NULL)
		{
			username = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( username != NULL )
		{
			int error = 0;
			
			UserUSBDevices *actuserdev = USBRemoteManagerCreatePort( l->sl_USBRemoteManager, username, &error );
			if( actuserdev != NULL )
			{
				char *uname = NULL, *domain = NULL, *pass = NULL, *host = NULL;
				char *buffer;
				char path[ 512 ];
				
				USBDevice *actdev = USBDeviceNew();
				UserUSBDevicesAddPort( actuserdev, actdev );
				
				//snprintf( tmp, sizeof(tmp), "/%s/", geoFormat );
				
				DEBUG("[usbremotecreate] getting data from mitradb\n");
				
				// check if structure already contain user name from Guacamole
				if( actuserdev->uusbd_RemoteUserName != NULL )
				{
					uname = StringDuplicate( actuserdev->uusbd_RemoteUserName );
				}
				else
				{
					if( loggedSession->us_User != NULL )
					{
						MitraManagerGetUserData( l->sl_MitraManager, loggedSession->us_User->u_Name, &uname, &domain, &pass, &host );
						if( uname != NULL && actuserdev->uusbd_RemoteUserName == NULL )
						{
							actuserdev->uusbd_RemoteUserName = StringDuplicate( uname );
						}
					}
				}
				
				DEBUG("[usbremotecreate] received user data from mitradb. User: %s Domain: %s\n", uname, domain );
				
				// generate password for usb device
				
				char *usbPassword = MakeString( 255 );
				sprintf( usbPassword, "%ld%s%d", time(NULL), loggedSession->us_SessionID, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );
				HashedString( &usbPassword );
				
				actdev->usbd_UserName = StringDuplicate( username );
				actdev->usbd_Password = usbPassword;
				actdev->usbd_GuacamoleUserName = StringDuplicate( uname );
				
				/*
 Open port
 
 curl -X POST "http://localhost:5000/Usb/Open?windowsUser=Pawel&password=pegasos1232" -H  "accept: **" -H  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImphbkBrb3dhbHNraS5wbCIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6Iktvd2Fsc2tpIiwibmJmIjoxNTk2NDgzMDk4LCJleHAiOjE1OTY0ODMzOTgsImlhdCI6MTU5NjQ4MzA5OCwiaXNzIjoiaXNzdWVyIiwiYXVkIjoiYXVkaWVuY2UifQ._e2w4UvqwgWi4J2LF0s4OvO8GLD4GbqnsM8Ze7ZIdas" -d ""
 */
				snprintf( path, sizeof(path), "Usb/Open?windowsUser=%s%%5C%s&password=%s", domain, uname, pass );// usbPassword );
				
				int bufLen = 256;
				int errorCode;
				
				DEBUG("[usbremotecreate] calling mitra server\n");
				BufString *rsp = MitraManagerCall( l->sl_MitraManager, path, &errorCode );
				
				// ask for key again
				DEBUG("[USBRemoteWEB] error code: %d\n", errorCode );
				if( errorCode == 401 )
				{
					MitraManagerCheckAndAddToken( l->sl_MitraManager, TRUE );
					if( rsp != NULL )
					{
						BufStringDelete( rsp );
					}
					rsp = MitraManagerCall( l->sl_MitraManager, path, &errorCode );
				}
				
				if( rsp != NULL )
				{
					//  { Port = port, WindowsUser = windowsUser }
					char *in = (char *)rsp->bs_Buffer;
					char *tmpbuf = NULL;
					if( ( tmpbuf = strstr( in, "{" ) ) != NULL )
					{
						in = tmpbuf;
					}
					
					jsmn_parser p;
					jsmntok_t t[128]; // We expect no more than 128 tokens
					
					DEBUG("[usbremotecreate] parse response: %s\n", in );
					
					bufLen += rsp->bs_Size;
				
					jsmn_init( &p );
					int r = jsmn_parse( &p, in , rsp->bs_Size, t, 256 );

					// Assume the top-level element is an object 
					if( r > 1 && t[0].type == JSMN_OBJECT )
					{
						//{"host":"localhost","username":"guac","password":"IkkeHeltStabile2000","database":"guacamole"} 
				
						char *port = StringDuplicateN( in + t[ 2 ].start, (int)(t[ 2 ].end-t[ 2 ].start) );
						//char *winUser = StringDuplicateN( in + t[ 4 ].start, (int)(t[ 4 ].end-t[ 4 ].start) );
						
						if( port != NULL )
						{
							char *end;
							actdev->usbd_IPPort = strtoll( port,  &end, 0 );
							FFree( port );
						}

					}
					BufStringDelete( rsp );
				}
				else
				{
					FERROR("[usbremotecreate] Cannot call mitra server\n");
				}
				
				
				/*
				 SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'database';
				  {"host":"localhost","username":"guac","password":"IkkeHeltStabile2000","database":"guacamole"}
				 * 
				 select * from FSetting where Type='MitraApp';
{"type":"RDP","name":"Francois Server","full address":"35.156.138.140","server port":"3389","remoteapplicationprogram":"","remote-app-dir":"francoisserver","saml_accessgroups":"","icon":"","executable_path":"","security":"any","alternate shell":"","remoteapp_parameters":"","remoteapp_working_dir":"","performance_wallpaper":"1","performance_theming":"1","performance_cleartype":"1","performance_windowdrag":"1","performance_aero":"1","performance_menuanimations":"1"} |
				 */

				if( actdev->usbd_IPPort >= 0 )
				{
					if( ( buffer = FMalloc( bufLen ) ) != NULL )
					{
						int size = sprintf( buffer, "{\"deviceid\":\"%lu\",\"address\":\"%s\",\"port\":%d,\"uname\":\"%s\",\"password\":\"%s\"}", actdev->usbd_ID, l->sl_MitraManager->mm_HostForClient, actdev->usbd_IPPort, actdev->usbd_Login, actdev->usbd_Password );
						//HttpAddTextContent(response, buffer);
						HttpSetContent( response, buffer, size );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\",\"error\":%d}", l->sl_Dictionary->d_Msg[DICT_USB_REMOTE_CANNOT_BE_CREATED] , DICT_USB_REMOTE_CANNOT_BE_CREATED, error );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( uname != NULL )
				{
					FFree( uname );
				}
				if( domain != NULL )
				{
					FFree( domain );
				}
				if( pass != NULL )
				{
					FFree( pass );
				}
				if( host != NULL )
				{
					FFree( host );
				}
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
	* @param username - (required) user name which points to user from which usb remote device will be dettached
	* @param port - (required) port of device which will be deleted
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

		char *username = NULL;
		FLONG port = 0;
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if (el != NULL)
		{
			username = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "port" );
		if (el != NULL)
		{
			char *next;
			port = (FLONG)strtol((char *)el->hme_Data, &next, 0);
		}
		
		if( username != NULL )
		{
			int error = 0;
			char  portString[ 128 ];
			
			snprintf( portString, sizeof(portString), "Usb/Close?port=%lu", port );	// lets recognize port by
			
			int errorCode;
			
			if( port == -1 )	// remove all user devices
			{
				UserUSBDevices *userusbdevices = USBRemoteManagerGetPorts( l->sl_USBRemoteManager, username );
				if( userusbdevices )
				{
					USBDevice *dev = userusbdevices->uusbd_Devices;
					while( dev != NULL )
					{
						// send request to windows that we want to remove user port after port
						snprintf( portString, sizeof(portString), "Usb/Close?port=%d", dev->usbd_IPPort );	// lets recognize port by
					
						BufString *rsp = MitraManagerCall( l->sl_MitraManager, portString, &errorCode );
						if( rsp != NULL )
						{
							// ask for key again
							DEBUG("[USBRemoteWEB] error code: %d\n", errorCode );
							if( errorCode == 401 )
							{
								MitraManagerCheckAndAddToken( l->sl_MitraManager, TRUE );
								if( rsp != NULL )
								{
									BufStringDelete( rsp );
								}
								rsp = MitraManagerCall( l->sl_MitraManager, portString, &errorCode );
							}
						}
						dev = (USBDevice *) dev->node.mln_Succ;
					}
				}	// userusbdevices
			}
			else
			{
				BufString *rsp = MitraManagerCall( l->sl_MitraManager, portString, &errorCode );
				if( rsp != NULL )
				{
					// ask for key again
					DEBUG("[USBRemoteWEB] error code: %d\n", errorCode );
					if( errorCode == 401 )
					{
						MitraManagerCheckAndAddToken( l->sl_MitraManager, TRUE );
						if( rsp != NULL )
						{
							BufStringDelete( rsp );
						}
						rsp = MitraManagerCall( l->sl_MitraManager, portString, &errorCode );
					}
				}
			
				error = USBRemoteManagerDeletePortByPort( l->sl_USBRemoteManager, username, port );
			}
			
			if( error == 0 )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"result\": \"sucess\" }" );
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
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, id" );
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

		char *username = NULL;

		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if (el != NULL)
		{
			username = UrlDecodeToMem( (char *)el->hme_Data );
		}
		el = HttpGetPOSTParameter( request, "id" );
		if (el != NULL)
		{
			char *next;
			id = (FLONG)strtol((char *)el->hme_Data, &next, 0);
		}
		
		if( username != NULL && id > 0 )
		{
			BufString *bs = BufStringNew();
			if (bs != NULL)
			{
				int pos = 0;
			
				UserUSBDevices *ususbdev = USBRemoteManagerGetPorts( l->sl_USBRemoteManager, username );
			
				BufStringAdd( bs, " {\"usbports\": [");
			
				if( FRIEND_MUTEX_LOCK( &(ususbdev->uusbd_Mutex) ) == 0 )
				{
					USBDevice *actdev =  ususbdev->uusbd_Devices;
					while( actdev )
					{
						if( actdev != NULL )
						{
							char tempBuffer[ 1024 ];
							if( pos > 0)
							{
								BufStringAdd( bs, ", ");
							}
				
							int msgsize = snprintf( tempBuffer, sizeof( tempBuffer ), "{\"deviceid\":\"%lu\",\"address\":\"%s\",\"port\":%d,\"uname\":\"%s\",\"password\":\"%s\"}", actdev->usbd_ID, actdev->usbd_NetworkAddress, actdev->usbd_IPPort, actdev->usbd_Login, actdev->usbd_Password );

							BufStringAddSize( bs, tempBuffer, msgsize );
						}
						else
						{
							FERROR("USBPort not found\n");
						}
						actdev = (USBDevice *)actdev->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &(ususbdev->uusbd_Mutex) );
				}

				BufStringAdd( bs, "]}" );

				INFO("USBPORTS JSON INFO: %s\n", bs->bs_Buffer);

				HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
				bs->bs_Buffer = NULL;

				BufStringDelete( bs );
			}
			else
			{
				FERROR("ERROR: Cannot allocate memory for BufferString\n");
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, id" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		
		if( username != NULL )
		{
			FFree( username );
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
