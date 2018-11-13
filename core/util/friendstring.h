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
 *  FString handling definitions
 *
 *  @author FL (Francois Lionet)
 *  @date first push on
 */

#ifndef FSTRING_H_
#define FSTRING_H_

#ifndef FBOOL
typedef int FBOOL;
#define TRUE 1
#define FALSE 0
int strcasecmp(const char *s1, const char *s2);
#endif

typedef struct FString
{
	int length;                     ///< length of the string
	int bufferLength;               ///< length of string data space
	int type;                       ///< type of string, ASCII or Unicode
	void* pWork;                    ///< pointer to work structure
	char* pString;                  ///< pointer to the string
} FString;

typedef struct FStringWork
{
	FString* pFString1;             ///< find next storage
	FString* pFString2;             ///< find next storage
	int result;                     ///< find next position
	int flags;                      ///< find next flags
} FStringWork;

#define FSTRING_SPRINTBUFFERSIZE 1024   ///< size of the buffer for sprint functions

enum
{
	FSTRINGTYPE_ASCII,                  ///< the string is in ASCII
	FSTRINGTYPE_UTF8                    ///< the string is in UTF8
};
enum
{
	FSTRINGFLAG_LEFT = 0x0001,                  ///< starts search from the left
	FSTRINGFLAG_RIGHT = 0x0002,                 ///< starts search from the right
	FSTRINGFLAG_NOCASE = 0x0004,                ///< do not take case of string into account
	FSTRINGFLAG_NODESTROYWORK = 0x0008,         ///< keep work structure after work
	FSTRINGFLAG_STRICTBUFFERSIZE = 0x0010,      ///< set the size of buffer to the exact size of string
	FSTRINGFLAG_CLEANWORK = 0x0020,             ///< frees the work
	FSTRINGFLAG_KEEPPREVIOUSWORK = 0x0040,      ///< if work zone already allocated, keep it and initialize it
	FSTRINGFLAG_DESTROYWORKAFTERWORK = 0x0080,  ///< end of work, free work zone? (TODO FL>FL redundant)
	FSTRINGFLAG_CREATENEW = 0x0100,             ///< creates a new string
	FSTRINGFLAG_BEFORE = 0x0200,                ///< indicates before string
	FSTRINGFLAG_AFTER = 0x0400,                 ///< indicates after string
	FSTRINGFLAG_NODELETE = 0x0800,              ///< do not delete previous string
	FSTRINGFLAG_INSERT = 0x1000                 ///< insert element
};
enum
{
	FSTRINGERROR_OK = 0,
	FSTRINGERROR_FATAL = -100000,
	FSTRINGERROR_UNKNOWN = FSTRINGERROR_FATAL,
	FSTRINGERROR_MEMORY = FSTRINGERROR_FATAL - 1,
	FSTRINGERROR_NOTIMPLEMENTED = FSTRINGERROR_FATAL - 2,
	FSTRINGERROR_NOTINITIALIZED = FSTRINGERROR_FATAL - 3,
	FSTRINGERROR_NULLPOINTER = FSTRINGERROR_FATAL - 4,
	FSTRINGERROR_INDEXOUTOFRANGE = FSTRINGERROR_FATAL - 5,
	FSTRINGERROR_STRINGNOTFOUND = FSTRINGERROR_FATAL - 6,
	FSTRINGERROR_CANNOTREADFILE = FSTRINGERROR_FATAL - 7,
	FSTRINGERROR_CANNOTWRITEFILE = FSTRINGERROR_FATAL - 8,
	FSTRINGERROR_FILENOTFOUND = FSTRINGERROR_FATAL - 9,
	FSTRINGERROR_ILLEGALARGUMENT = FSTRINGERROR_FATAL - 10,
	FSTRINGERROR_NOTFOUND = FSTRINGERROR_FATAL - 11
};
enum
{
	FSTRINGACTION_NOTINTIALIZED = -1,
	FSTRINGACTION_FINDFIRSTNUMBERFROMSTRING = 0,
	FSTRINGACTION_FINDNEXTNUMBERFROMSTRING
};

