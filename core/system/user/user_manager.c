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
	User *usr = smgr->um_Users;
	User *remusr = usr;
	Log( FLOG_INFO,  "Release users\n");
	
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
					DeviceRelease( smgr->um_SB, remdev );
					/*
					FHandler *fsys = (FHandler *)remdev->f_FSys;

					if( fsys != NULL && fsys->UnMount != NULL )
					{
						//
						// we are releasing device memory
						//
						
						if( fsys->Release( fsys, remdev ) != 0 )
						{
							DEBUG("[UMDelete] Device released\n");
						}
					}
					else
					{
						FERROR("Cannot free FSYS (null)\n");
					}
					*/
				
					FileDelete( remdev );
					remdev = NULL;
				}
			}

			DEBUG("[UMDelete] Free user %s\n", remusr->u_Name );
			
			UserDelete( remusr );
			
			remusr = NULL;
		}
	}
	
	smgr->um_Users = NULL;
	
	RemoteUserDeleteAll( smgr->um_RemoteUsers );
	
	//if( smgr != NULL )
	{
		UserGroupDeleteAll( smgr->um_SB, smgr->um_UserGroups );
		/*
		UserGroup *g = smgr->um_UserGroups, *rg;
		DEBUG("[UMDelete] Cleaning groups\n");
		while( g!= NULL )	// remove global groups
		{
			rg = g;
			g = (UserGroup *)g->node.mln_Succ;
			if( rg != NULL )
			{
				//if( rg->ug_ID ){ free( rg->ug_ID ); }
				if( rg->ug_Name )
				{
					FFree( rg->ug_Name ); 
				}
				if( rg->ug_Type != NULL )
				{
					FFree( rg->ug_Type );
				}
				FFree( rg );
			}
		}
		*/
		smgr->um_UserGroups = NULL;
		
		FFree( smgr );
	}
}

/**
 * Assign User to his groups in FC
 *
 * @param smgr pointer to UserManager
 * @param usr pointer to user structure to which groups will be assigned
 * @return 0 when success, otherwise error number
 */
int UMAssignGroupToUser( UserManager *smgr, User *usr )
{
	char tmpQuery[ 512 ];
	DEBUG("[UMAssignGroupToUser] Assign group to user\n");

	//sprintf( tmpQuery, "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );
	if( smgr == NULL )
	{
		return 1;
	}
	
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );

	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );

		void *result = sqlLib->Query(  sqlLib, tmpQuery );
	
		if ( result == NULL ) 
		{
			FERROR("SQL query result is empty!\n");
			sb->LibrarySQLDrop( sb, sqlLib );
			return 2;
		}
		
		FBOOL isAdmin = FALSE;
		FBOOL isAPI = FALSE;

		char **row;
		int j = 0;
	
		if( usr->u_Groups )
		{
			FFree( usr->u_Groups );
			usr->u_Groups = NULL;
			usr->u_GroupsNr = 0;
		}
	
		int rows = sqlLib->NumberOfRows( sqlLib, result );
		if( rows > 0 )
		{
			usr->u_Groups = FCalloc( rows, sizeof( UserGroup *) );
		}
	
		DEBUG("[UMAssignGroupToUser] Memory for %d  groups allocated\n", rows );
	
		if( usr->u_Groups != NULL )
		{
			int pos = 0;
			FULONG ID = 0;
			usr->u_GroupsNr = rows;
		
			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				DEBUG("[UMAssignGroupToUser] Going through loaded rows %d -> %s\n", j, row[ 0 ] );
				{
					FULONG gid = atol( row[ 0 ] );
				
					DEBUG("[UMAssignGroupToUser] User is in group %lu\n", gid  );
				
					UserGroup *g = smgr->um_UserGroups;
					while( g != NULL )
					{
						if( g->ug_ID == gid )
						{
							if( strcmp( g->ug_Name, "Admin" ) == 0 )
							{
								isAdmin = TRUE;
							}
							
							if( strcmp( g->ug_Name, "API" ) == 0 )
							{
								isAPI = TRUE;
							}
							
							UserGroupAddUser( g, usr );
							DEBUG("[UMAssignGroupToUser] Added group %s to user %s\n", g->ug_Name, usr->u_Name );
							usr->u_Groups[ pos++ ] = g;
						}
						g  = (UserGroup *) g->node.mln_Succ;
					}
				}
			}
		}
		
		usr->u_IsAdmin = isAdmin;
		usr->u_IsAPI = isAPI;
	
		sqlLib->FreeResult( sqlLib, result );

		sb->LibrarySQLDrop( sb, sqlLib );
	}
	
	return 0;
}

