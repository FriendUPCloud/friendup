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
 *  String Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 29/12/2016
 */
#ifndef __INTERFACE_STRING_INTERFACE_H__
#define __INTERFACE_STRING_INTERFACE_H__

#include <util/string.h>

typedef struct StringInterface
{
	char				*(*MakeString)( int length );
	int 				(*SubStrCmp)( char* str, char* compare );
	int					(*PStrlen)( char* str );
	int					(*SafeString)( char* *string, int length );
	int					(*SafeStrlen)( char* *string, int maxlen );
	char				*(*StringDuplicate)( const char* str );
	char				*(*StringDuplicateN)( char* str, int len );
	int					(*StrLenSafeSpaces)( char* str );
	void				(*AddEscapeChars)( char* str );
	FULONG				(*UrlDecode)( char* dst, const char* src );
	char 				*(*UrlDecodeToMem)( const char* src );
	char				** (*StringSplit)( char* str, char delimiter, unsigned int* length ); // Length of returned char array is placed in length
	char 				*(*StringAppend)( const char *src, const char *add );
	unsigned int		(*StringParseUInt)( char* str );
	FBOOL				(*CharIsDigit)( char c );
	FBOOL				(*CharIsUpAlpha)( char c );
	FBOOL				(*CharIsLoAlpha)( char c );
	FBOOL				(*CharIsAlpha)( char c );
	FBOOL				(*CharIsAlphanumeric)( char c );
	char				(*CharAlphaToLow)( char c );
	FBOOL				(*CharIsCTL)( char c );
	void				(*StringToLowercase)( char* str );
	void				(*StringToUppercase)( char* str );
	int					(*StringCheckExtension)( char* str, char* ext );
	void				(*StringSecureFree)( char* str );
	char				*(*StringShellEscape)( const char* str );
	char				*(*StringShellEscapeSize)( const char* str, int *len );
	char				*(*FindInBinary)(char *x, int m, char *y, int n) ;
	FLONG				(*FindInBinaryPOS)(char *x, int m, char *y, FQUAD n);
	FLONG				(*FindInBinarySimple)( char *x, int m, char *y, FQUAD n );
	void				(*HashedString)( char **str );
	char				*(*StringDuplicateEOL)( const char* str );
	int					(*StringNToInt)( char *s, int len );
	char				*(*EscapeStringToJSON)( char *str );
}StringInterface;

//
// init function
//

static inline void StringInterfaceInit( StringInterface *si )
{
	si->MakeString = MakeString;
	si->SubStrCmp = SubStrCmp;
	si->PStrlen = PStrlen;
	si->SafeString = SafeString;
	si->SafeStrlen = SafeStrlen;
	si->StringDuplicate = StringDuplicate;
	si->StringDuplicateN = StringDuplicateN;
	si->StrLenSafeSpaces = StrLenSafeSpaces;
	si->StringNToInt = StringNToInt;
	si->AddEscapeChars = AddEscapeChars;
	si->UrlDecode = UrlDecode;
	si->UrlDecodeToMem = UrlDecodeToMem;
	si->StringSplit = StringSplit;
	si->StringAppend = StringAppend;
	si->StringParseUInt = StringParseUInt;
	si->CharIsDigit = CharIsDigit;
	si->CharIsUpAlpha = CharIsUpAlpha;
	si->CharIsLoAlpha = CharIsLoAlpha;
	si->CharIsAlpha = CharIsAlpha;
	si->CharIsAlphanumeric = CharIsAlphanumeric;
	si->CharAlphaToLow = CharAlphaToLow;
	si->CharIsCTL = CharIsCTL;
	si->StringToLowercase = StringToLowercase;
	si->StringToUppercase = StringToUppercase;
	si->StringCheckExtension = StringCheckExtension;
	si->StringSecureFree = StringSecureFree;
	si->StringShellEscape = StringShellEscape;
	si->StringShellEscapeSize = StringShellEscapeSize;
	si->FindInBinary = FindInBinary;
	si->FindInBinaryPOS = FindInBinaryPOS;
	si->FindInBinarySimple = FindInBinarySimple;
	si->HashedString = HashedString;
	si->StringDuplicateEOL = StringDuplicateEOL;
	si->EscapeStringToJSON = EscapeStringToJSON;
}

#endif
