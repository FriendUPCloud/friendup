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
 *  Role Manager
 *
 * file contain definitions related to RoleManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2019
 */

#include "mitra_manager.h"
#include <system/systembase.h>

/*

 */

/**
 * Create RoleManager
 *
 * @param sb pointer to SystemBase
 * @return RoleManager structure
 */
MitraManager *MitraManagerNew( void *sb )
{
	MitraManager *mm;
	
	//SELECT fu.ID,fu.Name FROM FUser fu,FUserToGroup futg WHERE fu.ID = futg.UserID AND futg.UserGroupID IN (SELECT ID FROM FUserGroup WHERE `Name`="User" AND `Type` = "SAML" ) AND futg.UserID = "'. mysqli_real_escape_string( $SqlDatabase->_link, $User->ID ) .'"
	
	//SELECT Data FROM FSetting s WHERE s.UserID = '-1' AND s.Type = 'mitra' AND s.Key = 'database';
	
	// getMitraUser
	// SELECT gu.user_id FROM guacamole_user gu WHERE gu.username = \'mitra_'. mysqli_real_escape_string( $mitradb->_link, $friendusername ) .'\' OR gu.username = \'mitra_frienduser_'. intval( $frienduserid ) .'\''
	//
	//$checkquery = 'SELECT * FROM guacamole_connection_parameter gcp WHERE gcp.connection_id IN ( ' .
	//                                                                    'SELECT connection_id FROM guacamole_connection_permission WHERE entity_id IN ( ' .
	//                                                                    '       SELECT entity_id FROM guacamole_user WHERE user_id = \''. getMitraUser( $User->ID,$User->Name,false ) .'\' '.
	//                                                                    ') AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\')';

	
	//                                                                    'SELECT connection_id FROM guacamole_connection_permission WHERE entity_id IN ( ' .
	//                                                                    '       SELECT entity_id FROM guacamole_user WHERE user_id='SELECT gu.user_id FROM guacamole_user gu WHERE gu.username = 'mitra_%s' OR gu.username='mitra_frienduser_%s'' '.
	//                                                                    ') AND connection_id = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->data->connection ) . '\')'
	
	if( ( mm = FCalloc( 1, sizeof( MitraManager ) ) ) != NULL )
	{
		// read windows host from cfg.jsmn_init
		Props *prop = NULL;
		PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);

		char *ptr, path[ 1024 ];
		path[ 0 ] = 0;
	
		ptr = getenv("FRIEND_HOME");
	
		if( ptr != NULL )
		{
			sprintf( path, "%scfg/cfg.ini", ptr );
		}
	
		prop = plib->Open( path );
		if( prop != NULL)
		{
			mm->mm_WindowsHost = StringDuplicate( plib->ReadStringNCS( prop, "windows:host", NULL ) );
			mm->mm_WindowsPort = plib->ReadIntNCS( prop, "windows:port", 5000 );
			mm->mm_ServiceLogin = StringDuplicate( plib->ReadStringNCS( prop, "windows:login", NULL ) );
			mm->mm_ServicePassword = StringDuplicate( plib->ReadStringNCS( prop, "windows:password", NULL ) );
			mm->mm_HostForClient = StringDuplicate( plib->ReadStringNCS( prop, "windows:hostforclient", NULL ) );
		
			plib->Close( prop );
		}
	
		// get guacamole database settings
		
		mm->mm_SB = sb;
		SystemBase *l = (SystemBase *)sb;
		
		SQLLibrary *sqllib = l->LibrarySQLGet( l );
	
		DEBUG("[MitraManagerNew] mount\n");
		
		// get information from database about guacamole server
	
		if( sqllib != NULL )
		{
			void *res = sqllib->Query( sqllib, "SELECT Data FROM FSetting s WHERE s.UserID='-1' AND s.Type='mitra' AND s.Key='database'" );
			char *host = NULL;
			char *dbname = NULL;
			char *login = NULL;
			char *pass = NULL;
			int port = 3306;

			// get fields from query
			if( res != NULL )
			{
				char **row;
				
				DEBUG("[MitraManagerNew] guacamole settings found!\n");
			
				while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
				{
					if( row[ 0 ] != NULL )
					{
						char *in = (char *)row[ 0 ];
						jsmn_parser p;
						jsmntok_t t[128]; // We expect no more than 128 tokens
					
						jsmn_init( &p );
						int r = jsmn_parse( &p, row[ 0 ] , strlen( row[ 0 ] ), t, 256 );

						// Assume the top-level element is an object 
						if( r > 1 && t[0].type == JSMN_OBJECT )
						{
							//{"host":"localhost","username":"guac","password":"IkkeHeltStabile2000","database":"guacamole"} 
						
							host = StringDuplicateN( in + t[ 2 ].start, (int)(t[ 2 ].end-t[ 2 ].start) );
							login = StringDuplicateN( in + t[ 4 ].start, (int)(t[ 4 ].end-t[ 4 ].start) );
							pass = StringDuplicateN( in + t[ 6 ].start, (int)(t[ 6 ].end-t[ 6 ].start) );
							dbname = StringDuplicateN( in + t[ 8 ].start, (int)(t[ 8 ].end-t[ 8 ].start) );
						}
					}
				}	// while
				DEBUG("[MitraManagerNew]After while. Login: %s host: %s pass: %s dbname: %s\n", login, host, pass, dbname );
				sqllib->FreeResult( sqllib, res );
			} // res != NULL
			
			l->LibrarySQLDrop( l, sqllib );
		
			int error;
		
			mm->mm_Sqllib = (struct SQLLibrary *)LibraryOpen( l, l->sl_DefaultDBLib, 0 );
			if( mm->mm_Sqllib != NULL )
			{
				DEBUG("[MitraManagerNew] setting up mysql connection\n");
				error = mm->mm_Sqllib->Connect( mm->mm_Sqllib, host, dbname, login, pass, port );
				if( error != 0 )
				{
					FERROR("[MitraManagerNew] There is a problem with guacamole DB connection\n");
					LibraryClose( mm->mm_Sqllib );
					mm->mm_Sqllib = NULL;
                    
					if( host != NULL )
					{
						FFree( host );
						host = NULL;
					}
					if( login != NULL )
					{
						FFree( login );
						login = NULL;
					}
					if( pass != NULL )
					{
						FFree( pass );
						pass = NULL;
					}
					if( dbname != NULL )
					{
						FFree( dbname );
						dbname = NULL;
					}
				}
				else
				{
					INFO("[MitraManagerNew] Connection with DB set\n");
				}
			}
		
			if( host != NULL )
			{
				FFree( host );
			}
			if( login != NULL )
			{
				FFree( login );
			}
			if( pass != NULL )
			{
				FFree( pass );
			}
			if( dbname != NULL )
			{
				FFree( dbname );
			}
		}	// res != NULL
	}
	
	MitraManagerCheckAndAddToken( mm, TRUE );
	
	// test
	// or domain WEBMED_POC
	
	/*
	char path[ 256 ];
	snprintf( path, sizeof(path), "Usb/Open?windowsUser=%s%%5C%s&password=%s", "webmed.poc", "friend1", "Abc123456" );

	int bufLen = 256;
	int errorCode;
	
	BufString *rsp = MitraManagerCall( mm, path, &errorCode );
	if( rsp != NULL )
	{
		DEBUG("REsponse from usbmount: %s\n", rsp->bs_Buffer );
	}
	DEBUG("ERROR code %d\n", errorCode );
	*/
	return mm;
}