/**
 * Assign User to his groups in FC.
 * Groups are provided by string (comma is separator)
 *
 * @param um pointer to UserManager
 * @param usr pointer to user structure to which groups will be assigned
 * @param groups groups provided as string, where comma is separator between group names
 * @return 0 when success, otherwise error number
 */
int UMAssignGroupToUserByStringDB( UserManager *um, User *usr, char *groups )
{
	if( groups == NULL )
	{
		FERROR("Group value is empty, cannot setup groups!\n");
		return 1;
	}
	char tmpQuery[ 512 ];
	
	DEBUG("[UMAssignGroupToUserByStringDB] Assign group to user start NEW GROUPS: %s\n", groups );
	
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get mysql.library slot\n");
		return -10;
	}
	
	// checking  how many groups were passed
	
	int i;
	int commas = 1;
	int glen = strlen( groups );
	
	if( groups != NULL )
	{
		for( i=0 ; i < glen; i++ )
		{
			if( groups[ i ] == ',' )
			{
				commas++;
			}
		}
	}
	
	//
	// put all groups into table
	
	char **ptr = NULL;
	if( ( ptr = FCalloc( commas, sizeof(char *) ) ) != NULL )
	{
		int pos = 0;
		ptr[ pos++ ] = groups;
		
		for( i=1 ; i < glen; i++ )
		{
			if( groups[ i ] == ',' )
			{
				groups[ i ] = 0;
				ptr[ pos++ ] = &(groups[ i+1 ]);
			}
		}
		
		//
		// going through all groups and create new "insert"
		//
		
		UserGroup **usrGroups = FCalloc( pos, sizeof( UserGroup *) );
		BufString *bs = BufStringNew();
		BufStringAdd( bs, "INSERT INTO FUserToGroup (UserID, UserGroupID ) VALUES ");
		
		FBOOL isAdmin = FALSE;
		FBOOL isAPI = FALSE;
		DEBUG("[UMAssignGroupToUserByStringDB] Memory for groups allocated\n");
		for( i = 0; i < pos; i++ )
		{
			UserGroup *gr = um->um_UserGroups;
			while( gr != NULL )
			{
				if( strcmp( gr->ug_Name, ptr[ i ] ) == 0 )
				{
					usrGroups[ i ] = gr;
					
					if( strcmp( gr->ug_Name, "Admin" ) == 0 )
					{
						isAdmin = TRUE;
					}
					else if( strcmp( gr->ug_Name, "API" ) == 0 )
					{
						isAPI = TRUE;
					}
					
					DEBUG("[UMAssignGroupToUserByStringDB] Group found %s will be added to user %s\n", gr->ug_Name, usr->u_Name );
					
					char loctmp[ 255 ];
					if( i == 0 )
					{
						snprintf( loctmp, sizeof( loctmp ),  "( %lu, %lu ) ", usr->u_ID, gr->ug_ID ); 
					}
					else
					{
						snprintf( loctmp, sizeof( loctmp ),  ",( %lu, %lu ) ", usr->u_ID, gr->ug_ID ); 
					}
					BufStringAdd( bs, loctmp );
					break;
				}
				gr = (UserGroup *) gr->node.mln_Succ;
			}
		}
		
		usr->u_IsAdmin = isAdmin;
		usr->u_IsAPI = isAPI;
		
		// removeing old group conections from DB
		
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE UserID = %lu AND UserGroupId IN ( SELECT ID FROM FUserGroup fug WHERE fug.Type = 'Level')", usr->u_ID ) ;

		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}

		if( sqlLib->QueryWithoutResults( sqlLib, bs->bs_Buffer  ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", bs->bs_Buffer );
		}

		if( usr->u_Groups != NULL )
		{
			FFree( usr->u_Groups );
		}
		usr->u_Groups = usrGroups;
		
		if( bs != NULL )
		{
			BufStringDelete( bs );
		}
		
		FFree( ptr );
	}
	sb->LibrarySQLDrop( sb, sqlLib );
	DEBUG("[UMAssignGroupToUserByStringDB] Assign  groups to user end\n");
	
	return 0;
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
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return 1;
	}
	
	sqlLib->Update( sqlLib, UserDesc, usr );
	
	sb->LibrarySQLDrop( sb, sqlLib );
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
		sb->LibrarySQLDrop( sb, sqlLib );
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
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
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
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," Name = '%s'", name );
	
	int entries;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	// No need for sql lib anymore here
	sb->LibrarySQLDrop( sb, sqlLib );

	if( user != NULL )
	{
		{
			DEBUG("[UMUserGetByNameDB] User found %s  id %ld\n", user->u_Name, user->u_ID );
			UMAssignGroupToUser( um, user );
			UMAssignApplicationsToUser( um, user );
			user->u_MountedDevs = NULL;
		}
	}
	
	DEBUG("[UMUserGetByNameDB] END\n");

	return user;
}

