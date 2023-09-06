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
 *  User Manager
 *
 * file contain all functitons related to user management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user.h"
#include "user_manager.h"
#include "user_sessionmanager.h"

#include <system/systembase.h>
#include <util/sha256.h>
#include <system/fsys/device_handling.h>
#include <util/session_id.h>
#include <strings.h>
#include <system/notification/notification.h>
#include <system/fsys/door_notification.h>

#include <ftw.h>
#include <unistd.h>

/**
 * Create UserManager
 *
 * @param sb pointer to SystemBase
 * @return UserManager structure
 */
UserManager *UMNew( void *sb )
{
	UserManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( UserManager ) ) ) != NULL )
	{
		sm->um_SB = sb;
		
		pthread_mutex_init( &(sm->um_Mutex), NULL );
		
		return sm;
	}
	return NULL;
}

/**
 * Delete UserManager
 *
 * @param smgr pointer to UserManager structure which will be deleted
 */
void UMDelete( UserManager *smgr )
{
	// Go and remove all user specific information
	
	User *usr = NULL;
	
	// prevent other systems to work on same list
	if( FRIEND_MUTEX_LOCK( &(smgr->um_Mutex) ) == 0 )
	{
		usr = smgr->um_Users;
		smgr->um_Users = NULL;
		FRIEND_MUTEX_UNLOCK( &(smgr->um_Mutex) );
	}
	
	User *remusr = usr;
	Log( FLOG_INFO, "[UMDelete] Release users\n");
	
	//
	// we must release all users from memory
	//
	
	while( usr != NULL )
	{
		remusr = usr;
		usr = (User *)usr->node.mln_Succ;
		
		if( remusr != NULL )
		{
			DEBUG("[UMDelete] Releasing user devices\n");
			// Remove all mounted devices
			/*
			File *lf = remusr->u_MountedDevs;
			File *remdev = lf;
			while( lf != NULL )
			{
				remdev = lf;
				lf = (File *)lf->node.mln_Succ;
				
				if( remdev != NULL )
				{
					SystemBase *sb = (SystemBase *)smgr->um_SB;
					DeviceRelease( sb->sl_DeviceManager, remdev );
				
					FileDelete( remdev );
					remdev = NULL;
				}
			}

			DEBUG("[UMDelete] Free user %s\n", remusr->u_Name );
			*/
			UserReleaseDrives( remusr, smgr->um_SB );
			
			DEBUG("[UMDelete] Free user %s inuse %d\n", remusr->u_Name, remusr->u_InUse );
			
			UserDelete( remusr );
			
			remusr = NULL;
		}
	}
	
	RemoteUserDeleteAll( smgr->um_RemoteUsers );
	
	// destroy mutex
	pthread_mutex_destroy( &(smgr->um_Mutex) );
	
	FFree( smgr );
}

/**
 * Update User in FriendDB
 *
 * @param um pointer to UserManager
 * @param usr pointer to user structure to which will be updated in DB
 * @return 0 when success, otherwise error number
 */
int UMUserUpdateDB( UserManager *um, User *usr )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	if( usr != NULL )
	{
		usr->u_ModifyTime = time( NULL );
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
		if( sqlLib != NULL )
		{
			sqlLib->Update( sqlLib, UserDesc, usr );
	
			sb->LibrarySQLDrop( sb, sqlLib );
		}
		else
		{
			FERROR("Cannot get user, mysql.library was not open\n");
			return 1;
		}
	}
	else
	{
		FERROR("User = NULL\n");
		return 2;
	}
	return 0;
}

/**
 * Assign user applications to user
 *
 * @param smgr pointer to UserManager
 * @param usr pointer to user structure to which applications will be assigned
 * @return 0 when success, otherwise error number
 */
int UMAssignApplicationsToUser( UserManager *smgr, User *usr )
{
	return 0;	//disabled for test
	/*
	char tmpQuery[ 255 ];

	SystemBase *sb = (SystemBase *)smgr->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	int actapp = 0;
	
	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserApplication WHERE UserID='%lu'", usr->u_ID );

		void *result = sqlLib->Query( sqlLib, tmpQuery );
		if( result == NULL )
		{
			sb->LibrarySQLDrop( sb, sqlLib );
			return 2;
		}

		// Free previous applications
		if( usr->u_Applications )
		{
			UserAppDeleteAll( usr->u_Applications );
			usr->u_Applications = NULL;
		}
	
		// Make room
		//usr->u_Applications = FCalloc( result->row_count, sizeof( UserApplication * ) );
	
		// Fetch from mysql
		char **row;
		int j = 0;
		UserApplication *prev = NULL;
	
		while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
		{
			// first are column names
			if( j >= 1 )
			{
				FULONG rid = atol( row[ 0 ] );
				FULONG uid = atol( row[ 1 ] );
				FULONG aid = atol( row[ 2 ] );
				
				// Get single user application structure
				//UserApplication *ap = UserAppNew( rid, aid, row[3], row[4] );
			
				//if( ap != NULL )
				//{
				//	ap->node.mln_Succ = (MinNode *) usr->u_Applications;
				//	usr->u_Applications = ap;
				//}
				
			} 
			j++;
		}

		sqlLib->FreeResult( sqlLib, result );
	
		DEBUG( "[UMAssignApplicationsToUser] %d applications added.\n", actapp );
	
		// Return with amount of application
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	return actapp;
	*/
}

/**
 * Get User structure from by ID
 *
 * @param um pointer to UserManager
 * @param ID user id
 * @return User structure or NULL value when problem appear
 */
User *UMUserGetByID( UserManager *um, FUQUAD id )
{
	USER_MANAGER_USE( um );
	User *user = um->um_Users;
	while( user != NULL )
	{
		if( user->u_ID == id )
		{
			break;
		}
		user = (User *)user->node.mln_Succ;
	}
	USER_MANAGER_RELEASE( um );

	return user;
}


/**
 * Get User structure from by his name
 *
 * @param um pointer to UserManager
 * @param name user name
 * @return User structure or NULL value when problem appear
 */
User *UMUserGetByName( UserManager *um, const char *name )
{
	USER_MANAGER_USE( um );
	User *user = um->um_Users;
	while( user != NULL )
	{
		if( strcmp( user->u_Name, name ) == 0 )
		{
			break;
		}
		user = (User *)user->node.mln_Succ;
	}
	USER_MANAGER_RELEASE( um );

	return user;
}

/**
 * Get User structure from DB by his name
 *
 * @param um pointer to UserManager
 * @param name user name
 * @return User structure or NULL value when problem appear
 */
User * UMUserGetByNameDB( UserManager *um, const char *name )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];
	snprintf( tmpQuery, sizeof(tmpQuery)," Name='%s'", name );
	//sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," Name = '%s'", name );
	
	int entries;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	// No need for sql lib anymore here
	sb->LibrarySQLDrop( sb, sqlLib );

	if( user != NULL )
	{
		DEBUG("[UMUserGetByNameDB] User found %s  id %ld\n", user->u_Name, user->u_ID );
		UGMAssignGroupToUser( sb->sl_UGM, user );
		UMAssignApplicationsToUser( um, user );
		user->u_MountedDevs = NULL;
	}
	
	DEBUG("[UMUserGetByNameDB] END\n");

	return user;
}

/**
 * Get User structure from DB by id
 *
 * @param um pointer to UserManager
 * @param id user id
 * @return User structure or NULL value when problem appear
 */
User * UMUserGetByIDDB( UserManager *um, FULONG id )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];

	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ID = '%lu'", id );
	
	int entries = 0;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	DEBUG("[UMUserGetByIDDB] User poitner %p  number of entries %d\n", user, entries );
	// No need for sql lib anymore here
	sb->LibrarySQLDrop( sb, sqlLib );

	if( user != NULL )
	{
		DEBUG("[UMUserGetByIDDB] User found %s\n", user->u_Name );
		UGMAssignGroupToUser( sb->sl_UGM, user );
		UMAssignApplicationsToUser( um, user );
		user->u_MountedDevs = NULL;
	}
	
	DEBUG("[UMUserGetByIDDB] END\n");

	return user;
}

/**
 * Create User entry in DB
 *
 * @param smgr pointer to UserManager
 * @param r http request
 * @param usr user structure which will be stored in DB
 * @return 0 when success, otherwise error number
 */
