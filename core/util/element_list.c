/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/types.h>
#include "element_list.h"
#include "string.h"

/**
 * Parse string and return list of entries (int)
 *
 * @param str pointer to string
 * @return new pointer to root element IntListEl
 */

IntListEl *ILEParseString( char *str )
{
	if( str == NULL )
	{
		return NULL;
	}
	int i;
	char *startToken = str;
	char *curToken = str+1;
	
	IntListEl *rootEl = NULL;
	
	while( TRUE )
	{
		//printf("'%c'-'%d'   ===== ", *curToken, *curToken );
		if( *curToken == 0 || *curToken == ',' )
		{
			char *end;
			char oldChar = *curToken;
			char *oldCurToken = curToken;
			int64_t var = 0;
			IntListEl *el = NULL;
			
			if( *curToken != 0 )
			{
				*curToken = 0;
			}
			curToken++;
			
			//printf("Entry found: %s\n", startToken );
			var = strtol( startToken, &end, 0 );
			el = FCalloc( 1, sizeof( IntListEl ) );
			if( el != NULL )
			{
				el->i_Data = var;
				el->node.mln_Succ = (MinNode *)rootEl;
				rootEl = el;
			}
			// do something here
		
			*oldCurToken = oldChar;
			startToken = curToken;
		
			if( *curToken == 0 )
			{
				break;
			}
			curToken++;
		}
		else
		{
			curToken++;
		}
	}
	return rootEl;
}

/**
 * Parse string and return list of entries (unsigned int)
 *
 * @param str pointer to string
 * @return new pointer to root element IntListEl
 */

UIntListEl *UILEParseString( char *str )
{
	if( str == NULL )
	{
		return NULL;
	}
	int i;
	char *startToken = str;
	char *curToken = str+1;
	
	UIntListEl *rootEl = NULL;
	
	while( TRUE )
	{
		if( *curToken == 0 || *curToken == ',' )
		{
			char *end;
			char oldChar = *curToken;
			char *oldCurToken = curToken;
			uint64_t var = 0;
			UIntListEl *el = NULL;
			
			if( *curToken != 0 )
			{
				*curToken = 0;
			}
			curToken++;
			
			//printf("Entry found: %s\n", startToken );
			var = strtoul( startToken, &end, 0 );
			el = FCalloc( 1, sizeof( UIntListEl ) );
			if( el != NULL )
			{
				el->i_Data = var;
				el->node.mln_Succ = (MinNode *)rootEl;
				rootEl = el;
			}
			// do something here
		
			*oldCurToken = oldChar;	//lets fix string
			startToken = curToken;
		
			if( *curToken == 0 )
			{
				break;
			}
			curToken++;
		}
		else
		{
			curToken++;
		}
	}
	return rootEl;
}

/**
 * Parse string and return list of entries (char *)
 *
 * @param str pointer to string
 * @return new pointer to root element IntListString
 */

StringListEl *SLEParseString( char *str )
{
	if( str == NULL )
	{
		return NULL;
	}
	int i;
	char *startToken = str;
	char *curToken = str+1;
	
	StringListEl *rootEl = NULL;
	
	while( TRUE )
	{
		if( *curToken == 0 || *curToken == ',' )
		{
			char *end;
			char oldChar = *curToken;
			char *oldCurToken = curToken;
			int64_t var = 0;
			StringListEl *el = NULL;
			
			if( *curToken != 0 )
			{
				*curToken = 0;
			}
			
			curToken++;
			var = strtol( startToken, &end, 0 );
			el = FCalloc( 1, sizeof( StringListEl ) );
			if( el != NULL )
			{
				el->s_Data = StringDuplicate( startToken );
				el->node.mln_Succ = (MinNode *)rootEl;
				rootEl = el;
			}
			// do something here
		
			*oldCurToken = oldChar;
			startToken = curToken;
		
			if( *curToken == 0 )
			{
				break;
			}
			curToken++;
		}
		else
		{
			curToken++;
		}
	}
	return rootEl;
}