/**
 * Get User structure from DB by id
 *
 * @param um pointer to UserManager
 * @param name user id
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
		{
			DEBUG("[UMUserGetByIDDB] User found %s\n", user->u_Name );
			UMAssignGroupToUser( um, user );
			UMAssignApplicationsToUser( um, user );
			user->u_MountedDevs = NULL;
		}
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
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot create user, mysql.library was not opened!\n");
		return 1;
	}
	
	if( usr == NULL )
	{
		FERROR("Cannot create user, NULL cannot be stored into database\n");
	}

	if( UMUserExistByNameDB( smgr, usr->u_Name ) == TRUE )
	{
		DEBUG("[UMUserCreate]: user exist already!\n");
		sb->LibrarySQLDrop( sb, sqlLib );
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
			unsigned char hash[ 32 ];
			char *hashTarget;
			
			if( ( hashTarget = calloc( 69, sizeof(char) ) ) != NULL )
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

	int val = sqlLib->Save( sqlLib, UserDesc, usr );
	sb->LibrarySQLDrop( sb, sqlLib );
	
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
		FERROR("Cannot get user, mysql.library was not open\n");
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
	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check both username and password
		if( strcmp( name, tuser->u_Name ) == 0 )
		{
			return tuser;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}
	return NULL;
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
	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check both username and password
		if( tuser->u_ID == id )
		{
			return tuser;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}
	return NULL;
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
	sb->LibrarySQLDrop( sb, sqlLib );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		UMAssignGroupToUser( um, tmp );
		UMAssignApplicationsToUser( um, tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
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
		UMAssignGroupToUser( um, tmp );
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
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
		if( sqlLib )
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

	return usr->u_ID;
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
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	char where[ 128 ];
	where[ 0 ] = 0;
	
	DEBUG("[UMGetUserByNameDB] start\n");
	
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
		UMAssignGroupToUser( um, tmp );
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
	
	if( sqlLib && sqlLib->con.sql_Con )
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
					sb->LibrarySQLDrop( sb, sqlLib );
					{
						UMAssignGroupToUser( um, user );
						UMAssignApplicationsToUser( um, user );
						user->u_MountedDevs = NULL;
					}
					
					sqlLib->FreeResult( sqlLib, result );
					return user;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
		}
	}
	
	sb->LibrarySQLDrop( sb, sqlLib );
	
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
		UMAssignGroupToUser( um, tmp );
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
		usr->node.mln_Succ  = (MinNode *) um->um_Users;
		if( um->um_Users != NULL )
		{
			um->um_Users->node.mln_Pred = (MinNode *)usr;
		}
		um->um_Users = usr;
	}
	else
	{
		INFO("User found, will not be added\n");
	}
	
	return  0;
}

/**
 * Remove user from FC user list
 *
 * @param um pointer to UserManager
 * @param usr user which will be removed from FC user list
 * @param user_session_manager Session manager of the currently running instance
 * @return 0 when success, otherwise error number
 */