int UMUserCreate( UserManager *smgr, Http *r , User *usr )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	int val = 0;
	
	if( usr == NULL )
	{
		FERROR("Cannot create user, NULL cannot be stored into database\n");
		return -1;
	}

	if( UMUserExistByNameDB( smgr, usr->u_Name ) == TRUE )
	{
		DEBUG("[UMUserCreate]: user exist already!\n");
		return 1;
	}
	
	if( usr->u_Password != NULL )
	{
		if( usr->u_Password[ 0 ] == '{' && usr->u_Password[ 1 ] == 'S' && usr->u_Password[ 2 ] == '6' && usr->u_Password[ 3 ] == '}' )
		{
			
		}
		else
		{
			FCSHA256_CTX ctx;
			unsigned char hash[ 32 ];
			char *hashTarget;
			
			if( ( hashTarget = FCalloc( 69, sizeof(char) ) ) != NULL )
			{
				hashTarget[ 0 ] = '{';
				hashTarget[ 1 ] = 'S';
				hashTarget[ 2 ] = '6';
				hashTarget[ 3 ] = '}';
		
				DEBUG("[UMUserCreate] Encrypt password\n");
		
				Sha256Init( &ctx );
				Sha256Update( &ctx, (unsigned char *)usr->u_Password, strlen( usr->u_Password ) );
				Sha256Final( &ctx, hash );
		
				int i;
				int j=0;
		
				for( i = 0; i < 64; i += 2 )
				{
					sprintf( &(hashTarget[ i + 4 ]), "%02x", (char )hash[ j ] & 0xff );
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
	
	GenerateUUID( &( usr->u_UUID ) );

	if( r->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
	{
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );

		if( sqlLib != NULL )
		{
			char tmpQuery[ 128 ];
		
			val = sqlLib->Save( sqlLib, UserDesc, usr );
		
			sprintf( tmpQuery, "DELETE FROM `FUserToGroup` WHERE UserID=%lu", usr->u_ID );
			sqlLib->QueryWithoutResults( sqlLib, tmpQuery );
		
			sb->LibrarySQLDrop( sb, sqlLib );
		}
		else
		{
			FERROR("[UMUserCreate] Cannot create user, mysql.library was not opened!\n");
			return 2;
		}
	}
	return val;
}

/**
 * Return information if user is admin
 *
 * @param smgr pointer to UserManager UNUSED
 * @param r http request UNUSED
 * @param usr pointer to user structure which will be checked
 * @return TRUE if user is administrator, otherwise FALSE
 */
FBOOL UMUserIsAdmin( UserManager *smgr __attribute__((unused)), Http *r __attribute__((unused)), User *usr )
{
	if( usr != NULL &&  usr->u_IsAdmin == TRUE )
	{
		return TRUE;
	}
	else
	{
		FERROR("User is: %p or not admin\n", usr );
		return FALSE;
	}
}

/**
 * Return information if user is admin by authenticationid
 *
 * @param smgr pointer to UserManager
 * @param r http request
 * @param auth authentication id as string
 * @return TRUE if user is administrator, otherwise FALSE
 */
FBOOL UMUserIsAdminByAuthID( UserManager *smgr, Http *r __attribute__((unused)), char *auth )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("[UMUserIsAdminByAuthID] Cannot get user, mysql.library was not open\n");
		return FALSE;
	}
	
	char tmpQuery[ 1024 ];
	//"SELECT u.SessionID FROM FUser u,  WHERELIMIT 1",
	
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "select count(*) from FUser u, FUserToGroup utg, FUserGroup g, FUserApplication a where u.ID = utg.UserID AND g.ID = utg.UserGroupID AND g.Name = 'Admin'  AND a.UserID = u.ID AND  a.AuthID=\"%s\"", auth );
	
	void *res = sqlLib->Query( sqlLib, tmpQuery );

	if( res != NULL )
	{
		// Check if it was a real result
		if( sqlLib->NumberOfRows( sqlLib, res ) > 0 )
		{
			sqlLib->FreeResult( sqlLib, res );
			sb->LibrarySQLDrop( sb, sqlLib );
			return TRUE;
		}
		sqlLib->FreeResult( sqlLib, res );
	}
	
	sb->LibrarySQLDrop( sb, sqlLib );
	
	return FALSE;
}

/**
 * Check if User is already in FC user list
 *
 * @param smgr pointer to UserManager
 * @param u pointer to user structure which will be checked
 * @return pointer to User structure, otherwise NULL
 */
User *UMUserCheckExistsInMemory( UserManager *smgr, User *u )
{
	// First make sure we don't have a duplicate!
	if( u == NULL )
	{
		return NULL;
	}
	User *sess = smgr->um_Users;
	while( sess != NULL )
	{
		// Found a duplicate, use it, clean up u (not needed), return
		if( sess == u )
		{
			FERROR( "[UserInit] User already exists.\n" );
			return u;
		}
		sess = ( User *)sess->node.mln_Succ;
	}
	return NULL;
}

/**
 * Check if User is in database by his name
 *
 * @param smgr pointer to UserManager
 * @param name user name
 * @return TRUE if user is in database, otherwise FALSE
 */
FBOOL UMUserExistByNameDB( UserManager *smgr, const char *name )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	char query[ 1024 ];
	sprintf( query, " FUser where `Name` = '%s'" , name );
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		int res = sqlLib->NumberOfRecords( sqlLib, UserDesc,  query );
		if( res <= 0 )
		{
			sb->LibrarySQLDrop( sb, sqlLib );
			return FALSE;
		}
	
		sb->LibrarySQLDrop( sb, sqlLib );
		return TRUE;
	}
	return FALSE;
}

/**
 * Get User structure from FC user list by his name
 *
 * @param um pointer to UserManager
 * @param name user name
 * @return User structure when success, otherwise NULL
 */
User *UMGetUserByName( UserManager *um, const char *name )
{
	if( name == NULL )
	{
		return NULL;
	}

	USER_MANAGER_USE( um );

	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check both username and password
		if( strcmp( name, tuser->u_Name ) == 0 )
		{
			USER_MANAGER_RELEASE( um );
			return tuser;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}

	USER_MANAGER_RELEASE( um );

	return tuser;
}

/**
 * Get User structure from FC user list by user id
 *
 * @param um pointer to UserManager
 * @param id user id
 * @return User structure when success, otherwise NULL
 */
User *UMGetUserByID( UserManager *um, FULONG id )
{
	User *tuser = NULL;
	
	USER_MANAGER_USE( um );
	
	tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check both username and password
		if( tuser->u_ID == id )
		{
			USER_MANAGER_RELEASE( um );
			return tuser;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}
	
	USER_MANAGER_RELEASE( um );

	return tuser;
}

/**
 * Get user from database by his name
 *
 * @param um pointer to UserManager
 * @param name name of the user
 * @return User or NULL when error will appear
 */
User *UMGetUserByNameDB( UserManager *um, const char *name )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen(name)+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		snprintf( where, len, " `Name`='%s'", name );
		//sqlLib->SNPrintF( sqlLib, where, len, " `Name`='%s'", name );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->LibrarySQLDrop( sb, sqlLib );

		User *tmp = user;
		while( tmp != NULL )
		{
			UGMAssignGroupToUser( sb->sl_UGM, tmp );
			UMAssignApplicationsToUser( um, tmp );
		
			tmp = (User *)tmp->node.mln_Succ;
		}
		FFree( where );
	}
	
	DEBUG("[UMGetUserByNameDB] end\n");
	return user;
}

/**
 * Get user from database by his name
 *
 * @param um pointer to UserManager
 * @param uuid unique user id
 * @param loadAndAssign set true if you want to load and assign user to group in FriendCore memory
 * @return User or NULL when error will appear
 */
User *UMGetUserByUUIDDB( UserManager *um, const char *uuid, FBOOL loadAndAssign )
{
	if( uuid == NULL )
	{
		return NULL;
	}
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen( uuid )+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		sqlLib->SNPrintF( sqlLib, where, len, " `UniqueID`='%s'", uuid );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->LibrarySQLDrop( sb, sqlLib );

		if( loadAndAssign == TRUE )
		{
			User *tmp = user;
			while( tmp != NULL )
			{
				UGMAssignGroupToUser( sb->sl_UGM, tmp );
				UMAssignApplicationsToUser( um, tmp );
		
				tmp = (User *)tmp->node.mln_Succ;
			}
		}
		FFree( where );
	}
	
	DEBUG("[UMGetUserByNameDB] end\n");
	return user;
}

/**
 * Get user structure from database by his name
 * Do not assign him to any groups, just load
 *
 * @param um pointer to UserManager
 * @param uuid unique user id
 * @return User or NULL when error will appear
 */
User *UMGetOnlyUserByUUIDDB( UserManager *um, const char *uuid )
{
	if( uuid == NULL )
	{
		return NULL;
	}
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen( uuid )+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		sqlLib->SNPrintF( sqlLib, where, len, " `UniqueID`='%s'", uuid );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->LibrarySQLDrop( sb, sqlLib );

		FFree( where );
	}
	
	DEBUG("[UMGetUserByNameDB] end\n");
	return user;
}

/**
 * Get user from database by his name
 *
 * @param um pointer to UserManager
 * @param name name of the user
 * @return User or NULL when error will appear
 */
User *UMGetUserByNameDBCon( UserManager *um, SQLLibrary *sqlLib, const char *name )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	char where[ 128 ];
	where[ 0 ] = 0;
	
	DEBUG("[UMGetUserByNameDB] start\n");
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	sqlLib->SNPrintF( sqlLib, where, sizeof(where), " `Name` = '%s'", name );
	
	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		UGMAssignGroupToUser( sb->sl_UGM, tmp );
		UMAssignApplicationsToUser( um, tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("[UMGetUserByNameDB] end\n");
	return user;
}