/**
 * Delete MitraManager
 *
 * @param mmgr pointer to MitraManager structure which will be deleted
 */
void MitraManagerDelete( MitraManager *mmgr )
{
	DEBUG("[MitraManagerDelete] start\n");
	if( mmgr != NULL )
	{
		if( mmgr->mm_Sqllib != NULL )
		{
			//mmgr->mm_Sqllib->Disconnect( mmgr->mm_Sqllib );
			LibraryClose( mmgr->mm_Sqllib );
		}
		
		if( mmgr->mm_AuthToken != NULL )
		{
			FFree( mmgr->mm_AuthToken );
		}
		
		if( mmgr->mm_WindowsHost != NULL )
		{
			FFree( mmgr->mm_WindowsHost );
		}
		
		if( mmgr->mm_ServiceLogin != NULL )
		{
			FFree( mmgr->mm_ServiceLogin );
		}
		
		if( mmgr->mm_ServicePassword != NULL )
		{
			FFree( mmgr->mm_ServicePassword );
		}
		if( mmgr->mm_HostForClient != NULL )
		{
			FFree( mmgr->mm_HostForClient );
		}
		
		FFree( mmgr );
	}
	DEBUG("[MitraManagerDelete] end\n");
}

/**
 * Function is trying to set auth token. Token is changed only when connection was lost.
 *
 * @param mm pointer to MitraManager structure which will be deleted
 * @param force force to change authid
 */

