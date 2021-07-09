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
 *  WebdavToken Body
 *
 * All functions related to Webdav structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#include "webdav_token.h"

/**
 * Create new WebdavToken
 *
 * @return new WebdavToken structure when success, otherwise NULL
 */
WebdavToken *WebdavTokenNew()
{
	WebdavToken *tok = FCalloc( 1, sizeof(WebdavToken) );
	if( tok != NULL )
	{
		tok->wt_CreationTime = time( NULL );
	}
	return tok;
}

/**
 * Delete WebdavToken
 *
 * @param tok pointer to WebdavToken which will be deleted
 */
void WebdavTokenDelete( WebdavToken *tok )
{
	if( tok != NULL )
	{
		FFree( tok );
	}
}

/**
 * Delete WebdavToken list
 *
 * @param tok pointer to WebdavToken list which will be deleted
 */
void WebdavTokenDeleteAll( WebdavToken *tok )
{
	WebdavToken *lt = tok;
	while( lt != NULL )
	{
		WebdavToken *dt = lt;
		lt = (WebdavToken *) lt->node.mln_Succ;
		
		WebdavTokenDelete( dt );
	}
}