/**
 * Get user ID database by his name
 *
 * @param um pointer to UserManager
 * @param name name of the user
 * @return User or NULL when error will appear
 */
FULONG UMGetUserIDByNameDB( UserManager *um, const char *name )
{
	User *usr = UMGetUserByName( um, name );
	if( usr == NULL )
	{
		SystemBase *sb = (SystemBase *)um->um_SB;
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
		if( sqlLib != NULL )
		{
			FULONG id = 0;
			DEBUG("[UMGetUserIDByName] %s\n", name );

			char query[ 1024 ];
			sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT ID FROM `FUser` WHERE Name='%s'", name );
		
			void *result = sqlLib->Query( sqlLib, query );
			if( result != NULL )
			{
				char **row;
				if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					char *end;
					if( row[ 0 ] != NULL )
					{
						id = strtol( (char *)row[ 0 ], &end, 0 );
						
						sqlLib->FreeResult( sqlLib, result );
						sb->LibrarySQLDrop( sb, sqlLib );
						return id;
					}
				}
				sqlLib->FreeResult( sqlLib, result );
			}
			sb->LibrarySQLDrop( sb, sqlLib );
		}
	}

	if( usr != NULL )
	{
		return usr->u_ID;
	}
	return 0;
}

/**
 * Get user from database by ID
 *
 * @param um pointer to UserManager
 * @param id ID of the user
 * @return User or NULL when error will appear
 */
User *UMGetUserByIDDB( UserManager *um, FULONG id )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	char where[ 128 ];
	where[ 0 ] = 0;
	
	DEBUG("[UMGetUserByNameDB] start\n");
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	sqlLib->SNPrintF( sqlLib, where, sizeof(where), " `ID` = '%lu'", id );
	
	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
	sb->LibrarySQLDrop( sb, sqlLib );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		UGMAssignGroupToUser( sb->sl_UGM, tmp );
		UMAssignApplicationsToUser( um, tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("[UMGetUserByNameDB] end\n");
	return user;
}

/**
 * Get User structure from database by authentication id
 *
 * @param um pointer to UserManager
 * @param authId authentication id
 * @return User structure when success, otherwise NULL
 */
void *UMUserGetByAuthIDDB( UserManager *um, const char *authId )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMUserGetByAuthIDDB] %s\n", authId );
		// temporary solution, using MYSQL connection
		char query[ 1024 ];
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT u.ID FROM `FUser` u, `FApplication` f WHERE f.AuthID=\"%s\" AND f.UserID = u.ID LIMIT 1", authId );
		
		void *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{
			char **row;
			if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				struct User *user = NULL;
				char tmpQuery[ 1024 ];
				
				sprintf( tmpQuery, " ID = '%s'", row[0] );
				int entries;
				user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
				if( user != NULL )
				{
					sqlLib->FreeResult( sqlLib, result );
					sb->LibrarySQLDrop( sb, sqlLib );

					UGMAssignGroupToUser( sb->sl_UGM, user );
					UMAssignApplicationsToUser( um, user );
					user->u_MountedDevs = NULL;
					
					return user;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	
	return NULL;
}

/**
 * Get all users from database
 *
 * @param um pointer to UserManager
 * @return User list or NULL when error will appear
 */
User *UMGetAllUsersDB( UserManager *um )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	DEBUG("[UMGetAllUsersDB] start\n");
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, NULL, &entries );
	sb->LibrarySQLDrop( sb, sqlLib );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		UGMAssignGroupToUser( sb->sl_UGM, tmp );
		UMAssignApplicationsToUser( um, tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("[UMGetAllUsersDB] end\n");
	return user;
}

/**
 * Add user to FC user list
 *
 * @param um pointer to UserManager
 * @param usr user which will be added to FC user list
 * @return 0 when success, otherwise error number
 */
int UMAddUser( UserManager *um,  User *usr )
{
	if( usr != NULL && usr->u_ID != NULL )
	{
		User *lu =  UMGetUserByID( um, usr->u_ID );
		if( lu == NULL  )
		{
			int tr = 20;
			
			USER_MANAGER_CHANGE_ON( um );
			usr->node.mln_Succ  = (MinNode *) um->um_Users;
			if( um->um_Users != NULL )
			{
				um->um_Users->node.mln_Pred = (MinNode *)usr;
			}
			um->um_Users = usr;
			USER_MANAGER_CHANGE_OFF( um );
		}
		else
		{
			INFO("User found, will not be added\n");
		}
	}
	
	return  0;
}

/**
 * Remove user from FC user list
 *
 * @param um pointer to UserManager
 * @param usr user which will be removed from FC user list
 * @param userSessionManager Session manager of the currently running instance
 * @param doNotKillSession pointer to session which is sending command. So it should not be killed
 * @return 0 when success, otherwise error number
 */
int UMRemoveAndDeleteUser( UserManager *um, User *usr, UserSessionManager *userSessionManager, UserSession *doNotKillSession )
{
	User *userCurrent = NULL; //current element of the linked list, set to the beginning of the list
	User *userPrevious = NULL; //previous element of the linked list
	SystemBase *sb = (SystemBase *)um->um_SB;

	DEBUG("[UMRemoveAndDeleteUser] remove user\n");
	
	USER_CHANGE_ON( usr );

	UserSessListEntry *us = (UserSessListEntry *)usr->u_SessionsList;
	UserSessListEntry *delus = us;
	usr->u_SessionsList = NULL;
	
	while( us != NULL )
	{
		delus = us;
		us = (UserSessListEntry *)us->node.mln_Succ;
		
		UserSession *locses = (UserSession *)delus->us;
		
		//
		DEBUG("[UMRemoveAndDeleteUser] user in use1 %d\n", usr->u_InUse );
		
		USMUserSessionRemove( sb->sl_USM, locses );
		
		DEBUG("[UMRemoveAndDeleteUser] user in use2 %d\n", usr->u_InUse );
		
		if( doNotKillSession != locses )
		{
			killUserSession( um->um_SB, locses, FALSE );
		}
		
		DEBUG("[UMRemoveAndDeleteUser] user in use3 %d\n", usr->u_InUse );
		
		// we must remove session from user otherwise it will go into infinite loop
		//UserRemoveSession( usr, locses );
		//
		
		locses->us_User = NULL;
		FFree( delus );
	}

	USER_CHANGE_OFF( usr );
	
	//
	// Old version
	//
	
	/*
	FULONG userId = usr->u_ID;

	//UserRemoveConnectedSessions( usr, FALSE );
	
	UserSession *sessionToDelete;
	while( ( sessionToDelete = USMGetSessionByUserID( userSessionManager, userId ) ) != NULL )
	{
		if( sessionToDelete->us_Status == USER_SESSION_STATUS_TO_REMOVE )
		{
			DEBUG("[UMRemoveAndDeleteUser] session will be deleted\n");
			continue;
		}
		USERSESSION_LOCK( sessionToDelete );
		
		DEBUG("[UMRemoveAndDeleteUser] user in use1 %d\n", usr->u_InUse );
		
		USMUserSessionRemove( sb->sl_USM, sessionToDelete );
		
		DEBUG("[UMRemoveAndDeleteUser] user in use2 %d\n", usr->u_InUse );
		
		killUserSession( um->um_SB, sessionToDelete, FALSE );
		
		DEBUG("[UMRemoveAndDeleteUser] user in use3 %d\n", usr->u_InUse );
		
		// we must remove session from user otherwise it will go into infinite loop
		UserRemoveSession( usr, sessionToDelete );
		
		DEBUG("[UMRemoveAndDeleteUser] user in use4 %d\n", usr->u_InUse );
		
		//int status = USMUserSessionRemove( userSessionManager, sessionToDelete );
		//DEBUG("%s removing session at %p, status %d\n", __func__, sessionToDelete, status);
		
		USERSESSION_UNLOCK( sessionToDelete );
	}
	UserRemoveConnectedSessions( usr, FALSE );
	
	
	DEBUG("[UMRemoveAndDeleteUser] user in use5 %d\n", usr->u_InUse );

	
	
	USER_MANAGER_CHANGE_ON( um );
	*/
	FBOOL found = FALSE;
	unsigned int n = 0;
	
	userCurrent = um->um_Users;
	while( userCurrent != NULL )
	{
		if( userCurrent == usr )
		{
			DEBUG("%s removing user at %p, place in list %d\n", __func__, userCurrent, n);
			found = true;
			n++;
			break;
		}
		userPrevious = userCurrent;
		userCurrent = (User *)userCurrent->node.mln_Succ; //this is the next element in the linked list
	}
	
	//USER_UNLOCK( usr );
	
	if( found == TRUE )
	{
		//the requested user has been found in the list
		if( userPrevious )
		{
			//we are in the middle or at the end of the list
			DEBUG("Deleting from the middle or end of the list\n");
			userPrevious->node.mln_Succ = userCurrent->node.mln_Succ;
		}
		else
		{
			//we are at the very beginning of the list
			um->um_Users = (User *)userCurrent->node.mln_Succ; //set the global start pointer of the list
		}
		
		// we dont allow to change list when we work with it
		
		USER_MANAGER_CHANGE_OFF( um );
		
		UserDelete( userCurrent );
		
		return 0;
	}
	
	USER_MANAGER_CHANGE_OFF( um );
	
	return -1;
}

