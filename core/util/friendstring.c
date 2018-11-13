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
 *  Simplified C++ like string handling
 *
 *  This file contains a system of strings similar to Windows MFC Strings
 *  and takes care of allocating and releasing memory.
 *  It provides a set of simplified functions to perform multiple find of the same
 *  substring, and other easy tools such as loading texts and modifying them.
 *  It will also support Unicode and provide automatic conversion from and
 *  to ASCII... Crucial for international products...
 *  Such a string takes a more space and computer time than a simple C
 *  string, yet it is is protected against memory -and other- errors and simplifies
 *  a lot string handling in C: if you do not need ultra fast execution and are not
 *  constrained by memory, it can help you a lot and allow you to program faster
 *  with less risk of memory errors! (as this system did for us on Windows)...
 *
 *  @author FL (Francois Lionet)
 *  @date first push on 05/12/2016
 *  @todo FL>FL implement Unicode
 *  @todo FL>HT we *MUST* define a common error code list for Friend Core!
 */
#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include <stdarg.h>
#include <unistd.h>
#include <fcntl.h>
#include <libgen.h>
#include <sys/stat.h>
#ifdef __linux__
#include <linux/limits.h>
#else
#include <limits.h>
#endif
#include "friendstring.h"

int charLengths[] = {1, 2};

/**
 * FString handling global flags
 *
 * These flags will be ORed to every flags transmitted to the functions who ask for them.
 */
int globalFlags = FSTRINGFLAG_CLEANWORK | FSTRINGFLAG_DESTROYWORKAFTERWORK;

/**
 * FString handling global flags mask
 *
 * These ~flags will be ANDed to every flags transmitted to the functions who ask for them.
 */
int globalFlagsMask = 0;

///////////////////////////////////////////////////////////////////////////////
// Allocation / Free functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Allocates a new FString in ASCII or Unicode
 *
 * @param type one of the FSTRINGTYPE_* values
 *
 * @return pointer to the allocated FString
 * @return NULL in case of error
 */
FString* FStringAlloc(int type)
{
	FString* pTemp = (FString*)malloc( sizeof(FString) );
	if (pTemp != NULL)
	{
		if (type < 0)
			type = FSTRINGTYPE_ASCII;     // TODO: FL>FL use system defaults if flag is -1
		pTemp->type = type;
		pTemp->length = 0;
		pTemp->bufferLength = 0;
		pTemp->pWork = NULL;
		pTemp->pString = (char*)calloc(charLengths[type], 1);
		if (pTemp->pString == NULL)
			return NULL;
	}
	return pTemp;
}

/**
 * Frees a FString
 *
 * Takes care of all associated allocations
 *
 * @param pFString pointer to the FString structure to liberate
 */
void FStringFree(FString* pFString)
{
	if (pFString != NULL)
	{
		if (pFString->pString != NULL)
			free(pFString->pString);
		FStringWorkFree(pFString->pWork);
		free(pFString);
	}
}

/**
 * Allocates a ASCII FString from an ASCII string
 *
 * Note: you can free the C string after this function.
 *
 * @param pSource pointer to the string to copy upon allocation
 * @return pointer to the allocated FString
 * @return NULL in case of error
 */
FString* FStringAllocFromString(const char *pSource)
{
	FString* pTemp = NULL;
	if (pSource != NULL)
	{
		pTemp = FStringAlloc(FSTRINGTYPE_ASCII);
		FStringSetString(pTemp, pSource);
	}
	return pTemp;
}

/**
 * Allocates a FString from another FString
 *
 * Note: the type (ASCII or Unicode) is copied from the source FString.
 *
 * @param pFString pointer to the FString to copy upon allocation
 * @return pointer to the allocated FString
 * @return NULL in case of error
 */
FString* FStringAllocFromFString(FString* pFString)
{
	FString* pTemp = NULL;
	if (pFString != NULL)
	{
		pTemp = FStringAlloc(pFString->type);
		FStringSetFString(pTemp, pFString);
	}
	return pTemp;
}

/**
 * Allocates a ASCII FString with the content of a text file
 *
 * @param pPath pointer to a C string containing the path to the file
 * @param openFlags C "open" flags to use. If -1 it will use O_RDONLY
 * @param type of the FString object to allocate. If types are different,
 *        the text will be converted to the destination type.
 *
 * @return pointer to the allocated FString
 * @return NULL in case of error
 */
FString* FStringAllocFromPath(const char* pPath, const char* pOpenFlags, int type)
{
	if (pPath == NULL)
		return NULL;
	if (type != FSTRINGTYPE_ASCII)
		return NULL;

	FString* pFString = FStringAlloc(type);
	if (FStringSetFromFile(pFString, pPath, pOpenFlags) == FSTRINGERROR_OK)
		return pFString;
	FStringFree(pFString);
	return NULL;
}

/**
 * Allocates a ASCII FString with the content of a text file which path is contained in another FString
 *
 * @param pFPath pointer to a FString structrue containing the path to the file
 * @param openFlags C "open" flags to use. If -1 it will use O_RDONLY
 * @param type of the FString object to allocate. If types are different,
 *        the text will be converted to the destination type.
 *
 * @return pointer to the allocated FString
 * @return NULL in case of error
 */
FString* FStringAllocFromFPath(FString* pFSPath, const char* pOpenFlags, int type)
{
	if (pFSPath == NULL)
		return NULL;
	return FStringAllocFromPath(pFSPath->pString, pOpenFlags, type);
}