int UMRemoveUser(UserManager *um, User *usr, UserSessionManager *user_session_manager)
{
	User *user_current = um->um_Users; //current element of the linked list, set to the beginning of the list
	User *user_previous = NULL; //previous element of the linked list

	FULONG user_id = usr->u_ID;

	UserSession *session_to_delete;
    while ((session_to_delete = USMGetSessionByUserID(user_session_manager, user_id)) != NULL){
    	int status = USMUserSessionRemove(user_session_manager, session_to_delete);
    	DEBUG("%s removing session at %p, status %d\n", __func__, session_to_delete, status);
    }

    unsigned int n = 0;
    bool found = false;
	while (user_current != NULL){
		if (user_current == usr){
			DEBUG("%s removing user at %p, place in list %d\n", __func__, user_current, n);
			found = true;
			n++;
			break;
		}
		user_previous = user_current;
		user_current = (User *)user_current->node.mln_Succ; //this is the next element in the linked list
	}
	
	if (found){ //the requested user has been found in the list

		if (user_previous){ //we are in the middle or at the end of the list

			DEBUG("Deleting from the middle or end of the list\n");
			user_previous->node.mln_Succ = user_current->node.mln_Succ;

		} else { //we are at the very beginning of the list
			um->um_Users = (User *)user_current->node.mln_Succ; //set the global start pointer of the list
		}
		UserDelete(user_current);
		
		return 0;
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
 * @return 0 when success otherwise error number
 */
int UMStoreLoginAttempt( UserManager *um, const char *name, const char *info, const char *failReason )
{
	UserLogin ul;
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	User *usr = UMGetUserByNameDB( um, name );
	
	DEBUG("[UMStoreLoginAttempt] start\n");
	
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
 * @param numberOfFail if last failed logins will have same value as this variable then login possibility will be blocked for some period of time
 * @param lastLoginTime in this field infomration about last login time will be stored
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL UMGetLoginPossibilityLastLogins( UserManager *um, const char *name, int numberOfFail, time_t *lastLoginTime )
{
	FBOOL canILogin = FALSE;
	SystemBase *sb = (SystemBase *)um->um_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("[UMGetLoginPossibilityLastLogins] username %s\n", name );
		// temporary solution, using MYSQL connection
		char query[ 2048 ];
		time_t tm = time( NULL );
		
		// we are checking failed logins in last hour
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT `LoginTime`,`Failed` FROM `FUserLogin` WHERE `Login`='%s' AND (`LoginTime` > %lu AND `LoginTime` <= %lu) ORDER BY `LoginTime` DESC", name, tm-(3600l), tm );
		
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
		
		sb->LibrarySQLDrop( sb, sqlLib );
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
	SystemBase *sb = (SystemBase *)um->um_SB;
	DEBUG("[UMCheckAndLoadAPIUser] Start\n" );
	
	User *tuser = um->um_Users;
	while( tuser != NULL )
	{
		// Check both username and password
		if( tuser->u_IsAPI && strcmp( tuser->u_Name, "apiuser" ) == 0 )
		{
			um->um_APIUser = tuser;
			return 0;
		}
		tuser = (User *)tuser->node.mln_Succ;
	}
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		User *user = NULL;

		int entries;
		user = sqlLib->Load( sqlLib, UserDesc, "Name = 'apiuser'", &entries );
		sb->LibrarySQLDrop( sb, sqlLib );

		if( user != NULL )
		{
			// Generate the API user session
			char temptext[ 2048 ];
			char *sesid = SessionIDGenerate( );
			if( user->u_MainSessionID != NULL )
			{
				FFree( user->u_MainSessionID );
			}
			user->u_MainSessionID = sesid;
			
			sqlLib->SNPrintF( sqlLib, temptext, 2048, "UPDATE `FUser` f SET f.SessionID = '%s' WHERE`ID` = '%ld'",  user->u_MainSessionID, user->u_ID );
			sqlLib->QueryWithoutResults( sqlLib, temptext );
			
			DEBUG("[UMCheckAndLoadAPIUser] User found %s  id %ld\n", user->u_Name, user->u_ID );
			UMAssignGroupToUser( um, user );
			UMAssignApplicationsToUser( um, user );
			user->u_MountedDevs = NULL;
			
			user->node.mln_Succ  = (MinNode *) um->um_Users;
			if( um->um_Users != NULL )
			{
				um->um_Users->node.mln_Pred = (MinNode *)user;
			}
			um->um_Users = user;
			
			um->um_APIUser = user;
			
			return 0;
		}
	}
	return 1;
}