/**
 * Get User allowed login time
 *
 * @param um pointer to UserManager
 * @param name username which will be checked
 * @return 0 or time from which user is allowed to login (0 is also the value when he can login)
 */
FULONG UMGetAllowedLoginTime( UserManager *um, const char *name )
{
	FULONG tm = 0;
	
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMGetAllowedLoginTime] user name: %s\n", name );
		char query[ 1024 ];
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT `LoginTime` FROM `FUser` WHERE `Name`='%s' LIMIT 1", name );
		
		void *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			char **row;
			if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				tm = atol( row[ 0 ] );
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	return tm;
}

/**
 * Get User login possibility
 *
 * @param um pointer to UserManager
 * @param name login name
 * @param info additional information which will be stored in DB
 * @param failReason if field is not equal to NULL then user is not authenticated
 * @param deviceID device id/name
 * @param password password
 * @return 0 when success otherwise error number
 */
int UMStoreLoginAttempt( UserManager *um, const char *name, char *password, const char *info, const char *failReason, char *devicename )
{
	UserLogin ul;
	SystemBase *sb = (SystemBase *)um->um_SB;
	User *usr = UMGetUserByNameDB( um, name );
	
	DEBUG("[UMStoreLoginAttempt] start\n");
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		ul.ul_Login = (char *)name;
		if( usr != NULL )
		{
			ul.ul_UserID = usr->u_ID;
		}
		else
		{
			ul.ul_UserID = 0;
		}
		ul.ul_Information = (char *)info;
		ul.ul_Failed = (char *)failReason;
		ul.ul_LoginTime = time( NULL );
		ul.ul_Device = devicename;
		ul.ul_Password = password;
		
		sqlLib->Save( sqlLib, UserLoginDesc, &ul );
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	
	if( usr != NULL )
	{
		UserDelete( usr );
	}
	
	return 0;
}

/**
 * Get User login possibility
 *
 * @param um pointer to UserManager
 * @param name username which will be checked
 * @param password user password
 * @param numberOfFail if last failed logins will have same value as this variable then login possibility will be blocked for some period of time
 * @param lastLoginTime in this field infomration about last login time will be stored
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL UMGetLoginPossibilityLastLogins( UserManager *um, const char *name, char *password, int numberOfFail, time_t *lastLoginTime )
{
	FBOOL canILogin = FALSE;
	
	// if default value is equal or less then 0
	if( numberOfFail <= 0 )
	{
		return TRUE;
	}
	
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMGetLoginPossibilityLastLogins] username %s\n", name );
		// temporary solution, using MYSQL connection
		char *query = FMalloc( 2048 );
		time_t tm = time( NULL );
		
		// we are checking failed logins in last hour
		//sqlLib->SNPrintF( sqlLib, query, 2048, "SELECT LoginTime,Failed,Password FROM `FUserLogin` WHERE `Login`='%s' AND (`LoginTime`>%lu AND `LoginTime`<=%lu) ORDER BY `LoginTime` DESC", name, tm-(3600l), tm );
		snprintf( query, 2048, "SELECT LoginTime,Failed,Password FROM `FUserLogin` WHERE `Login`='%s' AND (`LoginTime`>%lu AND `LoginTime`<=%lu) ORDER BY `LoginTime` DESC", name, tm-(3600l), tm );
		
		void *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			char **row;
			int i = 0;
			FBOOL goodLogin = FALSE;
			int wasSamePasswordTimes = 0;
			
			char *lastPassword = StringDuplicate( password );
			
			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				if( i == 0 )
				{
					// we need only highest timestamp
					*lastLoginTime = atol( row[ 0 ] );
				}
				
				// if there was good login in last numberOfFail, we can quit
				if( row[ 1 ] == NULL )
				{
					goodLogin = TRUE;
					DEBUG("[UMGetLoginPossibilityLastLogins] last login was ok\n" );
					break;
				}
				
				// we do this check only to last password
				DEBUG("[UMGetLoginPossibilityLastLogins] row2: %s  -  %s\n", row[ 2 ], password );
				if( row[ 2 ] != NULL )
				{
					if( strcmp( lastPassword, row[ 2 ] ) == 0 )
					{
						DEBUG("[UMGetLoginPossibilityLastLogins] same password\n");
						wasSamePasswordTimes++;
					}
					
					if( lastPassword != NULL )
					{
						FFree( lastPassword );
					}
					lastPassword = StringDuplicate( row[ 2 ] );
				}
				/*
				if( i == 0 && row[ 2 ] != NULL && ( strcmp( row[ 2 ], password) == 0 ) )
				{
					goodLogin = TRUE;
					DEBUG("[UMGetLoginPossibilityLastLogins] previous and current password are same\n" );
					break;
				}
				*/
				
				i++;
				if( i >= numberOfFail )
				{
					if( wasSamePasswordTimes >= (numberOfFail-1) )
					{
						goodLogin = TRUE;
					}
					DEBUG("[UMGetLoginPossibilityLastLogins] number of fail login exceed\n" );
					break;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
			
			if( lastPassword != NULL )
			{
				FFree( lastPassword );
			}
			
			DEBUG("[UMGetLoginPossibilityLastLogins] wasSamePasswordTimes: %d\n", wasSamePasswordTimes );
			
			if( i < numberOfFail )
			{
				goodLogin = TRUE;
			}
			
			if( goodLogin == TRUE )
			{
				canILogin = TRUE;
			}
			else
			{
				canILogin = FALSE;
			}
		}
		
		FFree( query );
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	return canILogin;
}

//
// Delete file/directory from local disk
// internal function
//

int UMUnlinkCB( const char *fpath, const struct stat *sb __attribute__((unused)), int typeflag __attribute__((unused)), void *ftwbuf __attribute__((unused)))
{
	int rv = remove( fpath );
	if( rv != 0 )
	{
		DEBUG("Cannot delete %s\n", fpath );
	}
	
	return rv;
}

/**
 * Function remove user data from database
 *
 * @param um pointer to UserManager
 * @param id id of the user which data will be deleted
 * @param userName name of user which data will be removed
 */

