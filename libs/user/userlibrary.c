/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*

	UserLibrary code

*/

#include <core/types.h>
#include <core/library.h>
#include "userlibrary.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <openssl/sha.h>
#include <string.h>
#include <propertieslibrary.h>
#include <system/systembase.h>
#include <util/sha256.h>
#include <network/websocket_client.h>

#define LIB_NAME "user.library"
#define LIB_VERSION			1
#define LIB_REVISION		0

// internal function

//
// load all groups
//

UserGroup *LoadGroups( struct UserLibrary *l );

//
// get user by sessionId
//

struct User *UserGetBySession( struct UserLibrary *l, const char *sessionId );

//
// assign user to group
//

int AssignGroupToUser( struct UserLibrary *l, User *usr );
int AssignApplicationsToUser( struct UserLibrary *l, User *usr );

//
// init library
//

void *libInit( void *sb )
{
	struct UserLibrary *l = NULL;
	DEBUG("USERLIBRARY libinit\n");

	if( ( l = calloc( 1, sizeof( struct UserLibrary ) ) ) == NULL )
	{
		return NULL;
	}

	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	//l->libInit//no need
	l->libClose = dlsym ( l->l_Handle, "libClose" );
	l->GetVersion = dlsym ( l->l_Handle, "GetVersion" );
	l->GetRevision = dlsym( l->l_Handle, "GetRevision" );

	// user.library structure
	l->UserExistByName = dlsym ( l->l_Handle, "UserExistByName" );
	l->Authenticate = dlsym ( l->l_Handle, "Authenticate" );
	l->IsSessionValid = dlsym ( l->l_Handle, "IsSessionValid" );
	l->UserCreate = dlsym ( l->l_Handle, "UserCreate" );
	l->UserFree = dlsym( l->l_Handle, "UserFree" );
	l->UserGetBySession = dlsym ( l->l_Handle, "UserGetBySession" );
	l->UserGetByAuthID = dlsym( l->l_Handle, "UserGetByAuthID" );
	l->UserGet = dlsym ( l->l_Handle, "UserGet" );
	l->SetFullName = dlsym ( l->l_Handle, "SetFullName" );
	l->SetEmail = dlsym ( l->l_Handle, "SetEmail" );
	l->UserUpdateDb = dlsym( l->l_Handle, "UserUpdateDb" );
	l->UserDelete = dlsym( l->l_Handle, "UserDelete" );
	l->CheckPassword = dlsym( l->l_Handle, "CheckPassword" );
	l->WebRequest = dlsym( l->l_Handle, "WebRequest" );
	l->GetAllUsers = dlsym( l->l_Handle, "GetAllUsers" );
	l->UserGetByID = dlsym( l->l_Handle, "UserGetByID" );
	l->CheckPasswordMD5 = dlsym( l->l_Handle, "CheckPasswordMD5" );
	

	l->sb = sb;
	l->globalGroups = LoadGroups( l );

	return ( void *)l;
}

//
//
//

void libClose( struct UserLibrary *l )
{
	UserGroup *g = l->globalGroups, *rg;
	DEBUG("Cleaning groups\n");
	while( g!= NULL )	// remove global groups
	{
		rg = g;
		g = (UserGroup *)g->node.mln_Succ;
		if( rg )
		{
			//if( rg->ug_ID ){ free( rg->ug_ID ); }
			if( rg->ug_Name ){ free( rg->ug_Name ); }
			free( rg );
		}
	}
	
	DEBUG( "Freeing users.\n" );
	
	
	
	DEBUG("Closing connections\n");
	
	DEBUG("User library close\n");
}

//
//
//

long GetVersion(void)
{
	return LIB_VERSION;
}

long GetRevision(void)
{
	return LIB_REVISION;
}


//
// LoadGroups
// Load groups from database
//