void MitraManagerCheckAndAddToken( MitraManager *mm, FBOOL force )
{
	if( mm != NULL && (mm->mm_AuthToken == NULL || force == TRUE ) )
	{
		DEBUG("[MitraManagerCheckAndAddToken] start\n");
		// curl -X POST "http://localhost:5000/Token" -H  "accept: */*" -H  "Content-Type: application/json" -d "{\"username\":\"string\",\"password\":\"string\"}"
		
		char tmp[ 256 ];
		
		snprintf( tmp, sizeof(tmp), "/Token" );
		// "Authorization: Bearer mytoken123"
		
		char headers[ 64 ];
		snprintf( headers, sizeof(headers), "Content-Type: application/json" );
		
		DEBUG("[MitraManagerCheckAndAddToken] connect to: %s\n", mm->mm_WindowsHost );
		char content[ 256 ];
		
		// After while, response: HTTP/1.1 400 Bad Request

		snprintf( content, sizeof(content), "{\"username\":\"%s\",\"password\":\"%s\"}\r\n\r\n", mm->mm_ServiceLogin, mm->mm_ServicePassword );
		//strcpy( content, "{\"username\":\"jan@kowalski.pl\",\"password\":\"password\"}" );
		
		// POST, HTTP2, PATH, HEADERS, CONTENT
		HttpClient *c = HttpClientNew( TRUE, FALSE, tmp, headers, content );
		if( c != NULL )
		{
			BufString *bs = HttpClientCall( c, mm->mm_WindowsHost, mm->mm_WindowsPort, FALSE, FALSE );
			
			if( bs != NULL )
			{
				/*
				{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "username": "jan@kowalski.pl",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImphbkBrb3dhbHNraS5wbCIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6Iktvd2Fsc2tpIiwibmJmIjoxNTk2NDc0MzE2LCJleHAiOjE1OTY0NzQ2MTUsImlhdCI6MTU5NjQ3NDMxNiwiaXNzIjoiaXNzdWVyIiwiYXVkIjoiYXVkaWVuY2UifQ.lNImLi_N11f5iGu7iTQIZyzMJAOU19zuMe7SRELZQQo"
}
				 */
				
				DEBUG("[MitraManagerCheckAndAddToken] ClientCall != NULL. Resp len: %lu\n", bs->bs_Size );
				
				char *headEnd = strstr( bs->bs_Buffer, "\r\n\r\n" );
				if( headEnd != NULL )
				{
					char *in = (char *)headEnd+4;
					char *tmpin = strstr( headEnd, "{" );	// somehow content contain number, but we want to get json
					if( tmpin != NULL )
					{
						in = tmpin;
					}
					
					jsmn_parser p;
					jsmntok_t t[128]; // We expect no more than 128 tokens
				
					jsmn_init( &p );
					int r = jsmn_parse( &p, in , bs->bs_Size - (headEnd - bs->bs_Buffer), t, 256 );
				
					DEBUG("[MitraManagerCheckAndAddToken] response: %s - parser: %d type: %d\n", in, r, t[0].type );
				
					// Assume the top-level element is an object 
					if( r > 1 && t[0].type == JSMN_OBJECT )
					{
						//{"host":"localhost","username":"guac","password":"IkkeHeltStabile2000","database":"guacamole"} 
				
						//firstName = StringDuplicateN( in + t[ 2 ].start, (int)(t[ 2 ].end-t[ 2 ].start) );
						//lastName = StringDuplicateN( in + t[ 4 ].start, (int)(t[ 4 ].end-t[ 4 ].start) );
						//userName = StringDuplicateN( in + t[ 6 ].start, (int)(t[ 6 ].end-t[ 6 ].start) );
						mm->mm_AuthToken = StringDuplicateN( in + t[ 8 ].start, (int)(t[ 8 ].end-t[ 8 ].start) );
						DEBUG("[MitraManagerCheckAndAddToken] Authentication token set: %s\n", mm->mm_AuthToken );
					}
				}
				BufStringDelete( bs );
			}
			else
			{
				DEBUG("[MitraManagerCheckAndAddToken] response is empty!\n");
			}
			HttpClientDelete( c );
		}
		
		//mm->mm_AuthToken = StringDuplicate( token );
	}
	DEBUG("[MitraManagerCheckAndAddToken] end!\n");
}

