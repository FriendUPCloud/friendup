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
 *  Fast array of Friend Strings
 *
 *  There are two ways to access array elements:
 *  - use the ID of the element. It will still point to one elements even if the
 *    array is modified by inserting other elements before it
 *  - use the position of the element in the list, in this case the order of the
 *    elements is respected (good for texts)
 *
 *  @author FL (Francois Lionet)
 *  @warning this source has not been tested!
 *  @date first push on 06/12/2016
 *  @todo FL>FL implement Unicode
 *  @todo FL>FL make a generic "FastArray" version from this one and create the StringArray from it
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "friendstring.h"
#include "friendstringarray.h"

/**
 * Allocates a Freind String Array
 *
 * @param size number of string to store as default
 * @return pointer to the allocated array
 * @return NULL in case of error
 */
FStringArray* FStringArrayAlloc(int size)
{
	FStringArray* pFSArray = (FStringArray*)calloc( 1, sizeof( FStringArray ) );
	if( pFSArray == NULL )
		return NULL;
	pFSArray->justChecked = -1;

	if (size > 0 )
	{
		pFSArray->pArray = (FString**)calloc( sizeof( FString* ), size );
		if (pFSArray->pArray == NULL )
		{
			free(pFSArray);
			return NULL;
		}
		pFSArray->pIndexes = (int*)calloc( sizeof( int* ), size );
		if (pFSArray->pIndexes == NULL )
		{
			free(pFSArray->pArray);
			pFSArray->pArray = NULL;
			free(pFSArray);
			return NULL;
		}
		pFSArray->bufferLength = size;
	}
	return pFSArray;
}

/**
 * Liberates a friend String Array
 *
 * @param pFSArray pointer to the FStringArray to liberate
 * @return FSTRINGERROR_OK if everything OK (==0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayFree(FStringArray* pFSArray)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;

	FStringArrayDeleteAll(pFSArray);
	free(pFSArray->pArray);
	free(pFSArray->pIndexes);
	free(pFSArray);
	return FSTRINGERROR_OK;
}

/**
 * Destroys a FString from the array at a specific position
 *
 * @param pFSArray pointer to the FStringArray
 * @param number number of the string to delete
 * @return FSTRINGERROR_OK if everything OK (==0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayDeleteNumber(FStringArray* pFSArray, int number)
{
	if (pFSArray == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (number < 0)
		return number;

	if (pFSArray->pArray[number] != NULL)
	{
		FStringFree(pFSArray->pArray[number]);
		pFSArray->pArray[number] = NULL;
		pFSArray->pIndexes[number] = 0;
	}
	return FSTRINGERROR_OK;
}
/**
 * Destroys a FString from the array with its ID
 *
 * @param pFSArray pointer to the FStringArray
 * @param id id of the string to delete
 * @return FSTRINGERROR_OK if everything OK (==0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayDeleteId(FStringArray* pFSArray, int id)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;

	return FStringArrayDeleteNumber(pFSArray, FStringArrayGetNumberFromId(pFSArray, id));
}

/**
 * Destroys all FString from the array
 *
 * @param pFSArray pointer to the FStringArray
 * @return FSTRINGERROR_OK if everything OK (==0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayDeleteAll(FStringArray* pFSArray)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;

	int n;
	for (n = 0; n < pFSArray->bufferLength; n++)
	{
		if (pFSArray->pArray[n] != NULL)
		{
			FStringFree(pFSArray->pArray[n]);
			pFSArray->pArray[n] = NULL;
			pFSArray->pIndexes[n] = 0;
		}
	}
	return FSTRINGERROR_OK;
}

/**
 * Makes sure the handling buffers of the array is large enough
 *
 * @param pFSArray pointer to the FStringArray
 * @param size new size of the array
 * @return buffer size after checking (>0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayCheckBuffer(FStringArray* pFSArray, int size)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;
	if (size < 0)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (pFSArray->bufferLength < size)
	{
		int n;

		FString** pTemp1 = realloc(pFSArray->pArray, sizeof(FString*) * size );
		if (pTemp1 == NULL)
			return FSTRINGERROR_MEMORY;
		pFSArray->pArray = pTemp1;
		for (n = pFSArray->bufferLength; n < size; n++)
			pTemp1[n] = NULL;
		pFSArray->justChecked = size - 1;
		pFSArray->bufferLength = size;

		int *pTemp2 = realloc(pFSArray->pIndexes, sizeof(int *) * size);
		if (pTemp2 == NULL)
			return FSTRINGERROR_MEMORY;
		pFSArray->pIndexes = pTemp2;
		for (n = pFSArray->indexLength; n < size; n++)
			pTemp2[n] = 0;
		pFSArray->indexLength = size;
	}
	return pFSArray->bufferLength;
}

/**
 * Finds a place to create an new id
 *
 * @param pFSArray pointer to the FStringArray
 * @param number number of the string to associate the id with
 * @return id found (>=0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayNewId(FStringArray* pFSArray, int number)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;

	int n;
	for (n = 0; n < pFSArray->indexLength; n++)
	{
		if (pFSArray->pIndexes[n] == 0)
		{
			pFSArray->pIndexes[n] = number;
			FStringArrayCheckLastNumber(pFSArray);
			return n;
		}
	}
	return FSTRINGERROR_UNKNOWN;
}

/**
 * Counts the FStrings in the array and returns the number of the last one
 *
 * @param pFSArray pointer to the FStringArray
 * @return number of the last FString iin the array (number of lines...)
 */