/**
 * Cleans the memory associated with the FString structure
 *
 * This function can reduce the string buffer to the exact size of the string
 * if the global flags contains the FSTRINGFLAG_STRICTBUFFERSIZE flag.
 *
 * @param pFString pointer to the FString object to clean
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringClean(FString* pFString)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int flags = globalFlags & (~globalFlagsMask);

	if ( (flags & FSTRINGFLAG_CLEANWORK) != 0 && pFString->pWork != NULL)
	{
		FStringWorkFree(pFString->pWork);
		pFString->pWork = NULL;
	}
	if ( (flags & FSTRINGFLAG_STRICTBUFFERSIZE) != 0 || pFString->bufferLength < pFString->length )
	{
		FStringSetBufferSize(pFString, pFString->length);
	}
	return FSTRINGERROR_OK;
}

/**
 * Sets the memory allocated for the string to a specific size
 *
 * Note : the string will be truncated if it is longer than the required size.
 *
 * @param pFString pointer to the FString structure
 * @param length new length in characters
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringSetBufferSize(FString *pFString, int length)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	char* pTemp = realloc(pFString->pString, (length + 1) * charLengths[pFString->type]);
	if (pTemp == NULL)
		return FSTRINGERROR_MEMORY;

	pFString->pString = pTemp;
	pFString->bufferLength = length;
	if (pFString->length < length)
		pFString->length = length;
	pFString->pString[length] = 0;
	return FSTRINGERROR_OK;
}

/**
 * Makes sure the allocated buffer is large enough for a specific length
 *
 * Note: mostly internal function, yet you can use it after working a lot on a FString.
 *
 * @param pFString pointer to the FString structure
 * @param length new length
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringCheckBufferSize(FString *pFString, int length)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int flags = globalFlags;
	if (length > pFString->bufferLength || (flags & FSTRINGFLAG_STRICTBUFFERSIZE) != 0)
	{
		char *pTemp = realloc(pFString->pString, (length + 1) * charLengths[pFString->type]);
		if (pTemp == NULL)
			return FSTRINGERROR_MEMORY;

		pFString->pString = pTemp;          // not necessary, but I'd rather
		pFString->bufferLength = length;
		pFString->pString[length] = 0;
	}
	return FSTRINGERROR_OK;
}

int FStringWorkAlloc(FString* pFString)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int flags = globalFlags;
	if (pFString->pWork != NULL && (flags & FSTRINGFLAG_KEEPPREVIOUSWORK) != 0)
	{
		FStringWorkClean(pFString->pWork);
		return FSTRINGERROR_OK;
	}
	pFString->pWork = calloc ( sizeof(FStringWork), 1 );
	if (pFString->pWork != NULL)
	{
		((FStringWork *) pFString->pWork)->result = FSTRINGERROR_NOTINITIALIZED;
		((FStringWork *) pFString->pWork)->flags = -1;
	}
	else
	{
		return FSTRINGERROR_MEMORY;
	}
	return FSTRINGERROR_OK;
}

/**
 * Cleans the content of a work data zone
 *
 * Note: call this function after FStringFindNext if the FSTRINGFLAG_CLEANWORK
 * flag is not set in the global flags.
 *
 * @param pFSWork pointer to the work data zone
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringWorkClean(FStringWork* pFSWork)
{
	if (pFSWork == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FStringFree(pFSWork->pFString1);
	FStringFree(pFSWork->pFString2);
	pFSWork->pFString1 = NULL;
	pFSWork->pFString2 = NULL;
	pFSWork->result = FSTRINGERROR_NOTINITIALIZED;
	pFSWork->flags = -1;
	return FSTRINGERROR_OK;
}

/**
 * Frees a work data zone
 *
 * Note: call this function after FStringFindNext if the FSTRINGFLAG_CLEANWORK
 * flag is not set in the global flags.
 *
 * @param pFSWork pointer to the work data zone
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringWorkFree(FStringWork* pFSWork)
{
	if (pFSWork == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FStringWorkClean(pFSWork);
	free(pFSWork);
	return FSTRINGERROR_OK;
}

///////////////////////////////////////////////////////////////////////////////
// Conversion functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Converts the content of a FString to lower case
 *
 * @param pFString pointer to the FString structure to process
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringConvertToLowercase(FString *pFString)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int i;
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		for (i = 0; i < pFString->length; i++)
		{
			char c = pFString->pString[i];
			if (c >= 'A' && c <= 'Z')
				pFString->pString[i] = (char)(c | 0x20);
		}
	}
	else
	{
		return FSTRINGERROR_NOTIMPLEMENTED;
	}
	return FSTRINGERROR_OK;
}

/**
 * Converts the content of a FString to upper case
 *
 * @param pFString pointer to the FString structure to process
 * @return FString error code, FSTRINGERROR_OK (0) if no errors
 */
int FStringConvertToUppercase(FString *pFString)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int i;
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		for (i = 0; i < pFString->length; i++)
		{
			char c = pFString->pString[i];
			if (c >= 'a' && c <= 'z')
				pFString->pString[i] = (char)(c & ~0x20);
		}
	}
	else
	{
		return FSTRINGERROR_NOTIMPLEMENTED;
	}
	return FSTRINGERROR_OK;
}

///////////////////////////////////////////////////////////////////////////////
// Query
///////////////////////////////////////////////////////////////////////////////

/**
 * Returns a pointer to the actual C string of a FString
 *
 * Notes :
 * - All the strings, even Unicode are ended by a zero, not counted in the
 * length of the string.
 * - If the string is originally in Unicode, it will be converted to ASCII
 * in a temporary work buffer.
 *
 * @param pFString pointer to the FString structure
 * @return pointer too the C string ending by zero
 * @return NULL in case of error
 */
char* FStringGetString(FString* pFString)
{
	if (pFString != NULL)
	{
		if (pFString->type == FSTRINGTYPE_ASCII)
			return pFString->pString;
		else
		{
			// FL>FL TODO: Unicode to ascii conversion
		}
	}
	return NULL;
}

/**
 * Returns the length of the string contained in a FString
 *
 * @param pFString pointer to the FString structure to process
 * @return length of the string (>=0)
 * @return FString error code (<0) in case of error
 */
int FStringGetLength(FString* pFString)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return pFString->length;
}

/**
 * Returns the position of the next line in the FString
 *
 * Note : this function copes with "\n" and "\r\n" line endings.
 *
 * @param pFString pointer to the FString to explore
 * @param position position in the string to start the search
 * @return position of the first character of the next line (>0)
 * @return FString error code (<0) in case of error, (FSTRINGERROR_NOTFOUND if end of text)
 */
