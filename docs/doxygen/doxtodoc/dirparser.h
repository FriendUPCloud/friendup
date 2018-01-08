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
 * Prases directory and files
 *
 * Easy exploration of a directory and its sub-directories
 * with distinction between type of files
 *
 * @author FL (Francois Lionet)
 * @date first push on 18/01/2017
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <string.h>
#include "../../../core/util/friendstring.h"

#ifndef DOXTODOC_DIRPARSER_H
#define DOXTODOC_DIRPARSER_H

#define MAX_DIRS 20
#define MAX_FILES 500
typedef struct
{
	FString* dirNames[MAX_FILES];
	FString* fileNames[MAX_DIRS][MAX_FILES];
	int fileTypes[MAX_DIRS][MAX_FILES];
	int fileCounts[MAX_DIRS];
	char** pFilterList;
	void* pFileHandler;

	int parserFlags;
	int dirCount;
	FString* pFSError;
	FString* pFSCurrentPath;
	FString* pFSWorkPath;
	int filesTotal;
}FDirParser;
typedef int (*FDirParserFileHandler)(FDirParser*, FString* pFSFileName, int filter, int flags);

#ifdef __cplusplus
extern "C" {
#endif
FDirParser* FDirParserAlloc();
void FDirParserFree(FDirParser* pParser);
int FDirParserInit(FDirParser* pParser, const char** pFilterList, FDirParserFileHandler);
int FDirParserParsePath(FDirParser* pParser, const char* pPath, int flags);
int FDirParserParseFSPath(FDirParser* pParser, FString* pFSPath, int flags);
int FDirParserFilterFile(const struct dirent *entry);
int FDirParserProcessDirectory(FDirParser* pParser, FString* pFSPath, int flags);
#ifdef __cplusplus
}
#endif

#endif //DOXTODOC_DIRPARSER_H
