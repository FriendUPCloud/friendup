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
 *  Friend macros
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __CORE_FUNCTIONS_H__
#define __CORE_FUNCTIONS_H__

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wincompatible-pointer-types -Wformat -Wall -Wpedantic"
          
#define LIST_FOR_EACH( LIST, ENTRY, TYPE ) \
	for( ENTRY = LIST; ENTRY != NULL ; ENTRY = ( TYPE ) ENTRY->node.mln_Succ )

#define LIST_DELETE( LIST, TYPE, FUNCTION ) \
	{ TYPE ent = LIST;\
	while( ent != NULL ){ \
		TYPE rm = ent; ent = ( TYPE ) ent->node.mln_Succ; FUNCTION( rm ); \
	} \
	}
		
#pragma GCC diagnostic pop

#define LIST_ADD_HEAD( LIST, ENTRY ) \
		ENTRY->node.mln_Succ =(MinNode *) LIST; \
		LIST = ENTRY;
		
#endif //__CORE_FUNCTIONS_H__