/**
 * Get user data
 *
 * @param mmgr pointer to MitraManager structure which will be deleted
 */
/**
 * Get user data
 *
 * @param mmgr pointer to MitraManager structure which will be deleted
 */
int MitraManagerGetUserData( MitraManager *mmgr, char *username, char **uname, char **domain, char **pass, char **host )
{
	char *retValue = NULL;
	
	DEBUG("[MitraManagerGetUserData] start\n");
	
	if( mmgr->mm_Sqllib != NULL )
	{
		char *sqlTmp = FMalloc( 1024  );
		/*
		//snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='username' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1) union select parameter_value from guacamole_connection_parameter where parameter_name='domain' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1) union select parameter_value from guacamole_connection_parameter where parameter_name='password' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username, username, username );

		snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='username' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username );
		
		void *res = mmgr->mm_Sqllib->Query( mmgr->mm_Sqllib, sqlTmp );
		char **row;
		
		DEBUG("[MitraManagerGetUserData] sql ready: %s\n", sqlTmp );
		
		// we must find username
		
		while( ( row = mmgr->mm_Sqllib->FetchRow( mmgr->mm_Sqllib, res ) ) ) 
		{
			int ulen = 0;
			if( row[ 0 ] != NULL )	// username
			{
				ulen = strlen( row[ 0 ] );
				DEBUG("[MitraManagerGetUserData] username: %s\n", row[ 0 ] );
			}
			int dlen = 0;
			if( row[ 1 ] != NULL )	// domain
			{
				dlen = strlen( row[ 1 ] );
				DEBUG("[MitraManagerGetUserData] domain: %s\n", row[ 1 ] );
			}
			int plen = 0;
			if( row[ 2 ] != NULL )	// password
			{
				DEBUG("ROW2 >>>%s<<<\n", row[ 2 ] );
				if( row[ 2 ][ 0 ] != 0 )
				{
					plen = strlen( row[ 2 ] );
				}
			}
			int len = ulen + dlen + plen + 256;
			
			retValue = FMalloc( len );
			if( retValue != NULL )
			{
				snprintf( retValue, len, "\"username\":\"%s\",\"domain\":\"%s\",\"password\":\"%s\"", row[ 0 ], row[ 1 ], row[ 2 ] );
			}
			
			DEBUG("[MitraManagerGetUserData] user found: %s\n", retValue );
			break;
		}
		*/
		
		
		snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='username' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username );
		void *res = mmgr->mm_Sqllib->Query( mmgr->mm_Sqllib, sqlTmp );
		char **row;
		
		DEBUG("[MitraManagerGetUserData] sql ready: %s\n", sqlTmp );
		
		if( res != NULL )
		{
			// we must find username
			while( ( row = mmgr->mm_Sqllib->FetchRow( mmgr->mm_Sqllib, res ) ) ) 
			{
				if( row[ 0 ] != NULL )	// username
				{
					*uname = StringDuplicate( row[ 0 ] );
					DEBUG("[MitraManagerGetUserData] username: %s\n", row[ 0 ] );
				}
				break;
			}
			mmgr->mm_Sqllib->FreeResult( mmgr->mm_Sqllib, res );
		} // res != NULL
		
		snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='domain' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username );
		res = mmgr->mm_Sqllib->Query( mmgr->mm_Sqllib, sqlTmp );
		
		DEBUG("[MitraManagerGetUserData] sql ready: %s\n", sqlTmp );
		
		// we must find domain
		if( res != NULL )
		{
			while( ( row = mmgr->mm_Sqllib->FetchRow( mmgr->mm_Sqllib, res ) ) ) 
			{
				if( row[ 0 ] != NULL )	// domain
				{
					*domain = StringDuplicate( row[ 0 ] );
					DEBUG("[MitraManagerGetUserData] domain: %s\n", row[ 0 ] );
				}
				break;
			}
			mmgr->mm_Sqllib->FreeResult( mmgr->mm_Sqllib, res );
		} // res != NULL
		
		snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='password' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username );
		res = mmgr->mm_Sqllib->Query( mmgr->mm_Sqllib, sqlTmp );
		
		DEBUG("[MitraManagerGetUserData] sql ready: %s\n", sqlTmp );
		
		// we must find password
		if( res != NULL )
		{
			while( ( row = mmgr->mm_Sqllib->FetchRow( mmgr->mm_Sqllib, res ) ) ) 
			{
				if( row[ 0 ] != NULL )	// password
				{
					*pass = StringDuplicate( row[ 0 ] );
					DEBUG("[MitraManagerGetUserData] password: %s\n", row[ 0 ] );
				}
				break;
			}
			mmgr->mm_Sqllib->FreeResult( mmgr->mm_Sqllib, res );
		} // res != NULL
		
		snprintf( sqlTmp, 1024, "select parameter_value from guacamole_connection_parameter where parameter_name='hostname' AND connection_id=(select connection_id from guacamole_connection_permission where entity_id in (select entity_id from guacamole_entity where name='mitra_%s') limit 1)", username );
		res = mmgr->mm_Sqllib->Query( mmgr->mm_Sqllib, sqlTmp );
		
		DEBUG("[MitraManagerGetUserData] sql ready: %s\n", sqlTmp );
		
		// we must find hostname
		if( res != NULL )
		{
			while( ( row = mmgr->mm_Sqllib->FetchRow( mmgr->mm_Sqllib, res ) ) ) 
			{
				if( row[ 0 ] != NULL )	// password
				{
					*host = StringDuplicate( row[ 0 ] );
					DEBUG("[MitraManagerGetUserData] hostname: %s\n", row[ 0 ] );
				}
				break;
			}
			mmgr->mm_Sqllib->FreeResult( mmgr->mm_Sqllib, res );
		} // res != NULL
		
		//

		if( sqlTmp != NULL )
		{
			FFree( sqlTmp );
		}
	}
	DEBUG("[MitraManagerGetUserData] end\n");
	return 0;
}

