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
