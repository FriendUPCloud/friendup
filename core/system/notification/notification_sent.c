
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
 * Body of NotificationSent
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (03/12/2018)
 */

#include "notification_sent.h"

/**
 * Create NotificationSent
 *
 * @return new instance of NotificationSent
 */
NotificationSent *NotificationSentNew( )
{
	NotificationSent *n = FCalloc( 1, sizeof(NotificationSent) );
	if( n != NULL )
	{
		NotificationSentInit( n );
	}
	return n;
}

/**
 * Init NotificationSent
 *
 * @param n pointer to NotificationSent
 */
void NotificationSentInit( NotificationSent *n )
{
}

/**
 * Delete NotificationSent
 *
 * @param d pointer to NotificationSent which will be deleted
 */
void NotificationSentDelete( NotificationSent *d )
{
	if( d != NULL )
	{
		FFree( d );
	}
}

/**
 * Delete list of NotificationSent
 *
 * @param d pointer to first NotificationSent in list
 */
void NotificationSentDeleteAll( NotificationSent *d )
{
	while( d != NULL )
	{
		NotificationSent *dt = d;
		d = (NotificationSent *)d->node.mln_Succ;
		
		NotificationSentDelete( dt );
	}
}

