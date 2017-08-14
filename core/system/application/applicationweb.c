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
 *  Application Web
 *
 * handle all commands send by the user
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/application/application.h>
#include <z/zlibrary.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>

//
// How this thing is working
//  user A call  app/register and then new appsession is created, user structure is filled by his app authid
//  user A call app/share and point to usernames splitted by comma, users X,Y,Z receive via WS information that someone want to invite them
//  user X,Y,Z send message app/accept if they are accepting connection. They also attach their authid. If they cancel they are sending app/unshare
//  user A by using app/send command, can spread message between users X,Y,Z
//  users X,Y,Z can only send messages to session owner (user A) by using command app/sendowner
//
//

/**
 * Application web calls handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @return pointer to new Http structure (response) or NULL when error appear
 */
Http* ApplicationWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedSession )
{
	Log( FLOG_DEBUG, "ApplicationWebRequest %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	
	AppSession *was = l->sl_AppSessionManager->sl_AppSessions;
	while( was != NULL )
	{
		DEBUG("[ApplicationWebRequest] SASID: %llu\n", was->as_SASID );
		SASUList *wus =  was->as_UserSessionList;
		while( wus != NULL )
		{
			if( wus->authid[ 0 ] == 0 )
			{
				DEBUG("[ApplicationWebRequest] authid %s wusptr  %p\n", "empty",  wus );
			}
			else
			{
				DEBUG("[ApplicationWebRequest] authid %s wusptr  %p\n", wus->authid,  wus );
			}
			wus = (SASUList *)wus->node.mln_Succ;
		}
		was = (AppSession *)was->node.mln_Succ;
	}
	
	Http* response = NULL;
	
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, \
			"list - return installed application list\n \
			register - register application in db \
			install - install application for user \
			remove - remove application \
			getPermissions - get permissions for application \
			" );

		//
		// list of all applications avaiable on server
		//
		
	}
	else if( strcmp( urlpath[ 0 ], "list" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		BufString *bs = BufStringNew();
		if( bs != NULL )
		{
			int pos = 0;
			Application *al = l->sl_apps;
			
			DEBUG("[ApplicationWebRequest] Application LIST\n");
			
			BufStringAdd( bs, " { \"Application\": [" );
			
			while( al != NULL )
			{
				if( pos > 0 )
				{
					BufStringAdd( bs, ", " );
				}
				else
				{
					//BufStringAdd( bs, "{" );
				}
				
				BufString *lbs = GetJSONFromStructure( ApplicationDesc, al );
				
				if( lbs != NULL )
				{
					//DEBUG("Parse application entry %s !\n" , lbs->bs_Buffer );
					
					int msg = BufStringAddSize( bs, lbs->bs_Buffer, lbs->bs_Size );

					BufStringDelete( lbs );
				}

				al = (Application *)al->node.mln_Succ;
				pos++;
			}
			//INFO("JSON INFO 2: %s\n", bs->bs_Buffer );
			
			BufStringAdd( bs, "  ]}" );
			
			HttpAddTextContent( response, bs->bs_Buffer );
			
			BufStringDelete( bs );
		}
		else
		{
			FERROR("ERROR: Cannot allocate memory for BufferString\n");
		}
	}
	
	//
	// list of all users avaiable on server/assid
	//
	
	else if( strcmp( urlpath[ 0 ], "userlist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		FBOOL usersOnly = FALSE;
		response = HttpNewSimple( HTTP_200_OK,  tags );
		char *assid = NULL;
		char buffer[ 1024 ];
		
		HashmapElement *el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "usersonly" );
		if( el != NULL )
		{
			if( ( (char *)el->data ) != NULL && strcmp("true", (char *)el->data ) == 0 )
			{
				usersOnly = TRUE;
			}
		}
		
		if( assid != NULL )
		{
			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid, &end, 0 );
		
			BufString *bs = BufStringNew();
			// Try to fetch assid session from session list!
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			if( as != NULL && bs != NULL )
			{
				int pos = 0;
				BufStringAdd( bs, " { \"Users\": [" );
				
				SASUList *al = as->as_UserSessionList;
				while( al != NULL )
				{
					char temp[ 1024 ];
					int size = 0;
					FBOOL add = TRUE;
					
					if( usersOnly )
					{
						if( strstr( bs->bs_Buffer, al->usersession->us_User->u_Name ) != NULL )
						{
							add = FALSE;
						}
					}
					
					if( add == TRUE )
					{
						if( pos == 0 )
						{
							size = snprintf( temp, sizeof(temp), "%s", al->usersession->us_User->u_Name );
						}
						else
						{
							size = snprintf( temp, sizeof(temp), ",%s", al->usersession->us_User->u_Name );
						}
						BufStringAddSize( bs, temp, size );
					
						pos++;
					}
					al = (SASUList *) al->node.mln_Succ;
				}
				
				BufStringAdd( bs, "  ]}" );

				HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
				bs->bs_Buffer = NULL;
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "application session not found!" );
				HttpAddTextContent( response, buffer );
			}
			if( bs != NULL )
			{
				BufStringDelete( bs );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid paramter not found!" );
			HttpAddTextContent( response, buffer );
		}
	}
	
	//
	// register appsession
	//
	
	else if( strcmp( urlpath[ 0 ], "register" ) == 0 )
	{
		char *authid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] Register\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "authid" );
		if( el != NULL )
		{
			authid = UrlDecodeToMem( ( char *)el->data );
		}
		
		if( authid == NULL )
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "authid is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("AuthID is missing!\n");
		}
		else
		{
			char buffer[ 1024 ];
			
			FERROR("[ApplicationWebRequest] User set session: %s ---------- authid ---- %s\n", loggedSession->us_User->u_Name, authid );
			
			AppSession *as = AppSessionNew( l, authid, 0, loggedSession );
			if( as != NULL )
			{
				int err = AppSessionManagerAddSession( l->sl_AppSessionManager, as );
				if( err == 0 )
				{
					int size = sprintf( buffer, "{ \"SASID\": \"%llu\" }", as->as_SASID  );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s  %d\"}", "add session problem: ",  err );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "cannot create new  session" );
				HttpAddTextContent( response, buffer );
			}
		}
		
		if( authid != NULL )
		{
			FFree( authid );
		}
	}
	
	//
	// unregister appsession - remove it from session manager
	//
	
	else if( strcmp( urlpath[ 0 ], "unregister" ) == 0 )
	{
		char *assid = NULL;
		
		DEBUG("[ApplicationWebRequest] Unregister session\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		if( assid == NULL )
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("SASID is missing!\n");
		}
		else
		{
			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			char buffer[ 1024 ];
			
			if( as != NULL )
			{
				DEBUG("[ApplicationWebRequest] Found appsession id %llu\n", as->as_AppID );
				// if our session is owner session all connections must be closed
				
				UserSession *locus = (UserSession *)as->as_UserSessionList->usersession;
				int err = 0;
				
				char tmpmsg[ 255 ];
				
				if( locus->us_User == loggedSession->us_User )
				{
					int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"sasid-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					DEBUG("[ApplicationWebRequest] As Owner I want to remove session and sasid\n");
					
					err = AppSessionSendMessage( as, loggedSession, tmpmsg, msgsize, NULL );
					
					// we are not owner, we must send message to owner too
					if( loggedSession != locus )
					{
						err = AppSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					}
					
					err = AppSessionManagerRemSession( l->sl_AppSessionManager, as );
				}
				//
				// we are not session owner, we can onlybe removed from assid
				//
				else
				{
					int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
					err = AppSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					
					err = AppSessionRemUsersession( as, loggedSession );
				}
				
				if( err == 0 )
				{
					int size = sprintf( buffer, "{\"SASID\":\"%llu\"}", asval );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s  %d\"}", "add session problem: ",  err );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid not found" );
				HttpAddTextContent( response, buffer );
			}
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}	
	}
	
	
	//
	// accept appsession - invitee accepts invite from assid owner!
	//
	
	else if( strcmp( urlpath[ 0 ], "accept" ) == 0 )
	{
		char *authid = NULL;
		char *assid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] accept\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "authid" );
		if( el != NULL )
		{
			authid = UrlDecodeToMem( ( char *)el->data );
		}
		
		el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		// Comes in without required authid or assid!
		if( authid == NULL || assid == NULL )
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "authid or sasid is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("AuthID is missing!\n");
			
			if( authid != NULL ) { FFree( authid ); }
			if( assid != NULL ) { FFree( assid ); }
		}
		// We've got what we need! Continue
		else
		{
			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid, &end, 0 );
			char buffer[ 1024 ];
			
			// Try to fetch assid session from session list!
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				SASUList *li = as->as_UserSessionList;
				int error = 1;
		
				// Find invitee user with authid from user list in allowed users
				while( li != NULL )
				{
					DEBUG("[ApplicationWebRequest] Setting %s userfromlist %s userlogged %s  currauthid %s   entryptr %p\n", authid, li->usersession->us_User->u_Name, loggedSession->us_User->u_Name, li->authid, li );
					
					DEBUG("[ApplicationWebRequest] sessionfrom list %p loggeduser session %p\n",  li->usersession, loggedSession );
					if( li->usersession == loggedSession )
					{
						if( li->authid[ 0 ] != 0 )
						{
							FERROR("\n\nAUTHID IS NOT EMPTY %s!!!\n", li->authid );
						}
						
						if( li->status == SASID_US_INVITED )
						{
							li->status == SASID_US_ACCEPTED;
						}
						
						DEBUG("[ApplicationWebRequest] ASN set %s pointer %p\n", li->authid, li );
						strcpy( li->authid, authid );
						DEBUG("[ApplicationWebRequest] Setting authid %s user %s\n", authid, li->usersession->us_User->u_Name );
						
						as->as_UserNumber++;
						
						char tmpmsg[ 255 ];
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						
						int err = AppSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
						if( err != 0 )
						{
							
						}
						error = 0;
						break;
					}
					li = ( SASUList * )li->node.mln_Succ;
				}
			
				if( error == 0 )
				{
					int size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", as->as_UserSessionList->usersession->us_User->u_Name );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s\"}", "user not found: " );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "cannot create new  session" );
				HttpAddTextContent( response, buffer );
			}
		}

		if( authid != NULL )
		{
			FFree( authid );
		}
		if( assid != NULL )
		{
			FFree( assid );
		}
	}
	
	
	//
	// decline appsession - decline  accepts invite from assid owner!
	//
	
	else if( strcmp( urlpath[ 0 ], "decline" ) == 0 )
	{
		char *assid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] Decline\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  NULL;
		
		el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		// Comes in without required authid or assid!
		if( assid == NULL )
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "authid or sasid is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("AuthID is missing!\n");
			
			//if( authid != NULL ) { FFree( authid ); }
			if( assid != NULL ) { FFree( assid ); }
		}
		// We've got what we need! Continue
		else
		{
			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid, &end, 0 );
			char buffer[ 1024 ];
			
			// Try to fetch assid session from session list!
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				// Find invitee user with authid from user list in allowed users
				SASUList *li = GetListEntryBySession( as, loggedSession );
				int error = 1;
				
				if( li != NULL )
				{
					char tmpmsg[ 255 ];
					int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-decline\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
					DEBUG("[ApplicationWebRequest] Session found and will be removed\n");
					int err = AppSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					if( err != 0 )
					{
						
					}
					
					 err = AppSessionRemUsersession( as, loggedSession );
					 error = 0;
				}
				
				if( error == 0 )
				{
					int size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", as->as_UserSessionList->usersession->us_User->u_Name );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s\"}", "User not found: " );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "cannot create new  session" );
				HttpAddTextContent( response, buffer );
			}
		}

		if( assid != NULL )
		{
			FFree( assid );
		}
	}
	
	//
	// share app into an appsession to selected users
	//
	
	else if( strcmp( urlpath[ 0 ], "share" ) == 0 )
	{
		char *assid = NULL;
		char *userlist = NULL;
		char *msg = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		AppSession *as = NULL;
		char buffer[ 1024 ];
		char applicationName[ 1024 ];
		applicationName[ 0 ] = 0;
		
		if( assid != NULL )
		{
			char *end;
			//int assidlen = strlen( assid );
			FUQUAD asval = strtoul( assid,  &end, 0 );
			DEBUG("[ApplicationWebRequest] ASSID %s endptr-startp %d\n", assid, (int)(end-assid) );
			int errors = 0;
			
			as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
		}
		
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
		if( sqllib != NULL )
		{
			//
			// we must get application name to send it with invitation
			//

			char q[ 1024 ];
			if( as != NULL )
			{
				sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT `Name` FROM `FUserApplication` ua, `FApplication` a  WHERE ua.AuthID=\"%s\" and ua.ApplicationID = a.ID LIMIT 1",( char *)as->as_AuthID );
				//snprintf( q, sizeof(q), "SELECT `Name` FROM `FUserApplication` ua, `FApplication` a  WHERE ua.AuthID=\"%s\" and ua.ApplicationID = a.ID LIMIT 1",( char *)as->as_AuthID );

				MYSQL_RES *res = sqllib->Query( sqllib, q );
				if( res != NULL )
				{
					MYSQL_ROW row;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						strcpy( applicationName, row[ 0 ] );
					}
					sqllib->FreeResult( sqllib, res );
				}
				l->LibraryMYSQLDrop( l, sqllib );
			}
		}
		
		if( as == NULL  )
		{
			if( assid == NULL )
			{
				sprintf( buffer, "{ \"response\": \"sasid parameter is missing.\" }" );
				return response;
			}
			else
			{
				sprintf( buffer, "{ \"response\": \"Application session do not exist.\" }" );
			}
			HttpAddTextContent( response, buffer );
			return response;
		}
		
		// Register invite message so we can send it to users
		el =  HashmapGet( request->parsedPostContent, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->data );
		}
		
		// Get list of usernames
		el = HashmapGet( request->parsedPostContent, "users" );
		if( el != NULL )
		{
			userlist = UrlDecodeToMem( ( char *)el->data );
			
			FERROR("\n\n\n\n\n share: %s  as %p msg %s\n", userlist, as, msg );
			
			if( as != NULL && msg != NULL )
			{
			
				char *resp = AppSessionAddUsersByName( as, loggedSession, userlist, applicationName, msg  );
				if( resp != NULL )
				{
					HttpAddTextContent( response, resp );
					
					FFree( resp );
				}
				else
				{
					HttpAddTextContent( response, "{\"response\":\"cannot add any users, check logs\"}" );
				}
			}
		}
		else
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "authid or users is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("AuthID is missing!\n");
		}
		
		if( msg != NULL )
		{
			FFree( msg );
		}
		if( assid != NULL )
		{
			FFree( assid );
		}
		if( userlist != NULL )
		{
			FFree( userlist );
		}
	}
	
	//
	// unshare appsession - it terminates it
	//
	
	else if( strcmp( urlpath[ 0 ], "unshare" ) == 0 )
	{
		char *assid = NULL;
		char *userlist = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->data );
		}
		
		el =  HashmapGet( request->parsedPostContent, "users" );
		if( el != NULL )
		{
			userlist = UrlDecodeToMem( ( char *)el->data );
		}
		
		if( assid != NULL && userlist != NULL )
		{
			char buffer[ 1024 ];
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			int i;
			int errors = 0;
			
			DEBUG("[ApplicationWebRequest] UserList passed '%s'  as ptr %p\n", userlist, as );
			
			BufString *bs = AppSessionRemUserByNames( as, loggedSession, userlist );
			if( bs != NULL )
			{
				HttpAddTextContent( response, bs->bs_Buffer );
			
				BufStringDelete( bs );
			}
			else
			{
				HttpAddTextContent( response, "{\"response\":\"errors during removeing users. check FC logs for more details\"}" );
			}
		}
		else
		{
			char buffer[ 1024 ];
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "authid or users is missing" );
			HttpAddTextContent( response, buffer );
			FERROR("sasid or userlist is missing!\n");
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}
		if( userlist != NULL )
		{
			FFree( userlist );
		}
	}
		
	//
	// send message to other users (not owner of assid)
	//
	
	else if( strcmp( urlpath[ 0 ], "send" ) == 0 )
	{
		char *assid = NULL;
		char *msg = NULL;
		char *usernames = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] app/send (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->data );
		
		el = HashmapGet( request->parsedPostContent, "msg" );
		if( el != NULL ) msg = UrlDecodeToMem( ( char *)el->data );
		
		el = HashmapGet( request->parsedPostContent, "usernames" );
		if( el != NULL ) usernames = UrlDecodeToMem( ( char *)el->data );
		
		//OST usernames ["stefkos"]
		
		
		char buffer[ 1024 ];
		
		if( assid != NULL && msg != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			if( as != NULL )
			{
				int err = AppSessionSendMessage( as, loggedSession, msg, strlen( msg ), usernames );
				if( err > 0 )
				{
					int size = sprintf( buffer, "{\"response\":\"success\"}" );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s %d\"}", "cannot send message: ",  err );
					HttpAddTextContent( response, buffer );
				}
				
				if( as->as_Obsolete == TRUE )
				{
					int err = AppSessionManagerRemSession( l->sl_AppSessionManager, as );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid or msg are null: " );
			HttpAddTextContent( response, buffer );
		}
		
		if( usernames != NULL )
		{
			FFree( usernames );
		}
		if( assid != NULL )
		{
			FFree( assid );
		}
		if( msg != NULL )
		{
			FFree( msg );
		}
	}
		
	//
	// send message to owner of assid
	//
	
	else if( strcmp( urlpath[ 0 ], "sendowner" ) == 0 )
	{
		char *assid = NULL;
		char *msg = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		FERROR("app/sendowner called\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->data );
		
		el =  HashmapGet( request->parsedPostContent, "msg" );
		if( el != NULL ) msg = UrlDecodeToMem( ( char *)el->data );
		
		char buffer[ 1024 ];
		
		FERROR("sasid %s message %s\n",  assid, msg );
		
		if( assid != NULL && msg != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			FERROR("AS %p  asval %llu\n", as, asval );
			if( as != NULL )
			{
				char *newmsg = NULL;

				int err = AppSessionSendOwnerMessage( as, loggedSession, msg, strlen(msg) );
				FERROR("Messages sent %d\n", err );
				if( err > 0 )
				{
					int size = sprintf( buffer, "{\"response\":\"success\"}" );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s  %d\"}", "cannot send message: ",  err );
					HttpAddTextContent( response, buffer );
				}
				
				if( as->as_Obsolete == TRUE )
				{
					int err = AppSessionManagerRemSession( l->sl_AppSessionManager, as );
				}
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid or msg are null: " );
			HttpAddTextContent( response, buffer );
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}
		if( msg != NULL )
		{
			FFree( msg );
		}
	
	//
	// take session ownership
	//
		
	}
	else if( strcmp( urlpath[ 0 ], "takeover" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] Takeover\n");
		
		char *assid = NULL;
		char *devid = NULL;
		char *username = NULL;
		char buffer[ 1024 ];
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->data );
		
		el =  HashmapGet( request->parsedPostContent, "deviceid" );
		if( el != NULL ) devid = UrlDecodeToMem( ( char *)el->data );
		
		el =  HashmapGet( request->parsedPostContent, "username" );
		if( el != NULL ) username = UrlDecodeToMem( ( char *)el->data );
		
		if( assid != NULL && devid != NULL && username != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			FERROR("AS %p  asval %llu\n", as, asval );
			if( as != NULL )
			{
				// finding our current session on list
				
				pthread_mutex_lock( &as->as_SessionsMut );
				
				SASUList *srcli = as->as_UserSessionList;
				while( srcli != NULL )
				{
					if( srcli->usersession == loggedSession )
					{
						break;
					}
						
					srcli = (SASUList *) srcli->node.mln_Succ;
				}
				
				// finding session to which we want migrate
				
				SASUList *dstli = as->as_UserSessionList;
				while( dstli != NULL )
				{
					UserSession *locses = (UserSession *) dstli->usersession;
					if( strcmp( devid, locses->us_DeviceIdentity ) == 0 && strcmp( username, locses->us_User->u_Name ) == 0 )
					{
						break;
					}
						
					dstli = (SASUList *) dstli->node.mln_Succ;
				}
				
				if( dstli != NULL && srcli->usersession != NULL )
				{
					char  tmpauthid[ 255 ];
					strcpy( tmpauthid, srcli->authid );
					UserSession *tmpses = srcli->usersession;
					int tmpstatus = srcli->status;
					
					//strcpy( srcli->authid, dstli->authid );
					//srcli->usersession = dstli->usersession;
					//srcli->status = dstli->status;
					
					char tmp[ 1024 ];
					//int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%llu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"client-decline\",\"data\":\"%s\"}\"}}}}}", le->authid, as->as_ASSID, loggedSession->us_User->u_Name, assid, tmpses->us_User->u_Name );
					//int msgsndsize += WebSocketSendMessageInt( le->usersession, tmp, len );
					
					strcpy( dstli->authid, tmpauthid );
					dstli->usersession = tmpses;
					dstli->status = tmpstatus;
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s\"}", "Current or destination sessions not found!" );
					HttpAddTextContent( response, buffer );
				}
				
				pthread_mutex_unlock( &as->as_SessionsMut );
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid, deviceid or username parameters are empty" );
			HttpAddTextContent( response, buffer );
		}
		
		if( devid != NULL )
		{
			FFree( devid );
		}
		
		if( username != NULL )
		{
			FFree( username );
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}
		
	//
	// take session ownership
	//
		
	}
	else if( strcmp( urlpath[ 0 ], "switchsession" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] switchsession\n");
		
		char *assid = NULL;
		char *devid = NULL;
		char buffer[ 1024 ];
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->data );
		
		el =  HashmapGet( request->parsedPostContent, "deviceid" );
		if( el != NULL ) devid = UrlDecodeToMem( ( char *)el->data );
		
		if( assid != NULL && devid != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			FERROR("AS %p  asval %llu\n", as, asval );
			if( as != NULL )
			{
				pthread_mutex_lock( &as->as_SessionsMut );
				// finding our current session on list
				
				SASUList *srcli = as->as_UserSessionList;
				while( srcli != NULL )
				{
					if( srcli->usersession == loggedSession )
					{
						break;
					}
						
					srcli = (SASUList *) srcli->node.mln_Succ;
				}
				
				// finding session to which we want migrate
				
				SASUList *dstli = as->as_UserSessionList;
				while( dstli != NULL )
				{
					UserSession *locses = (UserSession *) dstli->usersession;
					if( strcmp( devid, locses->us_DeviceIdentity ) == 0 && loggedSession->us_ID == locses->us_ID )
					{
						break;
					}
						
						dstli = (SASUList *) dstli->node.mln_Succ;
				}
				
				if( dstli != NULL && srcli->usersession != NULL )
				{
					DEBUG("[ApplicationWebRequest] Switching sessions\n");
					
					char  tmpauthid[ 255 ];
					if( srcli->authid[ 0 ] == 0 )
					{
						tmpauthid[ 0 ] = 0;
					}
					else
					{
						strcpy( tmpauthid, srcli->authid );
					}
					void *tmpses = srcli->usersession;
					int tmpstatus = srcli->status;
					
					if( dstli->authid[ 0 ] == 0 )
					{
						srcli->authid[ 0 ] = 0;
					}
					else
					{
						strcpy( srcli->authid, dstli->authid );
					}
					srcli->usersession = dstli->usersession;
					srcli->status = dstli->status;
					
					if( tmpauthid[ 0 ] == 0 )
					{
						dstli->authid[ 0 ] = 0;
					}
					else
					{
						strcpy( dstli->authid, tmpauthid );
					}
					dstli->usersession = tmpses;
					dstli->status = tmpstatus;
				}
				else
				{
					int size = sprintf( buffer, "{\"response\":\"%s\"}", "Current or destination sessions not found!" );
					HttpAddTextContent( response, buffer );
				}
				
				pthread_mutex_unlock( &as->as_SessionsMut );
			}
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid or deviceid parameters are empty" );
			HttpAddTextContent( response, buffer );
		}
		
		if( devid != NULL )
		{
			FFree( devid );
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}
	}
	
	//
	// put variable into Application Session
	//
	
	else if( strcmp( urlpath[ 0 ], "putvar" ) == 0 )
	{
		char *assid = NULL;
		char *varid = NULL;
		char *var = NULL;
		FBOOL priv = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] app/send (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = ( char *)el->data;
		
		el = HashmapGet( request->parsedPostContent, "var" );
		if( el != NULL ) var = UrlDecodeToMem( ( char *)el->data );
		
		el = HashmapGet( request->parsedPostContent, "varid" );
		if( el != NULL ) varid = ( char *)el->data;
		
		el = HashmapGet( request->parsedPostContent, "mode" );
		if( el != NULL )
		{
			if( el->data != NULL )
			{
				if( strcmp( (char *)el->data, "private" ) == 0 )
				{
					priv = TRUE;
				}
			}
		}
		
		char buffer[ 1024 ];
		
		if( assid != NULL && var != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			if( as != NULL )
			{
				INVAREntry *le = NULL;
				
				// trying to find existing variable, because ID was passed
				
				pthread_mutex_lock( &as->as_VariablesMut );
				if( varid != NULL )
				{
					FULONG varidlong = strtoull( varid,  &end, 0 );
			
					le = as->as_Variables;
					while( le != NULL )
					{
						if( le->ne_ID == varidlong )
						{
							break;
						}
						le = (INVAREntry *) le->node.mln_Succ;
					}
				}
			
				// if entry exist we just update data
				// otherwise we create new entry
			
				if( le != NULL )
				{
					FBOOL canchange = FALSE;
					
					if( le->ne_SpecialData != NULL )
					{
						if( le->ne_SpecialData == loggedSession->us_User )
						{
							canchange = TRUE;
						}
					}
					else
					{
						canchange = TRUE;
					}
					
					if( canchange == TRUE )
					{
						DEBUG("[ApplicationWebRequest] Old entry changed\n");
						if( le->ne_Data != NULL )
						{
							FFree( le->ne_Data );
						}
						le->ne_Data = var;
					}
				}
				else
				{
					INVAREntry *ne = INVAREntryNew( as->as_VariablesNumGenerator++, NULL, NULL );
					if( ne != NULL )
					{
						DEBUG("[ApplicationWebRequest] New entry added\n");
						ne->ne_Data = var;
						le = ne;
						
						if( priv == TRUE )
						{
							le->ne_SpecialData = loggedSession->us_User;
						}
						
						le->node.mln_Succ = (MinNode *) as->as_Variables;
						as->as_Variables = le;
					}
				}
				
				pthread_mutex_unlock( &as->as_VariablesMut );
				
				if( le != NULL )
				{
					int size = sprintf( buffer, "{\"VariableNumber\":\"%lu\"}", le->ne_ID );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					int size = sprintf( buffer, "{\"VariableNumber\":\"%d\"}", -1 );
					HttpAddTextContent( response, buffer );
				}
			}
			
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid or deviceid parameters are empty" );
			HttpAddTextContent( response, buffer );
		}
		
//
	// get variable from Application Session
	//
	}
	else if( strcmp( urlpath[ 0 ], "getvar" ) == 0 )
	{
		char *assid = NULL;
		char *varid = NULL;
		char *var = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[ApplicationWebRequest] app/send (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->parsedPostContent, "sasid" );
		if( el != NULL ) assid = ( char *)el->data;
		
		el = HashmapGet( request->parsedPostContent, "varid" );
		if( el != NULL ) varid = ( char *)el->data;
		
		char buffer[ 1024 ];
		
		if( assid != NULL && var != NULL )
		{
			char *end;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
			
			if( as != NULL )
			{
				INVAREntry *le = NULL;
				
				// trying to find existing variable, because ID was passed
				
				pthread_mutex_lock( &as->as_VariablesMut );
				if( varid != NULL )
				{
					FULONG varidlong = strtoull( varid,  &end, 0 );
			
					le = as->as_Variables;
					while( le != NULL )
					{
						if( le->ne_ID == varidlong )
						{
							break;
						}
						le = (INVAREntry *) le->node.mln_Succ;
					}
				}
				
				pthread_mutex_unlock( &as->as_VariablesMut );
				
				if( le != NULL )
				{
					FBOOL canread = FALSE;
					
					if( le->ne_SpecialData != NULL )
					{
						if( le->ne_SpecialData == loggedSession->us_User )
						{
							canread = TRUE;
						}
					}
					else
					{
						canread = TRUE;
					}
					
					if( canread == TRUE )
					{
						char *tmpresp = FCalloc( strlen( le->ne_Data ) + 100, sizeof(char) );
						if( tmpresp != NULL )
						{
							int size = sprintf( tmpresp, "{\"VariableData\":\"%s\"}", le->ne_Data );
							HttpSetContent( response, tmpresp, size );
						}
					}
					else
					{
						int size = sprintf( buffer, "{\"response\":\"%s\"}", "You dont have access to this variable " );
						HttpAddTextContent( response, buffer );
					}
				}
				else
				{
					int size = sprintf( buffer, "{\"VariableData\":\"\"}" );
					HttpAddTextContent( response, buffer );
				}
			}
			
			else
			{
				int size = sprintf( buffer, "{\"response\":\"%s\"}", "session doesnt exist " );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			int size = sprintf( buffer, "{\"response\":\"%s\"}", "sasid or deviceid parameters are empty" );
			HttpAddTextContent( response, buffer );
		}
		
	//
	// install application
	//
	
	}
	else if( strcmp( urlpath[ 0 ], "install" ) == 0 )
	{
		char *url = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->uri->query, "url" );
		if( el != NULL )
		{
			url = UrlDecodeToMem( ( char *)el->data );
		}
		
		if( url != NULL )
		{
			
		}
		
		//HttpWriteAndFree( response );
		
		if( url != NULL )
		{
			FFree( url );
		}
	}
	else
	{
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		//HttpWriteAndFree( response );
		return response;
	}
		
/*
						//request->query;
						//
						// PARAMETERS SHOULD BE TAKEN FROM
						// POST NOT GET
						
		if( request->uri->query != NULL )
		{
			char *usr = NULL;
			char *pass = NULL;
							
			HashmapElement_t *el =  HashmapGet( request->uri->query, "username" );
			if( el != NULL )
			{
				usr = (char *)el->data;
			}
							
			el =  HashmapGet( request->uri->query, "password" );
			if( el != NULL )
			{
				pass = (char *)el->data;
			}
							
			if( usr != NULL && pass != NULL )
			{
				User *loggedUser = l->Authenticate( l, usr, pass, NULL );
				if( loggedUser != NULL )
				{
					char tmp[ 20 ];
					sprintf( tmp, "LERR: %d\n", loggedUser->u_Error );	// check user.library to display errors
					HttpAddTextContent( response, tmp );
				}else{
					HttpAddTextContent( response, "LERR: -1" );			// out of memory/user not found
				}
			}
		}
		DEBUG("user login response\n");

		HttpWriteAndFree( response, sock );
		result = 200;
	}else
	{
		Http404( sock );
		return 404;
	}
	*/
	DEBUG("[ApplicationWebRequest] FriendCore returned %s\n", response->content );

	return response;
}
