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
 *  User Manager
 *
 * file contain all functitons related to user management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_manager.h"
#include "user.h"

#include <system/systembase.h>
#include <util/sha256.h>

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
			DEBUG("Releasing user devices\n");
			// Remove all mounted devices
			File *lf = remusr->u_MountedDevs;
			File *remdev = lf;
			while( lf != NULL )
			{
				remdev = lf;
				lf = (File *)lf->node.mln_Succ;
				
				if( remdev != NULL )
				{
					FHandler *fsys = (FHandler *)remdev->f_FSys;

					if( fsys != NULL && fsys->UnMount != NULL )
					{
						//
						// we are releasing device memory
						//
						
						if( fsys->Release( fsys, remdev ) != 0 )
						{
							DEBUG("Device released\n");
						}
					}
					else
					{
						FERROR("Cannot free FSYS (null)\n");
					}
				
					FileDelete( remdev );
					remdev = NULL;
				}
			}

			DEBUG("Free user %s\n", remusr->u_Name );
			
			UserDelete( remusr );
			
			remusr = NULL;
			//DEBUG("======================================\n\n\n");
		}
	}
	
	smgr->um_Users = NULL;
	
	RemoteUserDeleteAll( smgr->um_RemoteUsers );
	
	if( smgr != NULL )
	{
		UserGroup *g = smgr->um_UserGroups, *rg;
		DEBUG("Cleaning groups\n");
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
	struct User *user = NULL;
	DEBUG("Assign group to user\n");

	//sprintf( tmpQuery, "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );
	
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );

	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );

		MYSQL_RES *result = sqlLib->Query(  sqlLib, tmpQuery );
	
		if ( result == NULL ) 
		{
			FERROR("SQL query result is empty!\n");
			sb->LibraryMYSQLDrop( sb, sqlLib );
			return 2;
		}
		
		FBOOL isAdmin = FALSE;

		MYSQL_ROW row;
		int j = 0;
		int actgroup = 0;
	
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
	
	//FERROR("\n\n\n\n\\n\n\n\n\n\\n\n-\n");
		DEBUG("Memory for %d  groups allocated\n", rows );
	
		if( usr->u_Groups != NULL )
		{
			int pos = 0;
			FULONG ID = 0;
			usr->u_GroupsNr = rows;
		
			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				DEBUG("Going through loaded rows %d -> %s\n", j, row[ 0 ] );
			
				// first are column names
				//if( j >= 1 )
				{
					FULONG gid = atol( row[ 0 ] );
				
					DEBUG("User is in group %lu\n", gid  );
				
					UserGroup *g = smgr->um_UserGroups;
					while( g != NULL )
					{
						//DEBUG("comparing %ld   -  %ld\n", g->ug_ID, gid );
						if( g->ug_ID == gid )
						{
							if( strcmp( g->ug_Name, "Admin" ) == 0 )
							{
								isAdmin = TRUE;
							}
							
							DEBUG("Added group %s to user %s\n", g->ug_Name, usr->u_Name );
							usr->u_Groups[ pos++ ] = g;
						}
						g  = (UserGroup *) g->node.mln_Succ;
					}
				} 
				//j++;
			}
		}
		
		if( isAdmin == TRUE )
		{
			usr->u_IsAdmin = TRUE;
		}
		else
		{
			usr->u_IsAdmin = FALSE;
		}
	
		sqlLib->FreeResult( sqlLib, result );

		sb->LibraryMYSQLDrop( sb, sqlLib );
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
	
	DEBUG("Assign group to user start NEW GROUPS: %s\n", groups );
	
	SystemBase *sb = (SystemBase *)um->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
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
		DEBUG("Memory for groups allocated\n");
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
					
					DEBUG("Group found %s will be added to user %s\n", gr->ug_Name, usr->u_Name );
					
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
		
		if( isAdmin == TRUE )
		{
			usr->u_IsAdmin = TRUE;
		}
		else
		{
			usr->u_IsAdmin = FALSE;
		}
		
		// removeing old group conections from DB
		
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE UserID = %lu AND UserGroupId IN ( SELECT ID FROM FUserGroup fug WHERE fug.Type = 'Level')", usr->u_ID ) ;

		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}
		DEBUG("call query: '%s'\n", tmpQuery );
		
		if( sqlLib->QueryWithoutResults( sqlLib, bs->bs_Buffer  ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", bs->bs_Buffer );
		}
		DEBUG("call query: '%s'\n", bs->bs_Buffer );
		
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
	sb->LibraryMYSQLDrop( sb, sqlLib );
	DEBUG("Assign  groups to user end\n");
	
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return 1;
	}
	
	sqlLib->Update( sqlLib, UserDesc, usr );
	
	sb->LibraryMYSQLDrop( sb, sqlLib );
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
	char tmpQuery[ 255 ];
	//sprintf( tmpQuery, "SELECT * FROM FUserApplication WHERE UserID='%lu'", usr->u_ID );
	
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	int actapp = 0;
	
	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserApplication WHERE UserID='%lu'", usr->u_ID );

		MYSQL_RES *result = sqlLib->Query( sqlLib, tmpQuery );
		if( result == NULL )
		{
			sb->LibraryMYSQLDrop( sb, sqlLib );
			return 2;
		}

		// Free previous applications
		if( usr->u_Applications )
		{
			usr->u_Applications = UserAppDeleteAll( usr->u_Applications );
		}
	
		// Make room
		//usr->u_Applications = FCalloc( result->row_count, sizeof( UserApplication * ) );
	
		// Fetch from mysql
		MYSQL_ROW row;
		int j = 0;
		UserApplication *prev = NULL;
	
		DEBUG( "Starting process\n" );
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
	
		DEBUG( "%d applications added.\n", actapp );
	
		// Return with amount of application
		sb->LibraryMYSQLDrop( sb, sqlLib );
	}
	return actapp;
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];
	//snprintf( tmpQuery, sizeof(tmpQuery)," Name = '%s'", name );
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," Name = '%s'", name );
	
	DEBUG( "Loading user.\n" );
	int entries;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	DEBUG("User poitner %p  number of entries %d\n", user, entries );
	// No need for sql lib anymore here
	sb->LibraryMYSQLDrop( sb, sqlLib );

	if( user != NULL )
	{
		int res = UserInit( &user );
		if( res == 0 )
		{
			DEBUG("[UserGet] User found %s  id %ld\n", user->u_Name, user->u_ID );
			UMAssignGroupToUser( um, user );
			UMAssignApplicationsToUser( um, user );
			user->u_MountedDevs = NULL;
		}
	}
	
	DEBUG("GETUSER data filled, END\n");

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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}

	User *user = NULL;
	char tmpQuery[ 1024 ];
	//snprintf( tmpQuery, sizeof(tmpQuery)," ID = '%lu'", id );
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ID = '%lu'", id );
	
	DEBUG( "Loading user, pointer to sqllib %p.\n", sqlLib );
	int entries = 0;
	user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
	
	DEBUG("User poitner %p  number of entries %d\n", user, entries );
	// No need for sql lib anymore here
	sb->LibraryMYSQLDrop( sb, sqlLib );

	if( user != NULL )
	{
		int res = UserInit( &user );
		if( res == 0 )
		{
			DEBUG("[UserGet] User found %s\n", user->u_Name );
			UMAssignGroupToUser( um, user );
			UMAssignApplicationsToUser( um, user );
			user->u_MountedDevs = NULL;
		}
	}
	
	DEBUG("GETUSER data filled, END\n");

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