void UMPurgeUserData( UserManager *um, FQUAD id, char *userName )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMPurgeUserData] id %lld\n", id );
		// temporary solution, using MYSQL connection
		char *query = FMalloc( 2048 );
		
		// first delete database entries
		
		snprintf( query, 2048, "delete from DockItem where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FAnnouncement where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FAnnouncementStatus where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from Fapplication where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FAppSession where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FCalendar where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FContact where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FContactAttribute where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FContact where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FFileShared where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		// miss Filesystem TODO
		
		snprintf( query, 2048, "delete from FKeys where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FMail where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FMailHeader where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FMailOutgoing where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FQueuedEvent where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FRefreshToken where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FRefreshToken where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FScreen where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FSetting where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FSFile where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FSFileLog where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FSFolder where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FShared where OwnerUserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FSSearchData where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FThumbnail where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FTinyUrl where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserApplication where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserGroup where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserLog where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		//TODO store information about deleteing user
		
		snprintf( query, 2048, "delete from FUserLogin where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		//TOD send information to mobile device that user data were deleted?
		
		snprintf( query, 2048, "delete from FUserMobileApp where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserSession where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserSessionApp where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserStats where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from FUserToGroup where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		snprintf( query, 2048, "delete from MitraFileSync where UserID=%ld", id );
		sqlLib->QueryWithoutResults( sqlLib, query );
		
		// now delete user files
		
		snprintf( query, 2048, "storage/%s", userName );
		nftw( query, UMUnlinkCB, 64, FTW_DEPTH | FTW_PHYS );
		
		FFree( query );
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
}

//return nftw( path, UnlinkCB, 64, FTW_DEPTH | FTW_PHYS );

/**
 * Function remove old entries from database (FUserLogin entries)
 *
 * @param um pointer to UserManager
 */

void UMRemoveRemovedUsersData( UserManager *um )
{
	// all deleted UserID   -  select UserID from FUserToGroup utg where UserID not in (select ID from FUser) group by UserID
	
	// select UserID from Filesystem utg where UserID not in (select ID from FUser) group by UserID
	
	// select UserID from FSFile utg where UserID not in (select ID from FUser) group by UserID

	
}

/**
 * Function remove old entries from database (FUserLogin entries)
 *
 * @param um pointer to UserManager
 */
void UMRemoveOldUserLoginEntries( UserManager *um )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		DEBUG("[UMRemoveOldUserLoginEntries] start\n" );
		char *query = FCalloc( 1, 4096 );
		if( query != NULL )
		{
			// 30 days in seconds 2 592 000
			//time_t tm = time( NULL ) - 2592000;
		
			// we are checking failed logins in last hour
			//sqlLib->SNPrintF( sqlLib, query, 2048, "DELETE FROM `FUserLogin` WHERE LoginTime < %ld", tm );
			snprintf( query, 4096, "DELETE l.* FROM FUserLogin l \
JOIN ( \
SELECT UserID, COALESCE ( ( SELECT LoginTime FROM FUserLogin li \
WHERE li.UserID = dlo.UserID AND Information='Login success' ORDER BY li.UserID DESC, li.LoginTime DESC LIMIT 2, 1 ), 1) AS mts, \
COALESCE( ( SELECT id FROM FUserLogin li WHERE li.UserID = dlo.UserID AND Information='Login success' ORDER BY li.UserID DESC, li.LoginTime DESC, li.id DESC LIMIT 2, 1 ), -1) AS mid \
FROM ( SELECT  DISTINCT UserID FROM FUserLogin dl WHERE Information='Login success') dlo) lo \
ON l.UserID = lo.UserID AND (l.LoginTime, l.id) < (mts, mid) AND l.Information='Login success'; \
\
DELETE l.* FROM FUserLogin l \
JOIN ( \
SELECT UserID, COALESCE ( ( SELECT LoginTime FROM FUserLogin li \
WHERE li.UserID = dlo.UserID AND Information='Login fail' ORDER BY li.UserID DESC, li.LoginTime DESC LIMIT 2, 1 ), 1) AS mts, \
COALESCE( ( SELECT  id FROM FUserLogin li WHERE li.UserID = dlo.UserID AND Information='Login fail' ORDER BY li.UserID DESC, li.LoginTime DESC, li.id DESC LIMIT 2, 1 ), -1) AS mid \
FROM ( SELECT  DISTINCT UserID FROM FUserLogin dl WHERE Information='Login fail') dlo ) lo \
ON l.UserID = lo.UserID AND (l.LoginTime, l.id) < (mts, mid) AND l.Information='Login fail'; \
\
DELETE  l.* FROM FUserLogin l \
JOIN ( \
SELECT UserID, COALESCE( ( SELECT LoginTime FROM FUserLogin li \
WHERE li.UserID = dlo.UserID AND Information='Passwordreset' ORDER BY li.UserID DESC, li.LoginTime DESC LIMIT 2, 1 ), 1) AS mts, \
COALESCE ( ( SELECT id FROM FUserLogin li WHERE li.UserID = dlo.UserID AND Information='Passwordreset' ORDER BY li.UserID DESC, li.LoginTime DESC, li.id DESC LIMIT 2, 1 ), -1) AS mid \
FROM ( SELECT DISTINCT UserID FROM FUserLogin dl WHERE Information='Passwordreset') dlo ) lo \
ON l.UserID = lo.UserID AND (l.LoginTime, l.id) < (mts, mid) AND l.Information='Passwordreset';" );
			
			DEBUG("[UMRemoveOldUserLoginEntries] query: %s\n", query );
		
			sqlLib->QueryWithoutResults( sqlLib, query );
			
			FFree( query );
		}
		sb->LibrarySQLDrop( sb, sqlLib );
		DEBUG("[UMRemoveOldUserLoginEntries] end\n" );
	}
}

/**
 * Check and set API user if thats neccessary
 *
 * @param um pointer to UserManager
 * @return 0 when success, otherwise error number
 */
int UMCheckAndLoadAPIUser( UserManager *um )
{
	int result = 0;
	SystemBase *sb = (SystemBase *)um->um_SB;
	DEBUG("[UMCheckAndLoadAPIUser] Start\n" );
	
	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check if api user was already found
		if( tuser->u_IsAPI || strcmp( tuser->u_Name, "apiuser" ) == 0 )
		{
			um->um_APIUser = tuser;
			break;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}

	// We have to create user
	if( tuser == NULL )
	{
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
		if( sqlLib != NULL )
		{
			User *user = NULL;

			int entries;
			user = sqlLib->Load( sqlLib, UserDesc, "Name='apiuser' LIMIT 1", &entries );

			if( user != NULL )
			{
				sb->LibrarySQLDrop( sb, sqlLib );
			
				DEBUG("[UMCheckAndLoadAPIUser] User found %s  id %ld\n", user->u_Name, user->u_ID );
				UGMAssignGroupToUser( sb->sl_UGM, user );
				UMAssignApplicationsToUser( um, user );
				user->u_MountedDevs = NULL;
				
				UMAddUser( sb->sl_UM, user );
				um->um_APIUser = tuser = user;
			
				// API user have only one session
				if( user->u_SessionsList == NULL )
				{
					// we now generate dummy session
					//UserSession *ses = UserSessionNew( sb, "api", "api" );
					UserSession *ses = UserSessionNew( NULL, "api", sb->fcm->fcm_ID );
					if( ses != NULL )
					{
						ses->us_UserID = user->u_ID;
						ses->us_LastActionTime = time( NULL );
				
						UserAddSession( user, ses );
						USMSessionSaveDB( sb->sl_USM, ses );
					
						USMUserSessionAdd( sb->sl_USM, ses );
					}
				}

				result = 0;
			}
			else
			{
				sb->LibrarySQLDrop( sb, sqlLib );
				result = 1;
			}
			return 0;
		}
		else
		{
			
		}
	}	// tuser != NULL
	
	return result;
}

/**
 * Return all users from database
 *
 * @param um pointer to UserManager
 * @param bs pointer to BufString where string will be stored
 * @param grname group name. If you want to get users from group, put group name. If you want all users, set NULL.
 * @return 0 when success, otherwise error number
 */
int UMReturnAllUsers( UserManager *um, BufString *bs, char *grname )
{
	SystemBase *l = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 512 ];
		char tmp[ 512 ];
		int itmp = 0;
		
		if( grname == NULL )
		{
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.UniqueID,u.Status,u.ModifyTime FROM FUser u WHERE u.Name not in('apiuser','guest')" );
		}
		else
		{
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.UniqueID,u.Status,u.ModifyTime FROM FUserGroup g inner join FUserToGroup utg on g.ID=utg.UserGroupID inner join FUser u on utg.UserID=u.ID where g.Name in ('%s')", grname );
		}
		
		BufStringAddSize( bs, "[", 1 );
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int usrpos = 0;
			char **row;

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				// User Status == DISABLED
				//DEBUG("Check user status: %s\n", (char *)row[ 1 ] );
				if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
				{
					if( usrpos == 0 )
					{
						itmp = snprintf( tmp, sizeof(tmp), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 2 ] );
					}
					else
					{
						itmp = snprintf( tmp, sizeof(tmp), ",{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 2 ] );
					}
				}
				else
				{
					if( usrpos == 0 )
					{
						itmp = snprintf( tmp, sizeof(tmp), "{\"userid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 2 ] );
					}
					else
					{
						itmp = snprintf( tmp, sizeof(tmp), ",{\"userid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 2 ] );
					}
				}
				BufStringAddSize( bs, tmp, itmp );
				usrpos++;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
		
		BufStringAddSize( bs, "]", 1 );
	}
	return 0;
}

/**
 * Get statistic about user accounts
 *
 * @param usm pointer to UserManager
 * @param bs pointer to BufString where results will be stored (as string)
 * @param details return more details
 * @return 0 when success otherwise error number
 */

int UMGetUserStatistic( UserManager *um, BufString *bs, FBOOL details )
{
	BufStringAddSize( bs, "\"users\":[", 9 );
	
	USER_MANAGER_USE( um );
	
	int nr = 0;
	int userCounter = 0;
	char tmp[ 512 ];
	int len = 0;
	
	if( details == TRUE )
	{
		User *usr = um->um_Users;
		while( usr != NULL )
		{
			int sesCounter = 0;
			int devCounter = 0;
			int uglCounter = 0;
			int sesCounterBytes = 0;
			int devCounterBytes = 0;
			int uglCounterBytes = 0;
			
			UserSessListEntry *sesentr = usr->u_SessionsList;
			while( sesentr != NULL )
			{
				sesCounter++;
				sesCounterBytes += sizeof( UserSessListEntry );
				sesentr = (UserSessListEntry *)sesentr->node.mln_Succ;
			}
			
			File *rootDev = usr->u_MountedDevs;
			while( rootDev != NULL )
			{
				devCounter++;
				devCounterBytes += sizeof( File );
				rootDev = (File *)rootDev->node.mln_Succ;
			}
			
			/*
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			{
				uglCounter++;
				uglCounterBytes += sizeof( UserGroupLink );
				ugl = (UserGroupLink *)ugl->node.mln_Succ;
			}
			*/
			
			if( nr == 0 )
			{
				len = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"size\":%d,\"sessions\":%d,\"sessionsbytes\":%d,\"volumesinmem\":%d,\"volumesinmembytes\":%d,\"groups\":%d,\"groupsbytes\":%d}", usr->u_Name, (int)sizeof(User), sesCounter, sesCounterBytes, devCounter, devCounterBytes, uglCounter, uglCounterBytes );
			}
			else
			{
				len = snprintf( tmp, sizeof(tmp), ",{\"name\":\"%s\",\"size\":%d,\"sessions\":%d,\"sessionsbytes\":%d,\"volumesinmem\":%d,\"volumesinmembytes\":%d,\"groups\":%d,\"groupsbytes\":%d}", usr->u_Name, (int)sizeof(User), sesCounter, sesCounterBytes, devCounter, devCounterBytes, uglCounter, uglCounterBytes );
			}
			BufStringAddSize( bs, tmp, len );
		
			nr++;
			usr = (User *)usr->node.mln_Succ;
		}
		
		BufStringAddSize( bs, "],", 2 );
		
		len = snprintf( tmp, sizeof(tmp), "\"usersnumber\":%d", userCounter );
		BufStringAddSize( bs, tmp, len );
	}
	else
	{
		User *usr = um->um_Users;
		while( usr != NULL )
		{
			int sesCounter = 0;
			userCounter++;
		
			UserSessListEntry *sesentr = usr->u_SessionsList;
			while( sesentr != NULL )
			{
				sesCounter++;
				sesentr = (UserSessListEntry *)sesentr->node.mln_Succ;
			}
			
			if( nr == 0 )
			{
				len = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"sessions\":%d}", usr->u_Name, sesCounter );
			}
			else
			{
				len = snprintf( tmp, sizeof(tmp), ",{\"name\":\"%s\",\"sessions\":%d}", usr->u_Name, sesCounter );
			}
			BufStringAddSize( bs, tmp, len );
		
			nr++;
			usr = (User *)usr->node.mln_Succ;
		}
	
		BufStringAddSize( bs, "],", 2 );
		
		len = snprintf( tmp, sizeof(tmp), "\"usersnumber\":%d", userCounter );
		BufStringAddSize( bs, tmp, len );
	}
	
	USER_MANAGER_RELEASE( um );
	return 0;
}