int FStringGetNextLine(FString* pFString, int position)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (position < 0 || position >= pFString->length)
		return FSTRINGERROR_INDEXOUTOFRANGE;
	if (pFString->type != FSTRINGTYPE_ASCII)
		return FSTRINGERROR_NOTIMPLEMENTED;

	int search = position;
	while (TRUE)
	{
		if (search >= pFString->length)
			return FSTRINGERROR_NOTFOUND;
		search++;
		char c = pFString->pString[search];
		if (c == '\n')
			break;
		if (c == '\r')
		{
			search++;
			break;
		}
	}
	return search;
}

/**
 * Returns the position of the previous line in a FString
 *
 * Note : this function copes with "\n" and "\r\n" line endings.
 *
 * @param pFString pointer to the FString structure to process
 * @param position position in the string to start the search
 * @return position of the first character of the previous line (>0)
 * @return FString error code (<0) in case of error (FSTRINGERROR_NOTFOUND if start of text)
 */
int FStringGetPreviousLine(FString* pFString, int position)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (position < 0 || position >= pFString->length)
		return FSTRINGERROR_INDEXOUTOFRANGE;
	if (pFString->type != FSTRINGTYPE_ASCII)
		return FSTRINGERROR_NOTIMPLEMENTED;

	int search = position;
	if (search == 0)
		return FSTRINGERROR_NOTFOUND;
	while (TRUE)
	{
		search--;
		if (search < 0)
			return FSTRINGERROR_NOTFOUND;
		if (pFString->pString[search] == '\n')
		{
			if (search > 0 && pFString->pString[search - 1] == '\r')
				search--;
			search--;
			break;
		}
	}
	search--;
	while (TRUE)
	{
		if (search == 0)
			break;
		search--;
		if (pFString->pString[search] == '\n')
		{
			search++;
			break;
		}
	}
	return search;
}

/**
 * Returns the position of the end of a line in a FString
 *
 * @param pFString pointer to the FString to explore
 * @param position position in the FString to start the search
 * @return if >0, position of the last character of the line (just before next line)
 * @return FString error code (<0) in case of error (FSTRINGERROR_NOTFOUND if end of text)
 */
int FStringGetEndOfLine(FString* pFString, int position)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (position < 0 || position >= pFString->length)
		return FSTRINGERROR_INDEXOUTOFRANGE;
	if (pFString->type != FSTRINGTYPE_ASCII)
		return FSTRINGERROR_NOTIMPLEMENTED;

	while (position < pFString->length)
	{
		char c = pFString->pString[position];
		if (c == '\r' || c == '\n')
			break;
		position++;
	}
	return position;
}

/**
 * Returns the position of the start of a line in a FString
 *
 * Note: this function is accelerated when going from one line to the previous one.
 *
 * @param pFString pointer to the FString to explore
 * @param position position in the FString to start the search
 * @return if >0, position of the last character of the line (just before next line)
 * @return FString error code (<0) in case of error (FSTRINGERROR_NOTFOUND if end of text)
 */
int FStringGetStartOfLine(FString* pFString, int position)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (position < 0 || position >= pFString->length)
		return FSTRINGERROR_INDEXOUTOFRANGE;
	if (pFString->type != FSTRINGTYPE_ASCII)
		return FSTRINGERROR_NOTIMPLEMENTED;

	while (position > 0)
	{
		char c = pFString->pString[position];
		if (c == '\r' || c == '\n')
		{
			position++;
			break;
		}
		position--;
	}
	return position;
}

/**
 * Return the number of lines of text between two positions in a text
 *
 * @param pFString pointer to the FString to explore
 * @param start position in the FString to start the count
 * @param end position in the FString of the line to find the number from
 * @return if >0, number of lines between the end and the start
 * @return FString error code (<0) in case of error (FSTRINGERROR_NOTFOUND if end of text)
 */