UserGroup *LoadGroups( struct UserLibrary *l )
{
	UserGroup *groups = NULL;
	UserGroup *newGroup = NULL, *lastGroup = NULL;
	
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	if( sqlLib != NULL )
	{
		int entries;
		groups = sqlLib->Load( sqlLib, GroupDesc, NULL, &entries );
		sb->LibraryMYSQLDrop( sb, sqlLib );
	}
	return groups;
}

//
// check if user exist in database
//

	// user.library structure
BOOL UserExistByName( struct UserLibrary *l, const char *name )
{
	char query[ 1024 ];
	sprintf( query, " `Name` = '%s'" , name );
	
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	if( sqlLib != NULL )
	{
		int res = sqlLib->NumberOfRecords( sqlLib, UserDesc,  query );
		if( res <= 0 )
		{
			sb->LibraryMYSQLDrop( sb, sqlLib );
			return FALSE;
		}
	
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return TRUE;
	}
	return FALSE;
}

#define FUP_AUTHERR_PASSWORD	1
#define FUP_AUTHERR_TIMEOUT		2
#define FUP_AUTHERR_UPDATE		3
#define FUP_AUTHERR_USRNOTFOUND	4
#define FUP_AUTHERR_WRONGSESID	5
#define FUP_AUTHERR_USER		6

//
// check password
//

BOOL CheckPassword( struct UserLibrary *l, User *usr, char *pass )
{
	if( usr->u_Password[ 0 ] == '{' &&
		usr->u_Password[ 1 ] == 'S' &&
		usr->u_Password[ 2 ] == '6' &&
		usr->u_Password[ 3 ] == '}' )
	{
		FCSHA256_CTX ctx;
		char hash[ 32 ];
		char hashTarget[ 64 ];
		
		DEBUG("Checkpassword, password is in SHA256 format\n");
		
		Sha256Init( &ctx );
		Sha256Update( &ctx, pass, (unsigned int)strlen( pass ) ); //&(usr->u_Password[4]), strlen( usr->u_Password )-4 );
		Sha256Final( &ctx, hash );
		
		int i;
		int j=0;
		/*
		for( i=0 ; i < 32 ; i++ )
		{
			printf( "%d - %02x\n", (char)(hash[ i ]), (char) hash[ i ] & 0xff );
		}*/
		
		for( i=0 ; i < 64 ; i+= 2 )
		{
			sprintf( &(hashTarget[ i ]), "%02x", (char )hash[ j ] & 0xff );
			j++;
		}
		
		DEBUG("Checking %s versus %s\n", hashTarget, usr->u_Password );
		
		if( strncmp( &(hashTarget[0]), &(usr->u_Password[4]), 64 ) == 0 )
		{
			return TRUE;
		}
	}
	else
	{
		if( strcmp( usr->u_Password, pass ) == 0 )
		{
			return TRUE;
		}
	}
	return FALSE;
}

//
// check password
//

BOOL CheckPasswordMD5( struct UserLibrary *l, User *usr, char *pass )
{
	if( usr->u_Password[ 0 ] == '{' &&
		usr->u_Password[ 1 ] == 'S' &&
		usr->u_Password[ 2 ] == '6' &&
		usr->u_Password[ 3 ] == '}' )
	{
		FCSHA256_CTX ctx;
		char hash[ 32 ];
		char hashTarget[ 64 ];
		
		DEBUG("Checkpassword, password is in SHA256 format\n");
		
		Sha256Init( &ctx );
		Sha256Update( &ctx, pass, (unsigned int)strlen( pass ) ); //&(usr->u_Password[4]), strlen( usr->u_Password )-4 );
		Sha256Final( &ctx, hash );
		
		int i;
		int j=0;
		/*
		for( i=0 ; i < 32 ; i++ )
		{
			printf( "%d - %02x\n", (char)(hash[ i ]), (char) hash[ i ] & 0xff );
		}*/
		
		for( i=0 ; i < 64 ; i+= 2 )
		{
			sprintf( &(hashTarget[ i ]), "%02x", (char )hash[ j ] & 0xff );
			j++;
		}
		
		DEBUG("Checking %s versus %s\n", hashTarget, usr->u_Password );
		
		if( strncmp( &(hashTarget[0]), &(usr->u_Password[4]), 64 ) == 0 )
		{
			return TRUE;
		}
	}
	else
	{
		if( strcmp( usr->u_Password, pass ) == 0 )
		{
			return TRUE;
		}
	}
	return FALSE;
}