int UMUserCreate( UserManager *smgr, Http *r, User *usr )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
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
			unsigned char hash[ 32 ];
			char *hashTarget;
			
			if( ( hashTarget = calloc( 69, sizeof(char) ) ) != NULL )
			{
				hashTarget[ 0 ] = '{';
				hashTarget[ 1 ] = 'S';
				hashTarget[ 2 ] = '6';
				hashTarget[ 3 ] = '}';
		
				DEBUG("Encrypt password\n");
		
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

	int val = sqlLib->Save( sqlLib, UserDesc, usr );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	return val;
}

/**
 * Return information if user is admin
 *
 * @param smgr pointer to UserManager
 * @param r http request
 * @param usr pointer to user structure which will be checked
 * @return TRUE if user is administrator, otherwise FALSE
 */

FBOOL UMUserIsAdmin( UserManager *smgr, Http *r, User *usr )
{
	if( usr->u_IsAdmin == TRUE )
	{
		return TRUE;
	}
	/*
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL)
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return FALSE;
	}
	
	char *tmpQuery = FCalloc( 2048, sizeof(char) );;
	
	sqlLib->SNPrintF( sqlLib, tmpQuery, 2048, "select u.ID from FUser u, FUserToGroup utg, FUserGroup g where u.ID = utg.UserID AND g.ID = utg.UserGroupID AND g.Name = 'Admin' AND u.Name = '%s'", usr->u_Name );
	//sprintf( tmpQuery, "select count(*) from FUser u, FUserToGroup utg, FUserGroup g where u.ID = utg.UserID AND g.ID = utg.UserGroupID AND g.Name = 'Admin' AND u.Name = '%s'", usr->u_Name );
	
	MYSQL_RES *res = sqlLib->Query( sqlLib, tmpQuery );

	if( res != NULL )
	{
		int rows = 0;
		// Check if it was a real result
		if( ( rows = sqlLib->NumberOfRows( sqlLib, res ) )> 0 )
		{
			DEBUG("rows %d\n", rows );
			
			sqlLib->FreeResult( sqlLib, res );
			sb->LibraryMYSQLDrop( sb, sqlLib );
			FFree( tmpQuery );
			return TRUE;
		}
		sqlLib->FreeResult( sqlLib, res );
	}
	
	sb->LibraryMYSQLDrop( sb, sqlLib );
	FFree( tmpQuery );
	*/
	return FALSE;
}

