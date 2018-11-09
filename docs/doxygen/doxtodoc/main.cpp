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
 * Doxygen to Friend Create converter
 *
 * Converts Doxygen XML output to Friend-Create coppatible database
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
#include "main.h"

// Path to open source and internal header
char* pPathXML = "../../../builddoc/XML/";

// Various global variables
char* pDefaultFilter = "*.XML";
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
#define MAX_FILTERS 4
char* filterList[MAX_FILTERS] =
		{
			"xml"
		};
enum
{
	FILETYPE_XML,
	FILETYPE_H,
	FILETYPE_JS,
	FILETYPE_PHP
};

int main()
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
		result = Process(pFSCurrentPath, flags);
		if (result != 0)
			break;


		// Load header files
		FStringSetString(pFSTemp, pPathHeaders);
		FStringAppendFilename(pFSTemp, pPathHeaderOpenSource);
		pFSHeaderOpenSource = FStringAllocFromFPath(pFSTemp, NULL, FSTRINGTYPE_ASCII);
		if (pFSHeaderOpenSource == NULL)
		{
			FStringSetString(pFSError, "Cannot open friendparser-headeropensource.h");
			break;
		}
		FStringReplaceFilename(pFSTemp, pPathHeaderInternal);
		pFSHeaderInternal = FStringAllocFromFPath(pFSTemp, NULL, FSTRINGTYPE_ASCII);
		if (pFSHeaderInternal == NULL)
		{
			FStringSetString(pFSError, "Cannot open friendparser-headerinternal.h");
			break;
		}
		FStringReplaceFilename(pFSTemp, pPathHeaderReport);
		pFSHeaderReport = FStringAllocFromFPath(pFSTemp, NULL, FSTRINGTYPE_ASCII);
		if (pFSHeaderReport == NULL)
		{
			FStringSetString(pFSError, "Cannot open friendparser-headerreport.h");
			break;
		}

		// Creates FStrings for reports
		if (flags & FPARSERFLAG_GENERATEREPORTS)
		{
			char timeBuffer[64];
			time_t t = time(NULL);
			struct tm *tm = localtime(&t);
			strftime(timeBuffer, 64, "%c", tm);
			for (n = 0; n < MAX_PEOPLE; n++)
			{
				pFSReports[n] = FStringAlloc(FSTRINGTYPE_ASCII);
				if (pFSReports[n] == NULL)
					break;
				if (FStringSetSPrint(pFSReports[n], pFSHeaderReport->pString, "SS", timeBuffer, pNames[n]) != FSTRINGERROR_OK)
					break;
				reportFlags[n] = 0;
			}
		}

		// Information for console
		FStringSetSPrint(pFSTemp, "%i source files processed\n", "I", filesTotal);
		FStringSetFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry added\n", "I", entriesAdded);
		FStringAppendFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry deleted\n", "I", entriesAdded);
		FStringAppendFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i database entry modified\n", "I", entryModified);
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




int Process(FString* pFSPath, int flags)
{
	dirCount = 0;
	return ProcessDirectory(pFSPath, flags);
}

int ProcessDirectory(FString* pFSPath, int flags)
{
	parserFlags = flags;

	int n;
	struct dirent **namelist;
	fileCounts[dirCount] = 0;
	chdir(pFSPath->pString);
	scandir(".", &namelist, FilterFile, alphasort);
	free(namelist);

	int error = 0;
	for (n = 0; n < fileCounts[dirCount]; n++)
	{
		if (fileTypes[dirCount][n] >= 0)
		{
			error = ProcessFile(fileNames[dirCount][n], fileTypes[dirCount][n], flags);
			if (error)
				break;
		}
		else
		{
			FString* pFSTemp = FStringAllocFromFString(pFSPath);
			FStringAppendFFilename(pFSTemp, fileNames[dirCount][n]);
			dirCount++;
			error = ProcessDirectory(pFSTemp, flags);
			dirCount--;
			FStringFree(pFSTemp);
			chdir(pFSPath->pString);
			if (error)
				break;
		}
		FStringFree(fileNames[dirCount][n]);
		fileNames[dirCount][n] = NULL;
	}

	return error;
}

