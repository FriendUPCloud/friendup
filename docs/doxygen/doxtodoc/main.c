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
 * Doxygen to Documentation Central converter
 *
 * Converts Doxygen XML output to Documentation Central compatible database
 *
 * @author FL (Francois Lionet)
 * @date first push on 17/01/2017
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
#include "main.h"

// Path to open source and internal header
char* pPathXML = "../../../builddoc/XML/";

// Various global variables
FString* pFSError = NULL;
FString* pFSCurrentPath = NULL;
FString* pFSWorkPath = NULL;
FString* pFSTemp = NULL;
FString *pFSRoot = NULL;
int filesTotal = 0;
int entriesCreated = 0;
int entriesModified = 0;
int entriesDeleted = 0;

// List of file types supported
char* filterList[] =
		{
			"xml",
		    NULL
		};
// File parser function
FDirParser* pParser = NULL;
int FDirParserFunction(FDirParser* pParser, FString* pFSFileName, int filter, int flags);

int main( int argc, char *argv[] )
{
	unsigned int flags = 0;
	int d, f, n;

	int result = 0;
	pFSError = FStringAlloc(FSTRINGTYPE_ASCII);
	if (pFSError == NULL)
	{
		fprintf(stderr, "Memory error.");
		return 1;
	}

	while(TRUE)
	{
		// Initializations
		pParser = FDirParserAlloc();
		if (pParser == NULL)
		{
			FStringSetString(pFSError, "Out of memory.");
			result = 1;
			break;
		}
		FDirParserInit(pParser, filterList, FDirParserFunction);

		// Parses command line
		int c;
		result = 0;
		while ((c = getopt(argc, argv, "::")) != -1)
		{
			switch (c)
			{
				case 'd':
					break;
				case 'o':
					break;
				case 'i':
					break;
				case 'r':
					break;
				case '?':
					FStringSetString(pFSError, "Unknown option.");
					result = 1;
					break;
				default:
					FStringSetString(pFSError, "Unknown result, sorry!");
					result = 1;
					break;
			}
		}
		if (result)
			break;

		// Set to "Unknown error"
		result = 2;
		FStringSetString(pFSError, "Unknown error...");

		// Work string
		pFSTemp = FStringAlloc(FSTRINGTYPE_ASCII);
		if (pFSTemp == NULL)
			break;

		// Pathnames storage
		pFSWorkPath = FStringAlloc(FSTRINGTYPE_ASCII);
		if (pFSWorkPath == NULL)
			break;
		pFSRoot = FStringAllocFromString(argv[0]);
		if (pFSRoot == NULL)
			break;
		pFSCurrentPath = FStringAllocFromCurrentDir();
		if (pFSCurrentPath == NULL)
			break;

		// Process files
		fprintf(stderr, "Working...\n");
		result = FDirParserParseFSPath(pParser, pFSCurrentPath, flags);
		if (result != 0)
			break;

		// Information for console
		FStringSetSPrint(pFSTemp, "%i source files processed\n", "I", filesTotal);
		FStringSetFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry added\n", "I", entriesCreated);
		FStringAppendFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry deleted\n", "I", entriesDeleted);
		FStringAppendFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry modified\n", "I", entriesModified);
		FStringAppendFString(pFSError, pFSTemp);
	}

	// Cleanup
	if (pFSCurrentPath)
	{
		chdir(pFSCurrentPath->pString);
		FStringFree(pFSCurrentPath);
	}
	if (pFSWorkPath)
		FStringFree(pFSWorkPath);

	// Reports error
	if (pFSError)
	{
		if (result == 0)
			fprintf(stderr, "Job completed.\n%s", pFSError->pString);
		else
			fprintf(stderr, "Job aborted.\nError #%i\n%s\n", result, pFSError->pString);
		FStringFree(pFSError);
	}
	return result;
}

int FDirParserFunction(FDirParser* pParser, FString* pFSFileName, int filter, int flags)
{
	switch (filter)
	{
		case 0:
			break;
		default:
			break;
	}
	return 0;
}

