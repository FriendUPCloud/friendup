/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef STRING_H_
#define STRING_H_

#include <core/types.h>
#include <core/types.h>

char* MakeString( int length );

// Perform strcmp on a substring
int SubStrCmp( char* str, char* compare );

// Gives stringlength of str (safely, only use with sprintf!)
int PStrlen( char* str );

// Make string safe! If it is not null terminated - fix it!
int SafeString( char* *string, int length );

// A kind of safe strlen func
int SafeStrlen( char* *string, int maxlen );

// calloc a const string
char* StringDuplicate( const char* str );

// Duplicate a string given N chars
char* StringDuplicateN( char* str, int len );

// calloc a const string (function reads till EOL
char* StringDuplicateEOL( const char* str );

// Show string length, but with " " becoming "\x20"
int StrLenSafeSpaces( char* str );

// Clean double // from strings
void CleanPathString( char* str );

// Add escape chars to string (requires that the string is long enough)
void AddEscapeChars( char* str );

// Decode string
FULONG UrlDecode( char* dst, const char* src );

char *UrlDecodeToMem( const char* src );

char *UrlEncodeToMem( const char *src );

char** StringSplit( char* str, char delimiter, unsigned int* length ); // Length of returned char array is placed in length

char *StringAppend( const char *src, const char *add );

unsigned int StringParseUInt( char* str );

FBOOL CharIsDigit( char c );

FBOOL CharIsUpAlpha( char c );

FBOOL CharIsLoAlpha( char c );

FBOOL CharIsAlpha( char c );

FBOOL CharIsAlphanumeric( char c );

char CharAlphaToLow( char c );

FBOOL CharIsCTL( char c );

void StringToLowercase( char* str );

void StringToUppercase( char* str );

int StringCheckExtension( char* str, char* ext );

void StringSecureFree( char* str );

char* StringShellEscape( const char* str );

char* StringShellEscapeSize( const char* str, int *len );

char *FindInBinary(char *x, int m, char *y, int n) ;

FQUAD FindInBinaryPOS(char *x, int m, char *y, FQUAD n);

FQUAD FindInBinarySimple( char *x, int m, char *y, FQUAD n );

void HashedString ( char **str );

char *GetStringFromJSON( char *text, char *token );

char *EscapeStringToJSON( char *str );

int StringNToInt( char *s, int len );

void string_escape_quotes(const char *src, char *dst); //destination has to be at least twice as long as src (in worst case)

#endif
