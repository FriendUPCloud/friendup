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
 *  SAS Web
 *
 * handle all commands send by the user
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/03/2020
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
#include "sas_web.h"

// disable debug
#undef __DEBUG

//
// How this thing is working
//  user A call  app/register and then new appsession is created, user structure is filled by his app authid
//  user A call app/share and point to usernames splitted by comma, users X,Y,Z receive via WS information that someone want to invite them
//  user X,Y,Z send message app/accept if they are accepting connection. They also attach their authid. If they cancel they are sending app/unshare
//  user A by using app/send command, can spread message between users X,Y,Z
//  users X,Y,Z can only send messages to session owner (user A) by using command app/sendowner
//
//

/// ifnot WEB_CALL_DOCUMENTATION
/**
 * Application web calls handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @return pointer to new Http structure (response) or NULL when error appear
 */
/// endif
Http* SASWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedSession )
{
	if( urlpath[ 0 ] == NULL )
	{
		Http* response = NULL;
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "urlpath[0] is NULL\n" );
		return response;
	}
	if( loggedSession != NULL && loggedSession->us_User != NULL )
	{
		Log( FLOG_DEBUG, "SASWebRequest %s  CALLED BY user: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	}
	else
	{
		Log( FLOG_DEBUG, "SASWebRequest %s  CALLED BY sessionID: %s\n", urlpath[ 0 ], loggedSession->us_SessionID );
	}
	
	// DEBUG disabled
	/*
	AppSession *was = l->sl_AppSessionManager->asm_AppSessions;
	while( was != NULL )
	{
		DEBUG("[SASWebRequest] SASID: %lu\n", was->as_SASID );
		SASUList *wus =  was->as_UserSessionList;
		while( wus != NULL )
		{
			if( wus->authid[ 0 ] == 0 )
			{
				DEBUG("[SASWebRequest] authid %s wusptr  %p\n", "empty",  wus );
			}
			else
			{
				DEBUG("[SASWebRequest] authid %s wusptr  %p\n", wus->authid,  wus );
			}
			wus = (SASUList *)wus->node.mln_Succ;
		}
		was = (AppSession *)was->node.mln_Succ;
	}
	*/
	
	Http* response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/help</H2>add new FCConnection
	*
	* @param sessionid - (required) session id of logged user
	*
	* @return return information about avaiable functions (app section)
	*/
	/// @endcond
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, \
			"list - return installed application list\n \
			" );
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/userlist</H2>List of all users connected to Application Shared Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id
	* @param usersonly - set true if you want to get only unique user names

	* @return string with information which users are connected to shared session
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "userlist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
	
		FBOOL usersOnly = FALSE;
		response = HttpNewSimple( HTTP_200_OK,  tags );
		char *assid = NULL;
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "usersonly" );
		if( el != NULL )
		{
			if( ( (char *)el->hme_Data ) != NULL && strcmp("true", (char *)el->hme_Data ) == 0 )
			{
				usersOnly = TRUE;
			}
		}
		
		if( assid != NULL )
		{
			char *end = NULL;
			FUQUAD asval = strtoull( assid, &end, 0 );
		
			BufString *bs = BufStringNew();
			// Try to fetch assid session from session list!
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			if( as != NULL && bs != NULL )
			{
				int pos = 0;
				BufStringAdd( bs, " {\"Users\":[" );
				
				SASUList *al = as->sas_UserSessionList;
				while( al != NULL )
				{
					char temp[ 1024 ];
					int size = 0;
					FBOOL add = TRUE;
					
					if( FRIEND_MUTEX_LOCK( &al->usersession->us_Mutex ) == 0 )
					{
						al->usersession->us_InUseCounter++;
						FRIEND_MUTEX_UNLOCK( &al->usersession->us_Mutex );
					}
					
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
					if( FRIEND_MUTEX_LOCK( &al->usersession->us_Mutex ) == 0 )
					{
						al->usersession->us_InUseCounter--;
						FRIEND_MUTEX_UNLOCK( &al->usersession->us_Mutex );
					}
					
					al = (SASUList *) al->node.mln_Succ;
				}
				
				BufStringAdd( bs, "  ]}" );

				HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
				bs->bs_Buffer = NULL;
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			if( bs != NULL )
			{
				BufStringDelete( bs );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/register</H2>Register new Application Shared Session
	*
	* @param sessionid - (required) session id of logged user
	* @param authid - (required) authentication id (provided by application)
	* @param type - type of application session 'close'(default), 'open' for everyone
	* @param sasid - if passed then it will be used to join already created SAS
	* @param force - if set to yes then number is coming from client

	* @return { SASID: <number> } when success, otherwise response with error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "register" ) == 0 )
	{
		char *authid = NULL;
		char *sasid = NULL;
		int type = 0;
		FBOOL force = FALSE;
		
		/*
		Thomas Wollburg :
14:44:11
// SAS functions to connect users coeiting a document... SAS session key is the document key we use  
// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.checkDocumentSession = function( sasID = null )
{
	if( Application.sas !== null )
	{
		console.log('SAS already initialised!');
		return;
	}
	
	console.log('init SAS ID',sasID, Application.isHost );
	var conf = {
		sasid   : sasID,
		onevent : Application.socketMessage
	};
	Application.sas = new SAS( conf, Application.sasidReady );	
	console.log('SAS instantiated.',conf);
}
		 */ 
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[SASWebRequest] Register\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "authid" );
		if( el != NULL )
		{
			authid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			sasid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "force" );
		if( el != NULL )
		{
			if( el->hme_Data != NULL && (strcmp( el->hme_Data, "true" ) == 0 ) )
			{
				force = TRUE;
			}
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "type" );
		if( el != NULL )
		{
			if( el->hme_Data != NULL )
			{
				if( strcmp( ( ( char *)el->hme_Data), "close") == 0 )
				{
					type = SAS_TYPE_CLOSED;
				}
				else if( strcmp( ( ( char *)el->hme_Data), "open") == 0 )
				{
					type = SAS_TYPE_OPEN;
				}
			}
		}
		
		if( authid == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "authid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("authid is missing!\n");
		}
		else
		{
			char buffer[ 1024 ];
			
			DEBUG("SAS/register: sasid %s\n", sasid );
			if( sasid != NULL )
			{
				char *end;
				FUQUAD asval = strtoull( sasid, &end, 0 );
				DEBUG("SASWeb sasid: %lu force: %d\n", asval, force );
				if( force == TRUE )
				{
					if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
					{
						loggedSession->us_InUseCounter++;
						FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
					}
					
					// if user want to create SAS with his own ID
					SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
					if( as == NULL )
					{
						DEBUG("SASWeb will create session now\n");
						as = SASSessionNew( l, authid, 0, loggedSession );
						if( as != NULL )
						{
							as->sas_SASID = asval;
							as->sas_Type = type;
							
							DEBUG("SASWeb will add session now\n");
							
							int err = SASManagerAddSession( l->sl_SASManager, as );
							
							DEBUG("SASWeb Add session: %d\n", err );
							
							if( err == 0 )
							{
								int size = sprintf( buffer, "{\"SASID\":\"%lu\",\"type\":%d}", as->sas_SASID, as->sas_Type );
								HttpAddTextContent( response, buffer );
							}
							else
							{
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS register", err );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
						else
						{
							int size = sprintf( buffer, "{\"SASID\":\"%lu\",\"type\":%d,\"exist\":true}", as->sas_SASID, as->sas_Type );
							HttpAddTextContent( response, buffer );
						}
					}
					else	// session was found, lets join it
					{
						SASUList *entry;
						DEBUG("[SASWebRequest] I will try to add session\n");
					
						if( ( entry = SASSessionAddCurrentUserSession( as, loggedSession) ) != NULL )
						{
							char tmpmsg[ 255 ];
							int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
							HttpAddTextContent( response, tmpmsg );
						}
						else
						{
							DEBUG("SASWeb Cannot join session\n");
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_CREATE_SAS], DICT_CANNOT_CREATE_SAS );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					
					if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
					{
						loggedSession->us_InUseCounter--;
						FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
					}
				}
				else	// sasid paramter was not sent
				{
					// Try to fetch assid session from session list!
					SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
					if( as != NULL )
					{
						char tmpmsg[ 255 ];
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						HttpAddTextContent( response, tmpmsg );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_CREATE_SAS], DICT_CANNOT_CREATE_SAS );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				/*
				char *end;
				FUQUAD asval = strtoull( sasid, &end, 0 );
			
				// Try to fetch assid session from session list!
				AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
				DEBUG("SAS/register as: %p\n", as );
		
				// We found session!
				if( as != NULL )
				{
					SASUList *entry;
					if( ( entry = AppSessionAddUsersBySession( as, loggedSession, loggedSession->us_SessionID, "system", "joined to sas"  ) ) != NULL )
					{
						// just accept connection
						entry->status = SASID_US_ACCEPTED;
						DEBUG("SAS/register Connection accepted\n");
						
						DEBUG("[ApplicationWebRequest] ASN set %s pointer %p\n", entry->authid, entry );
						strcpy( entry->authid, authid );
						
						int size = sprintf( buffer, "{ \"SASID\": \"%lu\" }", as->as_SASID  );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS register", 99 );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				*/
			}
			else	// sas with provided id do not exist
			{
				FERROR("[SASWebRequest] User set session: %s ---------- authid ---- %s\n", loggedSession->us_User->u_Name, authid );
			
				SASSession *as = SASSessionNew( l, authid, 0, loggedSession );
				if( as != NULL )
				{
					as->sas_Type = type;
					int err = SASManagerAddSession( l->sl_SASManager, as );
					if( err == 0 )
					{
						int size = sprintf( buffer, "{\"SASID\":\"%lu\",\"type\":%d}", as->sas_SASID, as->sas_Type );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS register", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_CREATE_SAS], DICT_CANNOT_CREATE_SAS );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
		}
		
		if( sasid != NULL )
		{
			FFree( sasid );
		}
		if( authid != NULL )
		{
			FFree( authid );
		}
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/unregister</H2>Unregister Application Shared Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id which will be removed

	* @return {SASID:<number>} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "unregister" ) == 0 )
	{
		char *assid = NULL;
		
		DEBUG("[SASWebRequest] Unregister session\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( assid == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("sasid is missing!\n");
		}
		else
		{
			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			char buffer[ 1024 ];
			
			if( as != NULL )
			{
				// if session is open it is allowed to quit session by the owner
				// if AS have less users then 1 then session is removed
				if( as->sas_Type == SAS_TYPE_OPEN )
				{
					int err = 0;

					err = SASSessionRemUserSessionAny( as, loggedSession );
					
					DEBUG("AS will be removed? %d number of users on sas %d\n", err, as->sas_UserNumber );
					// if user was removed and he was last then we remove SAS
					if( err == 0 && as->sas_UserNumber <= 0 )
					{
						err = SASManagerRemSession( l->sl_SASManager, as );
					}
					
					if( err == 0 )
					{
						int size = sprintf( buffer, "{\"SASID\":\"%lu\"}", asval );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS unregister", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					DEBUG("[SASWebRequest] Found appsession id %lu\n", as->sas_AppID );
					// if our session is owner session all connections must be closed
				
					UserSession *locus = (UserSession *)as->sas_UserSessionList->usersession;
					int err = 0;
				
					char tmpmsg[ 255 ];
					
					if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
					{
						loggedSession->us_InUseCounter++;
						FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
					}
				
					if( locus->us_User == loggedSession->us_User )
					{
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"sasid-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						DEBUG("[SASWebRequest] As Owner I want to remove session and sasid\n");
					
						err = SASSessionSendMessage( as, loggedSession, tmpmsg, msgsize, NULL );
					
						// we are not owner, we must send message to owner too
						if( loggedSession != locus )
						{
							err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
						}
					
						err = SASManagerRemSession( l->sl_SASManager, as );
					}
					//
					// we are not session owner, we can onlybe removed from assid
					//
					else
					{
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
						err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					
						err = SASSessionRemUserSession( as, loggedSession );
					}
					
					if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
					{
						loggedSession->us_InUseCounter--;
						FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
					}
				
					if( err == 0 )
					{
						int size = sprintf( buffer, "{\"SASID\":\"%lu\"}", asval );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS unregister", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		
		if( assid != NULL )
		{
			FFree( assid );
		}	
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/accept</H2>Accept invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required if authid is not provided) shared session id
	* @param authid - (required if sasid is not provided) application authentication id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "accept" ) == 0 )
	{
		char *authid = NULL;
		char *assid = NULL;
		FBOOL force = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		DEBUG("[SASWebRequest] accept\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "authid" );
		if( el != NULL )
		{
			authid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "force" );
		if( el != NULL )
		{
			if( el->hme_Data != NULL && (strcmp( el->hme_Data, "true" ) == 0 ) )
			{
				force = TRUE;
			}
		}
		
		// Comes in without required authid or assid!
		if( authid == NULL || assid == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "authid, sasid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			
			FERROR("authid or sasid is missing!\n");
		}
		// We've got what we need! Continue
		else
		{
			char *end = NULL;
			FUQUAD asval = strtoull( assid, &end, 0 );
			char buffer[ 1024 ];
			
			// Try to fetch assid session from session list!
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				int error = 1;
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
				
				DEBUG("App session type: %d\n", as->sas_Type );
				// if session is open, we can add new users to list without asking for permission
				if( as->sas_Type == SAS_TYPE_OPEN )
				{
					SASUList *entry;
					DEBUG("[SASWebRequest] I will try to add session\n");
					
					if( ( entry = SASSessionAddCurrentUserSession( as, loggedSession) ) != NULL )
					{
						char tmpmsg[ 255 ];
						// just accept connection
						entry->status = SASID_US_ACCEPTED;

						DEBUG("[SASWebRequest] ASN set %s pointer %p\n", entry->authid, entry );
						strcpy( entry->authid, authid );
						
						as->sas_UserNumber++;
						
						int msgsize = 0;
						
						DEBUG("[SASWebRequest] loggedSession->us_User : %p\n", loggedSession->us_User );
						if( loggedSession->us_User == NULL )
						{
							snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", "unknown" );
						}
						else
						{
							snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						}
						
						int err = SASSessionSendMessage( as, loggedSession, tmpmsg, msgsize, NULL );
						//int err = AppSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
						if( err != 0 )
						{
						
						}
						error = 0;
					}
					DEBUG("[SASWebRequest] looks like app session was not created\n");
				}
				else
				{
					SASUList *li = as->sas_UserSessionList;
		
					// Find invitee user with authid from user list in allowed users
					while( li != NULL )
					{
						DEBUG("[SASWebRequest] Setting %s userfromlist %s userlogged %s  currauthid %s   entryptr %p\n", authid, li->usersession->us_User->u_Name, loggedSession->us_User->u_Name, li->authid, li );
					
						DEBUG("[SASWebRequest] sessionfrom list %p loggeduser session %p\n",  li->usersession, loggedSession );
						if( li->usersession == loggedSession )
						{
							if( li->authid[ 0 ] != 0 )
							{
								FERROR("AUTHID IS NOT EMPTY %s!!!\n", li->authid );
							}
						
							if( li->status == SASID_US_INVITED )
							{
								li->status = SASID_US_ACCEPTED;
							}
						
							DEBUG("[SASWebRequest] ASN set %s pointer %p\n", li->authid, li );
							strcpy( li->authid, authid );
							DEBUG("[SASWebRequest] Setting authid %s user %s\n", authid, li->usersession->us_User->u_Name );
						
							as->sas_UserNumber++;
						
							char tmpmsg[ 255 ];
							int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						
							int err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
							if( err != 0 )
							{
							
							}
							error = 0;
							break;
						}
						li = ( SASUList * )li->node.mln_Succ;
					}
				}
			
				if( error == 0 )
				{
					int size = 0;
					
					if( as->sas_UserSessionList->usersession != NULL )
					{
						size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", as->sas_UserSessionList->usersession->us_User->u_Name );
					}
					else
					{
						size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", "empty" );
					}
					HttpAddTextContent( response, buffer );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
			}
			else if( force == TRUE )	// if session do not exist and system is forced to create new SAS
			{
				SASSession *as = SASSessionNew( l, authid, 0, loggedSession );
				if( as != NULL )
				{
					as->sas_Type = SAS_TYPE_OPEN;	// we can only create open sessions
					int err = SASManagerAddSession( l->sl_SASManager, as );
					if( err == 0 )
					{
						int size = sprintf( buffer, "{ \"SASID\":\"%lu\",\"type\":%d }", as->sas_SASID, as->sas_Type );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS register", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_CREATE_SAS], DICT_CANNOT_CREATE_SAS );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
			else	// session not found and system is not forced to create it
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
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
	
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* @ingroup WebCalls
	* 
	* <HR><H2>system.library/sas/decline</H2>Decline invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "decline" ) == 0 )
	{
		char *assid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[SASWebRequest] Decline\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  NULL;
		
		el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		// Comes in without required authid or assid!
		if( assid == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			
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
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
				
				// Find invitee user with authid from user list in allowed users
				SASUList *li = SASSessionGetListEntryBySession( as, loggedSession );
				int error = 1;
				
				if( li != NULL )
				{
					char tmpmsg[ 255 ];
					int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-decline\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
					DEBUG("[SASWebRequest] Session found and will be removed\n");
					int err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					if( err != 0 )
					{
						
					}
					
					 err = SASSessionRemUserSession( as, loggedSession );
					 error = 0;
				}
				
				if( error == 0 )
				{
					int size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", as->sas_UserSessionList->usersession->us_User->u_Name );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}

		if( assid != NULL )
		{
			FFree( assid );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/share</H2>Share your Application Shared Session with other users
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to invite to Shared Application Session. Function expect user names separated by comma
	* @param message - information which we want to send invited people

	* @return {response:success,identity:<user name>}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "share" ) == 0 )
	{
		char *assid = NULL;
		char *userlist = NULL;
		char *msg = NULL;
		char *sessid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		SASSession *as = NULL;
		char applicationName[ 1024 ];
		applicationName[ 0 ] = 0;
		
		if( assid != NULL )
		{
			char *end;
			FUQUAD asval = strtoul( assid,  &end, 0 );
			DEBUG("[SASWebRequest] ASSID %s endptr-startp %d\n", assid, (int)(end-assid) );
			
			as = SASManagerGetSession( l->sl_SASManager, asval );
		}
		
		SQLLibrary *sqllib  = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			//
			// we must get application name to send it with invitation
			//

			char q[ 1024 ];
			if( as != NULL )
			{
				sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT `Name` FROM `FUserApplication` ua, `FApplication` a  WHERE ua.AuthID=\"%s\" and ua.ApplicationID = a.ID LIMIT 1",( char *)as->sas_AuthID );

				void *res = sqllib->Query( sqllib, q );
				if( res != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						strcpy( applicationName, row[ 0 ] );
					}
					sqllib->FreeResult( sqllib, res );
				}
			}
			l->LibrarySQLDrop( l, sqllib );
		}
		
		if( as == NULL  )
		{
			char dictmsgbuf[ 256 ];
			if( assid == NULL )
			{
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			}
			else
			{
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
			}
			HttpAddTextContent( response, dictmsgbuf );
			return response;
		}
		
		// Register invite message so we can send it to users
		el =  HashmapGet( request->http_ParsedPostContent, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		// Get sessionid
		
		el = HashmapGet( request->http_ParsedPostContent, "sessid" );
		if( el != NULL )
		{
			sessid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		// Get list of usernames
		el = HashmapGet( request->http_ParsedPostContent, "users" );
		if( el != NULL )
		{
			userlist = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( userlist != NULL || sessid != NULL )
		{
			DEBUG("[SASWebRequest] share: %s  as %p msg %s\n", userlist, as, msg );
			
			if( as != NULL && msg != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
					
				if( userlist != NULL )
				{
					char *resp = SASSessionAddUsersByName( as, loggedSession, userlist, applicationName, msg  );
					if( resp != NULL )
					{
						HttpAddTextContent( response, resp );
					
						FFree( resp );
					}
					else
					{
						HttpAddTextContent( response, "{\"invited\":[\"\"]}" );
					}
				}
				else if( sessid != NULL )
				{
					if( SASSessionAddUsersBySession( as, loggedSession, sessid, applicationName, msg  ) != NULL )
					{
						char tmp[ 512 ];
						snprintf( tmp, sizeof(tmp), "{\"invited\":[\"%s\"]}", sessid );
						HttpAddTextContent( response, tmp );
					}
					else
					{
						HttpAddTextContent( response, "{\"invited\":[\"\"]}" );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_ADD_USERS] , DICT_CANNOT_ADD_USERS );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "users" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("users parameter is missing!\n");
		}
		
		if( sessid != NULL )
		{
			FFree( sessid );
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/unshare</H2>Unshare your Application Shared Session. Terminate
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to remove from Shared Application Session. Function expect user names separated by comma

	* @return list of users removed from SAS
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "unshare" ) == 0 )
	{
		char *assid = NULL;
		char *userlist = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "users" );
		if( el != NULL )
		{
			userlist = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( assid != NULL && userlist != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			DEBUG("[SASWebRequest] UserList passed '%s' as ptr %p\n", userlist, as );
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter++;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
			
			BufString *bs = SASSessionRemUserByNames( as, loggedSession, userlist );
			if( bs != NULL )
			{
				HttpAddTextContent( response, bs->bs_Buffer );
			
				BufStringDelete( bs );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_REMOVE_USERS] , DICT_CANNOT_REMOVE_USERS );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, users" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );

			FERROR("sasid or users is missing!\n");
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
		
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/send</H2>Send message to other users (not owner of sas)
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param usernames - users to which we want to send message. Function expect user names separated by comma
	* @param msg - (required) message which we want to send to users

	* @return {response:success}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "send" ) == 0 )
	{
		char *assid = NULL;
		char *msg = NULL;
		char *usernames = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[SASWebRequest] sas/send (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el = HashmapGet( request->http_ParsedPostContent, "msg" );
		if( el != NULL ) msg = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el = HashmapGet( request->http_ParsedPostContent, "usernames" );
		if( el != NULL ) usernames = UrlDecodeToMem( ( char *)el->hme_Data );
		
		char buffer[ 1024 ];
		
		if( assid != NULL && msg != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( as != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
				
				int err = 0;
				if( as->sas_Type == SAS_TYPE_OPEN )
				{
					err = SASSessionSendMessage( as, loggedSession, msg, strlen( msg ), NULL );
				}
				else
				{
					err = SASSessionSendMessage( as, loggedSession, msg, strlen( msg ), usernames );
				}
				if( err > 0 )
				{
					int size = sprintf( buffer, "{\"response\":\"success\"}" );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_SEND_MSG_ERR], err );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_CANNOT_SEND_MSG_ERR );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( as->sas_Obsolete == TRUE )
				{
					int err = SASManagerRemSession( l->sl_SASManager, as );
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, msg" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
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
		
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/sendowner</H2>Send message to SAS owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param msg - (required) message which we will be send

	* @return {response:success}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "sendowner" ) == 0 )
	{
		char *assid = NULL;
		char *msg = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		FERROR("sas/sendowner called\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el =  HashmapGet( request->http_ParsedPostContent, "msg" );
		if( el != NULL ) msg = UrlDecodeToMem( ( char *)el->hme_Data );
		
		char buffer[ 1024 ];
		
		FERROR("sasid %s message %s\n",  assid, msg );
		
		if( assid != NULL && msg != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter++;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
			
			FERROR("AS %p  asval %lu\n", as, asval );
			if( as != NULL )
			{
				int err = 0;
				// when SAS is open, there is no need to send message to owner
				if( as->sas_Type == SAS_TYPE_OPEN )
				{
					err = SASSessionSendMessage( as, loggedSession, msg, strlen( msg ), NULL );
				}
				else
				{
					err = SASSessionSendOwnerMessage( as, loggedSession, msg, strlen(msg) );
				}
				
				FERROR("Messages sent %d\n", err );
				if( err > 0 )
				{
					int size = sprintf( buffer, "{\"response\":\"success\"}" );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_SEND_MSG_ERR], err );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_CANNOT_SEND_MSG_ERR );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( as->sas_Obsolete == TRUE )
				{
					int err = SASManagerRemSession( l->sl_SASManager, as );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, msg" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/takeover</H2>Take over other user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param username - (required) user name which will take over of SAS
	* @param deviceid - (required) deviceid of user device which will take over SAS

	* @return {response:success}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "takeover" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[ApplicationWebRequest] Takeover\n");
		
		char *assid = NULL;
		char *devid = NULL;
		char *username = NULL;
		char buffer[ 1024 ];
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el =  HashmapGet( request->http_ParsedPostContent, "deviceid" );
		if( el != NULL ) devid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el =  HashmapGet( request->http_ParsedPostContent, "username" );
		if( el != NULL ) username = UrlDecodeToMem( ( char *)el->hme_Data );
		
		if( assid != NULL && devid != NULL && username != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter++;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
			
			FERROR("AS %p  asval %lu\n", as, asval );
			if( as != NULL )
			{
				// finding our current session on list
				
				if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
				{
					SASUList *srcli = as->sas_UserSessionList;
					while( srcli != NULL )
					{
						if( srcli->usersession == loggedSession )
						{
							break;
						}
						srcli = (SASUList *) srcli->node.mln_Succ;
					}
				
					// finding session to which we want migrate
				
					SASUList *dstli = as->sas_UserSessionList;
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

						char tmp[ 1024 ];
						//int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%llu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"client-decline\",\"data\":\"%s\"}\"}}}}}", le->authid, as->as_ASSID, loggedSession->us_User->u_Name, assid, tmpses->us_User->u_Name );
						//int msgsndsize += WebSocketSendMessageInt( le->usersession, tmp, len );
					
						strcpy( dstli->authid, tmpauthid );
						dstli->usersession = tmpses;
						dstli->status = tmpstatus;
					
						int size = sprintf( buffer, "{\"response\":\"success\"}" );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_USERSESSION_IN_SAS] , DICT_NO_USERSESSION_IN_SAS );
						HttpAddTextContent( response, dictmsgbuf );
					}
					FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, deviceid, username" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
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
		
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/switchsession</H2>Switch user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param deviceid - (required) deviceid of user device to which user want to switch in SAS

	* @return {response:success}, when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "switchsession" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[SASWebRequest] switchsession\n");
		
		char *assid = NULL;
		char *devid = NULL;
		char buffer[ 1024 ];
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el =  HashmapGet( request->http_ParsedPostContent, "deviceid" );
		if( el != NULL ) devid = UrlDecodeToMem( ( char *)el->hme_Data );
		
		if( assid != NULL && devid != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter++;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
			
			FERROR("AS %p  asval %lu\n", as, asval );
			if( as != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
				{
					// finding our current session on list
				
					SASUList *srcli = as->sas_UserSessionList;
					while( srcli != NULL )
					{
						if( srcli->usersession == loggedSession )
						{
							break;
						}
						srcli = (SASUList *) srcli->node.mln_Succ;
					}
				
					// finding session to which we want migrate
				
					SASUList *dstli = as->sas_UserSessionList;
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
						DEBUG("[SASWebRequest] Switching sessions\n");
					
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
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_USERSESSION_IN_SAS] , DICT_NO_USERSESSION_IN_SAS );
						HttpAddTextContent( response, dictmsgbuf );
					}
					FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, deviceid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/putvar</H2>Put variable into Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param var - (required) variable which will be stored in SAS
	* @param varid - variable ID, if not provided new will be created. Otherwise updated
	* @param mode - set to "private" if you want to have private variable. Otherwise it will be public
	* @return {VariableNumber:<number>}, when number > 0 then variable was created/updated. Otherwise error number will be returned
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "putvar" ) == 0 )
	{
		char *assid = NULL;
		char *varid = NULL;
		char *var = NULL;
		FBOOL priv = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[SASWebRequest] sas/putvar (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = ( char *)el->hme_Data;
		
		el = HashmapGet( request->http_ParsedPostContent, "var" );
		if( el != NULL ) var = UrlDecodeToMem( ( char *)el->hme_Data );
		
		el = HashmapGet( request->http_ParsedPostContent, "varid" );
		if( el != NULL ) varid = ( char *)el->hme_Data;
		
		el = HashmapGet( request->http_ParsedPostContent, "mode" );
		if( el != NULL )
		{
			if( el->hme_Data != NULL )
			{
				if( strcmp( (char *)el->hme_Data, "private" ) == 0 )
				{
					priv = TRUE;
				}
			}
		}
		
		char buffer[ 1024 ];
		
		if( assid != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( as != NULL )
			{
				INVAREntry *le = NULL;
				
				// trying to find existing variable, because ID was passed
				
				FRIEND_MUTEX_LOCK( &as->sas_VariablesMut );
				if( varid != NULL )
				{
					FULONG varidlong = strtoull( varid,  &end, 0 );
			
					le = as->sas_Variables;
					while( le != NULL )
					{
						if( le->ne_ID == varidlong )
						{
							break;
						}
						le = (INVAREntry *) le->node.mln_Succ;
					}
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
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
						DEBUG("[SASWebRequest] Old entry changed\n");
						if( le->ne_Data != NULL )
						{
							FFree( le->ne_Data );
						}
						le->ne_Data = var;
					}
				}
				else
				{
					INVAREntry *ne = INVAREntryNew( as->sas_VariablesNumGenerator++, NULL, NULL );
					if( ne != NULL )
					{
						DEBUG("[SASWebRequest] New entry added\n");
						ne->ne_Data = var;
						le = ne;
						
						if( priv == TRUE )
						{
							le->ne_SpecialData = loggedSession->us_User;
						}
						
						le->node.mln_Succ = (MinNode *) as->sas_Variables;
						as->sas_Variables = le;
					}
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
				
				FRIEND_MUTEX_UNLOCK( &as->sas_VariablesMut );
				
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
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, varid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/sas/getvar</H2>Get variable from Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param varid - variable ID from which data will be taken
	* @return {VariableData:<data>} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "getvar" ) == 0 )
	{
		char *assid = NULL;
		char *varid = NULL;
		char *var = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		DEBUG("[SASWebRequest] sas/send (sending to invitees) called, and \"%s\" is calling it\n", loggedSession->us_User->u_Name );
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL ) assid = ( char *)el->hme_Data;
		
		el = HashmapGet( request->http_ParsedPostContent, "varid" );
		if( el != NULL ) varid = ( char *)el->hme_Data;
		
		char buffer[ 1024 ];
		
		if( assid != NULL && varid != NULL )
		{
			char *end;
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter++;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
			
			if( as != NULL )
			{
				INVAREntry *le = NULL;
				
				// trying to find existing variable, because ID was passed
				
				if( FRIEND_MUTEX_LOCK( &as->sas_VariablesMut ) == 0 )
				{
					if( varid != NULL )
					{
						FULONG varidlong = strtoull( varid,  &end, 0 );
			
						le = as->sas_Variables;
						while( le != NULL )
						{
							if( le->ne_ID == varidlong )
							{
								break;
							}
							le = (INVAREntry *) le->node.mln_Succ;
						}
					}
					FRIEND_MUTEX_UNLOCK( &as->sas_VariablesMut );
				}
				
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
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO_VARIABLE] , DICT_NO_ACCESS_TO_VARIABLE );
						HttpAddTextContent( response, dictmsgbuf );
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
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
			
			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
			{
				loggedSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid, varid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		return response;
	}

	DEBUG("[SASWebRequest] FriendCore returned %s\n", response->http_Content );

	return response;
}
