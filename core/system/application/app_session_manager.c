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
 *  App Session Manager
 *
 * file contain all functitons related to application sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "app_session_manager.h"
#include <system/systembase.h>
#include "app_session.h"
#include <core/functions.h>

/**
 * Create application session manager
 *
 * @return AppSessionManager
 */

AppSessionManager *AppSessionManagerNew()
{
	AppSessionManager *as = NULL;
	
	if( ( as = FCalloc( 1, sizeof( AppSessionManager ) ) ) != NULL )
	{
		
	}
	else
	{
		FERROR("Cannot allocate memory for AppSessionManager\n");
	}
	
	return as;
}

/**
 * Delete Application Session Manager
 *
 * @param as application session to remove
 */


void AppSessionManagerDelete( AppSessionManager *as )
{
	DEBUG("AppSessionManagerDelete\n");
	if( as )
	{
		AppSession *las = as->sl_AppSessions;
		AppSession *oas = las;
		
		while( las != NULL )
		{
			DEBUG("AppSession will be removed from list\n");

			oas = las;
			las =(AppSession  *)las->node.mln_Succ;
			AppSessionDelete( oas );
		}
		
		FFree( as );
	}
}

/**
 * Add application session to manager
 *
 * @param as application session
 * @param nas pointer to application session which will be added
 * @return 0 if success, otherwise error number
 */

int AppSessionManagerAddSession( AppSessionManager *as, AppSession *nas )
{
	if( as != NULL )
	{
		AppSession *las = NULL;
		
		LIST_FOR_EACH( as->sl_AppSessions, las, AppSession * )
		{
			if( nas->as_ASSID == las->as_ASSID )
			{
				DEBUG("AppSession was already added to list\n");
				return 0;
			}
		}
		
		AppSession *lastone = as->sl_AppSessions;
		if( lastone == NULL )
		{
			as->sl_AppSessions = nas;
		}
		else
		{
			while( lastone->node.mln_Succ != NULL )
			{
				lastone = (AppSession *)lastone->node.mln_Succ;
			}
			lastone->node.mln_Succ = (MinNode *)nas;
		}
		
		return 0;
	}
	return -2;
}

/**
 * Remove application session from manager
 *
 * @param as application session
 * @param nas pointer to application session which will be removed
 * @return 0 if success, otherwise error number
 */

int AppSessionManagerRemSession( AppSessionManager *as, AppSession *nas )
{
	if( as != NULL )
	{
		AppSession *las = NULL;
		AppSession *oas = as->sl_AppSessions;
		
		LIST_FOR_EACH( as->sl_AppSessions, las, AppSession * )
		{
			if( nas->as_ASSID == las->as_ASSID )
			{
				DEBUG("AppSession will be removed from list\n");
				
				if( nas == as->sl_AppSessions )
				{
					as->sl_AppSessions = (AppSession *) nas->node.mln_Succ;
				}
				else
				{
					oas->node.mln_Succ = (MinNode *)nas->node.mln_Succ;
				}
				
				AppSessionDelete( nas );
				
				return 0;
			}
			
			oas = las;
		}
	}
	else
	{
		return -1;
	}
	return -2;
}

/**
 * Get
 *
 * @param as application session
 * @param id of application session to be searched
 * @return application session
 */

AppSession *AppSessionManagerGetSession( AppSessionManager *as, FUQUAD id )
{
	if( as != NULL )
	{
		AppSession *las = NULL;
		
		LIST_FOR_EACH( as->sl_AppSessions, las, AppSession * )
		{
			if( id == las->as_ASSID )
			{
				DEBUG("AppSession found\n");
				
				return las;
			}
		}
	}
	else
	{
		return NULL;
	}
	return NULL;
}
