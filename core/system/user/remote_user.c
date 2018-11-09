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
 * Remote User
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#include "remote_user.h"
#include <system/systembase.h>

/**
 * Create new Remote User
 *
 * @return new RemoteUser structure when success, otherwise NULL
 */
RemoteUser *RemoteUserNew( char *name, char *host )
{
	RemoteUser *u;
	if( ( u = FCalloc( 1, sizeof( RemoteUser ) ) ) != NULL )
	{
		u->ru_Name = StringDuplicate( name );
		u->ru_Host = StringDuplicate( host );
	}
	else
	{
		FERROR("Cannot allocate memory for user\n");
	}
	
	return u;
}

/**
 * Remove RemoteUser structure
 *
 * @param usr pointer to RemoteUser structure which will be deleted
 */
void RemoteUserDelete( RemoteUser *usr )
{
	if( usr != NULL )
	{
		RemoteDriveDeleteAll( usr->ru_RemoteDrives );
		
		if( usr->ru_Name != NULL )
		{
			FFree( usr->ru_Name );
		}
		
		if( usr->ru_Password != NULL )
		{
			FFree( usr->ru_Password );
		}
		
		if( usr->ru_Host != NULL )
		{
			FFree( usr->ru_Host );
		}
		
		if( usr->ru_SessionID != NULL )
		{
			FFree( usr->ru_SessionID );
		}
		
		if( usr->ru_AuthID != NULL )
		{
			FFree( usr->ru_AuthID );
			usr->ru_AuthID = NULL;
		}
		
		FFree( usr );
	}
}

/**
 * Remove RemoteUser structures connected via node list
 *
 * @param usr pointer to root RemoteUser structure which will be deleted
 * @return 0 when success, otherwise error number
 */
int RemoteUserDeleteAll( RemoteUser *usr )
{
	RemoteUser *rem = usr;
	RemoteUser *next = usr;
	
	while( next != NULL )
	{
		rem = next;
		next = (RemoteUser *)next->node.mln_Succ;
		
		RemoteUserDelete( rem );
	}
	return 0;
}

/**
 * Add remote drive to remote user
 *
 * @param ru pointer to RemoteUser to which drive will be assigned
 * @param name name of remote drive
 * @return 0 when success, otherwise error number
 */
int RemoteDriveAdd( RemoteUser *ru, char *name )
{
	if( ru != NULL )
	{
		RemoteDrive *rd = FCalloc( 1, sizeof(RemoteDrive) );
		if( rd != NULL )
		{
			rd->rd_Name = StringDuplicate( name );
			
			rd->node.mln_Succ = (MinNode *) ru->ru_RemoteDrives;
			ru->ru_RemoteDrives = rd;
		}
	}
	return 0;
}

/**
 * Remove remote drive from remote user
 *
 * @param ru pointer to RemoteUser from which drive will be removed
 * @param name name of remote drive
 * @return 0 when success, otherwise error number
 */
int RemoteDriveRemove( RemoteUser *ru, char *name )
{
	if( ru != NULL )
	{
		RemoteDrive *ldrive = ru->ru_RemoteDrives;
		RemoteDrive *prevdrive = ldrive;
		
		while( ldrive != NULL )
		{
			if( ldrive->rd_Name != NULL && strcmp( ldrive->rd_Name, name ) == 0 )
			{
				DEBUG("RemoteDriveDelete: \n");
				break;
			}
			prevdrive = ldrive;
			ldrive = (RemoteDrive *)ldrive->node.mln_Succ;
		}
		
		if( ldrive != NULL )
		{
			prevdrive->node.mln_Succ = ldrive->node.mln_Succ;
			DEBUG("RemoteDriveDelete drive will be removed from memory\n");
			
			RemoteDriveDelete( ldrive );
			
			return 0;
		}
	}
	return 0;
}

/**
 * Create new RemoteDrive
 *
 * @param localName pointer to local drive name
 * @param remoteName pointer to remote drive name
 * @return new structure when success, otherwise NULL
 */
RemoteDrive *RemoteDriveNew( char *localName, char *remoteName )
{
	RemoteDrive *rd = NULL;
	
	if( ( rd = FCalloc( 1, sizeof(RemoteDrive) ) ) != NULL )
	{
		rd->rd_LocalName = StringDuplicate( localName );
		rd->rd_RemoteName = StringDuplicate( remoteName );
	}
	return rd;
}

/**
 * Delete RemoteDrive
 *
 * @param rd pointer to drive which will be deleted
 */
void RemoteDriveDelete( RemoteDrive *rd )
{
	if( rd != NULL )
	{
		if( rd->rd_LocalName != NULL )
		{
			FFree( rd->rd_LocalName );
		}
		
		if( rd->rd_RemoteName != NULL )
		{
			FFree( rd->rd_RemoteName );
		}
		
		if( rd->rd_Name != NULL )
		{
			FFree( rd->rd_Name );
		}
		FFree( rd );
	}
}

/**
 * Delete RemoteDrive linked list
 *
 * @param rd pointer to drive which is first on linked list
 */
void RemoteDriveDeleteAll( RemoteDrive *rd )
{
	RemoteDrive *next = rd;
	while( next != NULL )
	{
		rd = next;
		next = (RemoteDrive *)next->node.mln_Succ;
		
		if( rd->rd_LocalName != NULL )
		{
			FFree( rd->rd_LocalName );
		}
		
		if( rd->rd_RemoteName != NULL )
		{
			FFree( rd->rd_RemoteName );
		}
		
		if( rd->rd_Name != NULL )
		{
			FFree( rd->rd_Name );
		}
		FFree( rd );
	}
}