int FStringArrayCheckLastNumber(FStringArray* pFSArray)
{
	int id;
	pFSArray->lastNumber = 0;
	for (id = 0; id < pFSArray->indexLength; id++)
	{
		if (pFSArray->pIndexes[id] > pFSArray->lastNumber)
			pFSArray->lastNumber = pFSArray->pIndexes[id];
	}
	return pFSArray->lastNumber;
}
/**
 * Finds a free slot to store a new FString, and return its id
 *
 * Use FStringArrayGetNumber to find the position of the element
 *
 * @param pFSArray pointer to the FStringArray
 * @param position initial position of the search
 * @param flags FSTRINGFLAG_AFTER to search after the position
 *              FSTRINGFLAG_BEFORE to search before the position
 * @return id of the allocated element
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayFindFreeSlot(FStringArray* pFSArray, int position, int flags)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;

	if (flags == -1)
		flags = FSTRINGFLAG_BEFORE | FSTRINGFLAG_AFTER;

	int number;
	FBOOL bFound = FALSE;

	if (flags == -1)
		flags = FSTRINGFLAG_AFTER;

	if (flags & FSTRINGFLAG_AFTER)
	{
		for (number = position; number < pFSArray->bufferLength; number++)
		{
			if (pFSArray->pArray[number] == NULL)
			{
				bFound = TRUE;
				break;
			}
		}
	}
	if (!bFound && (flags & FSTRINGFLAG_BEFORE) != 0)
	{
		for (number = position; number > 0; number--)
		{
			if (pFSArray->pArray[number] == NULL)
			{
				bFound = TRUE;
				break;
			}
		}
	}

	// Creates a new one?
	if (!bFound)
	{
		number = FStringArrayCheckBuffer(pFSArray, pFSArray->bufferLength + 1);
		if (number < 0)
			return number;
		if (flags & FSTRINGFLAG_INSERT)
		{
			if (position - 1 < pFSArray->bufferLength)
				memmove(&pFSArray->pArray[position + 1], &pFSArray->pArray[position], sizeof(FString*) * (pFSArray->bufferLength - position -1));
		}
		number = position;
	}
	pFSArray->lastNumber = number;

	// Returns the id
	return FStringArrayNewId(pFSArray, number);
}
/**
 * Adds a string at in the array
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString to put
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString by copying the first one
 *              default behavior is to use the pointer given to the function...
 * @return id of the FString in the array
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayAddFString(FStringArray* pFSArray, FString* pFString, int flags)
{
	if (pFSArray == NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (flags == -1)
		flags = 0;

	int id = FStringArrayFindFreeSlot(pFSArray, pFSArray->lastNumber, FSTRINGFLAG_AFTER);
	if (id < 0)
		return id;

	if (flags < 0)
		flags = FSTRINGFLAG_CREATENEW;

	int number = pFSArray->pIndexes[id];
	if (flags & FSTRINGFLAG_CREATENEW)
	{
		pFSArray->pArray[number] = FStringAllocFromFString(pFString);
		if (pFSArray->pArray[number] == NULL)
			return FSTRINGERROR_MEMORY;
	}
	else
	{
		pFSArray->pArray[number] = pFString;
	}
	return id;
}

/**
 * Add a FString created from a C string to the array
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param flags not used for the moment
 * @return id of the FString created in the array
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayAddString(FStringArray* pFSArray, char* pString, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FString* pFString = FStringAllocFromString(pString);
	if (pFString == NULL)
		flags = FSTRINGERROR_MEMORY;

	return FStringArrayAddFString(pFSArray, pFString, 0);
}

////////////////////////////////////////////////////////////////////////////////
// Enumeration
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the number of a FString from its id
 *
 * @param pFSArray pointer to the FStringArray
 * @param id id of the FString to find
 * @return number of the FString in the array (>=0)
 * @return FSTRINGERROR_* if error (<0)
 */
