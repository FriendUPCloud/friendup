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
 * Parses directory and files
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
#include "dirparser.h"

// Various global definitions
int parserFlags = 0;

FDirParser* pParsingParser;

FDirParser* FDirParserAlloc()
{
	FDirParser* pParser = calloc(sizeof(FDirParser), 1);
	if (pParser == NULL)
		return NULL;
	return pParser;
}
void FDirParserFree(FDirParser* pParser)
{
	if (pParser != NULL)
	{
		free(pParser);
	}
}
int FDirParserInit(FDirParser* pParser, const char** pFilterList, FDirParserFileHandler pFileHandler)
{
	int d, f;
	for (d = 0; d < MAX_DIRS; d++)
	{
		for (f = 0; f < MAX_FILES; f++)
		{
			if (pParser->dirNames[d] != NULL)
				FStringFree(pParser->dirNames[d]);
			if (pParser->fileNames[d][f] != NULL)
				FStringFree(pParser->fileNames[d][f]);
			pParser->fileTypes[d][f] = -1;
			pParser->fileCounts[d] = 0;
		}
	}
	pParser->pFilterList = (char**)pFilterList;
	pParser->pFileHandler = pFileHandler;
	pParser->dirCount = 0;
	return 0;
}
int FDirParserParsePath(FDirParser* pParser, const char* pPath, int flags)
{
	pParsingParser = pParser;
	FDirParserInit(pParser, (const char**)pParser->pFilterList, pParser->pFileHandler);
	FString* pFSPath = FStringAllocFromString(pPath);
	int result = FDirParserProcessDirectory(pParser, pFSPath, flags);
	FStringFree(pFSPath);
	return result;
}
int FDirParserParseFSPath(FDirParser* pParser, FString* pFSPath, int flags)
{
	pParsingParser = pParser;
	FDirParserInit(pParser, (const char**)pParser->pFilterList, pParser->pFileHandler);
	return FDirParserProcessDirectory(pParser, pFSPath, flags);
}
int FDirParserProcessDirectory(FDirParser* pParser, FString* pFSPath, int flags)
{
	pParser->parserFlags = flags;

	int n;
	struct dirent **namelist;
	pParser->fileCounts[pParser->dirCount] = 0;
	chdir(pFSPath->pString);
	scandir(".", &namelist, FDirParserFilterFile, alphasort);
	free(namelist);

	int error = 0;
	for (n = 0; n < pParser->fileCounts[pParser->dirCount]; n++)
	{
		if (pParser->fileTypes[pParser->dirCount][n] >= 0)
		{
			error = ((FDirParserFileHandler)pParser->pFileHandler)(pParser, pParser->fileNames[pParser->dirCount][n], pParser->dirCount, flags);
			if (error)
				break;
		}
		else
		{
			FString* pFSTemp = FStringAllocFromFString(pFSPath);
			FStringAppendFFilename(pFSTemp, pParser->fileNames[pParser->dirCount][n]);
			pParser->dirCount++;
			error = FDirParserProcessDirectory(pParser, pFSTemp, flags);
			pParser->dirCount--;
			FStringFree(pFSTemp);
			chdir(pFSPath->pString);
			if (error)
				break;
		}
	}
	return error;
}
int FDirParserFilterFile(const struct dirent *entry)
{
	int i;
	struct stat s;
	if( stat(entry->d_name, &s) == 0 )
	{
		if( s.st_mode & S_IFREG )
		{
			for (i = 0; ; i++)
			{
				if (pParsingParser->pFilterList[i] == NULL)
					break;
				if ( CheckExtension((char*)entry->d_name, pParsingParser->pFilterList[i]) != NULL )
				{
					if (pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]] == NULL)
						pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]] = FStringAlloc(FSTRINGTYPE_ASCII);
					FStringSetString(pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]], (char*)entry->d_name);
					pParsingParser->fileTypes[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]++] = i;
					return 1;
				}
			}
		}
		else if( s.st_mode & S_IFDIR )
		{
			if (strcmp(entry->d_name, "..") != 0 && strcmp(entry->d_name, ".") != 0)
			{
				if (pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]] == NULL)
					pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]] = FStringAlloc(FSTRINGTYPE_ASCII);
				FStringSetString(pParsingParser->fileNames[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]], entry->d_name);
				pParsingParser->fileTypes[pParsingParser->dirCount][pParsingParser->fileCounts[pParsingParser->dirCount]++] = -1;
				return 1;
			}
		}
	}
	return 0;
}