/*
 * Init user drives
 *
 * @param um pointer to UserManager
 * @return 0 when success, otherwise error number
 */
int UMInitUsers( UserManager *um )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	Log( FLOG_INFO, "----------------------------------------------------\n");
	Log( FLOG_INFO, "---------Mount user devices-------------------------\n");
	Log( FLOG_INFO, "----------------------------------------------------\n");
	
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		User *tmpUser = sb->sl_UM->um_Users;
		while( tmpUser != NULL )
		{
			char *err = NULL;
			DEBUG( "[UMInitUsers] FINDING DRIVES FOR USER %s\n", tmpUser->u_Name );
			
			UserSession *session = USMCreateTemporarySession( sb->sl_USM, sqllib, tmpUser->u_ID, 0 );
			if( session != NULL )
			{
				session->us_UserID = tmpUser->u_ID;
				session->us_User = tmpUser;
				
				UserDeviceMount( sb, session, 1, TRUE, &err, FALSE );
				if( err != NULL )
				{
					Log( FLOG_ERROR, "Initial system mount error. UserID: %lu Error: %s\n", tmpUser->u_ID, err );
					FFree( err );
				}
				USMDestroyTemporarySession( sb->sl_USM, sqllib, session );
			}
			DEBUG( "[UMInitUsers] DONE FINDING DRIVES FOR USER %s\n", tmpUser->u_Name );
			tmpUser = (User *)tmpUser->node.mln_Succ;
		}
		sb->LibrarySQLDrop( sb, sqllib );
	}
	
	Log( FLOG_INFO, "----------------------------------------------------\n");
	Log( FLOG_INFO, "---------Mount user group devices-------------------\n");
	Log( FLOG_INFO, "----------------------------------------------------\n");

	return 0;
}


/**
 * Get statistic about user accounts
 *
 * @param usm pointer to UserManager
 * @param bs pointer to BufString where results will be stored (as string)
 * @param userid if set then FC return information only about this user
 * @param usersOnly if information only about users should be returned. If set to FALSE devices will be returned
 * @return 0 when success otherwise error number
 */

int UMGetActiveUsersWSList( UserManager *um, BufString *bs, FULONG userid, FBOOL usersOnly )
{
	// we are going through users and their sessions
	// if session is active then its returned
	
	SystemBase *l = (SystemBase *)um->um_SB;
	time_t  timestamp = time( NULL );
	
	int pos = 0;
	
	USER_MANAGER_USE( um );
	
	User *usr = um->um_Users;
	
	if( userid > 0 )
	{
		usr = um->um_Users;
		while( usr != NULL )
		{
			DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
	
			if( userid == 0 || usr->u_ID == userid )
			{
				USER_LOCK( usr );
			
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						//DEBUG("[UMWebRequest] Going through sessions, device: %s time %lu timeout time %lu WS ptr %p\n", locses->us_DeviceIdentity, (long unsigned int)(timestamp - locses->us_LoggedTime), l->sl_RemoveSessionsAfterTime, locses->us_WSClients );
				
						if( ( (timestamp - locses->us_LastActionTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSD != NULL )
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
								tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\",\"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
							else
							{
								tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\",\"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
							}
					
							BufStringAddSize( bs, tmp, tmpsize );
						
							pos++;
						}
					}
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
				
				USER_UNLOCK( usr );
			
				break; // we need information only about one user
			}	// userid
			usr = (User *)usr->node.mln_Succ;
		}
	}
	else	// return information about all users
	{
		while( usr != NULL )
		{
			DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
		
			USER_LOCK( usr );
			
			UserSessListEntry  *usl = usr->u_SessionsList;
			while( usl != NULL )
			{
				UserSession *locses = (UserSession *)usl->us;
				if( locses != NULL )
				{
					FBOOL add = FALSE;
					/*
					DEBUG("[UMWebRequest] Going through sessions, "
							"device: %s time %lu timeout time %lu WS ptr %p\n", 
						locses->us_DeviceIdentity, 
						(long unsigned int)(timestamp - locses->us_LastActionTime), 
						l->sl_RemoveSessionsAfterTime, 
						locses->us_WSD
					);
					*/
					
					if( ( (timestamp - locses->us_LastActionTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSD != NULL )
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
							tmpsize = snprintf( tmp, sizeof(tmp), "{"
									"\"ID\":%ld,"
									"\"UUID\":\"%s\","
									"\"username\":\"%s\","
									"\"deviceidentity\":\"%s\""
								"}", 
								usr->u_ID,
								usr->u_UUID,
								usr->u_Name, 
								locses->us_DeviceIdentity 
							);
						}
						else
						{
							tmpsize = snprintf( tmp, sizeof(tmp), ",{"
									"\"ID\":%ld,"
									"\"UUID\":\"%s\","
									"\"username\":\"%s\","
									"\"deviceidentity\":\"%s\""
								"}", 
								usr->u_ID,
								usr->u_UUID,
								usr->u_Name, 
								locses->us_DeviceIdentity 
							);
						}
						
						BufStringAddSize( bs, tmp, tmpsize );

						pos++;
					}
				}
				usl = (UserSessListEntry *)usl->node.mln_Succ;
			}
			
			USER_UNLOCK( usr );
			
			usr = (User *)usr->node.mln_Succ;
		}
	}
	USER_MANAGER_USE( um );
	
	return 0;
}

/**
 * Send message to current user or user pointed by userid
 *
 * @param usm pointer to UserManager
 * @param bs pointer to BufString where results will be stored (as string)
 * @param loggedSession current user serssion
 * @param userid if set then FC will send information to this user
 * @param message information which will be send to user
 * @return 0 when success otherwise error number
 */

int UMSendMessageToUserOrSession( UserManager *um, BufString *bs, UserSession *loggedSession, FULONG userid, char *message )
{
	int msgsize = strlen( message )+1024;
	int msgsndsize = 0;
	char *sndbuffer = FCalloc( msgsize, sizeof(char) );
	
	User *usr = (User *)loggedSession->us_User;
	
	if( userid > 0 )
	{
		usr = UMGetUserByID( um, userid );
	}
	
	if( usr != NULL )
	{
		USER_LOCK( usr );
		
		UserSessListEntry *usle = (UserSessListEntry *)usr->u_SessionsList;
		int msgsndsize = 0;
		while( usle != NULL )
		{
			UserSession *ls = (UserSession *)usle->us;
			if( ls != NULL )
			{
				DEBUG("Found same session, sending msg\n");
				char tmp[ 512 ];
				int tmpsize = 0;
				
				tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\",\"deviceidentity\":\"%s\"}", usr->u_Name, ls->us_DeviceIdentity );
				
				int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":{\"username\":\"%s\",\"message\":\"%s\"}}}", 
				loggedSession->us_User->u_Name , message );
				
				msgsndsize = WebSocketSendMessageInt( ls, sndbuffer, lenmsg );
			}
			usle = (UserSessListEntry *)usle->node.mln_Succ;
		}
		
		USER_UNLOCK( usr );
		
		if( msgsndsize > 0 )
		{
			BufStringAdd( bs, usr->u_Name );
		}
	}
	
	if( sndbuffer != NULL )
	{
		FFree( sndbuffer );
	}
	return 0;
}


