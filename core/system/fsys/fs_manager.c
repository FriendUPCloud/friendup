/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file fs_manager.c
 * 
 *  Filesystem manager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created on 2016
 */

#include "fs_manager.h"
#include <system/fsys/device_handling.h>
#include <network/mime.h>
#include <util/md5.h>
#include <system/systembase.h>

#define DEFAULT_ACCESS "-RWED"

/**
 * FSManager create function.
 *
 * @param sb pointer to SystemBase
 * @return new FSManager structure when success, otherwise NULL
 */
FSManager *FSManagerNew( void *sb )
{
	FSManager *fm = NULL;
	if( ( fm = FCalloc( 1, sizeof( FSManager ) ) ) != NULL )
	{
		fm->fm_SB = sb;
	}
	
	return fm;
}

/**
 * FSManager destroy function.
 * 
 * @param fm pointer to FSManager which will be released
 */
void FSManagerDelete( FSManager *fm )
{
	if( fm != NULL )
	{
		FFree( fm );
	}
}

/**
 * Chec File/Directory access rights
 *
 * @param fm filemanager structure
 * @param path path to file/directory which will be checked for access
 * @param devid deviceid
 * @param usr pointer to user for which access is checked
 * @param perm permissions in format  ARWXDH (as string)
 * @return TRUE if success otherwise FALSE
 */
FBOOL FSManagerCheckAccess( FSManager *fm, const char *path, FULONG devid, User *usr, char *perm )
{
	FBOOL result = FALSE;
	char *localPath = NULL;
	
	DEBUG("[FSManagerCheckAccess] Check access for %s\n", path );
	if( path == NULL )
	{
		return FALSE;
	}
	
	char *newPath = NULL;
	int plen = strlen( path );
	if( plen == 0 )
	{
		newPath = FCalloc( 1, sizeof(char) );
	}
	else
	{
		if( path[ plen -1 ] == '/' )
		{
			newPath = StringDuplicateN( (char *)path, plen-1 );
		}
		else
		{
			newPath = StringDuplicateN( (char *)path, plen );
		}
	}
	
	SystemBase *sb = (SystemBase  *) fm->fm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		if( fm != NULL && perm != NULL && newPath != NULL )
		{
			int querysize = 0;
			querysize = 1024  + (2*strlen( newPath ));
			int pathLen = strlen(newPath);
			char *tmpQuery;
		
			DEBUG("[FSManagerCheckAccess] User ptr %p alloc size %d\n", usr, querysize );
		
			if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
			{
				if( perm[ 2 ] == 'W' )	// if we are checking write permission, we must check also parent folder permissions
				{
					char *parentPath = StringDuplicate( newPath );
					int i;
					// getting parent directory path
					for( i=pathLen ; i>=0 ; i-- )
					{
						if( parentPath[ i ] == '/' )
						{
							parentPath[ i ] = 0;
							break;
						}
					}
				
					sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
( Path = '%s' OR Path = '%s' ) \
AND DeviceID = %lu \
) \
AND ( \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
) \
", newPath, parentPath, devid, usr->u_ID, usr->u_ID );
				
					FFree( parentPath );
				}
				else
				{
					sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
Path = '%s' \
AND DeviceID = %lu \
) \
AND ( \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
) \
", newPath, devid, usr->u_ID, usr->u_ID );
				}
			
				DEBUG("[FSManagerCheckAccess] Checking access via SQL '%s'\n", tmpQuery );
		
				void *res = sqlLib->Query( sqlLib, tmpQuery );
				FBOOL access = FALSE;
			
				char defaultAccessRights[] = "-RWED";

				if( res != NULL )
				{
				// default access
				// -RWED-     - ARWEDH
				
				//  ROW````
				// 0 - access string
				// 1  - objectid (group or userid)
				// 2 - type of id  0 - user, 1- group,  2  - others
				// 3 - permissionid
				// 4 - ID - unused
					int nrrows = sqlLib->NumberOfRows( sqlLib, res );

					if( nrrows > 0 )
					{
						char **row = NULL;
					
						DEBUG("[FSManagerCheckAccess] Checking permissions %c  -   permission param %s\n", (char)perm[ 0 ], perm );
					
						while( ( row = sqlLib->FetchRow( sqlLib, res ) ) ) 
						{
							DEBUG("[FSManagerCheckAccess] Found permission entry %s  permissions to check PERM %s OBJID %s TYPE %s\n", row[ 0 ], perm, row[1], row[2] );
						
							// others rights
							//if( row[ 2 ][ 0 ] == '2' )
							//{
							//	strcpy( defaultAccessRights, row[ 0 ] );
							//}
							//else
							{
								// read
								if( perm[ 1 ] == 'R' && ((char)row[ 0 ][ 1 ]) == perm[ 1 ] )
								{
									access = TRUE;
									break;
								}
								// write
								if( perm[ 2 ] == 'W' && ((char)row[ 0 ][ 2 ]) == perm[ 2 ] )
								{
									access = TRUE;
									break;
								}
						
								if( perm[ 3 ] == 'E' && ((char)row[ 0 ][ 3 ]) == perm[ 3 ] )
								{
									access = TRUE;
									break;
								}
						
								if( perm[ 4 ] == 'D' && ((char)row[ 0 ][ 4 ]) == perm[ 4 ] )
								{
									access = TRUE;
									break;
								}
							}
						}
					}
					// number of rows > 0
					// checking default access
					else
					{
						access = TRUE;
					}
				
					if( access == TRUE )
					{
						result = TRUE;
					}
					sqlLib->FreeResult( sqlLib, res );
				}
				FFree( tmpQuery );
			}
			else
			{
				FERROR("Cannot allocate memory for query!\n");
				FFree( newPath );
				sb->LibrarySQLDrop( sb, sqlLib );
				return result;
			}
		}
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	FFree( newPath );
	
	DEBUG("Access to : %s : %d\n", path, result );

	return result;
}