//
// get all users from DB
//

User *GetAllUsers( struct UserLibrary *l )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( !sqlLib )
	{
		ERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, NULL, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		// TODO: Reenable application stuff when it works
		//AssignGroupToUser( l, tmp );
		//AssignApplicationsToUser( l, tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("GetAllUsers end\n");
	return user;
}

//
// authenticate user
//

User *Authenticate( struct UserLibrary *l, struct User *loguser, const char *name, const char *pass, const char *sessionId )
{
	if( l == NULL ) return NULL;
	DEBUG("Authenticate START\n");
	
	struct User *user = NULL;
	
	if( loguser == NULL )
	{
		user = l->UserGet( l, name );
	}
	else
	{
		user = loguser;
	}
	DEBUG("Authenticate User took\n");
	time_t timestamp = time ( NULL );
	
	if( user == NULL )
	{
		DEBUG("[ERROR] Cannot find user by name %s\n", name );
		return NULL;
	}
	
	if( sessionId != NULL )
	{
		if( loguser == NULL )
		{
			ERROR("!!!!!!!!!!!!!!!!!!!\n\n\n\n\n\n\n");
			l->UserFree( user );
		}
		DEBUG( "The session id is %s\n", sessionId );
		user = UserGetBySession( l, sessionId );
		
		if( user != NULL )
		{
			DEBUG("Check password %s  -  %s\n", pass, user->u_Password );
			
			if( CheckPassword( l, user, (char *)pass ) == FALSE )
			//if( strcmp( pass, user->u_Password ) != 0 )
			{
				user->u_Error = FUP_AUTHERR_PASSWORD;
				return NULL;
			}
		
			if( strcmp( name, user->u_Name ) != 0 )
			{
				user->u_Error = FUP_AUTHERR_USER;
				return NULL;
			}
		
			//
			// session is valid
			//
		
			// TODO: reenable timeout when it works!
			if( 1 == 1 || ( timestamp - user->u_LoggedTime ) < LOGOUT_TIME )
			{	// session timeout
	
				DEBUG("LOGin time %ld < LOGOUTTIME %d\n", timestamp - user->u_LoggedTime, LOGOUT_TIME );
	
				// same session, update login time

				char tmpQuery[ 255 ];
				sprintf( tmpQuery, "UPDATE FUser SET LoggedTime = '%lld' AND SessionID='%s' WHERE `Name` = '%s'", (long long)timestamp, sessionId, name );
				
				SystemBase *sb = (SystemBase *)l->sb;
				MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
				if( sqlLib != NULL )
				{
					// I should use MYSQL, but temporary solution is to use MYSQL connection only
					if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
					{
						user->u_Error = FUP_AUTHERR_UPDATE;
						sb->LibraryMYSQLDrop( sb, sqlLib );
						return user;
					}
					sb->LibraryMYSQLDrop( sb, sqlLib );

					return user;
				}
				return NULL;
			}
			else
			{
				user->u_Error = FUP_AUTHERR_TIMEOUT;
				return user;
			}
			
		}
		else
		{
			DEBUG("[ERROR] User cannot be found by session %s\n", sessionId );
			return NULL;
		}
		
	}
	else
	{
		
		DEBUG("AUTHENTICATE session NULL...\n");
		
		if( CheckPassword( l, user, (char *)pass ) == FALSE )
		{
			DEBUG( "Password does not match! %s != %s\n", pass, user->u_Password );
			user->u_Error = FUP_AUTHERR_PASSWORD;
			return NULL;
		}
		
		DEBUG( "The password comparizon is: %s, %s\n", pass, user->u_Password );
			
		// Create new session hash
		char *hashBase = MakeString( 255 );
		sprintf( hashBase, "%ld%s%d", timestamp, user->u_FullName, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );
		HashedString( &hashBase );
			
		// Remove old one and update
		if( user->u_SessionID ) free( user->u_SessionID );
		user->u_SessionID = hashBase;
			
		char tmpQuery[ 255 ];
		sprintf( tmpQuery, "UPDATE FUser SET `SessionID` = '%s', `LoggedTime` = '%lld' WHERE `Name` = '%s' LIMIT 1", 
			user->u_SessionID, (long long)timestamp, name );
		DEBUG("AUTH QUERY TOUT  %s\n", tmpQuery );

		SystemBase *sb = (SystemBase *)l->sb;
		MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
		if( sqlLib != NULL )
		{
			// using connection for a moment, must be rewritten
			if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
			{
				user->u_Error = FUP_AUTHERR_UPDATE;
				sb->LibraryMYSQLDrop( sb, sqlLib );
				return user;
			}
			
			sb->LibraryMYSQLDrop( sb, sqlLib );
			INFO("Auth return user %s with sessionid %s\n", user->u_Name, user->u_SessionID );
			return user;
		}
		free( hashBase );
		return NULL;
		
	}

	DEBUG("AUTHENTICATE END\n");

	// next request, if session id exist then user is logged in
	return user;
}

