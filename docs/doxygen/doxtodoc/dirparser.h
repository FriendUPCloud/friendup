/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