int FStringGetLineDistance(FString* pFString, int start, int end)
{
	if (pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;
	if (start < 0 || end < 0 || start > end )
		return FSTRINGERROR_INDEXOUTOFRANGE;

	// Check if on th same line
	int count = 0;
	int startLineStart = FStringGetStartOfLine(pFString, start);
	int endLineStart = FStringGetStartOfLine(pFString, end);
	while (startLineStart < endLineStart)
	{
		count++;
		startLineStart = FStringGetNextLine(pFString, startLineStart);
	}
	return count;
}



///////////////////////////////////////////////////////////////////////////////
// Set string functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Forces the string to a given C string
 *
 * Note : the C string can be freed after this function.
 * Note : this function will convert the string into the destination type,
 * ASCII or Unicode.
 *
 * @param pFString pointer to the FString structure to change
 * @param pSource pointer to the C string to copy
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetString(FString *pFString, const char *pSource)
{
	return FStringSetSubstringWithLength(pFString, pSource, 0, -1, -1);
}

/**
 * Forces a substring of a C string
 *
 * Note : this function will convert the string into the destination type,
 * ascii or unicode.
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to copy
 * @param srcePosition position of the start of the substring in the C string
 * @param srceLength length of the substring to extract from the C string
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetSubstring(FString *pFString, const char *pSource, int srcePosition, int srceLength)
{
	return FStringSetSubstringWithLength(pFString, pSource, srcePosition, srceLength, -1);
}

/**
 * Forces a string copied from another FString structure
 *
 * Note : this function will convert the string into the destination type,
 * ASCII or unicode.
 *
 * @param pFString pointer to the FString strcture to modify
 * @param pFSource pointer to the FString structure to copy
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetFString(FString *pFString, FString *pFSource)
{
	if (pFSource == NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringSetSubstringWithLength(pFString, pFSource->pString, 0, pFSource->length, pFSource->length);
}
/**
 * Forces a substring of another FString
 *
 * Note : this function will convert the string into the destination type,
 * ASCII or unicode.
 *
 * @param pFString pointer to the FString to modify
 * @param pFSource pointer to the FString to copy
 * @param srcePosition position of the start of the substring in the source FString
 * @param srceLength length of the substring to extract from the source FString
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetFSubstring(FString *pFString, FString *pFSource, int srcePosition, int srceLength)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFString->type == FSTRINGTYPE_ASCII && pFSource->type == FSTRINGTYPE_ASCII )
		return FStringSetSubstringWithLength(pFString, pFSource->pString, srcePosition, srceLength, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

int FStringSetSubstringWithLength(FString *pFString, const char *pSource, int srcePosition, int srceLength, int lString)
{
	if (pFString == NULL || pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (lString < 0)
		lString = (int)strlen(pSource);
	if (srcePosition < 0)
		srcePosition = 0;
	if (srcePosition > lString)
		srcePosition = lString;
	if (srceLength < 0 )
		srceLength = lString;
	if (srceLength > lString)
		srceLength = lString - srcePosition;
	if (srceLength == 0 || lString == 0)
		return FSTRINGERROR_OK;

	if (FStringCheckBufferSize(pFString, srceLength) != FSTRINGERROR_OK)
		return FSTRINGERROR_MEMORY;

	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		strncpy(pFString->pString, &pSource[srcePosition], (size_t)srceLength);
		pFString->pString[srceLength] = 0;
		pFString->length = srceLength;
	}
	else
	{
		return FSTRINGERROR_NOTIMPLEMENTED;
	}
	return FSTRINGERROR_OK;
}

/**
 * Forces a string into a FString by using sprintf
 *
 * Note : this function will convert the string into the destination type,
 * ASCII or unicode.
 *
 * @param pFString pointer to the FString structure to modify
 * @param pControl pointer to a C string containing the control string of sprintf
 * @param pTypes pointer to a C string indicating the types of the various parameters
 *        I indicating an integer
 *        S indicating a string
 *        All combinations up to "III" or "SSS" are currently supported, please ask
 *        for more (or put them yourself).
 *        Important: the pTypes string must match the pControl parameter layout,
 *        of sprintf will crash!
 * @param ... list of parameters for sprintf
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetSPrint(FString* pFString, const char* pControl, const char* pTypes, ...)
{
	if (pFString == NULL || pControl == NULL || pTypes == NULL)
		return FSTRINGERROR_NULLPOINTER;

	char* pBuffer = malloc(FSTRING_SPRINTBUFFERSIZE);
	if (pBuffer == NULL)
		return FSTRINGERROR_MEMORY;

	va_list arguments;
	va_start ( arguments, pTypes );
	if (strcmp(pTypes, "I") == 0)
		sprintf(pBuffer, pControl, (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "II") == 0)
		sprintf(pBuffer, pControl, (int)va_arg ( arguments, int ), (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "III") == 0)
		sprintf(pBuffer, pControl, (int)va_arg ( arguments, int ), (int)va_arg ( arguments, int ), (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "S") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ) );
	else if (strcmp(pTypes, "SS") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ) );
	else if (strcmp(pTypes, "SSS") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ) );
	else if (strcmp(pTypes, "SI") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "SSI") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ), (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "SII") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (int)va_arg ( arguments, int ), (int)va_arg ( arguments, int ) );
	else if (strcmp(pTypes, "ISS") == 0)
		sprintf(pBuffer, pControl, (int)va_arg ( arguments, int ), (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ) );
	else if (strcmp(pTypes, "SIS") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (int)va_arg ( arguments, int ), va_arg ( arguments, char* ) );
	else if (strcmp(pTypes, "SSI") == 0)
		sprintf(pBuffer, pControl, (char*)va_arg ( arguments, char* ), (char*)va_arg ( arguments, char* ), (int)va_arg ( arguments, int ) );
	else
	{
		free(pBuffer);
		return FSTRINGERROR_ILLEGALARGUMENT;
	}
	va_end(arguments);
	int result = FStringSetString(pFString, pBuffer);
	free(pBuffer);
	return result;
}

///////////////////////////////////////////////////////////////////////////////
// File functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Allocates a FString structure and copy the result of basename(given path)
 *
 * @param pPath pointer to a C string containing the path to copy
 * @return pointer to the allocated FString
 * @return NULL in case of memory allocation error
 */
FString* FStringAllocFromBasename(const char *pPath)
{
	FString* pTemp = NULL;
	if (pPath != NULL)
	{
		pTemp = FStringAlloc(FSTRINGTYPE_ASCII);
		FStringSetString(pTemp, basename((char*)pPath));
	}
	return pTemp;
}

/**
 * Allocates a FString structure and copy the result of dirname(given path)
 *
 * @param pPath pointer to a C string containing the path to copy
 * @return pointer to the allocated FString
 * @return NULL in case of memory allocation error
 */
FString *FStringAllocFromDirname(const char *pPath)
{
	FString* pTemp = NULL;
	if (pPath != NULL)
	{
		pTemp = FStringAlloc(FSTRINGTYPE_ASCII);
		FStringSetString(pTemp, dirname((char*)pPath));
	}
	return pTemp;
}

/**
 * Allocates a FString structure and copy the result of basename(another FString with given path)
 *
 * @param pFPath pointer to a FString structure containing the path to copy
 * @return pointer to the allocated FString
 * @return NULL in case of memory allocation error
 */
FString* FStringAllocFromFBasename(FString* pFPath)
{
	return FStringAllocFromBasename(pFPath->pString);
}

/**
 * Allocates a FString structure and copy the result of dirname(another FString with given path)
 *
 * @param pFPath pointer to a FString structure containing the path to copy
 * @return pointer to the allocated FString
 * @return NULL in case of memory allocation error
 */
FString* FStringAllocFromFDirname(FString* pFPath)
{
	return FStringAllocFromDirname(pFPath->pString);
}

/**
 * Allocates a FString structure and copies the current path of the application into it
 *
 * @return pointer to the allocated FString
 * @return NULL in case of memory allocation error
 */
FString* FStringAllocFromCurrentDir()
{
	FString* pFString = FStringAlloc(FSTRINGTYPE_ASCII);
	if (pFString != NULL)
		if (FStringSetCurrentDir(pFString) == FSTRINGERROR_OK)
			return pFString;
	FStringFree(pFString);
	return NULL;
}

/**
 * Forces the content of an FString to the result of dirname(C string)
 *
 * @param pFString pointer to the FString structure to modifiy
 * @param pPath pointer to the C string containing the path to process
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetDirname(FString *pFString, const char *pPath)
{
	return FStringSetSubstringWithLength(pFString, dirname((char *)pPath), 0, -1, -1);
}

/**
 * Forces the content of an FString to the result of basename(C string)
 *
 * @param pFString pointer to the FString structure to modifiy
 * @param pFPath pointer to the C string containing the path to process
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetBasename(FString *pFString, const char *pPath)
{
	return FStringSetSubstringWithLength(pFString, basename((char *)pPath), 0, -1, -1);
}

/**
 * Forces the content of an FString to the result of basename(FString)
 *
 * @param pFString pointer to the FString structure to modifiy
 * @param pFPath pointer to the FString structure containing the path to process
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetFBasename(FString *pFString, FString *pFPath)
{
	if (pFPath == NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringSetBasename(pFString, pFPath->pString);
}

/**
 * Forces the content of an FString to the result of dirname(FString)
 *
 * @param pFString pointer to the FString structure to modifiy
 * @param pFPath pointer to the FString structure containing the path to process
 * @return FSTRINGERROR_OK if no error (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetFDirname(FString *pFString, FString *pFPath)
{
	if (pFPath == NULL || pFString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringSetDirname(pFString, pFPath->pString);
}

/**
 * Returns a C string containing the result of basename(FString)
 *
 * @param pFString pointer to the FString structure
 * @return pointer to the C string containing the result
 * @return NULL in case of error
 */
char* FStringGetBasename(FString* pFString)
{
	char* ptr = FStringGetString(pFString);
	if (ptr != NULL)
		return basename(ptr);

	return NULL;
}

/**
 * Returns a C string containing the result of dirname(FString)
 *
 * @param pFString pointer to the FString structure
 * @return pointer to the C string containing the result
 * @return NULL in case of error
 */
char* FStringGetDirname(FString* pFString)
{
	char* ptr = FStringGetString(pFString);
	if (ptr != NULL)
		return basename(ptr);

	return NULL;
}

/**
 * Appends a filename at the end of a FString containing a pathname
 *
 * This function takes care of adding a "/" at the end of the path.
 *
 * @param pFString pointer to the FString structure
 * @param pName pointer to a C string that contains the name to append
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendFilename(FString *pFString, const char *pName)
{
	if (pFString == NULL || pName == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int result = FSTRINGERROR_OK;
	if (pFString->pString[pFString->length-1] != '/')
		result = FStringAppendString(pFString, "/");
	if (result == FSTRINGERROR_OK)
	{
		char* pFilename = strrchr(pName, '/');
		if (pFilename == NULL)
			pFilename = (char*)pName;
		else
			pFilename++;
		result = FStringAppendString(pFString, pFilename);
	}
	return result;
}

/**
 * Appends a filename from another FString at the end of a FString containing a pathname
 *
 * This function takes care of adding a "/" at the end of the path.
 *
 * @param pFString pointer to the FString structure
 * @param pFName pointer to a FString structure that contains the name to append
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendFFilename(FString *pFString, FString *pFName)
{
	if (pFString == NULL || pFName == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringAppendFilename(pFString, pFName->pString);
}

/**
 * Replaces a filename at the end of the path contained in a FString by a filename from a C string
 *
 * This function removes a previous filename at the end of the path and replaces
 * it with the new one.
 *
 * @param pFString pointer to the FString structure
 * @param pName pointer to a C string that contains the name to use
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceFilename(FString *pFString, const char *pName)
{
	if (pFString == NULL || pName == NULL)
		return FSTRINGERROR_NULLPOINTER;

	int result = FSTRINGERROR_OK;
	int start = pFString->length;
	if (start > 0)
	{
		char *pStart = strrchr(pFString->pString, '/');
		if (pStart == NULL)
			pStart = pFString->pString;
		start = (int) ((unsigned char *) pStart - (unsigned char *) pFString->pString);
		if (start > 0)
		{
			if (pFString->pString[start] != '/')
				result = FStringAppendString(pFString, "/");
			else
				result = FStringReplaceSubstring(pFString, "/", start, -1, 0, -1);
		}
		if (result != FSTRINGERROR_OK)
			return result;
	}
	char* pStartName = (char*)pName;
	char* pSlash = strrchr(pName, '/');
	if (pSlash != NULL)
		pStartName = pSlash + 1;
	return FStringAppendString(pFString, pStartName);
}

/**
 * Replaces a filename at the end of the path of a FString, filename taken from another FString
 *
 * This function removes a previous filename at the end of the path and replaces
 * it with the new one.
 *
 * @param pFString pointer to the FString structure
 * @param pFName pointer to a FString structure that contains the name to use
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceFFilename(FString *pFString, FString* pFName)
{
	if (pFString == NULL || pFName == NULL)
		return FSTRINGERROR_NULLPOINTER;
	return FStringReplaceFilename(pFString, pFName->pString);
}

/**
 * Forces a FString to the current directory of the application
 *
 * @param pFString pointer to the FString structure
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetCurrentDir(FString* pFString)
{
	if (pFString == NULL)
	{
		return FSTRINGERROR_NULLPOINTER;
	}

	char* pBuffer = malloc(PATH_MAX);
	if (pBuffer == NULL)
	{
		return FSTRINGERROR_MEMORY;
	}
	char* dummy = getcwd(pBuffer, PATH_MAX);            /// avoid warnings
	int result = FStringSetString(pFString, pBuffer);
	free(pBuffer);
	return result;
}

// Internal routine, used in FriendParser
char* CheckExtension(const char* pString, const char* pExt)
{
	int position = strlen(pString)-1;
	for( ; position >=0; position--)
	{
		if (pString[position] == '.')
		{
			if (strcmp(&pString[++position], pExt) == 0)
				return (char*)&pString[position];
			else
				break;
		}
	}
	return NULL;
}

/**
 * Checks the presence of a file extension in a FString
 *
 * @param pFString pointer to FString
 * @param pExt pointer to C string containing the extension, without "."
 * @return position of the extension in the FString
 * @return FSTRIINGERROR_NOTFOUND (<0) if not found
 */
int FStringCheckExtension(FString* pFString, const char* pExt)
{
	if (pFString == NULL || pExt == NULL)
		return FSTRINGERROR_NULLPOINTER;

	char* ptr = CheckExtension(pFString->pString, pExt);
	if (ptr != NULL)
		return (int)((unsigned char*)ptr - (unsigned char*)pFString->pString);

	return FSTRINGERROR_NOTFOUND;
}

/**
 * Forces the content of a FString to the content of a text file
 *
 * Note: the file will be converted to the proper type (ASCII or Unicode) upon loading.
 *
 * @param pFString pointer to the FString structure
 * @param pPath pointer to a C string pointing to the file to load
 * @param fileFlags "open" file command flags. Use -1 for O_RDONLY
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringSetFromFile(FString* pFString, const char* pPath, const char* pFileFlags)
{
	if (pFString == NULL || pPath == NULL)
		return FSTRINGERROR_NULLPOINTER;

	struct stat st;
	if (stat(pPath, &st) != 0)
		return FSTRINGERROR_FILENOTFOUND;
	int size = (int)st.st_size;

	if (pFileFlags == NULL)
		pFileFlags = "r";
	FILE* fd = fopen(pPath, pFileFlags);
	if (fd == NULL)
		return FSTRINGERROR_FILENOTFOUND;

	if (pFString->pString != NULL)
	{
		free(pFString->pString);
		pFString->pString = NULL;
		pFString->length = 0;
	}
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		pFString->pString = (char *)malloc((size_t)(size + 1));
		if (pFString->pString == NULL)
		{
			fclose(fd);
			FStringSetString(pFString, "");
			return FSTRINGERROR_MEMORY;
		}
		pFString->bufferLength = size;
		pFString->length = size;
		if (fread(pFString->pString, 1, (size_t)size, fd) != (size_t)size)
		{
			fclose(fd);
			FStringSetString(pFString, "");
			return FSTRINGERROR_CANNOTREADFILE;
		}
		pFString->pString[size] = 0;
	}

	fclose(fd);
	return FSTRINGERROR_OK;
}

/**
 * Writes the content of a FString structure to a file
 *
 * Note: the file will be saved in the format of the FString (ASCII or Unicode)
 *
 * @param pFString pointer to the FString structure
 * @param pPath pointer to a C string pointing to the file to write
 * @param pFileFlags "fopen" file command flags. Can be NULL, it will use "w".
 * 		  Use "a" for appending to the file.
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringWriteToFile(FString* pFString, const char* pPath, const char* pFileFlags)
{
	if (pFString == NULL || pPath == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFileFlags == NULL)
		pFileFlags = "w";
	FILE* fd = fopen(pPath, pFileFlags);
	if (fd == NULL)
		return FSTRINGERROR_CANNOTWRITEFILE;

	int result = FSTRINGERROR_OK;
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		if (fwrite (pFString->pString, 1, (size_t)pFString->length, fd) != (size_t)pFString->length)
			result = FSTRINGERROR_CANNOTWRITEFILE;
	}
	else
	{
		result = FSTRINGERROR_NOTIMPLEMENTED;
	}
	fclose(fd);
	return result;
}

///////////////////////////////////////////////////////////////////////////////
// Append string functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Appends a C string to a FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to append
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendString(FString *pFString, const char *pSource)
{
	return FStringAppendSubstringWithLength(pFString, pSource, 0, -1, -1);
}

/**
 * Appends a C substring to a FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to append
 * @param srcePosition position of the first character to extract
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendSubstring(FString *pFString, const char *pSource, int srcePosition, int srceLength)
{
	return FStringAppendSubstringWithLength(pFString, pSource, srcePosition, srceLength, -1);
}

/**
 * Appends a substring of a FString to another FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to the FString to append
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendFString(FString *pFString, FString *pFSource)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringAppendSubstringWithLength(pFString, pFSource->pString, 0, pFSource->length, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

/**
 * Appends a substring of a FString to a FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to the FString containing the substring to extract
 * @param srcePosition position of the first character to extract
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringAppendFSubstring(FString *pFString, FString *pFSource, int srcePosition, int srceLength)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringAppendSubstringWithLength(pFString, pFSource->pString, srcePosition, srceLength, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

int FStringAppendSubstringWithLength(FString *pFString, const char *pSource, int srcePosition, int srceLength, int lSource)
{
	if (pFString == NULL || pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (lSource < 0)
		lSource = (int)strlen(pSource);
	if (srcePosition < 0)
		srcePosition = 0;
	if (srcePosition > lSource)
		srcePosition = lSource;
	if (srceLength < 0 )
		srceLength = lSource;
	if (srceLength > lSource)
		srceLength = lSource - srcePosition;
	if (srceLength == 0 || lSource == 0)
		return FSTRINGERROR_OK;

	if ( FStringCheckBufferSize(pFString, pFString->length + srceLength) != FSTRINGERROR_OK)    // ensures no memory allocation error
		return FSTRINGERROR_MEMORY;

	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		strncpy(&pFString->pString[pFString->length], &pSource[srcePosition], (size_t)srceLength);
		pFString->pString[pFString->length + srceLength] = 0;
		pFString->length += srceLength;
	}
	else
	{
		return FSTRINGERROR_NOTIMPLEMENTED;
	}
	return FSTRINGERROR_OK;
}




///////////////////////////////////////////////////////////////////////////////
// Insert string functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Inserts a C string into a FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to insert
 * @param destPosition position of the insertion in destination FString
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringInsertString(FString *pFString, const char *pSource, int destPosition)
{
	if (pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringInsertSubstringWithLength(pFString, pSource, destPosition, 0, (int)strlen(pSource), (int)strlen(pSource));
}

/**
 * Inserts a substring of a C string into a FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to insert
 * @param destPosition position where to insert the substring
 * @param srcePosition position of the first character to extract
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringInsertSubstring(FString *pFString, const char *pSource, int destPosition, int srcePosition, int srceLength)
{
	return FStringInsertSubstringWithLength(pFString, pSource, destPosition, srcePosition, srceLength, -1);
}

/**
 * Inserts a FString into another FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to FString to insert
 * @param destPosition position of the insertion in destination FString
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringInsertFString(FString *pFString, FString *pFSource, int destPosition)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringInsertSubstringWithLength(pFString, pFSource->pString, destPosition, 0, pFSource->length, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

/**
 * Inserts a substring of a FString into another FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to the FString to insert the substring from
 * @param destPosition position where to insert the substring
 * @param srcePosition position of the first character to extract
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringInsertFSubstring(FString *pFString, FString *pFSource, int destPosition, int srcePosition, int srceLength)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringInsertSubstringWithLength(pFString, pFSource->pString, destPosition, srcePosition, srceLength, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

int FStringInsertSubstringWithLength(FString *pFString, const char *pSource, int destPosition, int srcePosition, int srceLength, int lString)
{
	if (pFString == NULL || pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (lString < 0)
		lString = (int)strlen(pSource);
	if (srcePosition < 0)
		srcePosition = 0;
	if (srcePosition > lString)
		srcePosition = lString;
	if (srceLength < 0 )
		srceLength = lString;
	if (srceLength > lString)
		srceLength = lString - srcePosition;
	if (srceLength == 0 || lString == 0)
		return FSTRINGERROR_OK;

	if (destPosition < 0)
		destPosition = 0;
	if (destPosition > pFString->length)
		destPosition = pFString->length;

	FString* pFStringTemp = FStringAllocFromFString(pFString);
	if (pFStringTemp == NULL)
		return FSTRINGERROR_MEMORY;

	if ( FStringCheckBufferSize(pFString, pFString->length + srceLength) != FSTRINGERROR_OK)    // ensures no memory allocation error
		return FSTRINGERROR_MEMORY;

	FStringSetFSubstring(pFString, pFStringTemp, 0, destPosition);
	FStringAppendSubstring(pFString, pSource, srcePosition, srceLength);
	FStringAppendFSubstring(pFString, pFStringTemp, destPosition, -1);

	FStringFree(pFStringTemp);

	return FSTRINGERROR_OK;
}

///////////////////////////////////////////////////////////////////////////////
// Insert string functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Replaces a portion of a FString by a C string
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to use as replacement
 * @param destPosition position of the replacement in destination FString
 * @param destLength length of the text to replace in destination FString
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceString(FString *pFString, const char *pSource, int destPosition, int destLength)
{
	if (pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringReplaceSubstringWithLength(pFString, pSource, destPosition, destLength, 0, (int)strlen(pSource), (int)strlen(pSource));
}

/**
 * Replaces a portion of a FString by another FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to the FString to use as replacement
 * @param destPosition position of the replacement in destination FString
 * @param destLength length of the text to replace in destination FString
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceFString(FString *pFString, FString *pFSource, int destPosition, int destLength)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringReplaceSubstringWithLength(pFString, pFSource->pString, destPosition, destLength, 0, pFSource->length, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

/**
 * Replaces a portion of a FString by a substring from a C string
 *
 * @param pFString pointer to the FString structure to modify
 * @param pSource pointer to the C string to extract the substring from
 * @param destPosition position of the replacement in destination FString
 * @param destLength length of the text to replace in destination FString
 * @param srcePosition position of the first character to extract in C string
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceSubstring(FString *pFString, const char *pSource, int destPosition, int destLength, int srcePosition, int srceLength)
{
	return FStringReplaceSubstringWithLength(pFString, pSource, destPosition, destLength, srcePosition, srceLength, -1);
}

/**
 * Replaces a portion of a FString by a substring extract from another FString
 *
 * @param pFString pointer to the FString structure to modify
 * @param pFSource pointer to the FString to extract the substring from
 * @param destPosition position of the replacement in destination FString
 * @param destLength length of the text to replace in destination FString
 * @param srcePosition position of the first character to extract in source FString
 * @param srceLength length of the substring to extract
 * @return FSTRINGERROR_OK if no errors (0)
 * @return FString error code (<0) in case of error
 */
int FStringReplaceFSubstring(FString *pFString, FString *pFSource, int destPosition, int destLength, int srcePosition, int srceLength)
{
	if (pFString == NULL || pFSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (pFSource->type == FSTRINGTYPE_ASCII)
		return FStringReplaceSubstringWithLength(pFString, pFSource->pString, destPosition, destLength, srcePosition, srceLength, pFSource->length);

	return FSTRINGERROR_NOTIMPLEMENTED;
}

int FStringReplaceSubstringWithLength(FString *pFString, const char *pSource, int destPosition, int destLength, int srcePosition, int srceLength, int lString)
{
	if (pFString == NULL || pSource == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (lString < 0)
		lString = (int)strlen(pSource);
	if (srcePosition < 0)
		srcePosition = 0;
	if (srcePosition > lString)
		srcePosition = lString;
	if (srceLength < 0 )
		srceLength = lString;
	if (srceLength > lString)
		srceLength = lString - srcePosition;
	if (srceLength == 0 || lString == 0)
		return FSTRINGERROR_OK;

	if (destPosition < 0)
		destPosition = 0;
	if (destPosition > pFString->length)
		destPosition = pFString->length;
	if (destLength < 0 )
		destLength = pFString->length - destPosition;
	if (destPosition + destLength > pFString->length)
		destLength = pFString->length - destPosition;

	int delta = srceLength - destLength;
	if (delta != 0)
	{
		if (delta > 0)
		{
			if (FStringCheckBufferSize(pFString, pFString->length + delta) != FSTRINGERROR_OK)
				return FSTRINGERROR_MEMORY;
		}
		memmove(&pFString->pString[destPosition + destLength + delta],
				&pFString->pString[destPosition + destLength],
				(size_t) (pFString->length - (destPosition + destLength)));
	}
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		strncpy(&pFString->pString[destPosition], &pSource[srcePosition], (size_t)srceLength);
		pFString->length += delta;
		pFString->pString[pFString->length] = 0;
	}
	else
	{
		return FSTRINGERROR_NOTIMPLEMENTED;
	}
	return FSTRINGERROR_OK;
}


///////////////////////////////////////////////////////////////////////////////
// Search functions
///////////////////////////////////////////////////////////////////////////////

/**
 * Compares a FString to a C string
 *
 * @param pFString pointer to the FString structure to compare to
 * @param pString pointer to the C string to use for comparaison
 * @param flags use FSTRINGFLAG_NOCASE for case independant comparaison
 * @return result of the comparison, similar to strcmp output
 * @return large negative error number (< FSTRINGERROR_FATAL)
 */
int FStringCompareString(FString *pFString, const char *pString, int flags)
{
	if (pFString == NULL || pString == NULL)
		return FSTRINGERROR_NULLPOINTER;

	if (flags == -1)
		flags = 0;
	flags |= globalFlags;
	flags &= ~globalFlagsMask;

	int result;
	if (pFString->type == FSTRINGTYPE_ASCII)
	{
		if (flags & FSTRINGFLAG_NOCASE)
			result = strcasecmp(pFString->pString, pString);
		else
			result = strcmp(pFString->pString, pString);
	}
	else
	{
		result = FSTRINGERROR_NOTIMPLEMENTED;
	}
	return result;
}

/**
 * Compares a FString to another FString
 *
 * @param pFString pointer to the FString structure to compare to
 * @param pFString2 pointer to the FString  to use for comparaison
 * @param flags use FSTRINGFLAG_NOCASE for case independant comparaison
 * @return result of the comparaison, similar to strcmp output
 * @return large negative error number (< FSTRINGERROR_FATAL)
 */
int FStringCompareFString(FString *pFString, FString* pFString2, int flags)
{
	if (pFString == NULL || pFString2 == NULL)
		return FSTRINGERROR_NULLPOINTER;

	return FStringCompareString(pFString, pFString2->pString, flags);
}

/**
 * Finds a C substring inside a FString
 *
 * Note : this function initialize a work area to continue the search with
 * FStringFindNext. The work area is freed when the last occurence is found.
 *
 * @param pFString pointer to the FString to compare to
 * @param pSource pointer to the C string to find
 * @param flags use FSTRINGFLAG_NOCASE for case independent comparison
 *        use FSTRINGFLAG_LEFT for left to right search (default))
 *        use FSTRINGFLAG_RIGHT for right to left search
 * @return position of the first occurrence of substring in FString if found
 * @return FSTRINGERROR_NOTFOUND if not found
 * @return FString error numbers in case of error
 */
int FStringFindSubstring(FString *pFString, const char *pSource, int flags)
{
	int result = FSTRINGERROR_OK;
	if (pFString == NULL || pSource == NULL)
	{
		return FSTRINGERROR_NULLPOINTER;
	}

	if (FStringWorkAlloc(pFString) != FSTRINGERROR_OK)
		return FSTRINGERROR_MEMORY;

	if (flags == -1)
		flags = FSTRINGFLAG_LEFT;
	flags |= globalFlags;
	flags &= ~globalFlagsMask;

	FStringWork* pWork = pFString->pWork;
	pWork->pFString1 = FStringAllocFromFString(pFString);
	if (pWork->pFString1 == NULL)
		return FSTRINGERROR_MEMORY;
	pWork->pFString2 = FStringAllocFromString(pSource);
	if (pWork->pFString2 == NULL)
		return FSTRINGERROR_MEMORY;
	pWork->flags = flags;
	pWork->result = FSTRINGERROR_NOTINITIALIZED;

	return FStringFindNext(pFString);
}

// Internal function, not protected
char* strstr_fromright(char* pString, char* pSearch)
{
	int c;
	int position = strlen(pSearch);
	if (position >= 0)
	{
		for (position--; position >= 0; position--)
		{
			char* pFound = strstr(&pString[position], pSearch);
			if (pFound == &pString[position])
				return pFound;
		}
	}
	return NULL;
}
/**
 * Finds the next occurrence of a substring in a FString
 *
 * Note : you have to call FStringFindSubstring first. This function will use
 * the flags defined then.
 *
 * @param pFString pointer to a FString where search was previously initialized
 * @return position of the next occurrence if found
 * @return FSTRINGERROR_NOTFOUND if not found
 * @return FString error numbers in case of error
 */
int FStringFindNext(FString* pFString)
{
	int result = FSTRINGERROR_OK;
	if (pFString == NULL || pFString->pWork == NULL)
		return FSTRINGERROR_NULLPOINTER;

	FStringWork* pWork = (FStringWork*)pFString->pWork;
	if (pWork->pFString1 == NULL || pWork->pFString2 == NULL)
		return 	FSTRINGERROR_NOTINITIALIZED;

	if (pWork->result == FSTRINGERROR_NOTFOUND)
		return FSTRINGERROR_NOTFOUND;

	int flags = pWork->flags | globalFlags;
	if (pWork->pFString1->type == FSTRINGTYPE_ASCII)
	{
		int position;
		char *pFound = NULL;
		if (flags & FSTRINGFLAG_RIGHT)
		{
			position = pWork->pFString1->length - pWork->pFString2->length;
			if (pWork->result != FSTRINGERROR_NOTINITIALIZED)
				position = pWork->result + pWork->pFString2->length - 1;
			if (position >= 0)
			{
				int c;
				for (; position >= 0; position--)
				{
					pFound = strstr(&pWork->pFString1->pString[position], pWork->pFString2->pString);
					if (pFound == &pWork->pFString1->pString[position])
						break;
				}
			}
		}
		else
		{
			position = 0;
			if (pWork->result != FSTRINGERROR_NOTINITIALIZED)
				position = pWork->result + 1;
			if (position < pFString->length)
				pFound = strstr(&pWork->pFString1->pString[position], pWork->pFString2->pString);
		}

		if (pFound == NULL)
			result = FSTRINGERROR_NOTFOUND;
		else
			result = (int)((unsigned long)pFound - (unsigned long)pWork->pFString1->pString);

	}
	else
	{
		result = FSTRINGERROR_NOTIMPLEMENTED;
	}

	pWork->result = result;
	if ( result == FSTRINGERROR_NOTFOUND && (flags & FSTRINGFLAG_DESTROYWORKAFTERWORK) )
	{
		FStringWorkFree(pWork);
		pFString->pWork = NULL;
	}
	return result;
}