//
// logout
//

void Logout( struct UserLibrary *l, const char *name )
{
	struct User *user = l->UserGet( l, name );
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 255 ];
		sprintf( tmpQuery, "UPDATE FUser SET `SessionID` = '%s', `LoggedTime` = '%d' WHERE `Name` = '%s'", user->u_SessionID, 0, name );
		DEBUG("AUTH QUERY TOUT  %s\n", tmpQuery );

		// temporary solution, using MYSQL connection
		if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
		{
		
		}
		sb->LibraryMYSQLDrop( sb, sqlLib );
	}
}

//
//
//

User *IsSessionValid( struct UserLibrary *l, const char *sessionId )
{
	// to see if the session has lastupdated date less then 2 hours old
	struct User *user = l->UserGetBySession( l, sessionId );
	time_t timestamp = time ( NULL );
	
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	if( !sqlLib ) return NULL;

	if( user == NULL )
	{
		//FUP_AUTHERR_USRNOTFOUND
		return NULL;
	}

	// we check if user is already logged in
	if( ( timestamp - user->u_LoggedTime ) < LOGOUT_TIME )
	{	// session timeout
		// we set timeout

		if( strcmp( user->u_SessionID, sessionId ) == 0 )
		{
			DEBUG( "IsSessionValid: Session is valid! %s\n", sessionId );
			char tmpQuery[ 255 ];
			sprintf( tmpQuery, "UPDATE FUser SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionId );

			// temporary solution
			if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
			{
				user->u_Error = FUP_AUTHERR_UPDATE;
				sb->LibraryMYSQLDrop( sb, sqlLib );
				return user;
			}

		}
		else
		{
			DEBUG( "IsSessionValid: Wrong sessionid! %s\n", sessionId );
			
			// same session, update loggedtime
			user->u_Error = FUP_AUTHERR_WRONGSESID;
			sb->LibraryMYSQLDrop( sb, sqlLib );
			return user;
		}
	}
	else
	{
		DEBUG( "IsSessionValid: Session has timed out! %s\n", sessionId );
		user->u_Error = FUP_AUTHERR_TIMEOUT;
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return user;
	}
	sb->LibraryMYSQLDrop( sb, sqlLib );
	return user;
}

//
// Create user in database
//

int UserCreate( struct UserLibrary *l, User *usr )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		ERROR("Cannot create user, mysql.library was not opened!\n");
		return 1;
	}
	
	if( usr == NULL )
	{
		ERROR("Cannot create user, NULL cannot be stored into database\n");
	}

	if( l->UserExistByName( l, usr->u_Name ) == TRUE )
	{
		DEBUG("CreateUser: user exist already!\n");
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return 1;
	}
	time_t timestamp = time ( NULL );
	
	if( usr->u_Name != NULL )
	{
		if( usr->u_Name[ 0 ] == '{' && usr->u_Name[ 1 ] == 'S' && usr->u_Name[ 2 ] == '6' && usr->u_Name[ 3 ] == '}' )
		{
			
		}
		else
		{
			FCSHA256_CTX ctx;
			char hash[ 32 ];
			char *hashTarget;
			
			if( ( hashTarget = calloc( 69, sizeof(char) ) ) != NULL )
			{
				hashTarget[ 0 ] = '{';
				hashTarget[ 1 ] = 'S';
				hashTarget[ 2 ] = '6';
				hashTarget[ 3 ] = '}';
		
				DEBUG("Encrypt password\n");
		
				Sha256Init( &ctx );
				Sha256Update( &ctx, usr->u_Password, strlen( usr->u_Password ) );
				Sha256Final( &ctx, hash );
		
				int i;
				int j=0;
		
				for( i=0 ; i < 64 ; i+= 2 )
				{
					sprintf( &(hashTarget[ i+4 ]), "%02x", (char )hash[ j ] & 0xff );
					j++;
				}
				
				if( usr->u_Password != NULL )
				{
					FFree( usr->u_Password );
				}
				
				usr->u_Password = hashTarget;
				hashTarget[ 68 ] = 0;
			}
		}
	}

	int val = sqlLib->Save( sqlLib, UserDesc, usr );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	return val;
}