int FStringArrayGetNumberFromId(FStringArray *pFSArray, int id)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;
	if (id < 0 || id > pFSArray->indexLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (pFSArray->pIndexes[id] > 0)
		return pFSArray->pIndexes[id] - 1;

	return FSTRINGERROR_NOTFOUND;
}
/**
 * Returns the id of a FString from its number
 *
 * This fuunction enumerates the array, and can be slow for large arrays.
 *
 * @param pFSArray pointer to the FStringArray
 * @param number number of the FString to find
 * @return number of the FString in the array (>=0)
 * @return FSTRINGERROR_NOTFOUND if not found, or error code (<0)
 */
int FStringArrayGetIdFromNumber(FStringArray* pFSArray, int number)
{
	if ( pFSArray== NULL )
		return FSTRINGERROR_NULLPOINTER;
	if (number < 0 || number > pFSArray->bufferLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	int id;
	for (id = 0; id < pFSArray->indexLength; id++)
	{
		if (pFSArray->pIndexes[id] == number)
		    return id;
	}
	return FSTRINGERROR_NOTFOUND;
}

/**
 * Find next FString in the array after the search is initialized
 *
 * You should call FStringArrayFindNumberFromString before calling this function
 *
 * @param pFSArray pointer to the FStringArray
 * @return number of the FString found
 * @return FSTRINGERROR_NOTFOUND if not found, or error code (<0)
 */
int FStringArrayFindNextNumber(FStringArray* pFSArray)
{
	if ( pFSArray== NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (pFSArray->action != FSTRINGACTION_FINDFIRSTNUMBERFROMSTRING && pFSArray->action != FSTRINGACTION_FINDNEXTNUMBERFROMSTRING )
		return FSTRINGERROR_NOTINITIALIZED;

	int number = pFSArray->result;

	int id;
	int result = -1;
	if (pFSArray->workFlags & FSTRINGFLAG_AFTER)
	{
		if (pFSArray->action == FSTRINGACTION_FINDNEXTNUMBERFROMSTRING)
			number++;
		for (id = number; id < pFSArray->indexLength; id++)
		{
			if (pFSArray->pIndexes[id] > 0)
			{
				if (FStringCompareString(pFSArray->pArray[pFSArray->pIndexes[id]], pFSArray->pWork->pString, pFSArray->workFlags) == 0)
				{
					result = id;
					break;
				}
			}
		}
	}
	else
	{
		if (pFSArray->action == FSTRINGACTION_FINDNEXTNUMBERFROMSTRING)
			number--;
		for (id = number; id > 0; id--)
		{
			if (pFSArray->pIndexes[id] > 0)
			{
				if (FStringCompareString(pFSArray->pArray[pFSArray->pIndexes[id]], pFSArray->pWork->pString, pFSArray->workFlags) == 0)
				{
					result = id;
					break;
				}
			}
		}
	}
	if (result > 0)
	{
		pFSArray->result = result;
		pFSArray->action = FSTRINGACTION_FINDNEXTNUMBERFROMSTRING;
		return result;
	}
	FStringFree(pFSArray->pWork);
	pFSArray->action = FSTRINGACTION_NOTINTIALIZED;
	return FSTRINGERROR_NOTFOUND;
}
/**
 * Finds the first FString containing a C string in the array
 *
 * Explore the array after this function by using FStringArrayFindNextNumber
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string to find
 * @param number number of the string to start the search at
 * @param flags FSTRINGFLAG_AFTER for upward search
 *              FSTRINGFLAG_BEFORE for backward search
 * @return number of the FString found
 * @return FSTRINGERROR_NOTFOUND if not found, or error code (<0)
 */
int FStringArrayFindNumberFromString(FStringArray* pFSArray, char* pString, int number, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (number < 0 || number > pFSArray->bufferLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (flags == -1)
		flags = FSTRINGFLAG_AFTER;

	if (pFSArray->pWork != NULL)
		FStringSetString(pFSArray->pWork, pString);
	else
	{
		pFSArray->pWork = FStringAllocFromString(pString);
		if (pFSArray->pWork == NULL)
			return FSTRINGERROR_MEMORY;
	}
	pFSArray->action = FSTRINGACTION_FINDFIRSTNUMBERFROMSTRING;
	pFSArray->result = number;
	pFSArray->workFlags = flags;
	return FStringArrayFindNextNumber(pFSArray);
}

////////////////////////////////////////////////////////////////////////////////
// File operations
////////////////////////////////////////////////////////////////////////////////

/**
 * Inserts an ASCII file in the array, each line being a new FString
 *
 * This function is not implemented.
 *
 * @param pFSArray pointer to the FStringArray
 * @param pPath pointer to a C string containing the pathname of the file
 * @param number position in the array to insert at
 * @param nLines number of lines of the files to insert
 * @param flags
 * @return FSTRINGERROR_NOTIMPLEMENTED
 */
int FStringArrayInsertFileAscii(FStringArray* pFSArray __attribute__((unused)), char* pPath __attribute__((unused)), int number __attribute__((unused)), int nLines __attribute__((unused)), int flags __attribute__((unused)))
{
	return FSTRINGERROR_NOTIMPLEMENTED;
}
/**
 * Write all the lines of the array into an ASCII file
 *
 * This function is not implemented.
 *
 * @param pFSArray pointer to the FStringArray
 * @param pPath pointer to a C string containing the pathname of the file
 * @param nLines number of lines of the files to write
 * @param flags
 * @return FSTRINGERROR_NOTIMPLEMENTED
 */
int FStringArraySaveAscii(FStringArray* pFSArray __attribute__((unused)), int nLines __attribute__((unused)), int flags __attribute__((unused)))
{
	return FSTRINGERROR_NOTIMPLEMENTED;
}
/**
 * Load an ASCII file in the array, each line being a new FString
 *
 * This function is not implemented.
 *
 * @param pFSArray pointer to the FStringArray
 * @param pPath pointer to a C string containing the pathname of the file
 * @param nLines number of lines of the files to insert
 * @param flags
 * @return FSTRINGERROR_NOTIMPLEMENTED
 */
int FStringArrayLoadAscii(FStringArray* pFSArray __attribute__((unused)), int nLines __attribute__((unused)), int position __attribute__((unused)), int flags __attribute__((unused)))
{
	return FSTRINGERROR_NOTIMPLEMENTED;
}

////////////////////////////////////////////////////////////////////////////////
// Insert strings in array
////////////////////////////////////////////////////////////////////////////////
/**
 * Inserts a FString at a position in the array
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString to insert
 * @param number position of insertion
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the first one (default)
 *              FSTRINGFLAG_AFTER to insert after the given position (default)
 *              FSTRINGFLAG_BEFORE to insert before
 * @return id of the new element
 * @return error code (<0)
 */
int FStringArrayInsertFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags)
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (flags == -1)
		flags = FSTRINGFLAG_AFTER | FSTRINGFLAG_CREATENEW;

	int id = FStringArrayFindFreeSlot(pFSArray, number, flags | FSTRINGFLAG_INSERT);
	if (id < 0)
		return id;

	number = pFSArray->pIndexes[id];
	if (flags & FSTRINGFLAG_CREATENEW)
	{
		pFSArray->pArray[number] = FStringAllocFromFString(pFString);
		if (pFSArray->pArray[number] == NULL)
			return FSTRINGERROR_MEMORY;
	}
	else
	{
		pFSArray->pArray[number] = pFString;
	}
	return id;
}
/**
 * Creates a new FString from a C string and inserts it at a position in the array
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param number position of insertion
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the first one (default)
 *              FSTRINGFLAG_AFTER to insert after the given position (default)
 *              FSTRINGFLAG_BEFORE to insert before
 * @return id of the new element
 * @return error code (<0)
 */

int FStringArrayInsertStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FString* pFString = FStringAllocFromString(pString);
	if (pFString == NULL)
		return FSTRINGERROR_MEMORY;

	if (flags == -1)
		flags = FSTRINGFLAG_AFTER;

	return FStringArrayInsertFStringAtNumber(pFSArray, pFString, number, flags);
}