/**
 * Return all active users
 *
 * @param um pointer to UserManager
 * @param bs pointer to BufString where string will be stored
 * @param usersOnly group name. If you want to get users from group, put group name. If you want all users, set NULL.
 * @return 0 when success, otherwise error number
 */
int UMGetAllActiveUsers( UserManager *um, BufString *bs, FBOOL usersOnly )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	time_t  timestamp = time( NULL );
	
	USER_MANAGER_USE( um );
	
	int pos = 0;
	User *usr = um->um_Users;
	while( usr != NULL )
	{
		//DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
		
		UserSessListEntry *usl = usr->u_SessionsList;
		while( usl != NULL )
		{
			UserSession *locses = (UserSession *)usl->us;
			if( locses != NULL )
			{
				FBOOL add = FALSE;
				DEBUG("[UMWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
				
				if( ( (timestamp - locses->us_LastActionTime) < sb->sl_RemoveSessionsAfterTime ) && locses->us_WSD != NULL )
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
						tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\",\"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
					}
					else
					{
						tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\",\"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
					}
					
					BufStringAddSize( bs, tmp, tmpsize );
					
					pos++;
				}
			}
			usl = (UserSessListEntry *)usl->node.mln_Succ;
		}
		usr = (User *)usr->node.mln_Succ;
	}
	
	USER_MANAGER_RELEASE( um );
	return 0;
}

/**
 * Remove user from UM list
 *
 * @param um pointer to UserManager
 * @param usr pointer to user which will be removed from list
 */
void UMRemoveUserFromList( UserManager *um,  User *usr )
{
	if( um->um_Users == NULL )
	{
		return;
	}
	
	USER_MANAGER_CHANGE_ON( um );
	
	if( usr == um->um_Users )
	{
		
	}
	else
	{
		User *prevUsr = um->um_Users;
		User *actUsr = (User *)um->um_Users->node.mln_Succ;
		
		while( actUsr != NULL )
		{
			if( actUsr == usr )
			{
				prevUsr->node.mln_Succ = actUsr->node.mln_Succ;
				break;
			}
			prevUsr = actUsr;
			actUsr = (User *)actUsr->node.mln_Succ;
		}
	}
	USER_MANAGER_CHANGE_OFF( um );
}



/**
 * Send door notification
 *
 * @param um pointer to UserManager
 * @param notif pointer to DoorNotification
 * @param ses UserSession
 * @param device pointer to RootDevice
 * @param path path to file/folder
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL UMSendDoorNotification( UserManager *um, void *notif, UserSession *ses, File *device, char *path )
{
	//return FALSE;
	
	SystemBase *sb = (SystemBase *)um->um_SB;
	DoorNotification *notification = (DoorNotification *)notif;
	
	char *tmpmsg = FCalloc( 2048, 1 );
	if( tmpmsg == NULL )
	{
		FERROR("Cannot allocate memory for buffer\n");
		return FALSE;
	}
    
	//
	// Go through logged users
	//
    
	DEBUG("[UMSendDoorNotification] CHECK11\n");
	USER_MANAGER_USE( um );
	
	User *usr = um->um_Users;
	while( usr != NULL )
	{
		// if notification should be addressed to user
		DEBUG("[USMSendDoorNotification] going through users, user: %lu\n", usr->u_ID );
		if( usr->u_ID == notification->dn_OwnerID )
		{
			USER_LOCK( usr );
			
			char *uname = usr->u_Name;
			int len = snprintf( tmpmsg, 2048, "{\"type\":\"msg\",\"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\"}}}", device->f_ID, device->f_Name, path, uname  );
			
			DEBUG("[USMSendDoorNotification] found ownerid %lu\n", usr->u_ID );
			
			// go through all User Sessions and send message
			UserSessListEntry *le = usr->u_SessionsList;
			while( le != NULL )
			{
				UserSession *uses = (UserSession *)le->us;
					
				// do not send message to sender
				FBOOL sendNotif = TRUE;
				if( uses == NULL )
				{
					sendNotif = FALSE;
				}
			
				if( sendNotif == TRUE )
				{
					DEBUG("[USMSendDoorNotification] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->UserSessionWebsocketWrite, sb, uses->us_DeviceIdentity );
				
					UserSessionWebsocketWrite( uses, (unsigned char *)tmpmsg, len, LWS_WRITE_TEXT );

					//
					// send message to all remote users
					//
					
					RemoteUser *ruser = usr->u_RemoteUsers;
					while( ruser != NULL )
					{
						DEBUG("[USMSendDoorNotification] Remote user connected: %s\n", ruser->ru_Name );
						RemoteDrive *rdrive = ruser->ru_RemoteDrives;
				
						while( rdrive != NULL )
						{
							DEBUG("[USMSendDoorNotification] Remote drive connected: %s %lu\n", rdrive->rd_LocalName, rdrive->rd_DriveID );
					
							if( rdrive->rd_DriveID == device->f_ID )
							{
								int fnamei;
								int fpathi;
								int funamei;
								int fdriveid;
					
								char *fname =  createParameter( "devname", rdrive->rd_RemoteName, &fnamei );
								char *fpath =  createParameter( "path", path, &fpathi );
								char *funame =  createParameter( "usrname", ruser->ru_Name, &funamei );
								char *fdeviceid = createParameterFULONG( "deviceid", rdrive->rd_RemoteID, &fdriveid );
						
								MsgItem tags[] = {
									{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
									{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
									{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
									{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
									{ ID_FNOT, (FULONG)0 , MSG_INTEGER_VALUE },
									{ ID_PARM, (FULONG)0, MSG_GROUP_START },
									{ ID_PRMT, (FULONG) fnamei, (FULONG)fname },
									{ ID_PRMT, (FULONG) fpathi, (FULONG)fpath },
									{ ID_PRMT, (FULONG) funamei, (FULONG)funame },
									{ ID_PRMT, (FULONG) fdriveid, (FULONG)fdeviceid },
									{ MSG_GROUP_END, 0,  0 },
									{ TAG_DONE, TAG_DONE, TAG_DONE }
								};
						
								DataForm *df = DataFormNew( tags );
								if( df != NULL )
								{
									//DEBUG("[USMSendDoorNotification] Register device, send notification\n");
							
									BufString *result = SendMessageAndWait( ruser->ru_Connection, df );
									if( result != NULL )
									{
										//DEBUG("[USMSendDoorNotification] Received response\n");
										BufStringDelete( result );
									}
									DataFormDelete( df );
								}
				
								FFree( fdeviceid );
								FFree( fname );
								FFree( fpath );
								FFree( funame );
								break;
							} // if driveID = deviceID
							rdrive = (RemoteDrive *)rdrive->node.mln_Succ;
						} // while remote drives
						ruser = (RemoteUser *)ruser->node.mln_Succ;
					} // while remote users
					
					//
					// Notify user sessions in cluster
					//
					
					Http *request = HttpNew();
					if( request != NULL )
					{
						request->http_ParsedPostContent = HashmapNew();
						request->http_Uri = UriNew();
						
						//request->http_Uri->uri_QueryRaw = StringDuplicateN( "fschange", 8 );
						
						char value[ 32 ];
						snprintf( value, sizeof(value), "%ld", device->f_ID );
						
						HashmapPut( request->http_ParsedPostContent, "sessionid", "test" );
						HashmapPut( request->http_ParsedPostContent, "fschange", "true" );
						HashmapPut( request->http_ParsedPostContent, "devid", value );
						HashmapPut( request->http_ParsedPostContent, "devname", device->f_Name );
						HashmapPut( request->http_ParsedPostContent, "owner", usr->u_Name );
						HashmapPut( request->http_ParsedPostContent, "path", path );
						
						BufString *res = SendMessageToSessionsAndWait( sb, usr->u_ID, request );
						if( res != NULL )
						{
							DEBUG("RESPONSE: %s\n", res->bs_Buffer );
							BufStringDelete( res );
						}
						
						//HttpFree( request );
					}
					
				} // sendNotif == TRUE
				le = (UserSessListEntry *)le->node.mln_Succ;
			} // while loop, session
			
			DEBUG("[UMSendDoorNotification] unlock user\n");
			
			USER_UNLOCK( usr );

			DEBUG("[UMSendDoorNotification] CHECK12\n");
		}
		usr = (User *)usr->node.mln_Succ;
	}
	
	USER_MANAGER_RELEASE( um );
	
	FFree( tmpmsg );
	return TRUE;
}

/**
 * Send user changes notification
 *
 * @param um pointer to UserManager
 * @param ses UserSession
 * @return 0 when there is no error, otherwise error number
 */
