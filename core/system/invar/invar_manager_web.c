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
 *  INVARManagerWeb body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/12/2017
 */

#include "invar_manager_web.h"
#include <core/functions.h>
#include <util/buffered_string.h>
#include <util/log/log.h>
#include <system/systembase.h>

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
	BufString *nbs = BufStringNew();
	char *eptr;
	
	DEBUG("INVARManagerWebRequest %s\n", urlpath[ 0 ] );
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	DEBUG("INVARManagerWebRequest: list all services avaiable path \n" );
	
	BufStringAddSize( nbs, "{", 1 );
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/listgroups</H2>Return all INVAR groups
	*
	* @param sessionid - (required) session id of logged user
	* @return return available INVAR groups
	*/
	/// @endcond
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/listgroup</H2>List all avaiable entries in INVAR group
	*
	* @param sessionid - (required) session id of logged user
	* @param gid - (required) invar group id
	* @return return available INVAR entries in group
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 0 ], "listgroup" ) == 0 )
	{
		BufString *tmp = BufStringNewSize( 2048 );
		if( tmp != NULL )
		{
			HashmapElement *gid = GetHEReq( request, "gid" );
			if( gid != NULL )
			{
				FULONG lgid = (FULONG)strtoul( gid->hme_Data, &eptr, 0 );
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
					Log( FLOG_ERROR, "Group with ID %s not found\n", gid->hme_Data );
				}
			}
			else
			{
 				Log( FLOG_ERROR, "Wrong GID '%s' provided\n", gid->hme_Data );
			}
		}
		else
		{
			Log( FLOG_ERROR, "Cannot allocate memory for StringBuffer\n");
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/centry</H2>Create INVAR entry and add it to group
	*
	* @param sessionid - (required) session id of logged user
	* @param gid - (required) invar group id
	* @param name - (required) entry name
	* @param data - (required) user data
	* @return string status:ok, response:<invar entry> when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "centry" ) == 0 )
	{
		char tmp[ 1024 ];
		
		HashmapElement *name = GetHEReq( request, "name" );
		HashmapElement *data = GetHEReq( request, "data" );
		HashmapElement *gid = GetHEReq( request, "gid" );
		
		if( name != NULL && data != NULL && gid != NULL )
		{
			INVAREntry *ne = INVAREntryNew( 0, name->hme_Data, data->hme_Data );
			if( ne != NULL )
			{
				FULONG lgid = (FULONG)strtoul( gid->hme_Data, &eptr, 0 );
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/dentry</H2>Delete INVAR entry
	*
	* @param sessionid - (required) session id of logged user
	* @param gid - (required) invar group id
	* @param eid - (required) entry id
	* @return string status:ok when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "dentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		HashmapElement *gid = GetHEReq( request, "gid" );
		
		if( eid != NULL && gid != NULL )
		{
			FULONG lgid = (FULONG)strtoul( gid->hme_Data, &eptr, 0 );
			FULONG leid = (FULONG)strtoul( eid->hme_Data, &eptr, 0 );
			
			INVARManagerDeleteEntry( nm, lgid, leid );
			
			BufStringAddSize( nbs, "\"status\":\"ok\"", 14 );
		}
		else
		{
			Log( FLOG_ERROR, "EID and GID not provided\n");
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/uentry</H2>Update INVAR entry
	*
	* @param sessionid - (required) session id of logged user
	* @param eid - (required) entry id
	* @param data - (required) user data
	* @return string status:ok, response:<invar entry> when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "uentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		HashmapElement *data = GetHEReq( request, "data" );
		
		if( eid != NULL && data != NULL )
		{
			FULONG leid = (FULONG)strtoul( eid->hme_Data, &eptr, 0 );
			
			INVAREntry *ne = INVARManagerGetEntryByPtr( nm, leid );
			if( ne != NULL )
			{
				if( ne->ne_Data != NULL )
				{
					FFree( ne->ne_Data );
				}
				ne->ne_Data = StringDuplicate( data->hme_Data );
				
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/gentry</H2>Get INVAR entry
	*
	* @param sessionid - (required) session id of logged user
	* @param eid - (required) entry id
	* @return string status:ok, response:<invar entry> when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 0 ], "gentry" ) == 0 )
	{
		HashmapElement *eid = GetHEReq( request, "eid" );
		
		if( eid != NULL )
		{
			FULONG leid = (FULONG)strtoul( eid->hme_Data, &eptr, 0 );
			
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/cgroup</H2>Create INVAR group
	*
	* @param sessionid - (required) session id of logged user
	* @param name - (required) group name
	* @return string status:ok, response:<invar entry> when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "cgroup" ) == 0 )
	{
		char tmp[ 10024 ];
		
		HashmapElement *name = GetHEReq( request, "name" );
		
		if( name != NULL  )
		{
			INVARGroup *ng = INVARGroupNew( 0, name->hme_Data );
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/invar/dgroup</H2>Delete INVAR group
	*
	* @param sessionid - (required) session id of logged user
	* @TODO no finished
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 0 ], "dgroup" ) == 0 )
	{
		
	}
	
	DEBUG( "INVARManager Command OK %s !\n", urlpath[ 0 ] );
	BufStringAddSize( nbs, "}", 1 );
	
	HttpSetContent( response, nbs->bs_Buffer, nbs->bs_Size );
	nbs->bs_Buffer = NULL;
	BufStringDelete( nbs );
	
	return response;
}