/**
 * Return information if user is admin by authenticationid
 *
 * @param smgr pointer to UserManager
 * @param r http request
 * @param auth authentication id as string
 * @return TRUE if user is administrator, otherwise FALSE
 */

FBOOL UMUserIsAdminByAuthID( UserManager *smgr, Http *r, char *auth )
{
	SystemBase *sb = (SystemBase *)smgr->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return FALSE;
	}
	
	char tmpQuery[ 1024 ];
	//"SELECT u.SessionID FROM FUser u,  WHERELIMIT 1",
	
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "select count(*) from FUser u, FUserToGroup utg, FUserGroup g, FUserApplication a where u.ID = utg.UserID AND g.ID = utg.UserGroupID AND g.Name = 'Admin'  AND a.UserID = u.ID AND  a.AuthID=\"%s\"", auth );
	
	//sprintf( tmpQuery, "select count(*) from FUser u, FUserToGroup utg, FUserGroup g, FUserApplication a where u.ID = utg.UserID AND g.ID = utg.UserGroupID AND g.Name = 'Admin'  AND a.UserID = u.ID AND  a.AuthID=\"%s\"", auth );
	
	MYSQL_RES *res = sqlLib->Query( sqlLib, tmpQuery );

	if( res != NULL )
	{
		// Check if it was a real result
		if( sqlLib->NumberOfRows( sqlLib, res ) > 0 )
		{
			sqlLib->FreeResult( sqlLib, res );
			sb->LibraryMYSQLDrop( sb, sqlLib );
			return TRUE;
		}
		sqlLib->FreeResult( sqlLib, res );
	}
	
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
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
	sprintf( query, " FUser where`Name` = '%s'" , name );
	
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

/**
 * Get User structure from FC user list by his name
 *
 * @param um pointer to UserManager
 * @param name user name
 * @return User structure when success, otherwise NULL
 */