int UMSendUserChangesNotification( UserManager *um, UserSession *ses )
{
	SystemBase *sb = (SystemBase *)um->um_SB;

	char *tmpmsg = FCalloc( 2048, 1 );
	if( tmpmsg == NULL )
	{
		FERROR("Cannot allocate memory for buffer\n");
		return 1;
	}
    
	//
	// Go through logged users
	//
    
	USER_MANAGER_USE( um );
	
	User *usr = ses->us_User;

	USER_LOCK( usr );
	
	int len = snprintf( tmpmsg, 2048, "{\"type\":\"msg\",\"data\":{\"type\":\"user-change\",\"data\":{\"username\":\"%s\"}}}", usr->u_Name );
	
	// go through all User Sessions and send message
	UserSessListEntry *le = usr->u_SessionsList;
	while( le != NULL )
	{
		UserSession *uses = (UserSession *)le->us;
		
		// do not send message to sender
		FBOOL sendNotif = TRUE;
		if( uses == NULL )
		{
			sendNotif = FALSE;
		}
		
		if( sendNotif == TRUE )
		{
			DEBUG("[USMSendDoorNotification] Send message %s\n", tmpmsg );
		
			UserSessionWebsocketWrite( uses, (unsigned char *)tmpmsg, len, LWS_WRITE_TEXT );

		} // sendNotif == TRUE
		le = (UserSessListEntry *)le->node.mln_Succ;
	} // while loop, session
	
	DEBUG("[UMSendDoorNotification] unlock user\n");
	
	USER_UNLOCK( usr );

	USER_MANAGER_RELEASE( um );
	
	FFree( tmpmsg );
	return 0;
}

//
//
//

typedef struct RemoveEntry
{
	UserSession *ses;
	MinNode node;
}RemoveEntry;

/**
 * Remove old User Sessions
 *
 * @param lsb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */
int UMRemoveOldSessions( void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;
	UserManager *um = (UserManager *)sb->sl_UM;

	time_t acttime = time( NULL );
	
	Log( FLOG_INFO, "[UMRemoveOldSessions] start\n" );

	USER_MANAGER_USE( um );
	
	User *usr = um->um_Users;
	while( usr != NULL )
	{
		USER_LOCK( usr );
		RemoveEntry *rootEntries = NULL;
		
		DEBUG("[UMRemoveOldSessions] found ownerid %lu\n", usr->u_ID );
		
		// go through all User Sessions and send message
		UserSessListEntry *le = usr->u_SessionsList;
		while( le != NULL )
		{
			UserSession *uses = (UserSession *)le->us;
			
			if( ( ( acttime - uses->us_LastActionTime ) > sb->sl_RemoveSessionsAfterTime ) )
			{
				RemoveEntry *re = FCalloc( 1, sizeof( RemoveEntry ) );
				if( re != NULL )
				{
					re->ses = uses;
					re->node.mln_Succ = (MinNode *)rootEntries;
				}
				rootEntries = re;
			}
			
			le = (UserSessListEntry *)le->node.mln_Succ;
		}
		
		USER_UNLOCK( usr );
		
		while( rootEntries != NULL )
		{
			RemoveEntry *old = rootEntries;
			rootEntries = (RemoveEntry *)rootEntries->node.mln_Succ;
			
			USMUserSessionRemove( sb->sl_USM, old->ses );
			UserRemoveSession( usr, old->ses );	// we want to remove it from user first
			USMSessionsDeleteDB( sb->sl_USM, old->ses->us_SessionID );
			UserSessionDelete( old->ses );
			FFree( old );
		}
		
		usr = (User *)usr->node.mln_Succ;
	}
	
	USER_MANAGER_RELEASE( um );
	
	Log( FLOG_INFO, "[UMRemoveOldSessions] end\n" );
	
	return 0;
}

/**
 * Remove all users from group
 *
 * @param um pointer to UserManager
 * @param groupid id of group from which users will be removed
 */
void UMRemoveUsersFromGroup( UserManager *um, FUQUAD groupid )
{
	USER_MANAGER_USE( um );

	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		USER_LOCK( tuser );
		
		if( tuser->u_UserGroupLinks != NULL )
		{
			// if group is first, lets just remove it quickly
			if( tuser->u_UserGroupLinks->ugl_GroupID == groupid )
			{
				UserGroupLink *uglrem = tuser->u_UserGroupLinks;
				tuser->u_UserGroupLinks = (UserGroupLink *)tuser->u_UserGroupLinks->node.mln_Succ;
				FFree( uglrem );
			}
			else
			{
				UserGroupLink *prevugl = tuser->u_UserGroupLinks;
				UserGroupLink *ugl = (UserGroupLink *)tuser->u_UserGroupLinks->node.mln_Succ;
				while( ugl != NULL )
				{
					// seems current group is group which we wanted to find
					if( ugl->ugl_GroupID == groupid )
					{
						// so previous group will get next pointer from current group
						// becaouse current pointer will be released
						prevugl->node.mln_Succ = ugl->node.mln_Succ;
						FFree( ugl );
						break;
					}
					
					prevugl = ugl;
					ugl = (UserGroupLink *)ugl->node.mln_Succ;
				}
			}
		}
		
		USER_UNLOCK( tuser );
		
		tuser = (User *)tuser->node.mln_Succ;
	}

	USER_MANAGER_RELEASE( um );
}


/**
 * Notify all users in group about changes
 *
 * @param um pointer to UserManager
 * @param groupid id of group which users 
 * @param type type of notification : 0 -mountlist changed
 */

#define UMNOTIFY_REQ_MSG_LEN 2048

void UMNotifyAllUsersInGroup( UserManager *um, FQUAD groupid, int type )
{
	char *tmpmsg = FCalloc( UMNOTIFY_REQ_MSG_LEN, 1 );
	if( tmpmsg == NULL )
	{
		FERROR("Cannot allocate memory for buffer\n");
		return;
	}
	DEBUG("[UMNotifyAllUsersInGroup] START\n" );
    
	//
	// Go through logged users
	//

	USER_MANAGER_USE( um );
	
	SystemBase *l = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		snprintf( tmpmsg, UMNOTIFY_REQ_MSG_LEN, "SELECT DISTINCT UserID from FUserToGroup WHERE UserGroupID=%ld", groupid );
		
		void *result = sqlLib->Query(  sqlLib, tmpmsg );
		if( result != NULL )
		{
			char **row;

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				char *end;
				FUQUAD id = 0;
				if( row[ 0 ] != NULL )
				{
					id = strtoll( row[ 0 ], &end, 0 );
					if( id > 0 )
					{
						DEBUG("[UMNotifyAllUsersInGroup] find and notify user by id: %ld\n", id );
						
						User *usr = um->um_Users;
						while( usr != NULL )
						{
							if( usr->u_ID == id && usr->u_SessionsList != NULL )	// if this is user which we trying to find
							{
								if( type == 0 )
								{
									UserNotifyFSEvent2( usr, "refresh", "Mountlist:" );
								}
								break;	// user found. There is no need to search for him
							}
							usr = (User *)usr->node.mln_Succ;
						}
					}
				}
				
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	
	USER_MANAGER_RELEASE( um );
	
	FFree( tmpmsg );
}

/**
 * Add existing users to new groups
 *
 * @param um pointer to UserManager
 * @param groupid id of group which users 
 */

#define LOCAL_SQL_LEN 256

void UMAddExistingUsersToGroup( UserManager *um, UserGroup *ug )
{
	char *tmpmsg = FCalloc( LOCAL_SQL_LEN, 1 );
	if( tmpmsg == NULL )
	{
		FERROR("Cannot allocate memory for buffer\n");
		return;
	}
    
	//
	// Go through logged users and add them to a group
	//
	
	DEBUG("[UMAddExistingUsersToGroup] start\n");

	USER_MANAGER_USE( um );
	
	SystemBase *l = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		snprintf( tmpmsg, LOCAL_SQL_LEN, "SELECT DISTINCT UserID from FUserToGroup WHERE UserGroupID=%ld", ug->ug_ID );
		
		void *result = sqlLib->Query(  sqlLib, tmpmsg );
		if( result != NULL )
		{
			char **row;

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				char *end;
				FUQUAD id = 0;
				if( row[ 0 ] != NULL )
				{
					id = strtoll( row[ 0 ], &end, 0 );
					if( id > 0 )
					{
						User *usr = um->um_Users;
						while( usr != NULL )
						{
							if( usr->u_ID == id )	// if this is user which we trying to find
							{
								DEBUG("[UMAddExistingUsersToGroup] used: %s was added to group: %s\n", usr->u_Name, ug->ug_Name );
								UserAddToGroup( usr, ug );
								break;		// we found user, we can stop
							}
							usr = (User *)usr->node.mln_Succ;
						}
					}
				}
				
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	
	USER_MANAGER_RELEASE( um );
	
	DEBUG("[UMAddExistingUsersToGroup] end\n");
	
	FFree( tmpmsg );
}