#ifdef __cplusplus
extern "C" {
#endif
// Allocation / liberation
FString *FStringAlloc(int type);
FString *FStringAllocFromString(const char *pSource);
FString *FStringAllocFromFString(FString *pSource);
FString *FStringAllocFromPath(const char *pPath, const char *pOpenFlags, int type);
FString *FStringAllocFromFPath(FString *pPath, const char *pOpenFlags, int type);

void FStringFree(FString *pFString);
int FStringClean(FString *pFString);
int FStringCheckBufferSize(FString *pFString, int l);
int FStringSetBufferSize(FString *pFString, int l);
int FStringWorkAlloc(FString *pFString);
int FStringWorkClean(FStringWork *pFSWork);
int FStringWorkFree(FStringWork *pFSWork);

// Queries
char *FStringGetString(FString *pFString);
int FStringGetLength(FString *pFString);
int FStringGetNextLine(FString *pFString, int position);
int FStringGetPreviousLine(FString *pFString, int position);
int FStringGetEndOfLine(FString *pFString, int position);
int FStringGetStartOfLine(FString *pFString, int position);
int FStringGetLineDistance(FString *pFString, int start, int end);

// Conversions
int FStringConvertToLowercase(FString *pFString);
int FStringConvertToUppercase(FString *pFString);

// Search / Replace
int FStringFindSubstring(FString *pFString, const char *pString, int flags);
int FStringCompareString(FString *pFString, const char *pString, int flags);
int FStringCompareFString(FString *pFString, FString *pFString2, int flags);
int FStringFindNext(FString *pFString);
char *strstr_fromright(char *pString, char *pSearch);

// File operations
FString *FStringAllocFromBasename(const char *pPath);
FString *FStringAllocFromDirname(const char *pPath);
FString *FStringAllocFromFBasename(FString *pPath);
FString *FStringAllocFromFDirname(FString *pPath);
FString *FStringAllocFromCurrentDir();
int FStringSetBasename(FString *pFString, const char *pPath);
int FStringSetDirname(FString *pFString, const char *pPath);
int FStringSetFBasename(FString *pFString, FString *pFSPath);
int FStringSetFDirname(FString *pFString, FString *pFSPath);
char *FStringGetBasename(FString *pFString);
char *FStringGetDirname(FString *pFString);
int FStringSetCurrentDir(FString *pFString);
char *CheckExtension(const char *pString, const char *pExt);
int FStringCheckExtension(FString *pFString, const char *pExt);
int FStringSetFromFile(FString *pFString, const char *pPath, const char *pFileFlags);
int FStringWriteToFile(FString *pFString, const char *pPath, const char *pFileFlags);
int FStringAppendFilename(FString *pFString, const char *pName);
int FStringAppendFFilename(FString *pFString, FString *pFSFile);
int FStringReplaceFilename(FString *pFString, const char *pName);

// Set string
int FStringSetString(FString *pFString, const char *pSource);
int FStringSetSubstring(FString *pFString, const char *pSource, int srcePosition, int srceLength);
int FStringSetSubstringWithLength(FString *pFString, const char *pSource, int srcePosition, int srceLength, int lSource);
int FStringSetFString(FString *pFString, FString *pFSource);
int FStringSetFSubstring(FString *pFString, FString *pFSource, int srcePosition, int srceLength);
int FStringSetSPrint(FString *pFString, const char *pControl, const char *pTypes, ...);

// Append string
int FStringAppendString(FString *pFString, const char *pSource);
int FStringAppendSubstring(FString *pFString, const char *pSource, int srcePosition, int srceLength);
int FStringAppendSubstringWithLength(FString *pFString, const char *pSource, int srcePosition, int srceLength, int lSource);
int FStringAppendFString(FString *pFString, FString *pFSource);
int FStringAppendFSubstring(FString *pFString, FString *pFSource, int srcePosition, int srceLength);
int FStringAppendFSDirectory(FString *pFString, FString *pFSDirectory);

// Replace string
int FStringReplaceString(FString *pFString, const char *pSource, int destPosition, int destLength);
int FStringReplaceSubstring(FString *pFString, const char *pSource, int destPosition, int destLength, int srcePosition, int srceLength);
int FStringReplaceSubstringWithLength(FString *pFString, const char *pSource, int destPosition, int destLength, int srcePosition, int srceLength, int lSource);
int FStringReplaceFString(FString *pFString, FString *pFSource, int destPosition, int destLength);
int FStringReplaceFSubstring(FString *pFString, FString *pFSource, int destPosition, int destLength, int srcePosition, int srceLength);

int FStringInsertString(FString *pFString, const char *pSource, int destPosition);
int FStringInsertSubstring(FString *pFString, const char *pSource, int destPosition, int srcePosition, int srceLength);
int FStringInsertSubstringWithLength(FString *pFString, const char *pSource, int destPosition, int srcePosition, int srceLength, int lSource);
int FStringInsertFString(FString *pFString, FString *pFSource, int destPosition);
int FStringInsertFSubstring(FString *pFString, FString *pFSource, int destPosition, int srcePosition, int srceLength);

#ifdef __cplusplus
}
#endif

#endif  // FSTRING_H_
