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
			
			DEBUG("Delete Entry\n");
			
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
		DEBUG("Group added to list %p next ptr %p\n", ng, ng->node.mln_Succ );
	}
	else
	{
		FERROR( "Group and Entry are empty\n");
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
		DEBUG("Group found under pointer %p\n", ng );
		
		if( ng != NULL && ng->ng_Pointer == grid )
		{
			ng->node.mln_Succ = (MinNode *) ng->ng_Entries;
			ng->ng_Entries = ne;
		}
		else
		{
			FERROR("Cannot add new entry, group under pointer %ld not found\n", grid );
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
 * Delete INVAREntry from INVARGroup
 *
 * @param nm pointer to INVARManager
 * @param grid id of group from which INVAREntry will be removed
 * @param enid id of entry which will be deleted
 */
void INVARManagerDeleteEntry( INVARManager *nm, FULONG grid, FULONG enid )
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
	DEBUG("GetGroup by ptr %lu\n", ptr );
	INVARGroup *ng = nm->nm_Groups;
	while( ng != NULL )
	{
		DEBUG("Checking group %p\n", ng );
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

/**
 * INVARManager web calls handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @return pointer to new Http structure (response) or NULL when error appear
 */
Http *INVARManagerWebRequest( void *m, char **urlpath, Http* request )
{
	INVARManager *nm = (INVARManager *)m;
	char *serviceName = NULL;
	int newStatus = -1;
	BufString *nbs = BufStringNew();
	char *eptr;
	
	DEBUG("INVARManagerWebRequest %s\n", urlpath[ 0 ] );
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	DEBUG("INVARManagerWebRequest: list all services avaiable path \n" );
	
	BufStringAddSize( nbs, "{", 1 );
	
	//
	// list all groups
	//
	
	if( strcmp( urlpath[ 0 ], "listgroups" ) == 0 )
	{
		BufString *tmp = BufStringNewSize( 2048 );
		if( tmp != NULL )
		{
			int pos = 0;
			
			INVARGroup *ng = nm->nm_Groups;
			while( ng != NULL )
			{
				char ct[ 1024 ];
				
				int size = INVARGroupToJSON( ng, ct, 1024 );
				
				if( pos++ > 0 )
				{
					BufStringAddSize( tmp,",", 1 );
				}
				BufStringAddSize( tmp, ct, size );
				
				ng = (INVARGroup *)ng->node.mln_Succ;
			}
			
			BufStringAddSize( nbs, tmp->bs_Buffer, tmp->bs_Size );
			BufStringDelete( tmp );
		}
		else
		{
			Log( FLOG_ERROR, "Cannot allocate memory for StringBuffer\n");
		}
		
		DEBUG("listgroups\n");
	}
	
	//
	// list entries assigned to group
	//
	
	else if( strcmp( urlpath[ 0 ], "listgroup" ) == 0 )
	{
		BufString *tmp = BufStringNewSize( 2048 );
		if( tmp != NULL )
		{
			HashmapElement *gid = GetHEReq( request, "gid" );
			if( gid != NULL )
			{
				FULONG lgid = (FULONG)strtoul( gid->data, &eptr, 0 );
				INVARGroup *ng = INVARManagerGetGroupByPtr( nm, lgid );
				if( ng != NULL )
				{
					int pos = 0;
					INVAREntry *ne = ng->ng_Entries;
					
					while( ne != NULL )
					{
						
						char ct[ 1024 ];
				
						int size = INVAREntryToJSON( ne, ct, 1024 );
						if( pos++ > 0 )
						{
							BufStringAddSize( tmp,",", 1 );
						}
						BufStringAddSize( tmp, ct, size );
						
						ne = (INVAREntry *) ne->node.mln_Succ;
					}
				}
				else
				{
					Log( FLOG_ERROR, "Group with ID %s not found\n", gid->data );
				}
			}
			else
			{
 				Log( FLOG_ERROR, "Wrong GID '%s' provided\n", gid->data );
			}
		}
		else
		{
			Log( FLOG_ERROR, "Cannot allocate memory for StringBuffer\n");
		}
	}
	
	//
	// create entry
	//
	
	else if( strcmp( urlpath[ 0 ], "centry" ) == 0 )
	{
		char tmp[ 1024 ];
		
		HashmapElement *name = GetHEReq( request, "name" );
		HashmapElement *data = GetHEReq( request, "data" );
		HashmapElement *gid = GetHEReq( request, "gid" );
		
		if( name != NULL && data != NULL && gid != NULL )
		{
			INVAREntry *ne = INVAREntryNew( 0, name->data, data->data );
			if( ne != NULL )
			{
				FULONG lgid = (FULONG)strtoul( gid->data, &eptr, 0 );
				DEBUG("Get group with ID %lu\n", (unsigned long )lgid );
			
				if( INVARManagerAddEntry( nm, lgid, ne ) == 0 )
				{
					INVAREntryJSONPTR( ne, tmp, 1024 );
				
					BufStringAddSize( nbs, "\"status\":\"ok\", \"response\":", 26 );
					BufStringAdd( nbs, tmp );
				}
				else
				{
					BufStringAddSize( nbs, "\"status\":\"fail\"", 15 );
				}
			}
			else
			{
				Log( FLOG_ERROR, "Cannot create new entry\n");
			}
		}
		else
		{
			Log( FLOG_ERROR, "Name, Data, GID not provided\n");
		}
	}
	
	//
	// remove entry
	//
	
	else if( strcmp( urlpath[ 0 ], "dentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		HashmapElement *gid = GetHEReq( request, "gid" );
		
		if( eid != NULL && gid != NULL )
		{
			FULONG lgid = (FULONG)strtoul( gid->data, &eptr, 0 );
			FULONG leid = (FULONG)strtoul( eid->data, &eptr, 0 );
			
			INVARManagerDeleteEntry( nm, lgid, leid );
		}
		else
		{
			Log( FLOG_ERROR, "EID and GID not provided\n");
		}
	}
	
	//
	// update entry
	//
	
	else if( strcmp( urlpath[ 0 ], "uentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		HashmapElement *data = GetHEReq( request, "data" );
		
		if( eid != NULL && data != NULL )
		{
			FULONG leid = (FULONG)strtoul( eid->data, &eptr, 0 );
			
			INVAREntry *ne = INVARManagerGetEntryByPtr( nm, leid );
			if( ne != NULL )
			{
				if( ne->ne_Data != NULL )
				{
					FFree( ne->ne_Data );
				}
				ne->ne_Data = StringDuplicate( data->data );
				
				char tmp[ 1024 ];
				INVAREntryJSONPTR( ne, tmp, 1024 );
				
				BufStringAddSize( nbs, "\"status\":\"ok\", \"response\":", 26 );
				BufStringAdd( nbs, tmp );
			}
		}
		else
		{
			Log( FLOG_ERROR, "EID and Data not provided\n");
		}
	}
	
	//
	// get entry
	//
	
	else if( strcmp( urlpath[ 0 ], "gentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		
		if( eid != NULL )
		{
			FULONG leid = (FULONG)strtoul( eid->data, &eptr, 0 );
			
			INVAREntry *ne = INVARManagerGetEntryByPtr( nm, leid );
			if( ne != NULL )
			{
				char tmp[ 10024 ];
				INVAREntryToJSON( ne, tmp, 10024 );
				
				BufStringAddSize( nbs, "\"status\":\"ok\", \"response\":", 26 );
				BufStringAdd( nbs, tmp );
			}
		}
		else
		{
			Log( FLOG_ERROR, "EID and Data not provided\n");
		}
	}
	
	//
	// create group
	//
	
	else if( strcmp( urlpath[ 0 ], "cgroup" ) == 0 )
	{
		char tmp[ 10024 ];
		
		HashmapElement *name = GetHEReq( request, "name" );
		
		if( name != NULL  )
		{
			INVARGroup *ng = INVARGroupNew( 0, name->data );
			if( ng != NULL )
			{

				if( INVARManagerAddGroup( nm, ng ) == 0 )
				{
					INVARGroupJSONPTR( ng, tmp, 10024 );
				
					BufStringAddSize( nbs, "\"status\":\"ok\", \"response\":", 26 );
					BufStringAdd( nbs, tmp );
				}
				else
				{
					BufStringAddSize( nbs, "\"status\":\"fail\"", 15 );
				}
			}
			else
			{
				Log( FLOG_ERROR, "Cannot create new entry\n");
			}
		}
		else
		{
			Log( FLOG_ERROR, "Name, Data, GID not provided\n");
		}
	}
	
	//
	// delete group
	//
	
	else if( strcmp( urlpath[ 0 ], "dgroup" ) == 0 )
	{
		
	}
	
	DEBUG( "INVARManager Command OK %s !\n", urlpath[ 0 ] );
	BufStringAddSize( nbs, "}", 1 );
	
	HttpSetContent( response, nbs->bs_Buffer, nbs->bs_Size );
	nbs->bs_Buffer = NULL;
	BufStringDelete( nbs );
	//HttpWriteAndFree( response );
	return response;
}

