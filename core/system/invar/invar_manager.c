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
 *  INVARManager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include "invar_manager.h"
#include <core/functions.h>
#include <util/buffered_string.h>
#include <util/log/log.h>
#include <system/systembase.h>

/**
 * Function create INVARManager
 *
 * @return new INVARManager structure, otherwise NULL
 */
INVARManager *INVARManagerNew( )
{
	INVARManager *nm;
	
	if( ( nm = FCalloc( 1, sizeof( INVARManager ) ) ) != NULL )
	{
		nm->nm_Groups = NULL;
	}
	
	return nm;
}

/**
 * Delete INVARManager
 *
 * @param nm pointer to INVARManager which will be deleted
 */
void INVARManagerDelete( INVARManager *nm )
{
	Log( FLOG_INFO, "INVARManagerDelete\n");
	if( nm != NULL )
	{
		INVARGroup *ng, *dg;
		
		ng  = dg = nm->nm_Groups;
		while( ng != NULL )
		{
			dg = ng;
			
			// remove entries
			
			INVAREntry *ne, *de;
			ne = de = ng->ng_Entries;
			
			DEBUG("[INVARManagerAddGroup] Delete Entry\n");
			
			while( ne != NULL )
			{
				de = ne;
				
				ne = (INVAREntry *)ne->node.mln_Succ;
				
				INVAREntryDelete( de);
			}
			
			ng = (INVARGroup *) ng->node.mln_Succ;
			
			INVARGroupDelete( dg );
		}
		//LIST_DELETE( nm->nm_Groups, INVARGroup *, INVARGroupDelete );
		
		FFree( nm );
	}
}

/**
 * Add INVARGroup to INVARManager
 *
 * @param nm pointer to INVARManager
 * @param ng pointer to INVARGRoup which will be added to INVARManager
 * @return 0 when success, otherwise error number
 */
int INVARManagerAddGroup( INVARManager *nm, INVARGroup *ng )
{
	Log( FLOG_INFO, "INVARManagerAddGroup\n");
	
	if( nm != NULL && ng != NULL )
	{
		ng->node.mln_Succ = (MinNode *) nm->nm_Groups;
		nm->nm_Groups = ng;
		DEBUG("[INVARManagerAddGroup] Group added to list %p next ptr %p\n", ng, ng->node.mln_Succ );
	}
	else
	{
		FERROR( "[INVARManagerAddGroup] Group and Entry are empty\n");
		return 1;
	}
	return 0;
}

/**
 * Delete INVARGroup from NVManager by ID
 *
 * @param nm pointer to INVARManager
 * @param id of INVARGroup which will be removed
 */
void INVARManagerDeleteGroup( INVARManager *nm, FULONG id )
{
	INVARGroup *ng, *og;
	if( nm != NULL )
	{
		if( id == nm->nm_Groups->ng_Pointer )
		{
			og = nm->nm_Groups;
			nm->nm_Groups = (INVARGroup *) nm->nm_Groups->node.mln_Succ;
			INVARGroupDelete( og );
		}
		else
		{
		
			ng  = og = nm->nm_Groups;
			while( ng != NULL )
			{
				og = ng;
				ng = (INVARGroup *) ng->node.mln_Succ;
			}
		}
	}
}

/**
 * Add INVAREntry to group by groupID
 *
 * @param nm pointer to INVARManager
 * @param grid ID of INVARGroup to which entry will be added
 * @param ne pointer to INVAREntry which will be added to group
 * @return 0 when success, otherwise error number
 */
int INVARManagerAddEntry( INVARManager *nm, FULONG grid, INVAREntry *ne )
{
	if( nm != NULL )
	{
		//INVARGroup *ng = (INVARGroup *)grid;
		INVARGroup *ng = INVARManagerGetGroupByPtr( nm, grid );
		DEBUG("[INVARManagerAddEntry] Group found under pointer %p\n", ng );
		
		if( ng != NULL && ng->ng_Pointer == grid )
		{
			ng->node.mln_Succ = (MinNode *) ng->ng_Entries;
			ng->ng_Entries = ne;
		}
		else
		{
			FERROR("[INVARManagerAddEntry] Cannot add new entry, group under pointer %ld not found\n", grid );
			return 1;
		}
	}
	else
	{
		return 2;
	}
	return 0;
}

/**
 * Delete INVAREntry from INVARGroup UNIMPLEMENTED
 *
 * @param nm pointer to INVARManager
 * @param grid id of group from which INVAREntry will be removed
 * @param enid id of entry which will be deleted
 */
void INVARManagerDeleteEntry( INVARManager *nm __attribute__((unused)), FULONG grid __attribute__((unused)), FULONG enid __attribute__((unused)))
{
	
}

/**
 * Get INVARGroup by group id
 *
 * @param nm pointer to INVARManager
 * @param ptr id of group which we want to get
 * @return INVARGroup structure from manager if it exist, otherwise NULL
 */
INVARGroup *INVARManagerGetGroupByPtr( INVARManager *nm, FULONG ptr )
{
	/*
	INVARGroup *ng = (INVARGroup *)ptr;
	if( ng->ng_Pointer != ptr )
	{
		Log( FLOG_ERROR, "Group assigned to pointer %ld doesn't exist\n", ptr );
		return NULL;
	}
	return ng;
	*/
	DEBUG("[INVARManagerGetGroupByPtr] GetGroup by ptr %lu\n", ptr );
	INVARGroup *ng = nm->nm_Groups;
	while( ng != NULL )
	{
		DEBUG("[INVARManagerGetGroupByPtr] Checking group %p\n", ng );
		if( ng->ng_Pointer == ptr )
		{
			return ng;
		}
		ng = (INVARGroup *)ng->node.mln_Succ;
	}
	
	return NULL;
}

/**
 * Get INVAREntry from INVARManager
 *
 * @param nm pointer to INVARManager
 * @param ptr id of INVAREntry which will be returned
 * @return structure of INVAREntry or NULL if it doesnt exist
 */
INVAREntry *INVARManagerGetEntryByPtr( INVARManager *nm, FULONG ptr )
{
	/*
	INVAREntry *ng = (INVAREntry *)ptr;
	if( ng->ne_Pointer != ptr )
	{
		Log( FLOG_ERROR, "Entry assigned to pointer %ld doesn't exist\n", ptr );
		return NULL;
	}
	return ng;
	
	*/
	INVAREntry *ne = NULL;
	INVARGroup *ng = nm->nm_Groups;
	while( ng != NULL )
	{
		INVAREntry *ne = ng->ng_Entries;
		while( ne != NULL )
		{
			if( ne->ne_Pointer == ptr )
			{
				return ne;
			}
			ne = (INVAREntry *)ne->node.mln_Succ;
		}
		
		ng = (INVARGroup *)ng->node.mln_Succ;
	}
	return ne;
}
