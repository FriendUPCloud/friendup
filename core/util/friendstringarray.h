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



/**
 * @file
 *
 *  Fast array of Friend Strings definitions
 *
 *  @author FL (Francois Lionet)
 *  @date first push on
 *  @todo FL>FL implement Unicode
 */

#ifndef __FRIENDSTRINGARRAY_H__
#define __FRIENDSTRINGARRAY_H__

typedef struct FStringArray
{
    int bufferLength;
	int indexLength;
	int lastNumber;
	int justChecked;
	FString* pWork;
	int action;
	int result;
	int workFlags;
    FString** pArray;
	int* pIndexes;
} FStringArray;

FStringArray* FStringArrayAlloc(int size);
int FStringArrayFree(FStringArray* pFSArray);
int FStringArrayCheckLastNumber(FStringArray* pFSArray);
int FStringArrayDeleteNumber(FStringArray* pFSArray, int number);
int FStringArrayDeleteId(FStringArray* pFSArray, int id);
int FStringArrayDeleteAll(FStringArray* pFSArray);
int FStringArrayCheckBuffer(FStringArray* pFSArray, int size);
int FStringArrayNewId(FStringArray* pFSArray, int number);
int FStringArrayFindFreeSlot(FStringArray* pFSArray, int position, int flags);
int FStringArrayAddFString(FStringArray* pFSArray, FString* pFString, int flags);
int FStringArrayAddString(FStringArray* pFSArray, char* pString, int flags);
int FStringArrayGetNumberFromId(FStringArray *pFSArray, int id);
int FStringArrayGetIdFromNumber(FStringArray* pFSArray, int number);
int FStringArrayFindNextNumber(FStringArray* pFSArray);;
int FStringArrayFindNumberFromString(FStringArray* pFSArray, char* pString, int number, int flags);
int FStringArrayInsertFileAscii(FStringArray* pFSArray, char* pPath, int number, int nLines, int flags);
int FStringArraySaveAscii(FStringArray* pFSArray, int nLines, int flags);
int FStringArrayLoadAscii(FStringArray* pFSArray, int nLines, int position, int flags);
int FStringArrayInsertFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags);
int FStringArrayInsertStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags);
int FStringArrayInsertFStringAtId(FStringArray* pFSArray, FString* pFString, int id, int flags);
int FStringArrayInsertStringAtId(FStringArray* pFSArray, char* pString, int id, int flags);
int FStringArraySetFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags);
int FStringArraySetStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags);
int FStringArraySetReplaceStringAtId(FStringArray* pFSArray, char* pString, int id, int flags);
int FStringArraySetFStringAtId(FStringArray* pFSArray, FString* pFString, int id, int flags);
int FStringArrayReplaceFStringAtNumber(FStringArray* pFSArray, FString* pFString, int number, int flags);
int FStringArrayReplaceStringAtNumber(FStringArray* pFSArray, char* pString, int number, int flags);
int FStringArrayReplaceStringAtId(FStringArray* pFSArray, char* pString, int id, int flags);
int FStringArrayReplaceFStringAtId(FStringArray* pFSArray, FString* pFString, int number, int flags);

#endif	// __FRIENDSTRINGARRAY_H__

