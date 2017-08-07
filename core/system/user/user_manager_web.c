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

/** @file
 * 
 *  User Manager Web body
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#include <core/types.h>
#include <core/nodes.h>
#include "user_manager_web.h"
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <system/user/user_sessionmanager.h>

/**
 * Http web call processor
 * Function which process all incoming Http requests
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession pointer to UserSession which called this function
 * @param result pointer to result value
 * @return response as Http structure, otherwise NULL
 */

Http *UMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	char *usr = NULL;
	char *pass = NULL;
	
	if( urlpath[ 1 ] == NULL )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		HttpAddTextContent( response, "fail<!--separate-->Function not found" );
		
		return response;
	}

	if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *groups = NULL;
		FULONG id = 0;
		FBOOL userCreated = FALSE;
		
		DEBUG( "[UMWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
			}
			
			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				usrpass = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrpass %s!!\n", usrpass );
			}
			
			if( usrname != NULL && usrpass != NULL )
			{
				User *tusr = UMUserGetByNameDB( l->sl_UM, usrname );
				
				if( tusr != NULL )
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"User already exist!!\"}" );
				}
				else
				{
					el = HttpGetPOSTParameter( request, "fullname" );
					if( el != NULL )
					{
						fullname = UrlDecodeToMem( (char *)el->data );
						DEBUG( "[UMWebRequest] Update fullname %s!!\n", fullname );
					}
					
					el = HttpGetPOSTParameter( request, "email" );
					if( el != NULL )
					{
						email = UrlDecodeToMem( (char *)el->data );
						DEBUG( "[UMWebRequest] Update email %s!!\n", email );
					}
					
					el = HttpGetPOSTParameter( request, "level" );
					if( el != NULL )
					{
						groups = UrlDecodeToMem( (char *)el->data );
					}
					
					User *locusr = UserNew();
					if( locusr != NULL )
					{
						UserInit( locusr );
						locusr->u_Name = usrname;
						locusr->u_FullName = fullname;
						locusr->u_Email = email;
						locusr->u_Password = usrpass;
						userCreated = TRUE;
						
						int error = UMUserCreate( l->sl_UM, request, locusr );
						
						DEBUG("[UMWebRequest] Create user error: %d\n", error );
						
						if( error == 0 )
						{
							HttpAddTextContent( response, "ok<!--separate-->{ \"create\": \"sucess\" }" );
						}
						else
						{
							char tmp[ 20 ];
							sprintf( tmp, "fail<!--separate-->{ \"response\": \"%d\"}", error );	// check user.library to display errors
							HttpAddTextContent( response, tmp );
						}
						
						UMAssignGroupToUserByStringDB( l->sl_UM, locusr, groups );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"create\": \"success!\"}" );
						
						UserDelete( locusr );
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot allocate memory for user!\"}" );
					}
				} // user found in db
			} // missing parameters
			else
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"username and password were not provided!\"}" );
			}
		}
		
		if( groups != NULL )
		{
			FFree( groups );
		}
		
		if( userCreated == TRUE )
		{
			if( usrname != NULL )
			{
				FFree( usrname );
			}
			if( usrpass != NULL )
			{
				FFree( usrpass );
			}
			if( fullname != NULL )
			{
				FFree( fullname );
			}
			if( email != NULL )
			{
				FFree( email );
			}
		}
		*result = 200;
	}
	
	//
	// delete user
	//
	
	else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		FULONG id = 0;
		FBOOL userFromSession = FALSE;
		
		DEBUG( "[UMWebRequest] Delete user!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->data, &next, 0 );
		}
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			if( id > 0 )
			{
				MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
				if( sqllib != NULL )
				{
					char *tmpQuery = NULL;
					int querysize = 1024;
					
					if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
					{
						User * usr = UMGetUserByID( l->sl_UM, id );
						if( usr != NULL )
						{
							UserDeviceUnMount( l, sqllib, usr );
							
							UMRemoveUser( l->sl_UM, usr );
						}
						// DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path = '%s'  )
						
						// DELETE `FFilePermission` WHERE Path = '%s' 
						
						sprintf( tmpQuery, "DELETE `FUser` WHERE ID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE `FUserGroup` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE `FUserSession` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE `Filesystem` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						FFree( tmpQuery );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"success\"}" );
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot allocate memory for string\"}" );
					}
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot find mysql.library!\"}" );
				}
			}
			else
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"id parameter is missing!\"}" );
			}
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"you don't have permission to remove users!\"}" );
		}
	}
	
	//
	// update password
	//
	
	else if( strcmp( urlpath[ 1 ], "updatepassword" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		char *usrpass = NULL;
		
		DEBUG( "[UMWebRequest] Update password!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "password" );
		if( el != NULL )
		{
			usrpass = UrlDecodeToMem( (char *)el->data );
		}
		
		if( usrname != NULL && usrpass != NULL )
		{
			while( logusr != NULL )
			{
				if( strcmp( logusr->u_Name, usrname ) == 0 )
				{
					if( 0 == l->sl_ActiveAuthModule->UpdatePassword( l->sl_ActiveAuthModule, request, logusr, usrpass ) )
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"updatepassword\": \"success!\"}" );
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Password not changed!\"}" );
					}
					
					break;
				}
				logusr = (User *)logusr->node.mln_Succ;
			}
			
			if( logusr == NULL )
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"User not found!\"}" );
			}
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"username or password fields are missing!\"}" );
		}
		
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		if( usrpass != NULL )
		{
			FFree( usrpass );
		}
		*result = 200;
	}
	
	//
	// update user
	//
	
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *groups = NULL;
		FULONG id = 0;
		FBOOL userFromSession = FALSE;
		FBOOL canChange = FALSE;
		FBOOL imAdmin = FALSE;
		
		DEBUG( "[UMWebRequest] Update user!!\n" );
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) )
		{
			imAdmin = TRUE;
		}
		DEBUG("[UMWebRequest] Im admin %d\n", imAdmin );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->data, &next, 0 );
			DEBUG( "[UMWebRequest] Update id %ld!!\n", id );
		}
		
		if( id > 0 && imAdmin == TRUE )
		{
			while( logusr != NULL )
			{
				if( logusr->u_ID == id  )
				{
					userFromSession = TRUE;
					DEBUG("[UMWebRequest] Found session, update\n");
					break;
				}
				logusr = (User *)logusr->node.mln_Succ;
			}
		}
		else if( id > 0 && imAdmin == FALSE )
		{
			logusr = NULL;
		}
		else
		{
			//if( imAdmin == FALSE )
			{
				id = loggedSession->us_User->u_ID;
				userFromSession = TRUE;
				logusr = loggedSession->us_User;
			}
		}
		
		if( logusr == NULL && id > 0 )
		{
			DEBUG("[UMWebRequest] Getting user from db\n");
			logusr = UMUserGetByIDDB( l->sl_UM, id );
		}
		
		if( logusr == NULL )
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"User not found!\"}" );
		}
		else
		{
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
				
				if( imAdmin  == TRUE )
				{
					if( usrname != NULL && logusr->u_Name != NULL )
					{
						FFree( logusr->u_Name );
						logusr->u_Name = usrname;
					}
				}
			}
			
			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				usrpass = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrpass %s!!\n", usrpass );
				if( usrpass != NULL && logusr->u_Password != NULL )
				{
					FFree( logusr->u_Password );
					logusr->u_Password = usrpass;
				}
			}
			
			el = HttpGetPOSTParameter( request, "fullname" );
			if( el != NULL )
			{
				fullname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update fullname %s!!\n", fullname );
				if( logusr->u_FullName != NULL )
				{
					FFree( logusr->u_FullName );
				}
				logusr->u_FullName = fullname;
			}
			
			el = HttpGetPOSTParameter( request, "email" );
			if( el != NULL )
			{
				email = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update email %s!!\n", email );
				if( logusr->u_Email != NULL )
				{
					FFree( logusr->u_Email );
				}
				logusr->u_Email = email;
			}
			
			el = HttpGetPOSTParameter( request, "level" );
			if( el != NULL )
			{
				groups = UrlDecodeToMem( (char *)el->data );
			}
			
			{
				DEBUG("[UMWebRequest] Changeing user data %lu\n", id );
				// user is not logged in
				// try to get it from DB
				
				if( imAdmin  == TRUE )
				{
					canChange = TRUE;
				}
				else
				{
					if( loggedSession->us_User == logusr )
					{
						canChange = TRUE;
					}
					else
					{
						canChange = FALSE;
					}
				}
				
				if( logusr != NULL && canChange == TRUE )
				{
					DEBUG("[UMWebRequest] FC will do a change\n");
					
					UMUserUpdateDB( l->sl_UM, logusr );
					
					UMAssignGroupToUserByStringDB( l->sl_UM, logusr, groups );
					
					RefreshUserDrives( l, logusr, NULL );
					
					HttpAddTextContent( response, "ok<!--separate-->{ \"update\": \"success!\"}" );
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"User not found!\"}" );
				}
				
				if( userFromSession == FALSE )
				{
					UserDelete( logusr );
				}
			}
		}
		
		if( groups != NULL )
		{
			FFree( groups );
		}
		*result = 200;
	}
	
	//
	// logout
	//
	
	else if( strcmp( urlpath[ 1 ], "logout" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) FERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG( "[UMWebRequest] Logging out!!\n" );
		
		//
		// we must provide sessionid of user who wants to logout
		//
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessionid" );
		if( el != NULL )
		{
			char *sessid = (char *)el->data;
			UserSession *sess = NULL;
			
			DEBUG("[UMWebRequest] Logout\n");
			
			if( sessid != NULL )
			{
				sess = USMGetSessionBySessionID( l->sl_USM, sessid );
				int error = 0; 
				
				if( sess != NULL )
				{
					MYSQLLibrary *sqlLib =  l->LibraryMYSQLGet( l );
					if( sqlLib != NULL )
					{
						sqlLib->Delete( sqlLib, UserSessionDesc, sess );
						l->LibraryMYSQLDrop( l, sqlLib );
					}
					
					sess->us_NRConnections--;
					error = USMUserSessionRemove( l->sl_USM, sess );
				}
				//
				// we found user which must be removed
				//
				
				if( request->h_RequestSource == HTTP_SOURCE_WS )
				{
					HttpFree( response );
					response = NULL;
				}
				
				if( error == 0 && response != NULL )
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"logout\": \"success\"}" );
				}
			}
			if( l->sl_ActiveAuthModule != NULL )
			{
				l->sl_ActiveAuthModule->Logout( l->sl_ActiveAuthModule, request, sessid );
			}
			else
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"authmodule not found!\"}" );
			}
		}
		*result = 200;
	}
	
	//
	// get user session list
	//
	
	else if( strcmp( urlpath[ 1 ], "sessionlist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		
		DEBUG( "[UMWebRequest] get sessionlist!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		if( usrname != NULL )
		{
			char *temp = FCalloc( 2048, 1 );
			int numberOfSessions = 0;
			
			if( temp != NULL )
			{
				while( logusr != NULL )
				{
					if( strcmp( logusr->u_Name, usrname ) == 0 )
					{
						BufString *bs = BufStringNew();
					
						UserSessListEntry *sessions = logusr->u_SessionsList;
						BufStringAdd( bs, "ok<!--separate-->[" );
						int pos = 0;
						unsigned long t = time( NULL );
					
						while( sessions != NULL )
						{
							UserSession *us = (UserSession *) sessions->us;
						
							//if( (us->us_LoggedTime - t) > LOGOUT_TIME )
							//if( us->us_WSConnections != NULL )
							time_t timestamp = time(NULL);
							if( ( (timestamp - us->us_LoggedTime) < REMOVE_SESSIONS_AFTER_TIME ) )
							{
								int size = 0;
								if( pos == 0 )
								{
									size = snprintf( temp, 2047, "{ \"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\"}", us->us_ID, us->us_DeviceIdentity, 		us->us_SessionID, (long long unsigned int)us->us_LoggedTime );
								}
								else
								{
									size = snprintf( temp, 2047, ",{ \"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\"}", us->us_ID, us->us_DeviceIdentity, 	us->us_SessionID, (long long unsigned int)us->us_LoggedTime );
								}
							
								BufStringAddSize( bs, temp, size );
							
								pos++;
							}
							sessions = (UserSessListEntry *) sessions->node.mln_Succ;
						}
					
						BufStringAdd( bs, "]" );
					
						HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
					
						DEBUG("[UMWebRequest] Sessions %s\n", bs->bs_Buffer );
						bs->bs_Buffer = NULL;
					
						BufStringDelete( bs );
						numberOfSessions++;
					}
					logusr = (User *)logusr->node.mln_Succ;
				}
				FFree( temp );
			}
			
			if( logusr == NULL && numberOfSessions == 0 )
			{
				HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"User not found!\"}" );
			}
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"username parameter is missing!\"}" );
		}
		
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		*result = 200;
	}
	//
	// kill user session
	//
	
	else if( strcmp( urlpath[ 1 ], "killsession" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		UserSession *usrses = l->sl_USM->usm_Sessions;
		char *sessionid = NULL;
		char *deviceid = NULL;
		char *usrname = NULL;
		int error = 0;
		
		FERROR( "[UMWebRequest] kill session" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessid" );
		if( el != NULL )
		{
			sessionid = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "deviceid" );
		if( el != NULL )
		{
			deviceid = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		if( sessionid != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by sessionid\n");
			UserSession *ses = USMGetSessionBySessionID( l->sl_USM, sessionid );
			if( usrses != NULL )
			{
				char *uname = NULL;
				if( usrses->us_User != NULL )
				{
					uname = usrses->us_User->u_Name;
				}
					
				DEBUG("[UMWebRequest] user %s session %s will be removed by user %s\n", uname, usrses->us_SessionID, uname  );
					
				error = USMUserSessionRemove( l->sl_USM, usrses );
			}
		}
		else if( deviceid != NULL && usrname != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by deviceid and username %s - %s\n", deviceid, usrname );
			User *u = UMGetUserByName( l->sl_UM, usrname );
			if( u != NULL )
			{
				UserSessListEntry *usl = u->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *s = (UserSession *) usl->us;
					if( s != NULL && s->us_DeviceIdentity != NULL && strcmp( s->us_DeviceIdentity, deviceid ) == 0 )
					{
						error = USMUserSessionRemove( l->sl_USM, s );
						break;
					}
					
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
			}
			else
			{
				error = 1;
			}
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"sessid or deviceid and username parameters is missing!\"}" );
		}
		
		//
		// we found user which must be removed
		//
		
		if( error == 0 )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"killsession\": \"success\"}" );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"killsession\": \"fail, please check FC logs\"}" );
		}
		
		if( sessionid != NULL )
		{
			FFree( sessionid );
		}
		if( deviceid != NULL )
		{
			FFree( deviceid );
		}
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		*result = 200;
	}
	
	//
	// active user list
	// user which are in FC memory
	//
	
	else if( strcmp( urlpath[ 1 ], "activelist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( UMUserIsAdmin( l->sl_UM  , request, loggedSession->us_User ) == TRUE )
		{
			FBOOL usersOnly = FALSE;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "usersonly" );
			if( el != NULL )
			{
				if( ( (char *)el->data ) != NULL && strcmp("true", (char *)el->data ) == 0 )
				{
					usersOnly = TRUE;
				}
			}
			
			DEBUG("[UMWebRequest] Get active sessions\n");
			
			BufString *bs = BufStringNew();
			
			BufStringAdd( bs, "{\"userlist\":[");
			
			// we are going through users and their sessions
			// if session is active then its returned
			
			time_t  timestamp = time( NULL );
			
			int pos = 0;
			User *usr = l->sl_UM->um_Users;
			while( usr != NULL )
			{
				DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
				
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						DEBUG("[UMWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
						
						if( ( (timestamp - locses->us_LoggedTime) < REMOVE_SESSIONS_AFTER_TIME ) && locses->us_WSConnections != NULL )
						{
							add = TRUE;
						}
						
						if( usersOnly == TRUE )
						{
							char newuser[ 255 ];
							snprintf( newuser, 254, "\"%s\"", usr->u_Name );
							
							if( strstr( bs->bs_Buffer, newuser ) != NULL )
							{
								add = FALSE;
							}
						}
						
						if( add == TRUE )
						{
							
							char tmp[ 512 ];
							int tmpsize = 0;

							if( pos == 0 )
							{
								tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
							else
							{
								tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
							
							BufStringAddSize( bs, tmp, tmpsize );
							
							pos++;
						}
					}
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
				usr = (User *)usr->node.mln_Succ;
			}
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
	}
	//
	// active user list
	// user which are in FC memory and have working WebSockets
	//
	
	else if( strcmp( urlpath[ 1 ], "activewslist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[UMWebRequest] GET activews list\n");
		
		if( UMUserIsAdmin( l->sl_UM  , request, loggedSession->us_User ) == TRUE )
		{
			FBOOL usersOnly = FALSE;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "usersonly" );
			if( el != NULL )
			{
				if( ( (char *)el->data ) != NULL && strcmp("true", (char *)el->data ) == 0 )
				{
					usersOnly = TRUE;
				}
			}
			
			DEBUG("[UMWebRequest] Get active sessions\n");
			
			BufString *bs = BufStringNew();
			
			BufStringAdd( bs, "{\"userlist\":[");
			
			// we are going through users and their sessions
			// if session is active then its returned
			
			time_t  timestamp = time( NULL );
			
			int pos = 0;
			User *usr = l->sl_UM->um_Users;
			while( usr != NULL )
			{
				DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
				
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						DEBUG("[UMWebRequest] Going through sessions, device: %s time %lu timeout time %d WS ptr %p\n", locses->us_DeviceIdentity, (long unsigned int)(timestamp - locses->us_LoggedTime), REMOVE_SESSIONS_AFTER_TIME, locses->us_WSConnections );
						
						if( ( (timestamp - locses->us_LoggedTime) < REMOVE_SESSIONS_AFTER_TIME ) && locses->us_WSConnections != NULL )
						{
							add = TRUE;
						}
						
						if( usersOnly == TRUE )
						{
							char newuser[ 255 ];
							sprintf( newuser, "\"%s\"", usr->u_Name );
							
							if( strstr( bs->bs_Buffer, newuser ) != NULL )
							{
								add = FALSE;
							}
						}
						
						if( add == TRUE )
						{
							char tmp[ 512 ];
							int tmpsize = 0;
							
							if( pos == 0 )
							{
								tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
							else
							{
								tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
							
							BufStringAddSize( bs, tmp, tmpsize );
							
							pos++;
						}
					}
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
				usr = (User *)usr->node.mln_Succ;
			}
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		
		else	//is admin
		{
			DEBUG("[UMWebRequest] User is not admin\n");
			HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"access denied\"}" );
		}
		
		*result = 200;
	}
	return response;
}