/**
 * Get file/directory/device access
 *
 * @param fm pointer to FSManager structure
 * @param path path to file/directory which will be checked for access
 * @param devid deviceid
 * @param usr pointer to user for which access is checked
 * @return pointer to new BufString structure with response
 */
BufString *FSManagerGetAccess( FSManager *fm, const char *path, FULONG devid, User *usr )
{
	BufString *bs = BufStringNew();
	if( path == NULL )
	{
		return bs;
	}
	DEBUG("[FSManagerGetAccess] start\n");
	
	char *newPath = NULL;
	int plen = strlen( path );
	if( path[ plen -1 ] == '/' )
	{
		newPath = StringDuplicateN( (char *)path, plen-1 );
	}
	else
	{
		newPath = StringDuplicateN( (char *)path, plen );
	}
	
	if( fm != NULL && newPath != NULL )
	{
		int querysize = 0;
		querysize = 2048 + ( 2*strlen( newPath ) );
		
		char *tmpQuery = NULL;
		
		if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
		{
			SystemBase *sb = (SystemBase  *) fm->fm_SB;
			SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
			
			if( sqlLib == NULL )
			{
				char ttmp[ 256 ];
				int size = snprintf( ttmp, sizeof(ttmp), "fail<!--separate-->{\"response\":\"%s\"}", sb->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] );
				BufStringAddSize( bs, ttmp, size );
				FFree( newPath );
				FFree( tmpQuery );
				return bs;
			}

			/*
			 // this sql is using match to find path. There is a problem with match + '.' sign inside
			 s qlLib->SNPrintF( sqlLib, tmpQuery, querysize,* "select Access, ObjectID, Type, PermissionID from `FPermLink` where \
			 PermissionID IN( \
			 SELECT ID FROM `FFilePermission` WHERE \
			 MATCH(Path) AGAINST('%s' IN BOOLEAN MODE) \
			 AND CHAR_LENGTH(Path) <=  LENGTH('%s') \
			 AND DeviceID = %lu ORDER BY CHAR_LENGTH(Path) DESC \
			 )\
			 AND ID IN( \
			 SELECT ID FROM  `FPermLink` WHERE \
			 ID IN( \
			 SELECT ID FROM `FPermLink` WHERE ObjectID \
			 IN( \
			 SELECT UserGroupID FROM `FUserToGroup` WHERE UserID = %lu ) AND `Type` = \'1\' \
			 UNION ALL \
			 SELECT ID FROM `FPermLink` WHERE ObjectID = %lu AND `Type` = \'0\' \
			 UNION ALL \
			 SELECT ID FROM `FPermLink` WHERE `Type` = \'2\' \
			 ) \
			 )", path, path, devid, usr->u_ID, usr->u_ID );
			 */
			
				char *parentPath = StringDuplicate( newPath );
				int i;
				// getting parent directory path
				if( plen > 0 )
				{
					for( i=plen-1 ; i>=0 ; i-- )
					{
						if( parentPath[ i ] == '/' )
						{
							parentPath[ i ] = 0;
							break;
						}
					}
				}
				
				/*
				 s qlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT *Access, ObjectID, Type, PermissionID from `FPermLink` where \
				 PermissionID in( \
				 SELECT ID FROM `FFilePermission` WHERE \
				 ( Path = '%s' OR Path = '%s' ) \
				 AND DeviceID = %lu ORDER BY CHAR_LENGTH(Path) DESC \
				 )\
				 AND ID in( \
				 select ID from  `FPermLink` where \
				 ID in( \
				 select ID from `FPermLink` where ObjectID \
				 in( \
				 select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 \
				 UNION ALL \
				 select ID from `FPermLink` where ObjectID = %lu and Type = 0 \
				 UNION ALL \
				 select ID from `FPermLink` where Type = 2 \
				 ) \
				 )", newPath, parentPath, devid, usr->u_ID, usr->u_ID );
				 */
				
				sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
( Path = '%s' OR Path = '%s' ) \
AND DeviceID = %lu \
) \
AND ( \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
) \
", newPath, parentPath, devid, usr->u_ID, usr->u_ID );
				
				FFree( parentPath );
				/*
			}
			else
			{
				sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "select Access, ObjectID, Type, PermissionID from `FPermLink` where \
				PermissionID IN( \
					SELECT ID FROM `FFilePermission` WHERE \
						Path = '%s' \
						AND DeviceID = %lu ORDER BY CHAR_LENGTH(Path) DESC \
				   )\
				AND ID IN( \
					SELECT ID FROM  `FPermLink` WHERE \
					ID IN( \
						SELECT ID FROM `FPermLink` WHERE ObjectID \
						IN( \
							SELECT UserGroupID FROM `FUserToGroup` WHERE UserID = %lu ) AND `Type` = \'1\' \
						UNION ALL \
						SELECT ID FROM `FPermLink` WHERE ObjectID = %lu AND `Type` = \'0\' \
						UNION ALL \
						SELECT ID FROM `FPermLink` WHERE `Type` = \'2\' \
				   ) \
				)", newPath, devid, usr->u_ID, usr->u_ID );
			}
			*/

			void *res = sqlLib->Query( sqlLib, tmpQuery );
			

			if( res != NULL )
			{
				// default access
				// -RWED-     - ARWEDH
				
				//  ROW````
				// 0 - access string
				// 1  - objectid (group or userid)
				// 2 - type of id  0 - user, 1- group,  2  - others
				// 3 - permissionid
				// 4 - ID - unused
				
				int pos = 0;
				char **row = NULL;
				
				FBOOL foundAccess[ 3 ];
				foundAccess[ 0 ] = foundAccess[ 1 ] = foundAccess[ 2 ] = FALSE;
				
				while( ( row = sqlLib->FetchRow( sqlLib, res ) ) ) 
				{
					int type = atoi( row[ 2 ] );
					char temp[ 1024 ];
					char typeTemp[ 255 ];
					int msgsize = 0;
					
					switch( type )
					{
						case 0:
							strcpy( typeTemp, "\"type\":\"user\"" );
							foundAccess[ 0 ] = TRUE;
							break;
						case 1:
							strcpy( typeTemp, "\"type\":\"group\"" );
							foundAccess[ 1 ] = TRUE;
							break;
						case 2:
							strcpy( typeTemp, "\"type\":\"others\"" );
							foundAccess[ 2 ] = TRUE;
							break;
					}
					
					if( pos == 0 )
					{
						msgsize = snprintf( temp, sizeof(temp), "{\"access\":\"%s\",\"objectid\":\"%s\",%s,\"permissionid\":\"%s\"}", row[ 0 ], row[ 1 ], typeTemp, row[ 3 ] );
					}
					else
					{
						msgsize = snprintf( temp, sizeof(temp), ",{\"access\":\"%s\",\"objectid\":\"%s\",%s,\"permissionid\":\"%s\"}", row[ 0 ], row[ 1 ], typeTemp, row[ 3 ] );
					}
					
					if( pos == 0 )
					{
						BufStringAddSize( bs, "ok<!--separate-->[", 17 );
						BufStringAdd( bs, "[");
					}
					
					BufStringAddSize( bs, temp, msgsize );
					
					pos++;
				}
				
				if( pos > 0 )
				{
					BufStringAdd( bs, "]");
				}
				else
				{
					BufStringAdd( bs, "[{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"user\",\"permissionid\":\"0\"},{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"group\",\"permissionid\":\"0\"},{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"others\",\"permissionid\":\"0\"}]" );
				}

				sqlLib->FreeResult( sqlLib, res );
			}
			else
			{
				BufStringAdd( bs, "[{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"user\",\"permissionid\":\"0\"},{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"group\",\"permissionid\":\"0\"},{\"access\":\"-RWED\",\"objectid\":\"0\",\"type\":\"others\",\"permissionid\":\"0\"}]" );
			}
	
			sb->LibrarySQLDrop( sb, sqlLib );		
			FFree( tmpQuery );
		}
		else
		{
			FERROR("Cannot allocate memory for query!\n");
			BufStringDelete( bs );
			FFree( newPath );
			return NULL;
		}
	}
	
	FFree( newPath );
	return bs;
}

