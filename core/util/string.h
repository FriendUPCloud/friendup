/*

<LICENSE TEMPLATE>

*/
#ifndef STRING_H_
#define STRING_H_

#include <stdbool.h>
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
char* StringDuplicateN( char* str, unsigned int len );

// Show string length, but with " " becoming "\x20"
int StrLenSafeSpaces( char* str );

// Clean double // from strings
void CleanPathString( char* str );

// Add escape chars to string (requires that the string is long enough)
void AddEscapeChars( char* str );

// Decode string
ULONG UrlDecode( char* dst, const char* src );

char *UrlDecodeToMem( const char* src );

char** StringSplit( char* str, char delimiter, unsigned int* length ); // Length of returned char array is placed in length

char *StringAppend( const char *src, const char *add );

unsigned int StringParseUInt( char* str );

BOOL CharIsDigit( char c );

BOOL CharIsUpAlpha( char c );

BOOL CharIsLoAlpha( char c );

BOOL CharIsAlpha( char c );

BOOL CharIsAlphanumeric( char c );

char CharAlphaToLow( char c );

BOOL CharIsCTL( char c );

void StringToLowercase( char* str );

void StringToUppercase( char* str );

int StringCheckExtension( char* str, char* ext );

void StringSecureFree( char* str );

char* StringShellEscape( const char* str );

char *FindInBinary(char *x, int m, char *y, int n) ;

int FindInBinaryPOS(char *x, int m, char *y, int n);

#endif
