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
 *  Mobile List Entry
 *
 * file contain body of MobileListEntry
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/10/2018
 */

#include <core/types.h>
#include "mobile_list_entry.h"

/**
 * Create new MobileListEntry
 *
 * @return new structure MobileListEntry
 */
MobileListEntry *MobileListEntryNew( UserMobileApp *uma )
{
	MobileListEntry *app;
	if( ( app = FCalloc( 1, sizeof(MobileListEntry) ) ) != NULL )
	{
		app->mm_UMApp = uma;
	}
	return app;
}

/**
 * Delete MobileListEntry
 *
 * @param ent pointer to MobileListEntry which will be deleted
 */
void MobileListEntryDelete( MobileListEntry *ent )
{
	if( ent != NULL )
	{
		FFree( ent );
	}
}

/**
 * Delete all MobileListEntries
 *
 * @param ent pointer to MobileListEntry list which will be deleted
 */
void MobileListEntryDeleteAll( MobileListEntry *ent )
{
	while( ent != NULL )
	{
		MobileListEntry *r = ent;
		ent = (MobileListEntry *) ent->node.mln_Succ;
		
		MobileListEntryDelete( r );
	}
}

/**
 * Initialize MobileListEntry
 *
 * @param ent pointer to MobileListEntry which will be initialized
 */
void MobileListEntryInit( MobileListEntry *ent )
{
	
}
