
const SASList = require('./List.js');

class SASManager
{
    constructor( dbcon ) 
    {
        this.globalID = 0;
        this.sasList = SASList( null );
        this.dbcon = dbcon
    }
/**
	*
	* <HR><H2>system.library/app/register</H2>Register new Application Shared Session
	*
	* @param con - (required) websocket connection
	* @param sessionid - (required) session id of logged user
	* @param authid - (required) authentication id (provided by application)
	* @param type - type of application session 'close'(default), 'open' for everyone
	* @param sasid - if passed then it will be used to join already created SAS

	* @return { SASID: <number> } when success, otherwise response with error code
    */
    
   register( con, sessionid, authid, type, sasid )
   {
       this.globalID++;
       var id = this.globalID;

       let selectQuery = 'SELECT * FROM ?? WHERE ?? = ?';    
       let query = mysql.format(selectQuery,["FUserSession","sessionid", sessionid ] );
       // query = SELECT * FROM `todo` where `user` = 'shahid'
	 /*  
	   this.dbcon.query( query, (err, data) => 
       {
           if( err )
           {
               console.error(err);
           }
           // rows fetch
           console.log(data);
	   });
	   */
		var handle = mysql.querySync(query) ;
		var results = handle.fetchAllSync() ;

		console.log(JSON.stringify(results)) ;

       var nobj = new SAS( con, id, type );	// create SAS

       this.sasList.add( nobj );	// add websocket connection to list

       return "{'SASID':" + id + "}";   // 0 = error
   }

   /**
   *
   * <HR><H2>system.library/app/unregister</H2>Unregister Application Shared Session
   *
   * @param sessionid - (required) session id of logged user
   * @param sasid - (required) shared session id which will be removed

   * @return {SASID:<number>} when success, otherwise error code
   */
   
   unregister( sessionid, sasid )
   {
	   sas = this.sasList.getElementByID( sasid );
	   if( sas != null )
	   {

	   }
	   else
	   {
		return "{'error':'not found'}";
	   }
   }

   /**
	*
	* <HR><H2>system.library/app/accept</H2>Accept invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required if authid is not provided) shared session id
	* @param authid - (required if sasid is not provided) application authentication id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    

	accept( sessionid, sasid, authid )
	{

	}

	/*
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
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid, &end, 0 );
			char buffer[ 1024 ];
			
			// Try to fetch assid session from session list!
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				int error = 1;
				
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
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
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
						int size = sprintf( buffer, "{ \"SASID\": \"%lu\",\"type\":%d }", as->sas_SASID, as->sas_Type );
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
	*/


    /**
	* @ingroup WebCalls
	* 
	* <HR><H2>system.library/app/decline</H2>Decline invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    

	/*
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
	*/


    /**
	* 
	* <HR><H2>system.library/app/share</H2>Share your Application Shared Session with other users
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to invite to Shared Application Session. Function expect user names separated by comma
	* @param message - information which we want to send invited people

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    



    /**
	* 
	* <HR><H2>system.library/app/unshare</H2>Unshare your Application Shared Session. Terminate
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to remove from Shared Application Session. Function expect user names separated by comma

	* @return list of users removed from SAS
    */
    




    /**
	* 
	* <HR><H2>system.library/app/send</H2>Send message to other users (not owner of sas)
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param usernames - users to which we want to send message. Function expect user names separated by comma
	* @param msg - (required) message which we want to send to users

	* @return {response:success}, when success, otherwise error code
	*/






    /**
	* 
	* <HR><H2>system.library/app/sendowner</H2>Send message to SAS owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param msg - (required) message which we will be send

	* @return {response:success}, when success, otherwise error code
    */
    









    /**
	* 
	* <HR><H2>system.library/app/takeover</H2>Take over other user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param username - (required) user name which will take over of SAS
	* @param deviceid - (required) deviceid of user device which will take over SAS

	* @return {response:success}, when success, otherwise error code
    */
    




    /**
	* 
	* <HR><H2>system.library/app/switchsession</H2>Switch user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param deviceid - (required) deviceid of user device to which user want to switch in SAS

	* @return {response:success}, when success, otherwise error code
    */
    





    /**
	* 
	* <HR><H2>system.library/app/putvar</H2>Put variable into Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param var - (required) variable which will be stored in SAS
	* @param varid - variable ID, if not provided new will be created. Otherwise updated
	* @param mode - set to "private" if you want to have private variable. Otherwise it will be public
	* @return {VariableNumber:<number>}, when number > 0 then variable was created/updated. Otherwise error number will be returned
    */
    







    /**
	* 
	* <HR><H2>system.library/app/getvar</H2>Get variable from Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param varid - variable ID from which data will be taken
	* @return {VariableData:<data>} when success, otherwise error with code
	*/

}
