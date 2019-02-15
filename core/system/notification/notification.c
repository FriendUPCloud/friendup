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
 * Body of Notification
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (03/12/2018)
 */

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>
#include "notification.h"
#include <util/session_id.h>

/**
 * Create Notification
 *
 * @return new instance of Notification
 */
Notification *NotificationNew( )
{
	Notification *n = FCalloc( 1, sizeof(Notification) );
	if( n != NULL )
	{
		NotificationInit( n );
	}
	return n;
}

/**
 * Init Notification
 *
 * @param n pointer to Notification
 */
void NotificationInit( Notification *n )
{
	n->n_Created = time( NULL );
}

/**
 * Delete Notification
 *
 * @param d pointer to Notification which will be deleted
 */
void NotificationDelete( Notification *d )
{
	if( d != NULL )
	{
		NotificationSentDeleteAll( d->n_NotificationsSent );
		
		if( d->n_Channel != NULL )
		{
			FFree( d->n_Channel );
		}
		if( d->n_Content != NULL )
		{
			FFree( d->n_Content );
		}
		if( d->n_Title != NULL )
		{
			FFree( d->n_Title );
		}
		if( d->n_Extra != NULL )
		{
			FFree( d->n_Extra );
		}
		if( d->n_Application != NULL )
		{
			FFree( d->n_Application );
		}
		if( d->n_UserName != NULL )
		{
			FFree( d->n_UserName );
		}

		FFree( d );
	}
}

/**
 * Delete list of Notification
 *
 * @param d pointer to first Notification in list
 */
void NotificationDeleteAll( Notification *d )
{
	while( d != NULL )
	{
		Notification *dt = d;
		d = (Notification *)d->node.mln_Succ;
		
		NotificationDelete( dt );
	}
}

