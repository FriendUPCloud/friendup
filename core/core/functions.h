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
 *  Friend macros
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 * 
 * \ingroup FriendCore
 * @{
 */

#ifndef __CORE_FUNCTIONS_H__
#define __CORE_FUNCTIONS_H__

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
		
#ifndef NO_NULL
#define NO_NULL( DISP ) ( DISP != NULL ? DISP : "" )
#endif
		
#endif //__CORE_FUNCTIONS_H__

/**@}*/
// End of FriendCore Doxygen group