/**
 * Inserts a FString after or before another FString referenced by its id
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString to insert
 * @param id id of the string to find
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the first one (default)
 *              FSTRINGFLAG_AFTER to insert after the given position (default)
 *              FSTRINGFLAG_BEFORE to insert before
 * @return id of the new element
 * @return error code (<0)
 */
int FStringArrayInsertFStringAtId(FStringArray* pFSArray, FString* pFString, int id, int flags)
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int number = FStringArrayGetNumberFromId(pFSArray, id);
	if (number < 0)
		return number;

	return FStringArrayInsertFStringAtNumber(pFSArray, pFString, number, flags);
}
/**
 * Creates a new FString from a C string and inserts it after or before another
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString to insert
 * @param id id of the string to find
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the first one (default)
 *              FSTRINGFLAG_AFTER to insert after the given position (default)
 *              FSTRINGFLAG_BEFORE to insert before
 * @return id of the new element
 * @return error code (<0)
 */
int FStringArrayInsertStringAtId(FStringArray* pFSArray, char* pString, int id, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FString* pFString = FStringAllocFromString(pString);
	if (pFString == NULL)
		flags = FSTRINGERROR_MEMORY;

	return FStringArrayInsertFStringAtId(pFSArray, pFString, id, 0);
}

////////////////////////////////////////////////////////////////////////////////
// Set strings in array
////////////////////////////////////////////////////////////////////////////////