//
// insernal , createUser
//


User *UserFromSQL( MYSQL_ROW row )
{
	User *user = calloc( 1, sizeof( User ) );
	
	if( user == NULL ) return NULL;
	
	DEBUG("UpdateUserFields %s %s %s <\n", row[ 1 ], row[ 2 ], row[ 3 ] );

	//| ID | Name    | Password | FullName | Email | SessionID                                | LoggedTime | CreatedTime |

	
	user->u_ID = atol( row[ 0 ] );
	
	user->u_Name = StringDuplicate( row[ 1 ] );
	
	DEBUG("->name %s\n", user->u_Name );
	
	if( row[ 2 ] != NULL )
	{
		user->u_Password = StringDuplicate( row[ 2 ] );
		DEBUG("->password %s  row4\n", user->u_Password );
	}
	
	if( row[ 3 ] != NULL )
	{
		user->u_FullName = StringDuplicate( row[ 3 ] );
	}
	
	if( row[ 4 ] != NULL )
	{
		user->u_FullName = StringDuplicate( row[ 4 ] );
	}
	
	if( row[ 5 ] != NULL )
	{
		user->u_SessionID = StringDuplicate( row[ 5 ] );
		DEBUG( "->session %p\n", user->u_SessionID );
	}
	
	user->u_LoggedTime = atol( row[ 6 ] );
	user->u_CreatedTime = atol( row[ 7 ] );
	user->u_MountedDevs = NULL;
	
	return user;
}

//
// user data free
//

void UserFree( User *user )
{
	// TODO: Reenable this when we're using it
	if( user->u_Groups != NULL )
	{
		FFree( user->u_Groups );
		user->u_Groups = NULL;
	}
	
	// Free up all!
	if( user->u_Applications != NULL )
	{
		UserApplication *data = user->u_Applications[0];
		if( data )
		{
			UserApplication *tmp = NULL;
			do
			{
				tmp = ( UserApplication *)data->ua_Next;
				//if( data->ua_Permissions ) free( data->ua_Permissions );
				free( data );
			}
			while( ( data = tmp ) != NULL );
		}
		free( user->u_Applications );
		
		user->u_Applications = NULL;
	}
	/*
	WebsocketClient *wsc = user->u_WSConnections;
	WebsocketClient *wsrem = wsc;
	while( wsc != NULL )
	{
		wsrem = wsc;
		wsc = (WebsocketClient *) wsc->node.mln_Succ;
		FFree( wsrem );
	}*/
	
	UserDelete( user );
	/*
	DEBUG("User free\n");
	if( user->u_Name != NULL )
	{
		free( user->u_Name ); user->u_Name = NULL;
	}
	DEBUG("User free user\n");

	if( user->u_Password != NULL )
	{
		free( user->u_Password ); user->u_Password = NULL;
	}
	
	DEBUG("User free pass\n");

	if( user->u_SessionID )
	{
		free( user->u_SessionID ); user->u_SessionID = NULL;
	}
	DEBUG("User free END\n");*/

	//free( user );
}

