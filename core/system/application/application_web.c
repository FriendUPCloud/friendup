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
 *  Application Web
 *
 * handle all commands regarding applications, application sessions
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
Http* ApplicationWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedSession )
{
	Log( FLOG_DEBUG, "[ApplicationWebRequest] %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );

	Http* response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/app/help</H2>add new FCConnection
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
			register - register application in db \
			install - install application for user \
			remove - remove application \
			" );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/app/list</H2>return all application names avaiable on the server
	*
	* @param sessionid - (required) session id of logged user
	* 
	* @return return application avaiable on the server in JSON format
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "list" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		BufString *bs = BufStringNew();
		if( bs != NULL )
		{
			int pos = 0;
			Application *al = l->sl_apps;
			
			DEBUG("[ApplicationWebRequest] Application LIST\n");
			
			BufStringAdd( bs, "{\"Application\":[" );
			
			while( al != NULL )
			{
				if( pos > 0 )
				{
					BufStringAdd( bs, ", " );
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
			
			BufStringAdd( bs, "]}" );
			
			HttpAddTextContent( response, bs->bs_Buffer );
			
			BufStringDelete( bs );
		}
		else
		{
			FERROR("[ApplicationWebRequest] Cannot allocate memory for BufferString\n");
		}
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/install</H2>Install application
	*
	* @param sessionid - (required) session id of logged user
	* @param url - (required ) url to application which will be installed
	* @return Function not finished
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 0 ], "install" ) == 0 )
	{
		char *url = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "url" );
		if( el != NULL )
		{
			url = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( url != NULL )
		{
			
		}

		if( url != NULL )
		{
			FFree( url );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/register</H2>Register Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param userid - user id which registered app. By default current user id is used
	* @param appid - (required) application id which session will be created
	* @param permissions - (required) application permissions
	* @param data - additional session data

	* @return { "response":"success" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "register" ) == 0 )
	{
		char *qauthid = NULL;
		char *permissions = NULL;
		char *data = NULL;
		FULONG userID = 0;
		FULONG appID = 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "appid" );
		if( el != NULL )
		{
			char *end;
			appID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "permissions" );
		if( el != NULL )
		{
			permissions = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "data" );
		if( el != NULL )
		{
			data = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( userID == 0 )
		{
			userID = loggedSession->us_UserID;
		}
		
		DEBUG("[/app/register] Create!\n");
		
		
		if( appID > 0 && permissions != NULL )
		{
			char tmp[ 1024 ];
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib != NULL )
			{
				if( data == NULL )
				{
					data = FCalloc( 2, sizeof(char) );
					if( data != NULL )
					{
						data[ 0 ] = ' ';
					}
				}
				
				DEBUG("[/app/register] SQL lib found!\n");
				UserApplication *fuapp = UserAppNew( userID, appID, loggedSession->us_ID, permissions );
				if( fuapp != NULL )
				{
					fuapp->ua_Data = StringDuplicate( data );
					
					DEBUG("[/app/register] Save entry!\n");
					int err = sqllib->Save( sqllib, UserApplicationDesc, fuapp );
					if( err == 0 )
					{
						snprintf( tmp, sizeof(tmp), "{\"result\":\"success\",\"id\":%lu,\"authid\":\"%s\"}", fuapp->ua_ID, fuapp->ua_AuthID );
					}
					UserAppDelete( fuapp );
				}
				else
				{
					strcpy( tmp, "{\"response\":\"fail\"}" );
				}
				
				DEBUG("[/app/register] reponse: %s\n", tmp );
				
				HttpAddTextContent( response, tmp );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "appid, permissions" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );

			FERROR("[ApplicationWebRequest] sasid or users is missing!\n");
		}
		
		if( qauthid != NULL )
		{
			FFree( qauthid );
		}
		if( permissions != NULL )
		{
			FFree( permissions );
		}
		if( data != NULL )
		{
			FFree( data );
		}
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/unregister</H2>Remove Application Session by authid
	*
	* @param sessionid - (required) session id of logged user
	* @param pauthid - (required ) authentication id which will be removed

	* @return { "response":"success" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "unregister" ) == 0 )
	{
		char *qauthid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "pauthid" );
		if( el != NULL )
		{
			qauthid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( qauthid != NULL )
		{
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib != NULL )
			{
				char q[ 1024 ];
				sqllib->SNPrintF( sqllib, q, sizeof(q), "DELETE FROM `FUserApplication` WHERE AuthID='%s'", qauthid );

				sqllib->QueryWithoutResults( sqllib, q );
			
				l->LibrarySQLDrop( l, sqllib );
				
				int size = sprintf( q, "{\"response\":\"success\"}" );
				HttpAddTextContent( response, q );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "qauthid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );

			FERROR("[ApplicationWebRequest] sasid or users is missing!\n");
		}
		
		if( qauthid != NULL )
		{
			FFree( qauthid );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/authidgen</H2>Create authentication id token
	*
	* @param sessionid - (required) session id of logged user
	* @param appname - (required ) application name
	* @param userid - user id

	* @return { "response":"success", "authid":"<XYZ>" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "authidgen" ) == 0 )
	{
		char *appname = NULL;
		FQUAD uid= 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "appname" );
		if( el != NULL )
		{
			appname = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			uid = strtoull( (( char *)el->hme_Data), &end, 0 );
		}
		
		if( appname != NULL )
		{
			if( loggedSession->us_User->u_IsAdmin )
			{
				if( uid == 0 )
				{
					uid = loggedSession->us_UserID;
				}
			}
			else
			{
				uid = loggedSession->us_UserID;
			}
			
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			
			if( sqllib != NULL )
			{
				FQUAD appID = 0;
				char query[ 1024 ];
				char respMsg[ 1024 ];
				int err = 0;
				
				// we must get application id from database
				
				sqllib->SNPrintF( sqllib, query, sizeof(query), "SELECT * FROM `FApplication` a inner join `FUserApplication` ua on a.ID=ua.ApplicationID WHERE a.Name='%s' AND ua.UserID=%ld LIMIT 1", appname, uid );
		
				void *result = sqllib->Query( sqllib, query );
				if( result != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, result ) ) )
					{
						char *end;
						appID = strtoull( row[ 0 ], &end, 0 );
					}
					sqllib->FreeResult( sqllib, result );
				}
			
				// now its time to generate hash
			
				if( appID > 0 )
				{
					AppSession *las = AppSessionNew( l, appID, uid, NULL );
					if( las != NULL )
					{
						err = sqllib->Save( sqllib, AppSessionDesc, las );
						if( err == 0 )
						{
							snprintf( respMsg, sizeof(respMsg), "{\"result\":\"success\",\"id\":%lu,\"authid\":\"%s\"}", las->as_ID, las->as_AuthID );
						
							AppSessionManagerAppSessionAdd( l->sl_AppSessionManager, las );
						}
						else
						{
							snprintf( respMsg, sizeof(respMsg), "{\"result\":\"fail\",\"error\":%d,\"msg\":\"%s\"}", (int)1, "Cannot store authid in DB" );
							
							AppSessionDelete( las );
						}
					}
					l->LibrarySQLDrop( l, sqllib );

					HttpAddTextContent( response, respMsg );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_APPLICATION_NOT_FOUND], appname );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_APPLICATION_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
			}
			FFree( appname );
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "appname" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/authidrenew</H2>Recreate authentication id token
	*
	* @param sessionid - (required) session id of logged user
	* @param appname - (required) application name
	* @param oldid - (required) previous authid

	* @return { "response":"success", "authid":"<XYZ>" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "authidrenew" ) == 0 )
	{
		char *appname = NULL;
		char *oldid = NULL;
		FQUAD uid= 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "appname" );
		if( el != NULL )
		{
			appname = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "oldid" );
		if( el != NULL )
		{
			oldid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( appname != NULL && oldid != NULL )
		{
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			
			if( sqllib != NULL )
			{
				FQUAD asID = 0;
				FQUAD appID = 0;
				char query[ 1024 ];
				char respMsg[ 1024 ];
				int err = 0;
				
				// we must get application id from database
				
				sqllib->SNPrintF( sqllib, query, sizeof(query), "SELECT ass.ID, a.ID FROM `FApplication` a inner join `FUserApplication` ua on a.ID=ua.ApplicationID inner join `FAppSession` ass on ua.ID=ass.UserApplicationID WHERE a.Name='%s' AND ass.AuthID='%s' LIMIT 1", appname, oldid );
		
				void *result = sqllib->Query( sqllib, query );
				if( result != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, result ) ) )	// getting AppSession ID
					{
						char *end;
						asID = strtoull( row[ 0 ], &end, 0 );
					}
					if( ( row = sqllib->FetchRow( sqllib, result ) ) )	// getting App ID
					{
						char *end;
						appID = strtoull( row[ 1 ], &end, 0 );
					}
					sqllib->FreeResult( sqllib, result );
				}
			
				// entry found so we have to update it
			
				if( asID > 0 )
				{
					AppSession *locas = AppSessionManagerGetSessionByAuthID( l->sl_AppSessionManager, oldid );
					if( locas != NULL )
					{
						AppSessionRegenerateAuthID( locas, l );
						
#ifdef DB_SESSIONID_HASH
						sqllib->SNPrintF( sqllib, query, sizeof(query), "UPDATE `FAppSession` Set AuthID='%s' where ID=%ld", locas->as_HashedAuthID, asID );
#else
						sqllib->SNPrintF( sqllib, query, sizeof(query), "UPDATE `FAppSession` Set AuthID='%s' where ID=%ld", locas->as_AuthID, asID );
#endif
						sqllib->QueryWithoutResults( sqllib, query );	// update database
						
						snprintf( respMsg, sizeof(respMsg), "{\"result\":\"success\",\"id\":%lu,\"authid\":\"%s\"}", locas->as_ID, locas->as_AuthID );
						HttpAddTextContent( response, respMsg );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_APPLICATION_SESSION_NOT_FOUND] , DICT_APPLICATION_SESSION_NOT_FOUND );
					}
				}
				else	// entry not found, will be generated
				{
					AppSession *las = AppSessionNew( l, appID, uid, NULL );
					if( las != NULL )
					{
						err = sqllib->Save( sqllib, AppSessionDesc, las );
						if( err == 0 )
						{
							snprintf( respMsg, sizeof(respMsg), "{\"result\":\"success\",\"id\":%lu,\"authid\":\"%s\"}", las->as_ID, las->as_AuthID );
						
							AppSessionManagerAppSessionAdd( l->sl_AppSessionManager, las );
						}
						else
						{
							AppSessionDelete( las );
						}
					}
					HttpAddTextContent( response, respMsg );
				}
				
				l->LibrarySQLDrop( l, sqllib );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "appname, oldid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
		
		if( appname != NULL )
		{
			FFree( appname );
		}
		if( oldid != NULL )
		{
			FFree( oldid );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/app/authidremove</H2>Remove authentication id token
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) authid of entry which will be removed
	* @param userid - if passed then session will be checked for this user

	* @return { "response":"success" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "authidremove" ) == 0 )
	{
		char *authid = NULL;
		FULONG uid = 0;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "id" );
		if( el != NULL )
		{
			authid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			uid = strtoull( (( char *)el->hme_Data), &end, 0 );
		}
		
		if( authid != NULL )
		{
			char respMsg[ 1024 ];
			User *usr = NULL;
			
			// we must get application id from database
			AppSession *ses = AppSessionManagerGetSessionByAuthID( l->sl_AppSessionManager, authid );
			if( ses != NULL )
			{
				if( loggedSession->us_User->u_IsAdmin )
				{
					if( uid == 0 )
					{
						usr = loggedSession->us_User;
					}
					else
					{
						usr = UMGetUserByID( l->sl_UM, uid );
					}
				}
				else
				{
					usr = loggedSession->us_User;
				}
				
				UserRemoveAppSession( usr, ses );
				AppSessionManagerAppSessionRemoveByAuthID( l->sl_AppSessionManager, authid );
			}

			snprintf( respMsg, sizeof(respMsg), "{\"result\":\"success\"}" );

			HttpAddTextContent( response, respMsg );

			FFree( authid );
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "appname" );
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
	DEBUG("[ApplicationWebRequest] FriendCore returned %s\n", response->http_Content );

	return response;
}