//
//
//

typedef struct AGroup
{
	char *key;
	char *val;
	int type;
	struct AGroup *next;
}AGroup;

/**
 * Set access rights to file/directory/device
 *
 * @param fm pointer to FSManager structure
 * @param usr pointer to user which sets permission
 * @param path path to file/directory on which access rights will be set
 * @param devid deviceid
 * @param userc user/owner access i -RWED "format"
 * @param groupc group access i -RWED "format"
 * @param othersc others access i -RWED "format"
 * @return pointer to new BufString structure with response
 */
int FSManagerProtect3( FSManager *fm, User *usr, char *path, FULONG devid, char *userc, char *groupc, char *othersc )
{
	SystemBase *sb = (SystemBase *)fm->fm_SB;
	
	SQLLibrary *sqllib  = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		char usercOld[ 6 ];
		char groupcOld[ 6 ];
		char otherscOld[ 6 ];
		
		strcpy( usercOld, "-RWED" );
		strcpy( groupcOld, "-RWED" );
		strcpy( otherscOld, "-RWED" );
		FULONG permissionid = 0;
		usercOld[ 5 ] = groupcOld[ 5 ] = otherscOld[ 5 ] = 0;
		
		// remote '/' if exist
		int plen = strlen( path );
		if( plen > 1 )
		{
			plen--;
			if( path[ plen ] == '/' )
			{
				path[ plen ] = 0;
			}
		}
		
		char *tmpQuery = NULL;
		int querysize = ( SHIFT_LEFT( strlen( path ), 1) ) + 512;
		
		if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
		{
			sqllib->SNPrintF( sqllib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
Path = '%s' \
AND DeviceID = %lu \
) \
AND ID in( \
select ID from  `FPermLink` where \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
) \
", path, devid, usr->u_ID, usr->u_ID );
			
			
			void *res = sqllib->Query( sqllib, tmpQuery );
			
			if( res != NULL )
			{
				char **row = NULL;
				
				while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
				{
					char *next;
					permissionid = (FULONG)strtol( row[ 3 ], &next, 0);
					
					int type = atoi( row[ 2 ] );
					
					DEBUG("[FSManagerProtect3] Type %d permissionid %ld access %s\n", type, permissionid, row[ 0 ] );
				
					switch( type )
					{
						case 0:
							strcpy( usercOld, row[0] );
						break;
						case 1:
							strcpy( groupcOld, row[0] );
						break;
						case 2:
							strcpy( otherscOld, row[0] );
						break;
					}
				}
				
				sqllib->FreeResult( sqllib, res );
			}
			
			//
			// remove old entries
			//
			
			// DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path = '%s'  )
			
			// DELETE `FFilePermission` WHERE Path = '%s' 
			
			//DELETE FROM `FPermLink` WHERE PermissionID in( SELECT ID FROM `FFilePermission` WHERE Path='stefkosdev:wallhaven-241962.jpg' AND DeviceID=6 )
			if( permissionid > 0 )
			{
				DEBUG("[FSManagerProtect3] Found permission, remove old entries\n");
				sqllib->SNPrintF( sqllib, tmpQuery, querysize, "DELETE FROM `FPermLink` WHERE PermissionID in( SELECT ID FROM `FFilePermission` WHERE Path='%s'  AND DeviceID=%lu)", path, devid );
				//sprintf( tmpQuery, "DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path='%s'  ) AND DeviceID=%lu", path, devid );
			
				sqllib->QueryWithoutResults( sqllib, tmpQuery );
			}
			
			// there is no need to remove main entry from DB
			//sqllib->SNPrintF( sqllib, tmpQuery, querysize,  " DELETE  FROM`FFilePermission` WHERE Path='%s' AND DeviceID=%lu", path, devid );
			//sprintf( tmpQuery, " DELETE `FFilePermission` WHERE Path='%s' AND DeviceID=%lu", path, devid );
			//sqllib->QueryWithoutResults( sqllib, tmpQuery );
			
			FFree( tmpQuery );
		}
		
		// when there i no entry in FPermission table
		
		if( permissionid <= 0 )
		{
			FilePermission fperm;
			fperm.fp_DeviceID = devid;
			fperm.fp_Path = (char *)path;

			if( ( sqllib->Save( sqllib, FilePermissionDesc, &fperm ) ) == 0 )
			{
			}
			permissionid = fperm.fp_ID;
		}
		
		DEBUG("[FSManagerProtect3] PermissionID %lu\n", permissionid );
			
		char insertQuery[ 2048 ];
		int i;
		
		// users
		if( userc != NULL )
		{
			int lsize = strlen(userc);
			for( i=0 ; i < lsize ; i++ ) userc[ i ] = toupper( userc[ i ] );
			
			int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, %lu, 0, '%s' )", permissionid, usr->u_ID, userc );
			sqllib->QueryWithoutResults( sqllib, insertQuery );
			
			DEBUG("[FSManagerProtect3] User access stored %s\n", insertQuery );
		}
		else		// default settings or old ones
		{
			int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, %lu, 0, '%s' )", permissionid, usr->u_ID, usercOld );
			sqllib->QueryWithoutResults( sqllib, insertQuery );
		}
		// groups

		if( groupc != NULL )
		{
			int lsize = strlen(groupc);
			for( i=0 ; i < lsize ; i++ ) groupc[ i ] = toupper( groupc[ i ] );
			
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			//for( i=0 ; i <usr->u_GroupsNr ; i++ )
			{
				//UserGroup *ug = usr->u_Groups[ i ];
				UserGroup *ug = ugl->ugl_Group;
				if( ug != NULL )
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, %lu, 1, '%s' )", permissionid, ug->ug_ID, groupc );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				
					DEBUG("[FSManagerProtect3] Group access stored %s\n", insertQuery );
				}
				ugl = (UserGroupLink *)ugl->node.mln_Succ;
			}
		}
		else
		{
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			//for( i=0 ; i <usr->u_GroupsNr ; i++ )
			{
				//UserGroup *ug = usr->u_Groups[ i ];
				UserGroup *ug = ugl->ugl_Group;
				if( ug != NULL )
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, %lu, 1, '%s' )", permissionid, ug->ug_ID, groupcOld );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				}
				ugl = (UserGroupLink *)ugl->node.mln_Succ;
			}
		}
		// others
		
		if( othersc != NULL )
		{
			int lsize = strlen(othersc);
			for( i=0 ; i < lsize ; i++ ) othersc[ i ] = toupper( othersc[ i ] );
			
			int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, 0, 2, '%s' )", permissionid, othersc );
			sqllib->QueryWithoutResults( sqllib, insertQuery );
			
			DEBUG("[FSManagerProtect3] Others access stored %s\n", insertQuery );
		}
		else
		{
			int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` (PermissionID,ObjectID,Type,Access) VALUES( %lu, 0, 2, '%s' )", permissionid, otherscOld );
			sqllib->QueryWithoutResults( sqllib, insertQuery );
		}

		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Set access rights to file/directory/device
 *
 * @param fm pointer to FSManager structure
 * @param path path to file/directory on which access rights will be set
 * @param devid deviceid
 * @param accgroups access in format "userA:ARWED,userB:ARWED,userC:ARWED;groupA:ARWED,groupB:ARWED;others:ARWED"
 * @return 0 when permmissions were set, otherwise error number
 */
int FSManagerProtect( FSManager *fm, const char *path, FULONG devid, char *accgroups )
{
	if( accgroups == NULL )
	{
		FERROR("Groups parameter is empty\n");
		return -1;
	}

	if( path == NULL )
	{
		FERROR("Path parameter is empty\n");
		return -1;
	}
	unsigned int i;
	int entries = 1;		// number
	char *users = accgroups;

	//
	// counting how many entries we have
	// set pointer where groups and others start
	char *key = accgroups;
	char *value = NULL;
	int type = 0;
	AGroup *root = NULL;
	AGroup *prev = root;

	DEBUG("[FSManagerProtect] command\n");

	for( i=1 ; i < strlen( accgroups ) ; i++ )
	{
		FBOOL createEntry = FALSE;

		if( accgroups[ i ] == ',' )
		{
			entries++;
			accgroups[ i ] = 0;
			createEntry = TRUE;
		}
		else if( accgroups[ i ] == ':' )
		{
			accgroups[ i ] = 0;
			value = &accgroups[ i+1 ];
		}
		else if( accgroups[ i ] == ';' )
		{
			type++;
			entries++;
			accgroups[ i ] = 0;
			createEntry = TRUE;
		}

		if( key != NULL && value != NULL )
		{
			AGroup *ng = FCalloc( 1, sizeof(AGroup ) );
			if( ng != NULL )
			{
				ng->key = key;
				ng->val = value;
				ng->type  = type;
				
				// if root is NULL, then we must create first element
				if( prev == NULL )
				{
					prev = root = ng;
				}
				else
				{
					prev->next = ng;
				}
			}
			key = &accgroups[ i+1 ];
			value = NULL;
		}
	}

	SystemBase *sb = (SystemBase *)fm->fm_SB;

	SQLLibrary *sqllib  = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		//
		// remove old entries
		//

		char *tmpQuery = NULL;
		int querysize = ( SHIFT_LEFT(strlen( path ), 1) ) + 512;

		if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
		{
			// DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path = '%s'  )
			
			// DELETE `FFilePermission` WHERE Path = '%s' 
			
			sqllib->SNPrintF( sqllib, tmpQuery, querysize, "DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path='%s'  ) AND DeviceID=%lu", path, devid );
			//sprintf( tmpQuery, "DELETE `FPermLink` WHERE PermissionID in( SELECT * FROM `FFilePermission` WHERE Path='%s'  ) AND DeviceID=%lu", path, devid );
			
			sqllib->QueryWithoutResults( sqllib, tmpQuery );
			
			sqllib->SNPrintF( sqllib, tmpQuery, querysize,  " DELETE `FFilePermission` WHERE Path='%s' AND DeviceID=%lu", path, devid );
			//sprintf( tmpQuery, " DELETE `FFilePermission` WHERE Path='%s' AND DeviceID=%lu", path, devid );
			
			sqllib->QueryWithoutResults( sqllib, tmpQuery );
			
			FFree( tmpQuery );
		}

		FilePermission fperm;
		fperm.fp_DeviceID = devid;
		fperm.fp_Path = (char *)path;

		if( ( sqllib->Save( sqllib, FilePermissionDesc, &fperm ) ) == 0 )
		{
			char insertQuery[ 2048 ];

			// we can go now through all entries
			// and put proper insert into DB

			prev = root;
			AGroup *rem = prev;
			while( prev != NULL )
			{
				rem = prev;
				prev = prev->next;
		
				// users
				if( rem->type == 0 )
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` ('PermissionID','ObjectID','Type','Access') VALUES( %lu, (SELECT ID FROM `FUser` where Name='%s'), 0, %s )", fperm.fp_ID, rem->key, rem->val );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				}
				// groups
				else if( rem->type == 1 )
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` ('PermissionID','ObjectID','Type','Access') VALUES( %lu, (SELECT ID FROM `FUserGroup` where Name='%s'), 1, %s )", fperm.fp_ID, rem->key, rem->val );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				}
				// others
				else
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FPermLink` ('PermissionID','ObjectID','Type','Access') VALUES( %lu, 0, 2, %s )", fperm.fp_ID, rem->val );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				}
		
				FFree( rem );
			}
		}
		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Add access rights to dir response command
 *
 * @param fm pointer to FSManager structure
 * @param recv received Dir command output