//
// get user by session
//

struct User *UserGetBySession( struct UserLibrary *l, const char *sessionId )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( !sqlLib )
	{
		ERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	struct User *user = NULL;
	char tmpQuery[ 1024 ];
	sprintf( tmpQuery, " SessionId = '%s'", sessionId );
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	if( user != NULL )
	{
		AssignGroupToUser( l, user );
		AssignApplicationsToUser( l, user );
	}
	
	DEBUG("UserGetBySession end\n");
	return user;
}

//
// Get user from database by authid
//

void *UserGetByAuthID( struct UserLibrary *l, const char *authId )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib && sqlLib->con.sql_Con )
	{
		// temporary solution, using MYSQL connection
		char q[ 1024 ];
		sprintf( q, "SELECT u.ID FROM `FUser` u, `FApplication` f WHERE f.AuthID=\"%s\" AND f.UserID = u.ID LIMIT 1", authId );
		if( mysql_query( sqlLib->con.sql_Con, q ) )
		{
			MYSQL_RES *result = mysql_store_result( sqlLib->con.sql_Con );
			if( result != NULL )
			{ 
				MYSQL_ROW row;
				if( ( row = mysql_fetch_row( result ) ) )
				{
					struct User *user = NULL;
					char tmpQuery[ 1024 ];
					sprintf( tmpQuery, " ID = '%s'", row[0] );
					int entries;
					user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
					if( user != NULL )
					{
						AssignGroupToUser( l, user );
						AssignApplicationsToUser( l, user );
						
						sb->LibraryMYSQLDrop( sb, sqlLib );
						return user;
					}
				}
			}
		}
	}
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	return NULL;
}

//
// GetUser from database by name
//

User * UserGet( struct UserLibrary *l, const char *name )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( !sqlLib )
	{
		ERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];
	sprintf( tmpQuery, " Name = '%s'", name );
	
	DEBUG( "Loading user.\n" );
	int entries;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );

	if( user )
	{
		DEBUG("User found %s\n", user->u_Name );
		AssignGroupToUser( l, user );
		AssignApplicationsToUser( l, user );
	}
	
	DEBUG("GETUSER data filled, END\n");

	sb->LibraryMYSQLDrop( sb, sqlLib );

	return user;
}

//
// GetUser from database by name
//

User * UserGetByID( struct UserLibrary *l, ULONG id )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( !sqlLib )
	{
		ERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];
	sprintf( tmpQuery, " ID = '%ld'", id );
	
	DEBUG( "Loading user.\n" );
	int entries;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );

	if( user )
	{
		DEBUG("User found %s\n", user->u_Name );
		AssignGroupToUser( l, user );
		AssignApplicationsToUser( l, user );
	}
	
	DEBUG("GETUSER data filled, END\n");

	sb->LibraryMYSQLDrop( sb, sqlLib );

	return user;
}

//
// Set User Full Name
//

void SetFullName( struct User *u, const char *fname )
{
	if( u != NULL && fname != NULL )
	{
		u->u_FullName = StringDuplicate( fname );
	}
}

//
// Set User Email address
//

void SetEmail( struct User *u, const char *mail )
{
	if( u != NULL && mail != NULL )
	{
		u->u_Email = StringDuplicate( mail );
	}
}

//
// Update user in database
//

void UserUpdateDb( struct UserLibrary *l, User *usr )
{
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( !sqlLib )
	{
		ERROR("Cannot get user, mysql.library was not open\n");
		return ;
	}
	
	sqlLib->Update( sqlLib, UserDesc, usr );
	
	sb->LibraryMYSQLDrop( sb, sqlLib );
}

