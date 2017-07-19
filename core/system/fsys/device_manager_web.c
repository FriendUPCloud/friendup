/*©mit***************************************************************************
 *                                                                              *
 * Friend Unifying Platform                                                     *
 * ------------------------                                                     *
 *                                                                              *
 * Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
 * Tel.: (+47) 40 72 96 56                                                      *
 * Mail: info@friendos.com                                                      *
 *                                                                              *
 **©****************************************************************************/
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
	
	//
	// refreshlist
	//
	
	if( strcmp( urlpath[ 1 ], "refreshlist" ) == 0 )
	{
		//char query[ 1024 ];
		char ids[ 1024 ];
		ids[ 0 ] = 0;
		int idssize = 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		BufString *bs = BufStringNew();
		if( RefreshUserDrives( l, loggedSession->us_User, bs ) == 0 )
		{
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Bufsize );
			bs->bs_Buffer = NULL;
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot refresh user drive!\"}" );
		}
		BufStringDelete( bs );
		
		*result = 200;
	}
	
	//
	//
	//
	
	// Check detailed information about a drive
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
			MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
			if( sqllib )
			{
				//snprintf( query, 512, ""
				sqllib->SNPrintF( sqllib, query, 512, ""
					"SELECT f.Name, f.ShortDescription FROM `Filesystem` f "
					"WHERE f.Config LIKE \"%%\\\"pollable\\\":\\\"yes\\\"%%\" "
					"AND f.Name = \"%s\" LIMIT 1", devname );
				
				MYSQL_RES *res = sqllib->Query( sqllib, query );
				
				if( res != NULL )
				{
					MYSQL_ROW row;
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
				
				l->LibraryMYSQLDrop( l, sqllib );
			}
			
			FFree( query );
			
			// We failed
			if( success == -1 )
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Could not find drive.\"}" );
			}
			// Wee we succeeded
			else if( resultstring != NULL )
			{
				HttpAddTextContent( response, resultstring );
			}
			// We failed (future use cases where error message is in success integer var)
			else
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"An error occured.\"}" );
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
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No device name specified.\"}" );
		}		
		
		
		*result = 200;
	}
	// Show list of available drives
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
			MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
			if( sqllib != NULL )
			{
				MYSQL_RES *res = sqllib->Query( sqllib, query );
				
				if( res != NULL )
				{
					MYSQL_ROW row;
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
				l->LibraryMYSQLDrop( l, sqllib );
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
			else HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Polling the drives is not possible.\"}" );
			
			// Clean up and set result status
			ListStringDelete( str );
			*result = 200;
	}
	
	//
	//  mount
	//
	
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
		
		DEBUG("=====================Mount==========================\n");
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
			
			goto error;
			//return response;
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
			// required arguments missing
			HttpAddTextContent( response, "{ \"response\": \"Required arguments is missing sessionid, devname\"}" );
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
					switch( mountError )
					{
						case FSys_Error_NOFSAvaiable:
							HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"Could not locate file system.\"}" );
							break;
						case FSys_Error_NOFSType:
							HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"No disk type specified or disk does not exist.\"}" );
							break;
						case FSys_Error_NOName:
							HttpAddTextContent( response, "fail<!--separate-->{\"response\": \"No disk name specified or disk does not exist.\"}" );
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
						//DEBUG( "We will mount this bastard, even if it's already mounted!\n" );
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
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					if( sqllib != NULL )
					{
						char *temptext = FCalloc( 512, sizeof( char ) );
						//sprintf( temptext, "
					
						if( temptext != NULL )
						{
							sqllib->SNPrintF( sqllib,  temptext, 512,"\
								UPDATE `Filesystem` f SET f.Mounted = '1'\
								WHERE\
								(\
									`UserID` = '%ld' OR\
									f.GroupID IN (\
										SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
										WHERE \
										g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
										ug.UserID = '%ld'\
									)\
								)\
								AND LOWER(f.Name) = LOWER('%s')", 
								loggedSession->us_User->u_ID, loggedSession->us_User->u_ID, devname 
							);

							MYSQL_RES *res = sqllib->Query( sqllib, temptext );

							FFree( temptext );
						}
						l->LibraryMYSQLDrop( l, sqllib );
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
				HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot mount device for not logged user\"}" );
			}
		}		// check mount parameters
		
		//HttpWriteAndFree( response );
		*result = 200;
		
		//
		// unmount
		//
	}
	else if( strcmp( urlpath[ 1 ], "unmount" ) == 0 )
	{
		char *devname = NULL;
		int mountError = 0;
		//FULONG id = 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE unmount\n");
		}
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
			
			goto error;
			//return response;
		}
		
		
		HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
		if( !el ) el = HashmapGet( request->query, "devname" );
		
		/*
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->data, &next, 0 );
			DEBUG( "[UNMOUNT] unmount device with id %ld!!\n", id );
		}
		*/
		
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
		//if( devname == NULL || sessionid == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device name or sessionID are empty\"}" );
		}
		/*
		if( id <= 0 )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"id paramter is missing\"}" );
		}
		*/
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
					//{FSys_Mount_Name, (FULONG)ldevname },
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
					
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					if( sqllib != NULL )
					{
						//sprintf( temptext, "
						
						sqllib->SNPrintF( sqllib,  temptext, sizeof(temptext),"\
							UPDATE `Filesystem` f SET f.Mounted = '0'\
							WHERE\
							(\
								`UserID` = '%ld' OR\
								f.GroupID IN (\
									SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
									WHERE \
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
									ug.UserID = '%ld'\
								)\
							)\
							AND LOWER(f.Name) = LOWER('%s')", 
							loggedSession->us_User->u_ID, loggedSession->us_User->u_ID, devname 
						);
						
						/*
						sqllib->SNPrintF( sqllib,  temptext, sizeof(temptext),"\
							UPDATE `Filesystem` f SET f.Mounted = '0'\
							WHERE\
							(\
								`UserID` = '%ld' OR\
								f.GroupID IN (\
									SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
									WHERE \
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
									ug.UserID = '%ld'\
								)\
							)\
							AND f.ID = %lu", 
							loggedSession->us_User->u_ID, loggedSession->us_User->u_ID, id 
						);
						*/
						MYSQL_RES *res = sqllib->Query( sqllib, temptext );
					
						//HttpWriteAndFree( response, sock );
						HttpAddTextContent( response, "ok<!--separate-->{ \"Response\": \"Successfully unmounted\" }" );
						*result = 200;
					
						//char *devfull = FCalloc( strlen( devname ) + 2, sizeof( char ) );
						//sprintf( devfull, "%s:", devname );
						//DoorNotificationCommunicateChanges( l, loggedSession, mountedDev, devfull );
						//FFree( devfull );
						
						l->LibraryMYSQLDrop( l, sqllib );
					}
				}
				
				//char tmp[ 100 ];
				//	sprintf( tmp, "UnMouting error: %d\n", l->GetError( l ) );
				//HttpAddTextContent( response, tmp );
			}	
			else
			{
				FERROR("User session is invalid\n");
				HttpAddTextContent( response, "ok<!--separate-->{ \"Response\": \"User not logged in, cannot unmount device\"}" );
			}
		}
		
		//HttpWriteAndFree( response );
		*result = 200;
	}
	
	//
	//  refresh
	//
	
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
		
		DEBUG("=====================Refresh==========================\n");
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
			
			goto error;
			//return response;
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
			
			MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
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
						HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device not found!\"}" );
					}
				}
				else
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"User not found!\"}" );
				}

				l->LibraryMYSQLDrop( l, sqllib );
			}
			else
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot open mysql.library!\"}" );
			}
		}
		else
		{	// user not found , he is not logged in
			DEBUG("[DeviceMWebRequest] Cannot mount device for not logged in user\n");
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot find devname parameter!\"}" );
		}
		
		//HttpWriteAndFree( response );
		*result = 200;
	}
	
	//
	// share device
	//
	
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
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
			
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
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device name or Username are empty\"}" );
			FERROR("Devname or username are empty! Cannot share device\n");
			goto error;
		}
		else
		{
			// first we must find user
			//  to which user we will share our device
			
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
					HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"User account do not exists\"}" );
					goto error;
					//return response;
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
				DEBUG("Sharing device in progress\n");
				
				if( user->u_InitialDevMount == FALSE )
				{
					DEBUG("Devices were not mounted for user. They will be mounted now\n");
					
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					if( sqllib != NULL )
					{
						UserDeviceMount( l, sqllib, user, 0 );
						l->LibraryMYSQLDrop( l, sqllib );
					}
					else
					{
						FERROR("Cannot get mysql.library slot\n");
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
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Device cannot be shared\"}" );
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
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"User account do not exists\"}" );
				//goto error;
				//return response;
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
		
		//
		// list mounted devices
		//
	}
	else if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE list\n");
		}
		response = HttpNewSimple(  HTTP_200_OK,  tags );
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
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
					
					//DEBUG("\n\n\nID %ld\n\n\n", dev->f_ID );
					
					// Clear it!
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
						snprintf( tmp, TMP_SIZE, "{\"Name\":\"%s\",\"Path\":\"%s\",\"FSys\":\"%s\",\"Config\":\"%s\",\"Visible\":\"%s\",\"Execute\":\"%s\",\"IsLimited\":\"%d\"}\n", 
							dev->f_Name ? dev->f_Name : "", 
							dev->f_Path ? dev->f_Path : "",
							sys && sys->Name ? sys->Name : "",
							configEscaped ? configEscaped: "{}",
							dev->f_Visible == 1 ? "true" : "false",
							executeCmd != NULL && strlen( executeCmd ) ? executeCmd : "", //,dev->f_ID
							isLimited
						);
						
					}
					else
					{
						snprintf( tmp, TMP_SIZE, ",{\"Name\":\"%s\",\"Path\":\"%s\",\"FSys\":\"%s\",\"Config\":\"%s\",\"Visible\":\"%s\",\"Execute\":\"%s\",\"IsLimited\":\"%d\"}\n", 
							dev->f_Name ? dev->f_Name : "", 
							dev->f_Path ? dev->f_Path : "",
							sys && sys->Name ? sys->Name : "",
							configEscaped ? configEscaped: "{}",
							dev->f_Visible == 1 ? "true" : "false",
							executeCmd != NULL && strlen( executeCmd ) ? executeCmd : "",//,dev->f_ID
							isLimited
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
				HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"User not logged in\"}" );
			}
		}
		
		*result = 200;
		
	}
	else if( strcmp( urlpath[ 1 ], "listsys" ) == 0 )
	{
		
		//
		// list all filesystems
		//
		
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
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"user.library is not opened!\"}" );
			goto error;
		}
		
		/*
		if( sessionid == NULL )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device name or sessionID are empty\"}" );
		}
		else
			*/
		{
			
			UserSession *logsess = loggedSession;//l->sl_ActiveAuthModule->IsSessionValid( l->sl_ActiveAuthModule, request, sessionid );
			User *curusr = logsess->us_User;  // l->sl_Sessions;
			//int found = 0;
			
			DEBUG("[DeviceMWebRequest] user found, listing devices\n");
			
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
				HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"User not logged in\"}" );
			}
		}
		*result = 200;
		
		//
		// update device in database
		//
	}
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
		FQUAD id = -1;
		
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
			id = (FQUAD)strtol(( char *)el->data, &next, 0);
		}
		
		if( id >= 0 )
		{
			BufString *names = BufStringNew();
			BufString *values = BufStringNew();
			if( names != NULL && values != NULL )
			{
				int pos = 0;
				// we will build update script
				MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
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
						int size = snprintf( idchar,  sizeof(idchar), ") WHERE ID = %llu;", id );
						BufStringAddSize( bs, idchar, size );
					
						sqllib->QueryWithoutResults( sqllib, bs->bs_Buffer );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"Database updated\"}" );
						
						l->LibraryMYSQLDrop( l, sqllib );
					}
					
					BufStringDelete( bs );
				}
				else	// bs == NULL
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot allocate memory for buffers\"}" );
				}
			} // values, names = NULL
			else
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot allocate memory for buffers\"}" );
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
			HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"id parameter is missing\"}" );
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
		HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Device function do not exist\"}" );
	}
	
	error:
	
	return response;
}
