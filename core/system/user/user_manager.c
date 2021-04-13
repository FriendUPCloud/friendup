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
#include "usersession_manager.h"

#include <system/systembase.h>
#include <util/sha256.h>
#include <system/fsys/device_handling.h>
#include <util/session_id.h>
#include <system/sas/sas_session.h>

#define USE_HASHMAP_TO_HOLD_USERS

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
		
#ifdef USE_HASHMAP_TO_HOLD_USERS
		sm->um_UsersMapByID = HashmapKIntNew();
#endif
		
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
	Log( FLOG_INFO, "Release users\n");
	
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
			
			UserDelete( remusr );
			
			remusr = NULL;
		}
	}
	
	RemoteUserDeleteAll( smgr->um_RemoteUsers );
	
#ifdef USE_HASHMAP_TO_HOLD_USERS
	HashmapKIntFree( smgr->um_UsersMapByID );
#endif
	
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
		SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
		if( sqlLib != NULL )
		{
			sqlLib->Update( sqlLib, UserDesc, usr );
	
			sb->DropDBConnection( sb, sqlLib );
		}
		else
		{
			FERROR("[UMUserUpdateDB] Cannot get user, mysql.library was not open\n");
			return 1;
		}
	}
	else
	{
		FERROR("[UMUserUpdateDB] usr pointer is equal to NULL\n");
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
	
	char tmpQuery[ 255 ];

	SystemBase *sb = (SystemBase *)smgr->um_SB;
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	int actapp = 0;
	
	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserApplication WHERE UserID='%lu'", usr->u_ID );

		void *result = sqlLib->Query( sqlLib, tmpQuery );
		if( result == NULL )
		{
			sb->DropDBConnection( sb, sqlLib );
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
				/*
				// Get single user application structure
				UserApplication *ap = UserAppNew( rid, aid, row[3], row[4] );
			
				if( ap != NULL )
				{
					ap->node.mln_Succ = (MinNode *) usr->u_Applications;
					usr->u_Applications = ap;
				}
				*/
			} 
			j++;
		}

		sqlLib->FreeResult( sqlLib, result );
	
		DEBUG( "[UMAssignApplicationsToUser] %d applications added.\n", actapp );
	
		// Return with amount of application
		sb->DropDBConnection( sb, sqlLib );
	}
	return actapp;
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
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("[UMUserGetByName] Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = sb->sl_UM->um_Users;
	while( user != NULL )
	{
		if( strcmp( user->u_Name, name ) == 0 )
		{
			break;
		}
		user = (User *)user->node.mln_Succ;
	}
	
	sb->DropDBConnection( sb, sqlLib );
	
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
	DEBUG("[UMUserGetByNameDB] Start\n");
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		char tmpQuery[ 1024 ];
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," Name = '%s'", name );
	
		int entries;
		user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
		// No need for sql lib anymore here
		sb->DropDBConnection( sb, sqlLib );

		if( user != NULL )
		{
			{
				DEBUG("[UMUserGetByNameDB] User found %s  id %ld\n", user->u_Name, user->u_ID );
				UGMAssignGroupToUser( sb->sl_UGM, user );
				UMAssignApplicationsToUser( um, user );
				user->u_MountedDevs = NULL;
			}
		}
	}
	else
	{
		FERROR("[UMUserGetByNameDB] Cannot get user, mysql.library was not open\n");
		return NULL;
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("[UMUserGetByIDDB] Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];

	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ID = '%lu'", id );
	
	int entries = 0;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	DEBUG("[UMUserGetByIDDB] User poitner %p  number of entries %d\n", user, entries );
	// No need for sql lib anymore here
	sb->DropDBConnection( sb, sqlLib );

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
int UMUserCreate( UserManager *smgr, Http *r __attribute__((unused)), User *usr )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	
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

	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	int val = 0;
	if( sqlLib != NULL )
	{
		val = sqlLib->Save( sqlLib, UserDesc, usr );
		sb->DropDBConnection( sb, sqlLib );
	}
	else
	{
		FERROR("[UMUserCreate] Cannot create user, mysql.library was not opened!\n");
		return 2;
	}
	return val;
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
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
			sb->DropDBConnection( sb, sqlLib );
			return TRUE;
		}
		sqlLib->FreeResult( sqlLib, res );
	}
	
	sb->DropDBConnection( sb, sqlLib );
	
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
	
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	if( sqlLib != NULL )
	{
		int res = sqlLib->NumberOfRecords( sqlLib, UserDesc,  query );
		if( res <= 0 )
		{
			sb->DropDBConnection( sb, sqlLib );
			return FALSE;
		}
	
		sb->DropDBConnection( sb, sqlLib );
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
	
	User *tuser = NULL;
	if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
	{
		User *tuser = um->um_Users;
		while( tuser != NULL )
		{
			// Check both username and password
			if( strcmp( name, tuser->u_Name ) == 0 )
			{
				FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
				return tuser;
			}
			tuser = (User *)tuser->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
	}
	
	/*
	// user is not in memory, load it
	
	tuser = UMGetUserByNameDB( um, name );
	if( tuser != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
		{
			tuser->node.mln_Succ = (MinNode *)um->um_Users;
			um->um_Users = tuser;
			FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
		}
	}
	*/
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
	
	if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
	{
		tuser = um->um_Users;
		while( tuser != NULL )
		{
			// Check both username and password
			if( tuser->u_ID == id )
			{
				FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
				return tuser;
			}
			tuser = (User *)tuser->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
	}
	
	/*
	// user is not in memory, load it
	
	tuser = UMGetUserByIDDB( um, id );
	if( tuser != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
		{
			tuser->node.mln_Succ = (MinNode *)um->um_Users;
			um->um_Users = tuser;
			FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
		}
	}
	*/
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen(name)+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		sqlLib->SNPrintF( sqlLib, where, len, " `Name`='%s'", name );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->DropDBConnection( sb, sqlLib );

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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen( uuid )+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		sqlLib->SNPrintF( sqlLib, where, len, " `UniqueID`='%s'", uuid );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->DropDBConnection( sb, sqlLib );

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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	User *user = NULL;
	
	if( sqlLib != NULL )
	{
		int len = strlen( uuid )+128;
		char *where = FMalloc( len );
	
		DEBUG("[UMGetUserByNameDB] start\n");

		sqlLib->SNPrintF( sqlLib, where, len, " `UniqueID`='%s'", uuid );
	
		int entries;
	
		user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
		sb->DropDBConnection( sb, sqlLib );

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
FULONG UMGetUserIDByName( UserManager *um, const char *name )
{
	User *usr = UMGetUserByName( um, name );
	if( usr == NULL )
	{
		SystemBase *sb = (SystemBase *)um->um_SB;
		SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
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
						sb->DropDBConnection( sb, sqlLib );
						return id;
					}
				}
				sqlLib->FreeResult( sqlLib, result );
			}
			sb->DropDBConnection( sb, sqlLib );
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
	
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	sqlLib->SNPrintF( sqlLib, where, sizeof(where), " `ID` = '%lu'", id );
	
	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
	sb->DropDBConnection( sb, sqlLib );
	
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
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
					sb->DropDBConnection( sb, sqlLib );

					UGMAssignGroupToUser( sb->sl_UGM, user );
					UMAssignApplicationsToUser( um, user );
					user->u_MountedDevs = NULL;
					
					return user;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		sb->DropDBConnection( sb, sqlLib );
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
	DEBUG("[UMGetAllUsersDB] start\n");
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, NULL, &entries );
	sb->DropDBConnection( sb, sqlLib );
	
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
	User *lu =  UMGetUserByID( um, usr->u_ID );
	if( lu == NULL  )
	{
		if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
		{
			usr->node.mln_Succ  = (MinNode *) um->um_Users;
			if( um->um_Users != NULL )
			{
				um->um_Users->node.mln_Pred = (MinNode *)usr;
			}
			um->um_Users = usr;
			FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
		}
	}
	else
	{
		INFO("[UMAddUser] User found, will not be added\n");
	}
	
	return  0;
}

int killUserSession( SystemBase *l, UserSession *ses );

/**
 * Remove user from FC user list
 *
 * @param um pointer to UserManager
 * @param usr user which will be removed from FC user list
 * @param userSessionManager Session manager of the currently running instance
 * @return 0 when success, otherwise error number
 */
int UMRemoveUser( UserManager *um, User *usr, UserSessionManager *userSessionManager )
{
	User *userCurrent = NULL; //current element of the linked list, set to the beginning of the list
	User *userPrevious = NULL; //previous element of the linked list

	if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
	{
		usr->u_InUse++;
		FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
	}
	
	FULONG userId = usr->u_ID;

	UserSession *sessionToDelete;
	while( ( sessionToDelete = USMGetSessionByUserID( userSessionManager, userId ) ) != NULL )
	{
		killUserSession( um->um_SB, sessionToDelete );
		//int status = USMUserSessionRemove( userSessionManager, sessionToDelete );
		//DEBUG("%s removing session at %p, status %d\n", __func__, sessionToDelete, status);
	}

	unsigned int n = 0;
	FBOOL found = FALSE;
	
	if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
	{
		userCurrent = um->um_Users;
		while( userCurrent != NULL )
		{
			if( userCurrent == usr )
			{
				DEBUG("[UMRemoveUser] %s removing user at %p, place in list %d\n", __func__, userCurrent, n);
				found = true;
				n++;
				break;
			}
			userPrevious = userCurrent;
			userCurrent = (User *)userCurrent->node.mln_Succ; //this is the next element in the linked list
		}
		FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
	}
	
	if( found == TRUE )
	{ //the requested user has been found in the list
		if( userPrevious )
		{ //we are in the middle or at the end of the list
			DEBUG("[UMRemoveUser] Deleting from the middle or end of the list\n");
			userPrevious->node.mln_Succ = userCurrent->node.mln_Succ;
		}
		else
		{ //we are at the very beginning of the list
			um->um_Users = (User *)userCurrent->node.mln_Succ; //set the global start pointer of the list
		}
		
		if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
		{
			usr->u_InUse--;
			FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
		}
		
		UserDelete( userCurrent );
		
		return 0;
	}
	else
	{
		if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
		{
			usr->u_InUse--;
			FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
		}
	}
	
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
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
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
		
		sb->DropDBConnection( sb, sqlLib );
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
 * @return 0 when success otherwise error number
 */
int UMStoreLoginAttempt( UserManager *um, const char *name, const char *info, const char *failReason )
{
	UserLogin ul;
	SystemBase *sb = (SystemBase *)um->um_SB;
	User *usr = UMGetUserByNameDB( um, name );
	
	DEBUG("[UMStoreLoginAttempt] start\n");
	
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
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
		
		sqlLib->Save( sqlLib, UserLoginDesc, &ul );
		
		sb->DropDBConnection( sb, sqlLib );
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
 * @param numberOfFail if last failed logins will have same value as this variable then login possibility will be blocked for some period of time
 * @param lastLoginTime in this field infomration about last login time will be stored
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL UMGetLoginPossibilityLastLogins( UserManager *um, const char *name, int numberOfFail, time_t *lastLoginTime )
{
	FBOOL canILogin = FALSE;
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMGetLoginPossibilityLastLogins] username %s\n", name );
		// temporary solution, using MYSQL connection
		char *query = FCalloc( 1, 2048 );
		time_t tm = time( NULL );
		
		// we are checking failed logins in last hour
		sqlLib->SNPrintF( sqlLib, query, 2048, "SELECT `LoginTime`,`Failed` FROM `FUserLogin` WHERE `Login`='%s' AND (`LoginTime` > %lu AND `LoginTime` <= %lu) ORDER BY `LoginTime` DESC", name, tm-(3600l), tm );
		
		void *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			char **row;
			int i = 0;
			FBOOL goodLogin = FALSE;
			
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
					break;
				}
				
				i++;
				if( i >= numberOfFail )
				{
					break;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
			
			if( i  <  numberOfFail )
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
		
		sb->DropDBConnection( sb, sqlLib );
	}
	return canILogin;
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
		SQLLibrary *sqlLib = sb->GetDBConnection( sb );
	
		if( sqlLib != NULL )
		{
			User *user = NULL;

			int entries;
			user = sqlLib->Load( sqlLib, UserDesc, "Name='apiuser' LIMIT 1", &entries );

			if( user != NULL )
			{
				sb->DropDBConnection( sb, sqlLib );
			
				DEBUG("[UMCheckAndLoadAPIUser] User found %s  id %ld\n", user->u_Name, user->u_ID );
				UGMAssignGroupToUser( sb->sl_UGM, user );
				UMAssignApplicationsToUser( um, user );
				user->u_MountedDevs = NULL;
				
				UMAddUser( sb->sl_UM, user );
				tuser = user;
			
				// API user have only one session
				if( user->u_SessionsList == NULL )
				{
					// we now generate dummy session
					//UserSession *ses = UserSessionNew( sb, "api", "api" );
					UserSession *ses = UserSessionNew( sb, NULL, "api" );
					if( ses != NULL )
					{
						ses->us_UserID = user->u_ID;
						ses->us_LoggedTime = time( NULL );
				
						UserAddSession( user, ses );
						USMSessionSaveDB( sb->sl_USM, ses );
					
						USMUserSessionAdd( sb->sl_USM, ses );
					}
				}

				result = 0;
			}
			else
			{
				sb->DropDBConnection( sb, sqlLib );
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
	SQLLibrary *sqlLib = l->GetDBConnection( l );
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
		l->DropDBConnection( l, sqlLib );
		
		BufStringAddSize( bs, "]", 1 );
	}
	return 0;
}

/**
 * Find user by name, add to SAS and send message to all user sessions that user was added to SAS
 *
 * @param um pointer to UserManager
 * @param uname user name
 * @param las pointer to application session
 * @param appName application name
 * @param msg message which will be send to sessions
 * @param usersAdded pointer to string which will contain users added to SAS
 * @param listNotEmpty set to TRUE if list already contain users
 * @return 0 when user was added to SAS, otherwise error number
 */
int UMFindUserByNameAndAddToSas( UserManager *um, char *uname, void *las, char *appName, char *msg, BufString *usersAdded, FBOOL listNotEmpty )
{
	SASSession *as = (SASSession *)las;
	SystemBase *sb = (SystemBase *)um->um_SB;
	char tmp[ 512 ];

	User *tuser = NULL;
	if( FRIEND_MUTEX_LOCK( &(um->um_Mutex) ) == 0 )
	{
		tuser = um->um_Users;
		while( tuser != NULL )
		{
			// Check both username and password
			if( strcmp( tuser->u_Name, uname ) == 0 )
			{
				FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
				
				if( FRIEND_MUTEX_LOCK( &(tuser->u_Mutex) ) == 0 )
				{
					tuser->u_InUse++;
					FRIEND_MUTEX_UNLOCK( &(tuser->u_Mutex) );
				}
				
				FBOOL userAddedToSas = FALSE;
				
				UserSessListEntry *usle = tuser->u_SessionsList;
				while( usle != NULL )
				{
					if( usle->us != NULL )
					{
						UserSession *us = (UserSession *)usle->us;
						if( us->us_WSD != NULL )
						{
							SASUList *sli = SASSessionAddUser( as, us, NULL );

							DEBUG("[UMFindUserByNameAndAddToSas] newsession will be added %p\n", us );

							if( sli != NULL )
							{
								char tmpmsg[ 2048 ];
								int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->sas_SASID, msg, tuser->u_Name , appName );

								WebSocketSendMessageInt( us, tmpmsg, len );
								
								int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", tuser->u_Name, us->us_DeviceIdentity );
								if( listNotEmpty == TRUE )
								{
									BufStringAddSize( usersAdded, ",", 1 );
									BufStringAddSize( usersAdded, tmp, tmpsize );
								}
								else
								{
									// if list was empty now its not
									listNotEmpty = FALSE;
								}
								userAddedToSas = TRUE;
							}
						}
						else	// Websocket connection not found
						{
							// user session was not added to SAS, beacouse websockets were not available
							int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"not invited\"}", tuser->u_Name, us->us_DeviceIdentity );
							if( listNotEmpty == TRUE )
							{
								BufStringAddSize( usersAdded, ",", 1 );
								BufStringAddSize( usersAdded, tmp, tmpsize );
							}
							else
							{
								// if list was empty now its not
								listNotEmpty = FALSE;
							}
						}
					}
					usle = (UserSessListEntry *)usle->node.mln_Succ;
				}	// go through all sessions attached to user
				
				if( userAddedToSas == TRUE )
				{
					if( FRIEND_MUTEX_LOCK( &(tuser->u_Mutex) ) == 0 )
					{
						tuser->u_InUse--;
						FRIEND_MUTEX_UNLOCK( &(tuser->u_Mutex) );
					}
					
					return 0;
				}
				
				// going to check another user, so we have to unlock current one
				
				if( FRIEND_MUTEX_LOCK( &(tuser->u_Mutex) ) == 0 )
				{
					tuser->u_InUse--;
					FRIEND_MUTEX_UNLOCK( &(tuser->u_Mutex) );
				}
				FRIEND_MUTEX_LOCK( &(um->um_Mutex) );
			}
			tuser = (User *)tuser->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(um->um_Mutex) );
	}
	
	return 1;
}

/**
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
	
	SQLLibrary *sqllib = sb->GetDBConnection( sb );
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
				
				UserDeviceMount( sb, tmpUser, session, 1, TRUE, &err, FALSE );
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
		sb->DropDBConnection( sb, sqllib );
	}
	
	Log( FLOG_INFO, "----------------------------------------------------\n");
	Log( FLOG_INFO, "---------Mount user group devices-------------------\n");
	Log( FLOG_INFO, "----------------------------------------------------\n");
		
	return 0;
}