//
// Remove User Data
//

int UserDelete( User *usr )
{
	if( usr != NULL )
	{
		if( usr->u_Email )
		{
			free( usr->u_Email );
		}
		
		if( usr->u_FullName )
		{
			free( usr->u_FullName );
		}
		
		if( usr->u_Name )
		{
			free( usr->u_Name );
		}
		
		if( usr->u_Password )
		{
			free( usr->u_Password );
		}
		
		if( usr->u_SessionID )
		{
			free( usr->u_SessionID );
		}
		
		free( usr );
	}
	
	return 0;
}


//
// Check if user has a textual permission, like module or filesystem
// in concert with applications
//

int UserAppPermission( struct UserLibrary *l, int userId, int applicationId, const char *permission )
{

	return -1;
}

//
// Load user assigned groups
//

int AssignGroupToUser( struct UserLibrary *l, User *usr )
{
	char tmpQuery[ 255 ];
	struct User *user = NULL;

	sprintf( tmpQuery, "SELECT * FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );
	
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );

	// temporary solution
	if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
	{
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return 1;
	}

	MYSQL_RES *result = mysql_store_result(  sqlLib->con.sql_Con );
  
	if (result == NULL) 
	{
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return 2;
 	}

	MYSQL_ROW row;
	int j = 0;
	int actgroup = 0;
	
	if( usr->u_Groups )
	{
		FFree( usr->u_Groups );
	}
	usr->u_Groups = FCalloc( result->row_count, sizeof( UserGroup *) );
	

	/*
	 CREATE TABLE `FUserToGroup` (
 `UserID` bigint(20) NOT NULL,
 `UserGroupID` bigint(20) NOT NULL,
	 */
	
	// I assume columns
	// ID, User, Password, Session
  
	while( ( row = mysql_fetch_row( result ) ) ) 
	{
		// first are column names
		if( j >= 1 )
		{
			long uid = atol( row[ 0 ] );
			ULONG gid = atol( row[ 1 ] );
			
			UserGroup *g = l->globalGroups;
			
			// trying to find group
			// and assign it to user
			
			DEBUG("Add group %ld to user\n", gid );
			
			while( g != NULL )
			{
				if( g->ug_ID == gid )
				{
					memcpy( usr->u_Groups[ actgroup++ ], g, sizeof(UserGroup ) );
					//usr->u_Groups[ actgroup++ ] = g;
					
					DEBUG("Group %ld added to user %s\n", (ULONG)g->ug_ID, user->u_Name );
					
					//mysql_free_result( result );
					//sb->LibraryMYSQLDrop( sb, sqlLib );
					//return 0;
				}
				g = (UserGroup *)g->node.mln_Succ;
			}
		} 
		j++;
	}

	mysql_free_result( result );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	return 3;
}

//
// assign user applications to user
//