/**
 * Changes the content of a FString at a given position in the array
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString
 * @param number number of the FString to change
 * @param flags for future extension
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArraySetFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags __attribute__((unused)))
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (number < 0 || number > pFSArray->bufferLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (pFSArray->pArray[number] == NULL)
		return FSTRINGERROR_NOTFOUND;

	return FStringSetFString(pFSArray->pArray[number], pFString);
}
/**
 * Changes the content of a FString at a given position in the array with the content of a C string
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param number number of the FString to change
 * @param flags for future extension
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArraySetStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags __attribute__((unused)))
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (number < 0 || number > pFSArray->bufferLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (pFSArray->pArray[number] == NULL)
		return FSTRINGERROR_NOTFOUND;

	return FStringSetString(pFSArray->pArray[number], pString);
}

/**
 * Changes the content of a FString at a given id with the content of a C string
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString
 * @param id id of the FString to change
 * @param flags for future extension
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArraySetFStringAtId(FStringArray* pFSArray, FString* pFString, int id, int flags __attribute__((unused)))
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int number = FStringArrayGetNumberFromId(pFSArray, id);
	if (number < 0)
		return number;

	return FStringSetFString(pFSArray->pArray[number], pFString);
}

/**
 * Changes the content of a FString at a given id with the content of a C string
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param id id of the FString to change
 * @param flags for future extension
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArraySetStringAtId(FStringArray* pFSArray, char* pString, int id, int flags __attribute__((unused)))
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int number = FStringArrayGetNumberFromId(pFSArray, id);
	if (number < 0)
		return number;

	return FStringSetString(pFSArray->pArray[number], pString);
}

////////////////////////////////////////////////////////////////////////////////
// Replaces strings in array
////////////////////////////////////////////////////////////////////////////////

/**
 * Replaces a FString in the array by another one, at a given position
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the FString
 * @param number number of the FString to replace
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the given one (default)
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArrayReplaceFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags)
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (number < 0 || number > pFSArray->bufferLength)
		return FSTRINGERROR_INDEXOUTOFRANGE;

	if (pFSArray->pArray[number] != NULL)
		FStringFree(pFSArray->pArray[number]);

	if (flags == -1)
		flags = FSTRINGFLAG_CREATENEW;

	if (flags & FSTRINGFLAG_CREATENEW)
	{
		pFSArray->pArray[number] = FStringAllocFromFString(pFString);
		if (pFSArray->pArray[number] == NULL)
			return FSTRINGERROR_MEMORY;
	}
	else
	{
		pFSArray->pArray[number] = pFString;
	}
	return FSTRINGERROR_OK;
}
/**
 * Allocates a FString from a C string and replaces another one in the array with it
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param number number of the FString to replace
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the given one (default)
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArrayReplaceStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (flags < 0)
		flags = 0;

	FString* pFString = FStringAllocFromString(pString);
	if (pFString == NULL)
		return FSTRINGERROR_MEMORY;

	return FStringArrayReplaceFStringAtNumber(pFSArray, pFString, number, flags);
}
/**
 * Allocates a FString from a C string and replaces another one at a given id
 *
 * @param pFSArray pointer to the FStringArray
 * @param pString pointer to the C string
 * @param id id of the FString to replace
 * @param flags FSTRINGFLAG_CREATENEW to create a new FString from the given one (default)
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArrayReplaceStringAtId(FStringArray* pFSArray, char* pString, int id, int flags)
{
	if ( pFSArray== NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int number = FStringArrayGetNumberFromId(pFSArray, id);
	if (number < 0)
		return number;

	FString* pFString = FStringAllocFromString(pString);
	if (pFString == NULL)
		return FSTRINGERROR_MEMORY;

	if (flags < 0)
		flags = 0;

	return FStringArrayReplaceFStringAtNumber(pFSArray, pFString, number, flags);
}

/**
 * Replaces a FString in the array by another one, at a given id
 *
 * @param pFSArray pointer to the FStringArray
 * @param pFString pointer to the C string
 * @param id id of the FString to replace
 * @param flags not used, for future extension
 * @return FSTRINGERROR_OK
 * @return error code (<0)
 */
int FStringArrayReplaceFStringAtId(FStringArray* pFSArray, FString* pFString, int id, int flags)
{
	if ( pFSArray== NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int number = FStringArrayGetNumberFromId(pFSArray, id);
	if (number < 0)
		return number;

	return FStringArrayReplaceFStringAtNumber(pFSArray, pFString, number, flags);
}