int ProcessFile(FString* pPath, int type, int flags)
{
	FStringSetCurrentDir(pFSWorkPath);
	FString* pFString = FStringAlloc(FSTRINGTYPE_ASCII);
	if (pFString == NULL)
		return FSTRINGERROR_MEMORY;

	FStringSetFString(pFSError, pPath);
	if (FStringSetFromFile(pFString, pPath->pString, NULL) != FSTRINGERROR_OK)
		return FSTRINGERROR_CANNOTREADFILE;

	// Change flag
	filesTotal++;
	BOOL bModified = FALSE;

	// Replaces headers
	int start, end;
	FString* pFSHeader = NULL;
	if (flags & FPARSERFLAG_OPENSOURCE)
		pFSHeader = pFSHeaderOpenSource;
	if (flags & FPARSERFLAG_INTERNAL)
		pFSHeader = pFSHeaderInternal;
	if ( pFSHeader != NULL )
	{
		start = FStringFindSubstring(pFString, "/*©*", FSTRINGFLAG_AFTER);
		end = FStringFindSubstring(pFString, "**©*", FSTRINGFLAG_AFTER);
		if (start >= 0 && end > start)
		{
			end = FStringGetEndOfLine(pFString, end);
			FStringReplaceFString(pFString, pFSHeader, start, end - start);
			filesModified++;
			bModified = TRUE;
		}
	}
	if (flags & FPARSERFLAG_GENERATEREPORTS)
	{
		int n, found;
		FString* pFSearch = FStringAlloc(FSTRINGTYPE_ASCII);
		for (n = 0; n < MAX_PEOPLE; n++)
		{
			FStringSetSPrint(pFSearch, ">%s", "S", pInitials[n]);
			found = FStringFindSubstring(pFString, pFSearch->pString, FSTRINGFLAG_LEFT);
			while (found >= 0)
			{
				// Checks validity
				int m;
				FStringSetFSubstring(pFSTemp, pFString, found - 2, 2);
				for (m = 0; m < MAX_PEOPLE; m++)
				{
					if (FStringCompareString(pFSTemp, pInitials[m], 0) == 0)
					{
						start = FStringGetStartOfLine(pFString, found);
						end = FStringGetEndOfLine(pFString, found);
						if (start >= 0 && end > start)
						{
							int lineNumber = FStringGetLineDistance(pFString, 0, start);

							// FL>HT: Hogne can you help me? I do not understand extended lists of parameters in FStringSPrint, it does not work for more than one...
							FString* pFSTodo = FStringAlloc(FSTRINGTYPE_ASCII);
							FStringSetSPrint(pFSTodo, "In file %s, ", "S", pPath->pString);
							FStringSetFString(pFSTemp, pFSTodo);
							FStringSetSPrint(pFSTodo, "line %i:\n", "I", lineNumber);
							FStringAppendFString(pFSTemp, pFSTodo);
							FStringFree(pFSTodo);

							FStringAppendFSubstring(pFSTemp, pFString, start, end - start);
							FStringAppendString(pFSTemp, "\n\n");
							FStringAppendFString(pFSReports[n], pFSTemp);
							reportFlags[n] |= REPORTFLAG_MODIFIED;
							break;
						}
					}
				}
				found = FStringFindNext(pFString);
			}
		}
	}
	if (bModified)
	{
		if (FStringWriteToFile(pFString, pPath->pString, NULL) != FSTRINGERROR_OK)
			return FSTRINGERROR_CANNOTWRITEFILE;
	}
	return 0;
}

int FilterFile(const struct dirent *entry)
{
	int i;
	for (i = 0; i < MAX_FILTERS; i++)
	{
		struct stat s;
		if( stat(entry->d_name, &s) == 0 )
		{
			if( s.st_mode & S_IFREG )
			{
				for (i = 0; i < MAX_FILTERS; i++)
				{
					if ( CheckExtension((char*)entry->d_name, filterList[i]) != NULL )
					{
						if (fileNames[dirCount][fileCounts[dirCount]] == NULL)
							fileNames[dirCount][fileCounts[dirCount]] = FStringAlloc(FSTRINGTYPE_ASCII);
						FStringSetString(fileNames[dirCount][fileCounts[dirCount]], (char*)entry->d_name);
						fileTypes[dirCount][fileCounts[dirCount]++] = i;
						return 1;
					}
				}
			}
			else if( s.st_mode & S_IFDIR )
			{
				if (strcmp(entry->d_name, "..") != 0 && strcmp(entry->d_name, ".") != 0)
				{
					if (fileNames[dirCount][fileCounts[dirCount]] == NULL)
						fileNames[dirCount][fileCounts[dirCount]] = FStringAlloc(FSTRINGTYPE_ASCII);
					FStringSetString(fileNames[dirCount][fileCounts[dirCount]], entry->d_name);
					fileTypes[dirCount][fileCounts[dirCount]++] = -1;
					return 1;
				}
			}
		}
	}
	return 0;
}


