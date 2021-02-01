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
 *  Socket Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */
#ifndef __INTERFACE_LIST_STRING_INTERFACE_H__
#define __INTERFACE_LIST_STRING_INTERFACE_H__

#include <util/list_string.h>

typedef struct ListStringInterface
{
	ListString					*(*ListStringNew)();
	void						(*ListStringDelete)( ListString *ls );
	int64_t						(*ListStringAdd)( ListString *add, char *data, int64_t size );
	int							(*ListStringJoin)( ListString *ls );
} ListStringInterface;

//
// init function
//

static inline void ListStringInterfaceInit( ListStringInterface *si )
{
	si->ListStringNew = ListStringNew;
	si->ListStringDelete = ListStringDelete;
	si->ListStringAdd = ( void *)ListStringAdd;
	si->ListStringJoin = ListStringJoin;
}

#endif
