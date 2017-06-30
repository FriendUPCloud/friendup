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
 *  User Group
 *
 * file contain funuctions related to user groups
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_group.h"

/**
 * Create new User Group
 *
 * @param id unique value which will point to UserGroup
 * @param name of new UserGroup
 * @param uid id of user assigned to group
 * @param type type of group as string
 * @return new UserGroup structure when success, otherwise NULL
 */
UserGroup *UserGroupNew( FULONG id, char *name, FULONG uid, char *type )
{
	UserGroup *ug = NULL;
	
	if( ( ug = FCalloc( 1, sizeof( UserGroup ) ) ) != NULL )
	{
		int len = strlen( name );
		
		ug->ug_ID = id;
		int len10 = len + 10;
		
		ug->ug_Name = FCalloc( len10, sizeof(char) );
		if( ug->ug_Name != NULL )
		{
			strncpy( ug->ug_Name, name, len );
		}
	
		ug->ug_UserID = uid;
	
		len = strlen( type );
		ug->ug_Type = FCalloc( len10, sizeof(char) );
		if( ug->ug_Type != NULL )
		{
			strncpy( ug->ug_Type, type, len );
		}
	}
	
	return ug;
}

/**
 * Delete UserGroup
 *
 * @param ug pointer to UserGroup which will be deleted
 * @return 0 when success, otherwise error number
 */
int UserGroupDelete( UserGroup *ug )
{
	if( ug != NULL )
	{
		if( ug->ug_Name != NULL )
		{
			FFree( ug->ug_Name );
		}
		
		if( ug->ug_Type != NULL )
		{
			FFree( ug->ug_Type );
		}
	}
	return 0;
}

/**
 * Delete all UserGroups from list
 *
 * @param ug pointer to root of UserGroup list which will be deleted
 * @return 0 when success, otherwise error number
 */
int UserGroupDeleteAll(UserGroup* ug)
{
	UserGroup *rem = ug;
	UserGroup *next = ug;
	
	while( next != NULL )
	{
		rem = next;
		next = (UserGroup *)next->node.mln_Succ;
		
		UserGroupDelete( rem );
	}
	return 0;
}