int AssignApplicationsToUser( struct UserLibrary *l, User *usr )
{
	char tmpQuery[ 255 ];
	sprintf( tmpQuery, "SELECT * FROM FUserApplication WHERE UserID='%lu'", usr->u_ID );
	
	SystemBase *sb = (SystemBase *)l->sb;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	// Query database
	if( mysql_query( sqlLib->con.sql_Con, tmpQuery ) )
	{
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return 1;
	}

	// Store result from call
	MYSQL_RES *result = mysql_store_result( sqlLib->con.sql_Con );
	if( result == NULL )
	{
		sb->LibraryMYSQLDrop( sb, sqlLib );
		return 2;
	}

	// Free previous applications
	if( usr->u_Applications )
	{
		UserApplication *data = usr->u_Applications[0];
		UserApplication *tmp = NULL;
		do
		{
			tmp = ( UserApplication *)data->ua_Next;
			free( data->ua_Permissions );
			free( data );
		}
		while( ( data = tmp ) != NULL );
		free( usr->u_Applications );
	}
	
	// Make room
	usr->u_Applications = FCalloc( result->row_count, sizeof( UserApplication * ) );
	
	// Fetch from mysql
	MYSQL_ROW row;
	int j = 0;
	int actapp = 0;
	UserApplication *prev = NULL;
	DEBUG( "Starting process\n" );
	while( ( row = mysql_fetch_row( result ) ) ) 
	{
		// first are column names
		if( j >= 1 )
		{
			ULONG rid = atol( row[ 0 ] );
			ULONG uid = atol( row[ 1 ] );
			ULONG aid = atol( row[ 2 ] );
			
			
			// Get single user application structure
			UserApplication *ap = FCalloc( 1, sizeof( UserApplication ) );
			ap->ua_ID = rid;
			ap->ua_ApplicationID = aid;
			ap->ua_Permissions = FCalloc( strlen( row[3] ) + 1, sizeof( char * ) );
			sprintf( ap->ua_Permissions, "%s", row[3] );
			
			// Link up to linked list
			if( prev != NULL )
			{
				ap->ua_Next = ( void *)prev;
			}
			else
			{
				ap->ua_Next = NULL;
			}
			
			// Store for next link
			prev = ap;
			
			// Add to list
			usr->u_Applications[ actapp++ ] = ap;
			
		} 
		j++;
	}
	
	// Free mysql result
	mysql_free_result( result );
	
	DEBUG( "%d applications added.\n", actapp );
	
	// Return with amount of application
	sb->LibraryMYSQLDrop( sb, sqlLib );
	return actapp;
}

//
// network handler
//

Http* WebRequest( struct UserLibrary *l, char **urlpath, Http* request )
{
	Http* response = NULL;
	
	if( strcmp( urlpath[ 0 ], "Authenticate" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

						//request->query;
						//
						// PARAMETERS SHOULD BE TAKEN FROM
						// POST NOT GET
						
		if( request->parsedPostContent != NULL )
		{
			char *usr = NULL;
			char *pass = NULL;
							
			HashmapElement *el =  HashmapGet( request->parsedPostContent, "username" );
			if( el != NULL )
			{
				usr = (char *)el->data;
			}
							
			el =  HashmapGet( request->parsedPostContent, "password" );
			if( el != NULL )
			{
				pass = (char *)el->data;
			}
							
			if( usr != NULL && pass != NULL )
			{
				User *loggedUser = l->Authenticate( l, NULL, usr, pass, NULL );
				if( loggedUser != NULL )
				{
					char tmp[ 20 ];
					sprintf( tmp, "LERR: %d\n", loggedUser->u_Error );	// check user.library to display errors
					HttpAddTextContent( response, tmp );
				}
				else
				{
					HttpAddTextContent( response, "LERR: -1" );			// out of memory/user not found
				}
			}
		}
		DEBUG("user login response\n");

		//HttpWriteAndFree( response );
	}
	else
	{
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple(  HTTP_404_NOT_FOUND,  tags );
	
		//HttpWriteAndFree( response );
		return response;
	}
	
	return response;
}

// Create HASH
// TODO: Use stronger key!
//

void HashedString ( char **str )
{
	unsigned char temp[SHA_DIGEST_LENGTH];
	memset( temp, 0x0, SHA_DIGEST_LENGTH );
	
	char *buf = FCalloc( SHA_DIGEST_LENGTH * 2 + 1, sizeof( char ) );

	if( buf != NULL )
	{
		SHA1( ( unsigned char *)*str, strlen( *str ), temp);

		int i = 0;
		for ( ; i < SHA_DIGEST_LENGTH; i++ )
		{
			sprintf( (char*)&(buf[i*2]), "%02x", temp[i] );
		}

		if ( *str ) 
		{
			FFree ( *str );
		}
		DEBUG ( "[HashedString] Hashing\n" );
		*str = buf;
		DEBUG ( "[HashedString] Hashed\n" );
	}
	else
	{
		ERROR("Cannot allocate memory for hashed string\n");
	}
}