/*
 List all
 
 curl -X GET "http://localhost:5000/Usb/ListAll" -H  "accept: application/json" -H  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImphbkBrb3dhbHNraS5wbCIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6Iktvd2Fsc2tpIiwibmJmIjoxNTk2NDgzMDk4LCJleHAiOjE1OTY0ODMzOTgsImlhdCI6MTU5NjQ4MzA5OCwiaXNzIjoiaXNzdWVyIiwiYXVkIjoiYXVkaWVuY2UifQ._e2w4UvqwgWi4J2LF0s4OvO8GLD4GbqnsM8Ze7ZIdas"
 
 [
  {
    "windowsUser": "8f8aa317726945f2a8edc44500157449",
    "port": 0
  },
  {
    "windowsUser": "1c90725302ca444c96eed8d3cf102e69",
    "port": 0
  },
  {
    "windowsUser": "1c84c682b34a4f918781efa3a39f40d8",
    "port": 0
  },
  {
    "windowsUser": "1d25f0a524044d33a0e74af4d2aaa547",
    "port": 0
  }
]
 
 */

/*
 Open port
 

 
 curl -X POST "http://localhost:5000/Usb/Open?windowsUser=Pawel&password=pegasos1232" -H  "accept: **" -H  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImphbkBrb3dhbHNraS5wbCIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6Iktvd2Fsc2tpIiwibmJmIjoxNTk2NDgzMDk4LCJleHAiOjE1OTY0ODMzOTgsImlhdCI6MTU5NjQ4MzA5OCwiaXNzIjoiaXNzdWVyIiwiYXVkIjoiYXVkaWVuY2UifQ._e2w4UvqwgWi4J2LF0s4OvO8GLD4GbqnsM8Ze7ZIdas" -d ""
 */

