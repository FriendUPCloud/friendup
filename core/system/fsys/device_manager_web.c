/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/
/** @file device_manager_web.c
 * 
 *  Device manager definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#include "device_manager_web.h"
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <core/types.h>
#include <core/functions.h>
#include <system/fsys/door_notification.h>

/**
 * Device web calls handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @param result pointer to integer where http error will be set
 * @return pointer to new Http structure (response) or NULL when error appear
 */
Http *DeviceMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/help</H2>Return available commands
	*
	* @param sessionid - (required) session id of logged user
	* @return avaiable device commands
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "ok<!--separate-->{\"HELP\":\"commands: \"" 
			"mount - mount device"
			",unmount - unmount device"
			",list - list all mounted devices"
			",listsys - take all avaiable file systems"
			"\"}" );
		
		*result = 200;
		
		return response;
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/refreshlist</H2>Refresh user drives.
	* This function check database Filesystem changes and mount unmounted devices.
	*
	* @param sessionid - (required) session id of logged user
	* @return information which devices are mounted
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "refreshlist" ) == 0 )
	{
		char ids[ 1024 ];
		ids[ 0 ] = 0;
		int resperr = 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		BufString *bs = BufStringNew();
		if( ( resperr = RefreshUserDrives( l, loggedSession->us_User, bs ) ) == 0 )
		{
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Bufsize );
			bs->bs_Buffer = NULL;
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "RefreshUserDrives", resperr );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
			HttpAddTextContent( response, dictmsgbuf );
		}
		BufStringDelete( bs );
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/knock</H2>Get detailed information about drive.
	*
	* @param sessionid - (required) session id of logged user
	* @param devname - (required) device name
	* @return ok + separator + message when call passed without problems, otherwise error code will be returned
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "knock" ) == 0 )
	{
		char *devname = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( el != NULL ) devname = (char *)el->data;
		
		int success = -1;
		char *resultstring = NULL;
		
		if( devname != NULL )
		{
			char *query = FCalloc( 512, sizeof( char ) );
			
			// Fetch rows
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib )
			{
				//snprintf( query, 512, ""
				sqllib->SNPrintF( sqllib, query, 512, ""
"SELECT f.Name, f.ShortDescription FROM `Filesystem` f "
"WHERE f.Config LIKE \"%%\\\"pollable\\\":\\\"yes\\\"%%\" "
"AND f.Name = \"%s\" LIMIT 1", devname );
				
				void *res = sqllib->Query( sqllib, query );
				
				if( res != NULL )
				{
					char **row;
					int rownr = 0;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						if( row[ 0 ] != NULL && row[ 1 ] != NULL )
						{
							resultstring = FCalloc( 512, sizeof( char ) );
							sprintf( resultstring, "ok<!--separate-->{\"Name\":\"%s\",\"Description\":\"%s\"}", row[0], row[1] );
							success = 0;
						}
					}
					
					sqllib->FreeResult( sqllib, res );
				}
				
				l->LibrarySQLDrop( l, sqllib );
			}
			
			FFree( query );
			
			// We failed
			if( success == -1 )
			{
				char dictmsgbuf[ 256 ];
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_DRIVE_NOT_FOUND], devname );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_DRIVE_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			// Wee we succeeded
			else if( resultstring != NULL )
			{
				HttpAddTextContent( response, resultstring );
			}
			// We failed (future use cases where error message is in success integer var)
			else
			{
				char dictmsgbuf[ 256 ];
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ENTRY_IN_DB], devname );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ENTRY_IN_DB );
				HttpAddTextContent( response, dictmsgbuf );
			}
			// Free resources
			if( resultstring )
			{
				FFree( resultstring );
			}
		}
		// No device name
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "devname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}		
		
		
		*result = 200;
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/polldrives</H2>Return list of available drives
	*
	* @param sessionid - (required) session id of logged user
	* @TODO Hogne give more details
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "polldrives" ) == 0 )
	{
		// Ready response
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		if( response != NULL )
		{ 
			HttpFree( response ); 
			FERROR("RESPONSE polldrives\n"); 
		}
		response = HttpNewSimple( HTTP_200_OK, tags );
		
		// Build query and make ready to fetch rows in liststring
		char *query = "\
SELECT f.Name, u.FullName AS Username  FROM `Filesystem` f, FUser u \
WHERE f.Config LIKE \"%\\\"pollable\\\":\\\"yes\\\"%\" AND u.ID = f.UserID \
ORDER BY \
f.Name ASC";
			
			ListString *str = ListStringNew();
			
			// Fetch rows
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib != NULL )
			{
				void *res = sqllib->Query( sqllib, query );
				
				if( res != NULL )
				{
					char **row;
					int rownr = 0;
					while( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						if( row[ 0 ] != NULL && row[ 1 ] != NULL )
						{
							char *prt = FCalloc( 512, sizeof( char ) );
							sprintf( prt, "%s{\"Name\":\"%s\",\"Publisher\":\"%s\"}", rownr == 0 ? "" : ",", row[0], row[1] );
							ListStringAdd( str, prt, strlen( prt ) ); 
							FFree( prt );
							rownr++;
						}
					}
					sqllib->FreeResult( sqllib, res );
				}
				l->LibrarySQLDrop( l, sqllib );
			}
			
			// Add positive response
			if( ListStringJoin( str ) )
			{
				char *cnt = FCalloc( strlen( str->ls_Data ) + 20, sizeof( char ) );
				sprintf( cnt, "ok<!--separate-->[%s]", str->ls_Data );
				HttpAddTextContent( response, cnt );
				FFree( cnt );
			}
			// Add negative response
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_POLL_DRIVE_NO_DATA] , DICT_POLL_DRIVE_NO_DATA );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			// Clean up and set result status
			ListStringDelete( str );
			*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/mount</H2>Mount device
	*
	* @param sessionid - (required) session id of logged user
	* @param devname - (required) device name. Parameter and logged user id is used to get user device parameters from Filesystem table.
	* @param path - used by most filesystems to point directory which will be mounted (like server filesystem)
	* @param enc - set to 'true' to encode data on disk
	* @param type - filesystem type
	* @param execute - point to application which will be launched when mount function will be called
	* @param visible - set to 'true' if you want to make device visible for users
	* @return { Response: Mounted successfully. } when success, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "mount" ) == 0 )
	{
		char *devname = NULL;
		char *path = NULL;
		char *type = NULL;
		char *visible = NULL;
		char *execute = NULL;
		char *enc = NULL; // if enc = 'yes' the whole transmission is encoded by private key
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		if( response != NULL )
		{
			HttpFree( response ); 
			FERROR("RESPONSE mount\n"); 
		}
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[DeviceMWebRequest] mount\n");
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			
			goto error;
		}
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( !el ) el = HashmapGet( request->query, "devname" );
		
		if( el != NULL )
		{
			char *ldevname = NULL;
			devname = (char *)el->data;
			
			if( devname != NULL && ( ldevname = FCalloc( strlen( devname ) + 50, sizeof(char) ) ) != NULL )
			{
				UrlDecode( ldevname, devname );
				strcpy( devname, ldevname );
				
				// Clean name
				int nl = strlen( devname );
				memset( ldevname, 0, strlen( devname ) + 50 );
				
				int i = 0; for( ; i < nl; i++ )
				{
					if( devname[i] == ':' )
					{
						ldevname[i] = '\0';
						break;
					}
					ldevname[i] = devname[i];
				}
				strcpy( devname, ldevname );
				
				FFree( ldevname );
			}
		}
		
		el = HttpGetPOSTParameter( request, "path" );
		if( el != NULL )
		{
			path = (char *)el->data;
			if( path != NULL )
			{
				char *lpath = NULL;
				if( ( lpath = FCalloc( strlen( path ) + 1, sizeof(char) ) ) != NULL )
				{
					UrlDecode( lpath, path );
					strcpy( path, lpath );
					
					FFree( lpath );
				}
			}
		}
		
		el = HttpGetPOSTParameter( request, "enc" );
		if( el != NULL )
		{
			if( (char *)el->data != NULL )
			{
				enc = (char *)el->data;
			}
		}
		
		el = HttpGetPOSTParameter( request, "type" );
		if( el != NULL )
		{
			type = (char *)el->data;
		}
		
		int mountError = 0;
		
		//if( sessionid == NULL || devname == NULL )
		if( devname == NULL )
		{
			FERROR("One of required arguments is missing: sessionid, devname\n");
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "devname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		else
		{
			char *host = NULL;
			char *port = NULL;
			
			el = HttpGetPOSTParameter( request, "execute" );
			if( el != NULL ) execute = ( char *)el->data;
			
			el = HttpGetPOSTParameter( request, "visible" );
			if( el != NULL ) visible = ( char *)el->data;
			
			el = HttpGetPOSTParameter( request, "Server" );
			if( el != NULL )
			{
				host = (char *)el->data;
			}
			
			el = HttpGetPOSTParameter( request, "Port" );
			if( el != NULL )
			{
				port = (char *)el->data;
			}
			
			//
			// user is logged in, we can mount device for him
			//
			
			char *module = NULL;
			el = HttpGetPOSTParameter( request, "module" );
			if( el != NULL )
			{
				module = (char *)el->data;
			}
			
			if( loggedSession->us_User != NULL )
			{
				struct TagItem tags[] = {
					{ FSys_Mount_Path,           (FULONG)path },
					{ FSys_Mount_Server,         (FULONG)host },
					{ FSys_Mount_Port,           (FULONG)port },
					{ FSys_Mount_Type,           (FULONG)type },
					{ FSys_Mount_Name,           (FULONG)devname },
					{ FSys_Mount_User_SessionID, (FULONG)loggedSession->us_User->u_MainSessionID },
					{ FSys_Mount_Module,         (FULONG)module },
					{ FSys_Mount_Owner,          (FULONG)loggedSession->us_User },
					{ FSys_Mount_UserName, (FULONG)loggedSession->us_User->u_Name },
					{ FSys_Mount_Mount,          (FULONG)TRUE },
					{ FSys_Mount_SysBase,        (FULONG)l },
					{ FSys_Mount_Visible,        visible == NULL ? (FULONG)1 : (FULONG)0 },
					//{ FSys_Mount_Execute,        execute == NULL ? (FULONG)NULL : (FULONG)execute },
					{ TAG_DONE, TAG_DONE }
				};
				
				File *mountedDev = NULL;
				
				int mountError = MountFS( l, (struct TagItem *)&tags, &mountedDev, loggedSession->us_User );
				
				// This is ok!
				if( mountError != 0 && mountError != FSys_Error_DeviceAlreadyMounted )
				{
					char dictmsgbuf[ 256 ];
					switch( mountError )
					{
						case FSys_Error_NOFSAvaiable:
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
							//HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"Could not locate file system.\"}" );
							break;
						case FSys_Error_NOFSType:
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
							//HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"No disk type specified or disk does not exist.\"}" );
							break;
						case FSys_Error_NOName:
						case FSys_Error_SelectFail:
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_DISKNAME_OR_DISK] , DICT_NO_DISKNAME_OR_DISK );
							HttpAddTextContent( response, dictmsgbuf );
							//HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"No disk name specified or disk does not exist.\"}" );
							break;
						default:
						{
							char tmp[ 100 ];
							snprintf( tmp, sizeof( tmp ), "ok<!--separate-->Mouting error: %d\n", l->GetError( l ) );
							HttpAddTextContent( response, tmp );
							
							break;
						}
					}
					mountError = 1;
				}
				else
				{
					if( mountError == FSys_Error_DeviceAlreadyMounted )
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device already mounted.\"}" );
					}
					else
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Mounted successfully.\"}" );
					}
					
				}	// mount failed
				
				// we must check if dvice should be moutned
				// NB: ALWAYS mount when asked to and allowed to
				
				if( mountedDev != NULL && l->sl_UnMountDevicesInDB == 1 && mountError != FSys_Error_DeviceAlreadyMounted )
				{
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						char *temptext = FCalloc( 512, sizeof( char ) );
						//sprintf( temptext, "
					
						if( temptext != NULL )
						{
							sqllib->SNPrintF( sqllib,  temptext, 512,"\
UPDATE `Filesystem` f SET f.Mounted = '1' \
WHERE \
( \
`UserID` = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
) \
) \
AND LOWER(f.Name) = LOWER('%s')", 
								loggedSession->us_User->u_ID, loggedSession->us_User->u_ID, devname 
							);

							void *res = sqllib->Query( sqllib, temptext );

							FFree( temptext );
						}
						l->LibrarySQLDrop( l, sqllib );
					}
					
					mountedDev->f_Mounted = TRUE;
					
					char *devfull = FCalloc( strlen( devname ) + 2, sizeof( char ) );
					if( devfull != NULL )
					{
						sprintf( devfull, "%s:", devname );
						DoorNotificationCommunicateChanges( l, loggedSession, mountedDev, devfull );
						FFree( devfull );
					}
				}
				
			}
			else
			{	// user not found , he is not logged in
				DEBUG("[DeviceMWebRequest] Cannot mount device for not logged in user\n");
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USERSESSION_OR_USER_NOT_FOUND] , DICT_USERSESSION_OR_USER_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}		// check mount parameters
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/unmount</H2>Unmount device
	*
	* @param sessionid - (required) session id of logged user
	* @param devname - (required) device name which system will try unmount.
	* @return { Response: Successfully unmounted } when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "unmount" ) == 0 )
	{
		char *devname = NULL;
		int mountError = 0;

		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE unmount\n");
		}
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			
			goto error;
		}
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( !el ) el = HashmapGet( request->query, "devname" );
		
		if( el != NULL )
		{
			char *ldevname = NULL;
			devname = (char *)el->data;
			
			if( devname != NULL && ( ldevname = FCalloc( strlen( devname ) + 50, sizeof(char) ) ) != NULL )
			{
				UrlDecode( ldevname, devname );
				strcpy( devname, ldevname );
				
				// Clean name
				int nl = strlen( devname );
				memset( ldevname, 0, strlen( devname ) + 50 );
				
				int i = 0; for( ; i < nl; i++ )
				{
					if( devname[i] == ':' )
					{
						ldevname[i] = '\0';
						break;
					}
					ldevname[i] = devname[i];
				}
				strcpy( devname, ldevname );
				
				FFree( ldevname );
			}
		}
		
		if( devname == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "devname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		else
		{
			if( loggedSession != NULL )
			{
				mountError = -1;
				char *ldevname;
				
				char *type = NULL;
				int fid = 0;
				
				File *f = NULL;
				LIST_FOR_EACH( loggedSession->us_User->u_MountedDevs, f, File * )
				{
					if( strcmp( devname, f->f_Name ) == 0 )
					//if( id == f->f_ID )
					{
						mountError = 0;
						f->f_Mounted = FALSE;
						fid = f->f_ID; // Need the ID too!
						type = ( char *) f->f_FSysName;//   f->f_Type; // Copy the type, we need it
						ldevname = f->f_Name;
						// please check Types next time
					}
				}
				
				struct TagItem tags[] = {
					{FSys_Mount_ID, (FULONG)fid },
					{FSys_Mount_Name, (FULONG)devname },
					{FSys_Mount_Type, (FULONG)type },
					{TAG_DONE, TAG_DONE }
				};
				
				mountError = UnMountFS( l, (struct TagItem *)&tags, loggedSession );
				DEBUG("[DeviceMWebRequest] Unmounting device error %d\n", mountError );
				
				// default handle
				if( mountError != 0 )
				{
					char tmp[ 256 ];
					sprintf( tmp, "fail<!--separate-->{\"response\":\"error unmounting\",\"errorcode\":\"%d\"}", mountError );
					HttpAddTextContent( response, tmp );
				}		// mounting via php proxy
				else	// there was no error while mounting device
				{
					char temptext[ 512 ];
					
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						sqllib->SNPrintF( sqllib,  temptext, sizeof(temptext),"\
UPDATE `Filesystem` f SET f.Mounted = '0' \
WHERE \
( \
`UserID` = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
) \
) \
AND LOWER(f.Name) = LOWER('%s')", 
							loggedSession->us_User->u_ID, loggedSession->us_User->u_ID, devname 
						);
						
						Log( FLOG_INFO, "Device was unmounted with success: %s!\n", devname );
						
						void *res = sqllib->Query( sqllib, temptext );
					
						HttpAddTextContent( response, "ok<!--separate-->{ \"Response\": \"Successfully unmounted\" }" );
						*result = 200;

						l->LibrarySQLDrop( l, sqllib );
					}
				}
			}
			else
			{
				FERROR("User session is invalid\n");
				
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_INVALID_USER_SESSION] , DICT_INVALID_USER_SESSION );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/refresh</H2>Refresh user drive in FriendCore
	*
	* @param sessionid - (required) session id of logged user
	* @param devname - (required) device name. Parameter and logged user id is used to get user device parameters from Filesystem table.
	* @return { Result: Device updated!} when success, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "refresh" ) == 0 )
	{
		char *devname = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		if( response != NULL )
		{
			HttpFree( response ); 
			FERROR("RESPONSE mount\n"); 
		}
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			
			goto error;
		}
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( el != NULL )
		{
			char *ldevname = NULL;
			devname = (char *)el->data;
			
			if( devname != NULL && ( ldevname = FCalloc( strlen( devname ) + 50, sizeof(char) ) ) != NULL )
			{
				UrlDecode( ldevname, devname );
				strcpy( devname, ldevname );
				
				// Clean name
				int nl = strlen( devname );
				memset( ldevname, 0, strlen( devname ) + 50 );
				
				int i = 0; for( ; i < nl; i++ )
				{
					if( devname[i] == ':' )
					{
						ldevname[i] = '\0';
						break;
					}
					ldevname[i] = devname[i];
				}
				strcpy( devname, ldevname );
				
				FFree( ldevname );
			}
		}
		
		if( devname != NULL )
		{
			int error = 0;
			
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib != NULL )
			{
				User *usr = loggedSession->us_User;
				if( usr != NULL )
				{
					File *rootdev = usr->u_MountedDevs;
					while( rootdev != NULL )
					{
						if( strcmp( devname, rootdev->f_Name ) == 0 )
						{
							int entries = 0;
							char query[ 256 ];
							//snprintf( query, sizeof( query ), " ID=%lu", rootdev->f_ID );
							sqllib->SNPrintF( sqllib, query, sizeof( query ), " ID=%lu", rootdev->f_ID );
							
							Filesystem *fs = sqllib->Load( sqllib, FilesystemDesc, query, &entries );
							if( fs != NULL )
							{
								if( rootdev->f_Config != NULL )
								{
									FFree( rootdev->f_Config );
								}
								rootdev->f_Config = StringDuplicate( fs->fs_Config );
								
								FilesystemDelete( fs );
								
								DEBUG( "[DeviceMWebRequest] We now have information: %s (query: %s) - name: %s\n", rootdev->f_Config, query, rootdev->f_Name );
							}
							break;
						}
						rootdev = (File *)rootdev->node.mln_Succ;
					}
					
					if( rootdev != NULL )
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"Device updated!\"}" );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_DEVICE_NOT_FOUND], devname );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_DEVICE_NOT_FOUND );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
				}

				l->LibrarySQLDrop( l, sqllib );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{	// user not found , he is not logged in
			DEBUG("[DeviceMWebRequest] Cannot mount device for not logged in user\n");
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "devname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		
		//HttpWriteAndFree( response );
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/share</H2>Refresh user drive in FriendCore
	*
	* @param sessionid - (required) session id of logged user
	* @param devname - (required) device name which you want to share with another user
	* @param username - (required) name of the user to which you want to share your drive
	* @return { Result: Device shared successfully} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "share" ) == 0 )
	{
		char *devname = NULL;
		char *username = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			
			goto error;
		}
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( el != NULL )
		{
			devname = (char *)el->data;
		}
		
		el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			username = (char *)el->data;
		}
		
		if( devname == NULL || username == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, devname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("Devname or username are empty! Cannot share device\n");
			goto error;
		}
		else
		{
			// first we must find user
			// to which user we will share our device
			
			User *user = NULL;
			
			LIST_FOR_EACH( l->sl_UM->um_Users, user, User * )
			{
				if( strcmp( username, user->u_Name ) == 0 )
				{
					break;
				}
			}
			
			if( user == NULL )
			{
				// new user added to session
				user = UMUserGetByNameDB( l->sl_UM, username );
				if( user != NULL )
				{
					LIST_ADD_HEAD( l->sl_UM->um_Users, user );
				}
				else
				{
					FERROR("Cannot find user with name %s in database\n", username );
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
					goto error;
				}
			}
			
			File *rootDev = NULL;
			
			LIST_FOR_EACH( loggedSession->us_User->u_MountedDevs, rootDev, File * )
			{
				if(  strcmp( rootDev->f_Name, devname ) == 0 )
				{
					INFO("Device for sharing found: %s\n", devname );
					break;
				}
			}
			
			
			if( user != NULL && rootDev != NULL )
			{
				DEBUG("[DeviceMWebRequest] Sharing device in progress\n");
				
				if( user->u_InitialDevMount == FALSE )
				{
					DEBUG("[DeviceMWebRequest] Devices were not mounted for user. They will be mounted now\n");
					
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						UserDeviceMount( l, sqllib, user, 0, TRUE );
						l->LibrarySQLDrop( l, sqllib );
					}
					else
					{
						FERROR("Cannot get sql.library slot\n");
					}
				}
				
				File *file = FCalloc( 1, sizeof( File ) );
				if( file != NULL )
				{
					char fileName[ 512 ];
					sprintf( fileName, "%s_%s", loggedSession->us_User->u_Name, devname );
					
					file->f_Name = StringDuplicate( fileName );	// shared name
					file->f_SharedFile = rootDev;
					file->f_User =  loggedSession->us_User;		// user which is sharing device
					
					LIST_ADD_HEAD( user->u_MountedDevs, file );
					
					int err;
					if( ( err = DeviceMountDB( l, file, TRUE ) ) != 0 )
					{
						FERROR("[DeviceMWebRequest] Cannot share device, error %d\n", err );
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_DEVICE_CANNOT_BE_SHARED], err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_DEVICE_CANNOT_BE_SHARED );
						HttpAddTextContent( response, dictmsgbuf );
					}
					else
					{
						INFO("[DeviceMWebRequest] Device %s shared successfully\n", devname );
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"Device shared successfully\"}" );
					}
				}
			}
			else
			{
				FERROR("User account do not exist!Sharing device option is not possible\n");
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_OR_DEVICE_NOT_EXIST] , DICT_USER_OR_DEVICE_NOT_EXIST );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			//char tmp[ 100 ];
			//char temptext[ 512 ];
			//sprintf( tmp, "ok<!--separate-->Mouting error: %d (already mounted)\n", l->GetError( l ) );
			
			//HttpAddTextContent( response, tmp );
			/*
			 *	sprintf( temptext, "UPDATE `Filesystem` SET `Mounted` = '1' WHERE `UserID` = '%ld' AND LOWER(`Name`) = LOWER('%s')", loggedUser->u_ID, devname );
			 *					
			 *	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
			 *	MYSQL_RES *res = sqllib->Select( sqllib, temptext );
			 *	l->LibraryMYSQLDrop( l, sqllib );
			 */
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/list</H2>List mounted devices
	*
	* @param sessionid - (required) session id of logged user
	* @return All devices and their attributes in JSON when success, otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE list\n");
		}
		response = HttpNewSimple(  HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			goto error;
		}
		
		{
			UserSession *logsess = loggedSession;
			User *curusr = logsess->us_User; 
			
			DEBUG("[DeviceMWebRequest] device/list\n");
			
			if( curusr != NULL )
			{
				File *dev = curusr->u_MountedDevs;
				BufString *bs = BufStringNew();
				BufStringAdd( bs, "ok<!--separate-->[" );
				int devnr = 0;
				
#define TMP_SIZE 2048
				char *tmp = FCalloc( TMP_SIZE, sizeof( char ) ); 
				char *executeCmd = NULL;
				char *configEscaped = NULL;
				
				while( dev != NULL )
				{
					FHandler *sys = (FHandler *)dev->f_FSys;
					
					// Escape config
					int len = dev->f_Config ? strlen( dev->f_Config ) : 0, k = 0;
					dev->f_Visible = 1; // Special case, default is visible
					
					DEBUG( "[DeviceMWebRequest] Getting config (length: %d).\n", len );
					if( len > 2 )
					{
						if( configEscaped ) FFree( configEscaped );
						configEscaped = FCalloc( len * 2 + 2, sizeof( char ) );
						int n = 0; for( ; n < len; n++ )
						{
							if( dev->f_Config[n] == '"' )
							{
								configEscaped[k++] = '\\';
							}
							configEscaped[k++] = dev->f_Config[n];
						}
						// Find executable
						DEBUG( "[DeviceMWebRequest] Looking in: %s\n", dev->f_Config );
						executeCmd = FCalloc( 256, sizeof( char ) );
						int mo = 0, im = 0, imrun = 1;
						for( ; imrun == 1 && im < len - 14; im++ )
						{
							if( strncmp( dev->f_Config + im, "\"Executable\"", 12 ) == 0 )
							{
								im += 14;
								imrun = 0;
								for( ; im < len; im++ )
								{
									// Next quote is end of string
									if( dev->f_Config[im] == '"' ) break;
									executeCmd[mo++] = dev->f_Config[ im ];
								}
							}
						}
					}
					
					memset( tmp, '\0', TMP_SIZE-1 );
					
					FBOOL isLimited = FALSE;
					
					if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == FALSE )
					{
						if( strcmp( dev->f_FSysName, "Local" ) == 0 )
						{
							isLimited = TRUE;
						}
					}
					
					if( devnr == 0 )
					{
						snprintf( tmp, TMP_SIZE, "{\"Name\":\"%s\",\"Type\":\"%s\",\"Path\":\"%s\",\"FSys\":\"%s\",\"Config\":\"%s\",\"Visible\":\"%s\",\"Execute\":\"%s\",\"IsLimited\":\"%d\",\"Server\":\"%s\",\"Port\":\"%d\"}\n", 
							dev->f_Name ? dev->f_Name : "", 
							dev->f_FSysName ? dev->f_FSysName : "", 
							dev->f_Path ? dev->f_Path : "",
							sys && sys->Name ? sys->Name : "",
							configEscaped ? configEscaped: "{}",
							dev->f_Visible == 1 ? "true" : "false",
							executeCmd != NULL && strlen( executeCmd ) ? executeCmd : "", 
							isLimited,
							dev->f_DevServer ? dev->f_DevServer : "",
							dev->f_DevPort
						);
						
					}
					else
					{
						snprintf( tmp, TMP_SIZE, ",{\"Name\":\"%s\",\"Type\":\"%s\",\"Path\":\"%s\",\"FSys\":\"%s\",\"Config\":\"%s\",\"Visible\":\"%s\",\"Execute\":\"%s\",\"IsLimited\":\"%d\",\"Server\":\"%s\",\"Port\":\"%d\"}\n", 
							dev->f_Name ? dev->f_Name : "",
							dev->f_FSysName ? dev->f_FSysName : "", 
							dev->f_Path ? dev->f_Path : "",
							sys && sys->Name ? sys->Name : "",
							configEscaped ? configEscaped: "{}",
							dev->f_Visible == 1 ? "true" : "false",
							executeCmd != NULL && strlen( executeCmd ) ? executeCmd : "",
							isLimited,
							dev->f_DevServer ? dev->f_DevServer : "",
							dev->f_DevPort
						);
					}
					
					if( executeCmd ) FFree( executeCmd );
					executeCmd = NULL;
					
					if( configEscaped ) FFree( configEscaped );
					configEscaped = NULL;
					
					BufStringAdd( bs, tmp );
					
					devnr++;
					dev = (File *)dev->node.mln_Succ;
				}
				
				FFree( tmp );
				
				BufStringAdd( bs, "]" );
				
				HttpAddTextContent( response, bs->bs_Buffer );
				
				BufStringDelete( bs );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USERSESSION_OR_USER_NOT_FOUND] , DICT_USERSESSION_OR_USER_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		
		*result = 200;
		
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/listsys</H2>List all avaiable filesystems
	*
	* @param sessionid - (required) session id of logged user
	* @return All filesystems and their attributes in JSON when success, otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "listsys" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE listsys\n");
		}
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
			HttpAddTextContent( response, dictmsgbuf );
			goto error;
		}
		
		{
			UserSession *logsess = loggedSession;//l->sl_ActiveAuthModule->IsSessionValid( l->sl_ActiveAuthModule, request, sessionid );
			User *curusr = logsess->us_User;  // l->sl_Sessions;

			if( curusr != NULL )
			{
				FHandler *fsys = l->sl_Filesystems;
				BufString *bs = BufStringNew();
				BufStringAdd( bs, "{\"Filesystems\":[ " );
				int fsysnr = 0;
				char tmp[ 256 ];
				
				while( fsys != NULL )
				{
					if( fsysnr == 0 )
					{
						sprintf( tmp, "{ \"Name\": \"%s\" } \n", fsys->Name );
					}
					else
					{
						sprintf( tmp, ", { \"Name\": \"%s\" } \n", fsys->Name );
					}
					BufStringAdd( bs, tmp );
					
					fsysnr++;
					fsys = (FHandler *)fsys->node.mln_Succ;
				}
				BufStringAdd( bs, " ]}" );
				
				HttpAddTextContent( response, bs->bs_Buffer );
				
				BufStringDelete( bs );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USERSESSION_OR_USER_NOT_FOUND] , DICT_USERSESSION_OR_USER_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/device/update</H2>Store device attributes in database
	*
	* @param sessionid - (required) session id of logged user
	* @return { Result: Database updated} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		char *devname = NULL;
		char *config = NULL;
		char *descrypt = NULL;
		FLONG id = -1;
		
		//`ID`, `UserID`, `GroupID`, `DeviceID`, `Name`, `Type`, `ShortDescription`, `Server`, `Port`, `Path`, `Username`, `Password`, `Config`, `Mounted`, `Authorized`, `Owner`SELECT * FROM `Filesystem` WHERE 1
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE update\n");
		}
		response = HttpNewSimple(  HTTP_200_OK,  tags );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( el != NULL )
		{
			devname = UrlDecodeToMem(( char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "config" );
		if( el != NULL )
		{
			config = UrlDecodeToMem(( char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "descryption" );
		if( el != NULL )
		{
			descrypt = UrlDecodeToMem(( char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "id" );
		{
			char *next;
			id = (FLONG)strtol(( char *)el->data, &next, 0);
		}
		
		if( id >= 0 )
		{
			BufString *names = BufStringNew();
			BufString *values = BufStringNew();
			if( names != NULL && values != NULL )
			{
				int pos = 0;
				// we will build update script
				SQLLibrary *sqllib  = l->LibrarySQLGet( l );
				if( sqllib != NULL )
				{
					if( config != NULL )
					{
						char *escconfig = sqllib->MakeEscapedString( sqllib, config );
						
						if( pos == 0 )
						{
							BufStringAdd( names, "`Config`" );
							BufStringAdd( values, config );
						}
						else
						{
							BufStringAdd( names, ",`Config`" );
							BufStringAdd( values, "," );
							BufStringAdd( values, escconfig );
						}
						pos++;
						FFree( escconfig );
					}
					// descritption
					if( devname != NULL )
					{
						char *escconfig = sqllib->MakeEscapedString( sqllib, devname );
						
						if( pos == 0 )
						{
							BufStringAdd( names, "`Name`" );
							BufStringAdd( values, escconfig );
						}
						else
						{
							BufStringAdd( names, ",`Name`" );
							BufStringAdd( values, "," );
							BufStringAdd( values, escconfig );
						}
						pos++;
						FFree( escconfig );
					}
					//descryption
					if( descrypt != NULL )
					{
						char *escconfig = sqllib->MakeEscapedString( sqllib, descrypt );
						
						if( pos == 0 )
						{
							BufStringAdd( names, "`ShortDescription`" );
							BufStringAdd( values, escconfig );
						}
						else
						{
							BufStringAdd( names, ",`ShortDescription`" );
							BufStringAdd( values, "," );
							BufStringAdd( values, escconfig );
						}
						pos++;
						FFree( escconfig );
					}
				
					BufString *bs = BufStringNew();
					if( bs != NULL )
					{
						char idchar[ 255 ];
					
						BufStringAdd( bs, " UPDATE `Filesystem` SET (");
						BufStringAdd( bs, names->bs_Buffer );
						BufStringAdd( bs, " ) VALUES (" );
						BufStringAdd( bs, values->bs_Buffer );
						int size = snprintf( idchar,  sizeof(idchar), ") WHERE ID = %ld;", id );
						BufStringAddSize( bs, idchar, size );
					
						sqllib->QueryWithoutResults( sqllib, bs->bs_Buffer );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"Database updated\"}" );
						
						l->LibrarySQLDrop( l, sqllib );
					}
					
					BufStringDelete( bs );
				}
				else	// bs == NULL
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
					HttpAddTextContent( response, dictmsgbuf );
				}
			} // values, names = NULL
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( names != NULL )
			{
				BufStringDelete( names );
			}
			
			if( values != NULL )
			{
				BufStringDelete( values );
			}
		}
		else	// id < 0
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		
		if( descrypt != NULL )
		{
			FFree( descrypt );
		}
		
		if( config != NULL )
		{
			FFree( config );
		}
		
		if( devname != NULL )
		{
			FFree( devname );
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
	
	error:
	
	return response;
}
