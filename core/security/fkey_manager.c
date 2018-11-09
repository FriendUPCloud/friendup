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
 * file contain functions related to fkey manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "fkey_manager.h"
#include <system/user/user.h>
#include <system/systembase.h>

/**
 * Create new FKeyManager
 *
 * @param sb pointer to SystemBase
 * @return new FKeyManager structure when success, otherwise NULL
 */
FKeyManager *FKeyManagerNew( void *sb )
{
	FKeyManager *fkm = FCalloc( 1, sizeof(FKeyManager) );
	if( fkm != NULL )
	{
		SystemBase *lsb = (SystemBase *)sb;
		fkm->km_SB = sb;
		
		SQLLibrary *sqllib = lsb->LibrarySQLGet( lsb );
		if( sqllib != NULL )
		{
			int keyentries;
			
			fkm->km_Keys = sqllib->Load( sqllib, FKeyDesc, NULL, &keyentries );
			
			lsb->LibrarySQLDrop( lsb, sqllib );
		}
	}
	return fkm;
}

/**
 * Delete FKeyManager
 *
 * @param fkm pointer to FKeyManager which will be deleted
 */
void FKeyManagerDelete( FKeyManager *fkm )
{
	if( fkm != NULL )
	{
		FKeyDeleteAll( fkm->km_Keys );
	}
}

/**
 * Get FKey by key name
 *
 * @param km pointer to FKeyManager
 * @param kname name of key which we want to get
 * @return FKey structure when success, otherwise NULL
 */
FKey *FKeyManagerGetByName( FKeyManager *km, char *kname )
{
	FKey *lkey = km->km_Keys;
	while( lkey != NULL )
	{
		if( lkey->k_Name != NULL && strcmp( lkey->k_Name, kname ) == 0 )
		{
			return lkey;
		}
		lkey = (FKey *)lkey->node.mln_Succ;
	}
	return NULL;
}

/**
 * Get FKey by key ID
 *
 * @param km pointer to FKeyManager
 * @param id ID of key which we want to get
 * @return FKey structure when success, otherwise NULL
 */
FKey *FKeyManagerGetByID( FKeyManager *km, FULONG id )
{
	FKey *lkey = km->km_Keys;
	while( lkey != NULL )
	{
		if( lkey->k_ID == id )
		{
			return lkey;
		}
		lkey = (FKey *)lkey->node.mln_Succ;
	}
	
	// if key doesnt exist, lets try to get it from DB
	
	SystemBase *sb = (SystemBase *)km->km_SB;
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		int keyentries;
		char where[ 256 ];
		snprintf( where, sizeof(where), " ID=%lu", id );
			
			FKey *k = sqllib->Load( sqllib, FKeyDesc, where, &keyentries );
			if( k != NULL )
			{
				k->node.mln_Succ = (MinNode *)km->km_Keys;
				km->km_Keys = k;
				sb->LibrarySQLDrop( sb, sqllib );
				return k;
			}
		sb->LibrarySQLDrop( sb, sqllib );
	}
	
	return NULL;
}

/**
 * Assign key to root file UNIMPLEMENTED
 *
 * @param fkm pointer to FKeyManager
 * @param rootf pointer to root File
 * @return 0 when success, otherwise error number
 */
int FKeyManagerAssignKeyToDrive( FKeyManager *fkm __attribute__((unused)), File *rootf __attribute__((unused)))
{
	
	return 0;
}

static inline void swapPointers( void **s, void **d )
{
	void *tmp = *s;
	*s = *d;
	*d = tmp;
}

/**
 * Update FKey
 *
 * @param km pointer to FKeyManager
 * @param id ID of key which we want to get
 * @return 0 when success, otherwise error number
 */
int FKeyManagerUpdateKeyByID( FKeyManager *km, FULONG id )
{
	FKey *k = NULL;
	
	// Load key from DB first
	SystemBase *sb = (SystemBase *)km->km_SB;
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		int keyentries;
		char where[ 256 ];
		snprintf( where, sizeof(where), " ID=%lu", id );
		
		k = sqllib->Load( sqllib, FKeyDesc, where, &keyentries );
		sb->LibrarySQLDrop( sb, sqllib );
	}
	
	if( k == NULL )
	{
		FERROR("Key not found: %lu\n", id );
		return -1;
	}
	
	FKey *lkey = km->km_Keys;
	while( lkey != NULL )
	{
		if( lkey->k_ID == id )
		{
			break;
		}
		lkey = (FKey *)lkey->node.mln_Succ;
	}
	
	// entry do not exist, we must add it
	if( lkey == NULL )
	{
		k->node.mln_Succ = (MinNode *)km->km_Keys;
		km->km_Keys = k;
	}
	else	// key exist, we must swap data
	{
		lkey->k_UserID = k->k_UserID;
		swapPointers( &(lkey->k_User), &(k->k_User) );
		swapPointers( (void **)&(lkey->k_Type), (void **)&(k->k_Type) );
		swapPointers( (void **)&(lkey->k_Name), (void **)&(k->k_Name) );
		swapPointers( (void **)&(lkey->k_Data), (void **)&(k->k_Data) );
		swapPointers( (void **)&(lkey->k_PublicKey), (void **)&(k->k_PublicKey) );
		swapPointers( (void **)&(lkey->k_Signature), (void **)&(k->k_Signature) );
		memcpy( &(lkey->k_DateCreated), &(k->k_DateCreated), sizeof(struct tm) );
		
		FKeyDelete( k );
	}
	return 0;
}

