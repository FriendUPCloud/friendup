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
 *  User Mobile Application
 *
 * file contain definitions related to user mobile application
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 07/09/2018
 */

#include "user_mobile_app.h"

/**
 * Create new UserMobileApp
 *
 * @return new structure UserMobileApp
 */
UserMobileApp *UserMobileAppNew()
{
	UserMobileApp *app;
	if( ( app = FCalloc( 1, sizeof(UserMobileApp) ) ) != NULL )
	{
		app->uma_CreateTS = time(NULL);
		UserMobileAppInit( app );
	}
	return app;
}

/**
 * Delete UserMobileApp
 *
 * @param app pointer to UserMobileApp which will be deleted
 */
void UserMobileAppDelete( UserMobileApp *app )
{
	if( app != NULL )
	{
		/*
		if( app->uma_WSClient != NULL )
		{
			WebsocketClientDelete( app->uma_WSClient );
			app->uma_WSClient = NULL;
		}
		*/
		
		if( app->uma_AppToken != NULL )
		{
			FFree( app->uma_AppToken );
		}
		
		if( app->uma_AppVersion != NULL )
		{
			FFree( app->uma_AppVersion );
		}
		
		if( app->uma_Core != NULL )
		{
			FFree( app->uma_Core );
		}
		
		if( app->uma_DeviceID != NULL )
		{
			FFree( app->uma_DeviceID );
		}
		
		if( app->uma_Platform != NULL )
		{
			FFree( app->uma_Platform );
		}
		
		if( app->uma_PlatformVersion != NULL )
		{
			FFree( app->uma_PlatformVersion );
		}
		
		FFree( app );
	}
}

/**
 * Delete all UserMobileApp's
 *
 * @param app pointer to UserMobileApp list which will be deleted
 */
void UserMobileAppDeleteAll( UserMobileApp *app )
{
	while( app != NULL )
	{
		UserMobileApp *r = app;
		app = (UserMobileApp *) app->node.mln_Succ;
		
		UserMobileAppDelete( r );
	}
}

/**
 * Initialize UserMobileApp
 *
 * @param app pointer to UserMobileApp which will be initialized
 */
void UserMobileAppInit( UserMobileApp *app )
{
	
}