User *UMGetUserByName( UserManager *um, char *name )
{
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
 * 
 */

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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	char where[ 128 ];
	where[ 0 ] = 0;
	
	DEBUG("UMGetUserByNameDB start\n");
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	//snprintf( where, sizeof(where), " `Name` = '%s'", name );
	sqlLib->SNPrintF( sqlLib, where, sizeof(where), " `Name` = '%s'", name );
	
	struct User *user = NULL;
	int entries;
	
	user = ( struct User *)sqlLib->Load( sqlLib, UserDesc, where, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	User *tmp = user;
	while( tmp != NULL )
	{
		// TODO: Reenable application stuff when it works
		UMAssignGroupToUser( um, tmp );
		UMAssignApplicationsToUser( um, tmp );
		UserInit( &tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("UMGetUserByNameDB end\n");
	return user;
}

/**
 * Get User structure from database by authentication id
 *
 * @param um pointer to UserManager
 * @param authid authentication id
 * @return User structure when success, otherwise NULL
 */

void *UMUserGetByAuthIDDB( UserManager *um, const char *authId )
{
	SystemBase *sb = (SystemBase *)um->um_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib && sqlLib->con.sql_Con )
	{
		DEBUG("GetAuthByAuthid %s\n", authId );
		// temporary solution, using MYSQL connection
		char query[ 1024 ];
		//snprintf( query, sizeof(query), "SELECT u.ID FROM `FUser` u, `FApplication` f WHERE f.AuthID=\"%s\" AND f.UserID = u.ID LIMIT 1", authId );
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT u.ID FROM `FUser` u, `FApplication` f WHERE f.AuthID=\"%s\" AND f.UserID = u.ID LIMIT 1", authId );
		
		MYSQL_RES *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{
			MYSQL_ROW row;
			if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				struct User *user = NULL;
				char tmpQuery[ 1024 ];
				
				sprintf( tmpQuery, " ID = '%s'", row[0] );
				int entries;
				user = sqlLib->Load( sqlLib, UserDesc, tmpQuery, &entries );
				if( user != NULL )
				{
					sb->LibraryMYSQLDrop( sb, sqlLib );
					int res = UserInit( &user );
					if( res == 0 )
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
	
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
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
		UMAssignGroupToUser( um, tmp );
		UMAssignApplicationsToUser( um, tmp );
		UserInit( &tmp );
		
		tmp = (User *)tmp->node.mln_Succ;
	}
	
	DEBUG("GetAllUsers end\n");
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
 * @return 0 when success, otherwise error number
 */

int UMRemoveUser( UserManager *um, User *usr )
{
	User *lusr = um->um_Users;
	User *prevusr = lusr;
	
	while( lusr != NULL )
	{
		if( lusr == usr )
		{
			DEBUG("UserManagerRemove: user removed\n");
			break;
		}
		prevusr = lusr;
		lusr = (User *)lusr->node.mln_Succ;
	}
	
	if( lusr != NULL )
	{
		prevusr->node.mln_Succ = lusr->node.mln_Succ;
		DEBUG("User will be removed from memory\n");
		UserDelete( lusr );
		
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("UMGetAllowedLoginTime %s\n", name );
		// temporary solution, using MYSQL connection
		char query[ 1024 ];
		//snprintf( query, sizeof(query), "SELECT u.ID FROM `FUser` u, `FApplication` f WHERE f.AuthID=\"%s\" AND f.UserID = u.ID LIMIT 1", authId );
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT `LoginTime` FROM `FUser` WHERE `Name`='%s' LIMIT 1", name );
		
		MYSQL_RES *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			MYSQL_ROW row;
			if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				tm = atol( row[ 0 ] );
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		
		sb->LibraryMYSQLDrop( sb, sqlLib );
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	User *usr = UMGetUserByNameDB( um, name );
	
	DEBUG("UMStoreLoginAttempt\n");
	
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
		
		sb->LibraryMYSQLDrop( sb, sqlLib );
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
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("UMGetLastFailLogins %s\n", name );
		// temporary solution, using MYSQL connection
		char query[ 2048 ];
		time_t tm = time( NULL );
		
		// we are checking failed logins in last hour
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT `LoginTime`,`Failed` FROM `FUserLogin` WHERE `Login`='%s' AND (`LoginTime` > %lu AND `LoginTime` <= %lu) ORDER BY `LoginTime` DESC", name, tm-(3600l), tm );
		
		MYSQL_RES *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			MYSQL_ROW row;
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
		
		sb->LibraryMYSQLDrop( sb, sqlLib );
	}
	
	return canILogin;
}

/**
 * Add remote user
 *
 * @param um pointer to UserManager
 * @param name user name as string
 * @param sessid sessionid
 * @param hostname hostname string
 * @return 0 when success, otherwise error number
 */
int UMAddRemoteUser( UserManager *um, const char *name, const char *sessid, const char *hostname )
{
	DEBUG("UMAddRemoteUser start\n");
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	while( actUsr != NULL )
	{
		if( strcmp( name, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			break;
		}
		
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	if( actUsr == NULL )
	{
		actUsr = RemoteUserNew( (char *) name, (char *)hostname );
		if( actUsr != NULL )
		{
			actUsr->node.mln_Succ = (MinNode *) um->um_RemoteUsers;
			um->um_RemoteUsers = actUsr;
			
			//actUsr->ru_Name = StringDuplicate( name );
			actUsr->ru_SessionID = StringDuplicate( sessid );
			//actUsr->ru_Host = StringDuplicate( hostname );
		}
	}
	
	if( actUsr != NULL )
	{
		actUsr->ru_ConNumber++;
		
		SystemBase *sb = (SystemBase *)um->um_SB;
		CommService *service = sb->fcm->fcm_CommService;
		
		Socket *newsock;
		
		newsock = SocketConnectHost( service->s_SB, service->s_secured, actUsr->ru_Host, service->s_port );
		//newcon->cfcc_Socket = SocketOpen( service->s_secured, service->s_port, SOCKET_TYPE_CLIENT );
		if( newsock != NULL )
		{
			CommFCConnection *con = CommServiceAddConnection( service, newsock, actUsr->ru_Host, NULL, SERVICE_CONNECTION_OUTGOING );
			if( con != NULL )
			{
				actUsr->ru_Connection = con;
			}
			
			// now we must send authid and later notification about changes
		}
		else
		{
			FERROR("Cannot open socket\n");
		}
	}
	
	DEBUG("UMAddRemoteUser end\n");
	
	return 0;
}

/**
 * Remove remote user
 *
 * @param uname user name as string
 * @param hostname hostname string
 * @return 0 when success, otherwise error number
 */
int UMRemoveRemoteUser( UserManager *um, const char *name, const char *hostname )
{
	DEBUG("UMRemoveRemoteUser start\n");
	SystemBase *sb = (SystemBase *)um->um_SB;
	CommService *service = sb->fcm->fcm_CommService;
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	RemoteUser *prevUsr = actUsr;
	while( actUsr != NULL )
	{
		if( strcmp( name, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			break;
		}
		
		prevUsr = actUsr;
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	if( actUsr != NULL )
	{
		actUsr->ru_ConNumber--;
		
		// we have less or equal connections to 0
		// user can be removed from list
		
		if( actUsr->ru_ConNumber <= 0 )
		{
			if( actUsr == um->um_RemoteUsers )
			{
				um->um_RemoteUsers = (RemoteUser *) um->um_RemoteUsers->node.mln_Succ;
			}
			else
			{
				prevUsr->node.mln_Succ = actUsr->node.mln_Succ;
			}
			
			//CommServiceDelConnection( service, actUsr->ru_Connection, actUsr->ru_Connection->cfcc_Socket );
			RemoteUserDelete( actUsr );
		}
	}
	
	DEBUG("UMRemoveRemoteUser end\n");
	
	return 0;
}

/**
 * Add remote drive (and user if needed)
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param authid authenticationid
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMAddRemoteDrive( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName )
{
	DEBUG("UMAddRemoteUser start\n");
	FBOOL registerUser = FALSE;
	FBOOL registerDrive = FALSE;
	CommFCConnection *con = NULL;
	SystemBase *sb = (SystemBase *)um->um_SB;
	CommService *service = sb->fcm->fcm_CommService;
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	RemoteDrive *remDri = NULL;
	
	// try to find user first
	
	while( actUsr != NULL )
	{
		if( strcmp( uname, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			DEBUG("User found %s - host %s\n", uname, hostname );
			con = actUsr->ru_Connection;
			break;
		}
		
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	// if user do not exist then connection must be created
	
	if( actUsr == NULL )
	{
		registerUser = TRUE;
		registerDrive = TRUE;
		
		actUsr = RemoteUserNew( (char *)uname, (char *) hostname );
		if( actUsr != NULL )
		{
			actUsr->node.mln_Succ = (MinNode *) um->um_RemoteUsers;
			um->um_RemoteUsers = actUsr;

			actUsr->ru_AuthID = StringDuplicate( authid );
			
			Socket *newsock;
			
			newsock = SocketConnectHost( service->s_SB, service->s_secured, actUsr->ru_Host, service->s_port );
			if( newsock != NULL )
			{
				con = CommServiceAddConnection( service, newsock, actUsr->ru_Host, NULL, SERVICE_CONNECTION_OUTGOING );
				if( con != NULL )
				{
					actUsr->ru_Connection = con;
					
					CommServiceRegisterEvent( con, newsock );
				}
			}
		}
	}
	
	if( actUsr != NULL )
	{
		// we are increasing connection number
		
		actUsr->ru_ConNumber++;
		
		// try to find remote drive

		remDri = actUsr->ru_RemoteDrives;
		while( remDri != NULL )
		{
			if( remDri->rd_LocalName != NULL && strcmp( localDevName, remDri->rd_LocalName ) == 0 &&
				remDri->rd_RemoteName != NULL && strcmp( remoteDevName, remDri->rd_RemoteName ) == 0 )
			{
				break;
			}
		}
		
		// if drive doesnt exist, we must create one
		
		if( remDri == NULL )
		{
			registerDrive = TRUE;
			
			remDri = RemoteDriveNew( localDevName, remoteDevName );
			if( remDri != NULL )
			{
				remDri->node.mln_Succ = (MinNode *)actUsr->ru_RemoteDrives;
				actUsr->ru_RemoteDrives = remDri;
			}
		}
	}
	
	/*
	if( registerUser == TRUE )
	{
		char *luname = FCalloc( strlen(uname)+10, sizeof(char));
		char *lauthid = FCalloc( strlen(authid)+8, sizeof(char));
		char *llocuname = FCalloc( strlen(locuname)+13, sizeof(char));
		
		int iuname = sprintf( luname, "username=%s", uname );
		int iauthid = sprintf( lauthid, "authid=%s", authid );
		int ilocuname = sprintf( llocuname, "locusername=%s", locuname );
		
		MsgItem tags[] = {
			{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
			{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_RUSR, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_PARM, (FULONG)0, MSG_GROUP_START },
				{ ID_PRMT, (FULONG) iuname, (FULONG)luname },
				{ ID_PRMT, (FULONG) iauthid, (FULONG)lauthid },
				{ ID_PRMT, (FULONG) ilocuname, (FULONG)llocuname },
			{ MSG_GROUP_END, 0,  0 },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("Register user\n");

		//int sbytes = SocketWrite( con->cfcc_Socket, (char *)df, df->df_Size );
		
		BufString *result = SendMessageAndWait( con, df );
		
		//BufString *result = SocketReadTillEnd( con->cfcc_Socket, 0, 15 );
		if( result != NULL )
		{
			DEBUG("Response received\n");
			if( result->bs_Size > 0 )
			{
				DEBUG("Answer received\n");
				DataForm *resultDF = (DataForm *)result->bs_Buffer;
				if( resultDF->df_ID == ID_FCRE )
				{
					DEBUG("Received proper response\n");
				}
			}
			else
			{
				FERROR("Register user fail\n");
				registerDrive = FALSE;
			}
			
			BufStringDelete( result );
		}
		else
		{
			FERROR("Register user fail\n, result = NULL\n");
			registerDrive = FALSE;
		}
		DataFormDelete( df );
		
		FFree( llocuname );
		FFree( luname );
		FFree( lauthid );
	}
	*/
	
	DEBUG("Before register drive %d\n", registerDrive );
	
	if( registerUser == TRUE || registerDrive == TRUE )
	{
		char *luname = FCalloc( strlen(uname)+10, sizeof(char));
		char *lauthid = FCalloc( strlen(authid)+8, sizeof(char));
		char *llocuname = FCalloc( strlen(locuname)+13, sizeof(char));
		
		int iuname = sprintf( luname, "username=%s", uname );
		int iauthid = sprintf( lauthid, "authid=%s", authid );
		int ilocuname = sprintf( llocuname, "locusername=%s", locuname );
		
		char *llocalDevName = FCalloc( strlen(localDevName)+12, sizeof(char));
		char *lremoteDevName  = FCalloc( strlen(remoteDevName)+20, sizeof(char));
		
		int ilocalDevName = sprintf( llocalDevName, "locdevname=%s", localDevName );
		int iremoteDevName = sprintf( lremoteDevName, "remotedevname=%s", remoteDevName );
		
		MsgItem tags[] = {
			{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
			{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
			{ ID_RDRI, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_PARM, (FULONG)0, MSG_GROUP_START },
				{ ID_PRMT, (FULONG) iuname, (FULONG)luname },
				{ ID_PRMT, (FULONG) iauthid, (FULONG)lauthid },
				{ ID_PRMT, (FULONG) ilocuname, (FULONG)llocuname },
				{ ID_PRMT, (FULONG) ilocalDevName, (FULONG)llocalDevName },
				{ ID_PRMT, (FULONG) iremoteDevName, (FULONG)lremoteDevName },
			{ MSG_GROUP_END, 0,  0 },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("Register device\n");
		
		BufString *result = SendMessageAndWait( con, df );
		
		if( result != NULL )
		{
			DEBUG("Response received Register device\n");
			if( result->bs_Size > 0 )
			{
				DataForm *resultDF = (DataForm *)result->bs_Buffer;
				if( resultDF->df_ID == ID_FCRE )
				{
					char *ptr = result->bs_Buffer + (9*sizeof(FULONG))+FRIEND_CORE_MANAGER_ID_SIZE;
					DEBUG("Received proper response1\n");
					
					resultDF = (DataForm *)ptr;
					if( resultDF->df_ID == ID_CMMD && resultDF->df_Size == 0 && resultDF->df_Data == MSG_INTEGER_VALUE )
					{
						INFO("FC connection set\n");
					}
					else
					{
						FERROR("Cannot  setup connection with other FC\n");
					}
				}
			}
			BufStringDelete( result );
		}
		DataFormDelete( df );
		
		FFree( llocalDevName );
		FFree( lremoteDevName );
		
		FFree( llocuname );
		FFree( luname );
		FFree( lauthid );
	}
	
	DEBUG("UMAddRemoteUser end\n");
	
	return 0;
}

/**
 * Remove and delete remote drive (and user if there will be need)
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMRemoveRemoteDrive( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName )
{
	return 0;
}

/**
 * Add remote drive to user
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param authid authenticationid
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMAddRemoteDriveToUser( UserManager *um, CommFCConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName )
{
	User *locusr = um->um_Users;
	RemoteDrive *locremdri = NULL;
	
	while( locusr != NULL )
	{
		if( strcmp( locuname, locusr->u_Name ) == 0 )
		{
			DEBUG("User found: %s\n", locuname );
			break;
		}
		locusr = (User *)locusr->node.mln_Succ;
	}
	
	if( locusr == NULL )
	{
		FERROR("Cannot find user\n");
		return -1;
	}
	
	// we are trying to find remote user with same/existing connection
	RemoteUser *remusr = locusr->u_RemoteUsers;
	while( remusr != NULL )
	{
		if( strcmp( uname, remusr->ru_RemoteDrives->rd_LocalName ) == 0 && con == remusr->ru_Connection )
		{
			DEBUG("User found: %s\n", uname );
			break;
		}
		remusr = (RemoteUser *)remusr->node.mln_Succ;
	}
	
	// user do not exist, we must create new one and attach it
	if( remusr == NULL )
	{
		remusr = RemoteUserNew( (char *)uname, (char *)hostname );
		if( remusr != NULL )
		{
			remusr->ru_AuthID = StringDuplicate( authid );
			remusr->ru_Connection = con;
			
			remusr->node.mln_Succ = (MinNode *)locusr->u_RemoteUsers;
			locusr->u_RemoteUsers = remusr;
			DEBUG("New remote user added %s\n", uname );
		}
	}

	if( remusr != NULL )
	{
		locremdri = remusr->ru_RemoteDrives;
		while( locremdri != NULL )
		{
			if( strcmp( locremdri->rd_LocalName, localDevName ) == 0 && strcmp( locremdri->rd_RemoteName, remoteDevName ) == 0 )
			{
				DEBUG("Remote drive found %s\n", localDevName );
				break;
			}
			locremdri = (RemoteDrive *)locremdri->node.mln_Succ;
		}
	}
	
	if( locremdri == NULL )
	{
		locremdri = RemoteDriveNew( localDevName, remoteDevName );
		if( locremdri != NULL )
		{
			locremdri->node.mln_Succ = (MinNode *)remusr->ru_RemoteDrives;
			remusr->ru_RemoteDrives = locremdri;
			DEBUG("New remote drive added\n");
		}
	}
	
	return 0;
}

/**
 * Remove and delete remote drive from User
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMRemoveRemoteDriveFromUser( UserManager *um, CommFCConnection *con, const char *uname, const char *hostname, char *localDevName, char *remoteDevName )
{
	return 0;
}