/*
POST /Usb/Open?windowsUser=webmed.poc%5Cfriend&password=webmedpoc HTTP/1.1
> Host: 81.0.147.244:17010
> User-Agent: curl/7.63.0
> accept: **
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImphbkBrb3dhbHNraS5wbCIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6Iktvd2Fsc2tpIiwibmJmIjoxNTk2OTIwNDIyLCJleHAiOjE1OTY5MjA3MjIsImlhdCI6MTU5NjkyMDQyMiwiaXNzIjoiaXNzdWVyIiwiYXVkIjoiYXVkaWVuY2UifQ.sKgr3eS44kcx1m0tsajozoJbKbQgo7X3YA82pyA47Gw
> Content-Length: 0
> Content-Type: application/x-www-form-urlencoded
*/

BufString *MitraManagerCall( MitraManager *mm, char *path, int *errCode )
{
	BufString *bs = NULL;
	char tmp[ 512 ];

	snprintf( tmp, sizeof(tmp), "/%s", path );
	// "Authorization: Bearer mytoken123"
	
	char headers[ 512 ];
	snprintf( headers, sizeof(headers), "Content-type: application/x-www-form-urlencoded\r\nContent-Length: 0\r\nAuthorization: Bearer %s", mm->mm_AuthToken );
	
	// POST, HTTP2, PATH, HEADERS, CONTENT
	HttpClient *c = HttpClientNew( TRUE, FALSE, tmp, headers, NULL );
	if( c != NULL )
	{
		bs = HttpClientCall( c, mm->mm_WindowsHost, mm->mm_WindowsPort, FALSE, FALSE );
		if( bs != NULL )
		{
			char *headEnd = strstr( bs->bs_Buffer, "\r\n\r\n" );
			if( headEnd != NULL )
			{
				// find start and end of http status
				char *startStatus = NULL;
				char *endStatus = NULL;
				int i;
				*errCode = 0;
				
				for( i = 0 ; i < bs->bs_Size ; i++ )
				{
					if( bs->bs_Buffer[ i ] == ' ' )
					{
						if( startStatus == NULL )
						{
							startStatus = (bs->bs_Buffer + i + 1 );
						}
						else
						{
							if( endStatus == NULL )
							{
								endStatus = bs->bs_Buffer+i;
								char *status = StringDuplicateN( startStatus, endStatus-startStatus );
								if( status != NULL )
								{
									*errCode = atoi( status );
								}
								break;	// error code found, quit!
							}
						}
					}
				}
				
				headEnd += 4;
				// we should return data only
				int len = (bs->bs_Size - (headEnd-bs->bs_Buffer));
				BufString *newbs = BufStringNewSize( len+16 );
				if( newbs != NULL )
				{
					BufStringAdd( newbs, headEnd );
					BufStringDelete( bs );
				}
				bs = newbs;
			}
		}
		HttpClientDelete( c );
	}
	return bs;
}
