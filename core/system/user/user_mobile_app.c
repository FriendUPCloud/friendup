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