*  @return Dir output with permission strings when success, otherwise NULL
 */
BufString *FSManagerAddPermissionsToDir( FSManager *fm, BufString *recv, FULONG devid, User *usr )
{
	if( recv == NULL )
	{
		return NULL;
	}
	
	if( recv->bs_Buffer[ 0 ] == 'f' )
	{
		return recv;
	}
	
	SystemBase *sb = (SystemBase  *) fm->fm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get sql.library slot!\n");
		return NULL;
	}
	
	char *permPtr = recv->bs_Buffer;
	char *permPtrLast = permPtr;
	char *pathPtr = recv->bs_Buffer;
	FBOOL parentDirectoryAccess = FALSE;
	
	BufString *bsres = BufStringNew();
	
	// while parsing JSON Im trying to find files by Path
	// next Im trying to localize Permissions and Im filling this field with file permissions
	
	char parentAccess[ 3 ][ 5 ];
	parentAccess[ 0 ][ 0 ] = parentAccess[ 1 ][ 0 ] = parentAccess[ 2 ][ 0 ] = 0;
	char access[ 3 ][ 5 ];
	access[ 0 ][ 0 ] = access[ 1 ][ 0 ] = access[ 2 ][ 0 ] = 0;
	
	while( ( pathPtr  = strstr( pathPtr, "\"Path\"" ) ) != NULL )
	{
		char *path;
		char *allocPath = NULL;
		
		pathPtr += 8;	// we move to the end of "Path":"
		path = pathPtr;

		// we want to end string by putting 0 on the end
		while( *pathPtr != 0 )
		{
			char *oldChar = pathPtr;
			
			pathPtr++;

			if( *oldChar != '\\' && *pathPtr == '\"' )
			{
				allocPath = StringDuplicateN( path, (oldChar+1)-path );
				if( allocPath != NULL )
				{
					int len = strlen( allocPath );
					if( allocPath[ len-1 ] == '\\' )
					{
						allocPath[ len-1 ] = 0;
					}
				}
				break;
			}
		}
		
		if( permPtr != NULL )
		{
			permPtr = strstr( permPtr, "\"Permissions\"" );
		}

		if( permPtr != NULL )
		{
			permPtr += 15;	// "Permissions":"  
			FERROR("Permsize %d  - %.*s\n", (int)(permPtr-permPtrLast), (int)(permPtr-(permPtrLast+1)), permPtr );
			BufStringAddSize( bsres, permPtrLast, permPtr-permPtrLast );
			
			// fetch access rights to parent directory
			
			// new path removes / on the end
			char *newPath = NULL;
			int plen = 0;
			if( allocPath != NULL )
			{
				plen = strlen( allocPath );
				if( allocPath[ plen -1 ] == '/' )
				{
					newPath = StringDuplicateN( (char *)allocPath, plen-1 );
				}
				else
				{
					newPath = StringDuplicateN( (char *)allocPath, plen );
				}
			}
			
			if( fm != NULL && newPath != NULL )
			{
				int querysize = 0;
				querysize = 2048 + ( 2*strlen( newPath ) );
				
				char *tmpQuery = NULL;
				
				if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
				{
					if( parentDirectoryAccess == FALSE )
					{
						char *parentPath = StringDuplicate( newPath );
						int i;
						// getting parent directory path
						if( plen > 0 )
						{
							for( i=plen-1 ; i>=0 ; i-- )
							{
								if( parentPath[ i ] == '/' )
								{
									parentPath[ i ] = 0;
									break;
								}
							}
						}
						
						sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
( Path = '%s' ) \
AND DeviceID = %lu \
) \
AND ( \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
)", parentPath, devid, usr->u_ID, usr->u_ID );
						
						void *res = sqlLib->Query( sqlLib, tmpQuery );
						if( res != NULL )
						{
							char **row = NULL;
							
							while( ( row = sqlLib->FetchRow( sqlLib, res ) ) ) 
							{
								int type = atoi( row[ 2 ] );
								switch( type )
								{
									case 0:
									case 2:
										strcpy( parentAccess[ type ], row[ 0 ] );
										break;
									case 1:
										if( parentAccess[ 1 ][ 0 ] != 0 )
										{
											strcpy( parentAccess[ type ], row[ 0 ] );
										}
										break;
								}
							}
							sqlLib->FreeResult( sqlLib, res );
						}
				
						FFree( parentPath );
				
						parentDirectoryAccess = TRUE;
					}
			
			
					access[ 0 ][ 0 ] = access[ 1 ][ 0 ] = access[ 2 ][ 0 ] = 0;
					// fetch access rights to file

					sqlLib->SNPrintF( sqlLib, tmpQuery, querysize, "SELECT Access, ObjectID, Type, PermissionID from `FPermLink` where \
PermissionID in( \
SELECT ID FROM `FFilePermission` WHERE \
( Path = '%s' ) \
AND DeviceID = %lu \
) \
AND ( \
( ObjectID in( select UserGroupID from `FUserToGroup` where UserID = %lu ) and Type = 1 ) \
OR \
( ObjectID = %lu and Type = 0 ) \
OR \
( Type = 2 ) \
)", newPath, devid, usr->u_ID, usr->u_ID );

					void *res = sqlLib->Query( sqlLib, tmpQuery );
					
					if( res != NULL )
					{
						int pos = 0;
						char **row = NULL;
						
						while( ( row = sqlLib->FetchRow( sqlLib, res ) ) ) 
						{
							int type = atoi( row[ 2 ] );
							strcpy( access[ type ], row[ 0 ] );
						}
						
						sqlLib->FreeResult( sqlLib, res );
					}
					
					// copy access rights to string which will be returned
					
					if( access[ 0 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, access[ 0 ], 5 );
					}
					else if( parentAccess[ 0 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, parentAccess[ 0 ], 5 );
					}
					else
					{
						BufStringAddSize( bsres, DEFAULT_ACCESS, 5 );
					}
					
					BufStringAddSize( bsres, ",", 1 );
					
					if( access[ 1 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, access[ 1 ], 5 );
					}
					else if( parentAccess[ 1 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, parentAccess[ 1 ], 5 );
					}
					else
					{
						BufStringAddSize( bsres, DEFAULT_ACCESS, 5 );
					}
					
					BufStringAddSize( bsres, ",", 1 );
					
					if( access[ 2 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, access[ 2 ], 5 );
					}
					else if( parentAccess[ 2 ][ 0 ] != 0 )
					{
						BufStringAddSize( bsres, parentAccess[ 2 ], 5 );
					}
					else
					{
						BufStringAddSize( bsres, DEFAULT_ACCESS, 5 );
					}
					
					FFree( tmpQuery );
				}
				else
				{
					FERROR("Cannot allocate memory for query!\n");
					//BufStringDelete( bs );
					FFree( newPath );
					sb->LibrarySQLDrop( sb, sqlLib );
					return NULL;
				}
			}
			
			FFree( newPath );
			
			// end fetch access rights to file
			
			permPtrLast = permPtr;
		}
		
		if( allocPath != NULL )
		{
			FFree( allocPath );
		}
	}
	
	BufStringAddSize( bsres, permPtrLast, ( &recv->bs_Buffer[ recv->bs_Size ] )-permPtrLast );
	
	BufStringDelete( recv );
	
	sb->LibrarySQLDrop( sb, sqlLib );
	
	return bsres;
}
