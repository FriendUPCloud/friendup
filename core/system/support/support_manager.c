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
 *  Support Manager Body
 *
 * file contain all functitons related to all misc functionalities which support FC
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <system/support/support_manager.h>

/**
 * Create new SupportManager
 *
 * @return new SupportManager structure when success, otherwise NULL
 */
SupportManager *SupportManagerNew( )
{
	SupportManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( SupportManager ) ) ) != NULL )
	{
		
	}
	else
	{
		FERROR("Cannot allocate memory for SupportManager!\n");
	}
	
	return sm;
}

/**
 * Delete SupportManager
 *
 * @param sm pointer to SupportManager which will be deleted
 */

void SupportManagerDelete( SupportManager *sm )
{
	if( sm != NULL )
	{
		FFree( sm );
	}
}

//
// internal SupportManager thread
//

void SupportManagerThread( SupportManager *sm )
{
	
}

