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

	void							(*ListStringDelete)( ListString *ls );

	int							(*ListStringAdd)( ListString *add, char *data, int size );
	
	ListString					*(*ListStringJoin)( ListString *ls );
	
}ListStringInterface;

//
// init function
//

inline void ListStringInterfaceInit( ListStringInterface *si )
{
	si->ListStringNew = ListStringNew;
	si->ListStringDelete = ListStringDelete;
	si->ListStringAdd = ListStringAdd;
	si->ListStringJoin = ListStringJoin;
}

#endif