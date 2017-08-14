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

FQUAD FindInBinaryPOS(char *x, int m, char *y, FUQUAD n);

FQUAD FindInBinarySimple( char *x, int m, char *y, FUQUAD n );

void HashedString ( char **str );

char *GetStringFromJSON( char *text, char *token );

#endif
