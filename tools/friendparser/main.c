/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/
/**
 * @file
 *
 *  Source parser
 *
 *  @author FL (Francois Lionet)
 *  @date first push on
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <string.h>
#include "friendstring.h"
#include "main.h"
#include "headers.txt"

#define MAX_ARGUMENTS 32
enum
{
	FPARSERFLAG_SUBDIRECTORIES = 0x00000001,
	FPARSERFLAG_INTERNAL = 0x00000002,
	FPARSERFLAG_OPENSOURCE = 0x00000004,
	FPARSERFLAG_GENERATEREPORTS = 0x00000008
};

// Report generation
#define MAX_PEOPLE 7
char* pInitials[MAX_PEOPLE] =
		{
			"HT",
			"PS",
			"CA",
			"TW",
			"EO",
			"FL"
		};
char* pNames[MAX_PEOPLE] =
		{
			"Hogne Tildstad",
			"Pawel Stefanski",
			"Chris Andre Stromland",
			"Thomas Wollburg",
			"Espen Olsen",
			"Francois Lionet"
		};
char* pFilenameReports = "friendlyreport-%s.txt";
FString* pFSReports[MAX_PEOPLE];
FString* pFSHeaderReport = NULL;
int reportFlags[MAX_PEOPLE];
#define REPORTFLAG_MODIFIED 0x00000001

// List of file types supported
#define MAX_FILTERS 5
char* filterList[MAX_FILTERS] =
		{
			"c",
		    "h",
		    "js",
		    "php",
		    "cpp"
		};

// Various global variables
#define MAX_DIRS 20
#define MAX_FILES 500
FString* dirNames[MAX_FILES];
FString* fileNames[MAX_DIRS][MAX_FILES];
int fileTypes[MAX_DIRS][MAX_FILES];
int fileCounts[MAX_DIRS];
int dirCount = 0;
int parserFlags = 0;
char* pDefaultFilter = "*.*";
FString* pFSHeaderAgpl = NULL;
FString* pFSHeaderLgpl = NULL;
FString* pFSHeaderMit = NULL;
FString* pFSHeaderInternalAgpl = NULL;
FString* pFSHeaderInternalLgpl = NULL;
FString* pFSHeaderInternalMit = NULL;
FString* pFSError = NULL;
FString* pFSCurrentPath = NULL;
FString* pFSWorkPath = NULL;
FString* pFSTemp = NULL;
FString *pFSRoot = NULL;
int filesTotal = 0;
int filesModified = 0;
#define OLDHEADERLENGTH 6
char oldHeader[OLDHEADERLENGTH];
char* oldHeaderLetters[OLDHEADERLENGTH] =
		{
			"/",
		    "*",
		    "©",
		    "*",
		    "*",
		    "*"
		};

int main( int argc, char *argv[] )
{
	unsigned int flags = 0;
	int d, f, n;

	int result = 0;
	pFSError = FStringAlloc(FSTRINGTYPE_ASCII);
	if (pFSError == NULL)
	{
		fprintf(stderr, "Memory result.");
		return 1;
	}

	while(TRUE)
	{
		// Initializations
		for (d = 0; d < MAX_DIRS; d++)
		{
			for (f = 0; f < MAX_FILES; f++)
			{
				fileNames[d][f] = NULL;
			}
		}

		// Parses command line
		int c;
		result = 0;
		while ((c = getopt(argc, argv, "oir::")) != -1)
		{
			switch (c)
			{
				case 'o':
					flags |= FPARSERFLAG_OPENSOURCE;
					break;
				case 'i':
					flags |= FPARSERFLAG_INTERNAL;
					break;
				case 'r':
					flags |= FPARSERFLAG_GENERATEREPORTS;
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

		// Allocates the headers
		pFSHeaderAgpl = FStringAllocFromString(headerAgpl);
		pFSHeaderLgpl = FStringAllocFromString(headerLgpl);
		pFSHeaderMit = FStringAllocFromString(headerMit);
		pFSHeaderInternalAgpl = FStringAllocFromString(headerInternalAgpl);
		pFSHeaderInternalLgpl = FStringAllocFromString(headerInternalLgpl);
		pFSHeaderInternalMit = FStringAllocFromString(headerInternalMit);
		pFSHeaderReport = FStringAllocFromString(headerReports);

		// Creates oldheader detection string
		for (n = 0; n < OLDHEADERLENGTH; n++)
		{
			oldHeader[n] = oldHeaderLetters[n][0];
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

		// Process files
		fprintf(stderr, "Working...\n");
		result = Process(pFSCurrentPath, flags);
		if (result != 0)
			break;

		// Information for console
		FStringSetSPrint(pFSTemp, "%i files processed\n", "I", filesTotal);
		FStringSetFString(pFSError, pFSTemp);
		FStringSetSPrint(pFSTemp, "%i source files modified\n", "I", filesModified);
		FStringAppendFString(pFSError, pFSTemp);

		// Generates reports
		if (flags & FPARSERFLAG_GENERATEREPORTS)
		{
			// Saves the reports if they contain something
			chdir(pFSCurrentPath->pString);
			for (n = 0; n < MAX_PEOPLE; n++)
			{
				if (reportFlags[n])
				{
					FStringSetSPrint(pFSTemp, pFilenameReports, "S", pInitials[n]);
					if (FStringWriteToFile(pFSReports[n], pFSTemp->pString, NULL) != FSTRINGERROR_OK)
					{
						FStringSetSPrint(pFSError, "Cannot write %s's report.", "S", pInitials[n]);
						result = 1;
						break;
					}
					else
					{
						FStringSetSPrint(pFSTemp, "Report generated for %s\n", "S", pInitials[n]);
						FStringAppendFString(pFSError, pFSTemp);
					}
				}
			}
			if (result)
				break;
		}
		break;
	}

	// Cleanup
	for (d = 0; d < MAX_DIRS; d++)
	{
		for (f = 0; f < MAX_FILES; f++)
		{
			if (fileNames[d][f] != NULL)
				FStringFree(fileNames[d][f]);
		}
	}
	for (n = 0; n < MAX_PEOPLE; n++)
	{
		if (pFSReports[n] != NULL)
			FStringFree(pFSReports[n]);
	}
	if (pFSCurrentPath)
	{
		chdir(pFSCurrentPath->pString);
		FStringFree(pFSCurrentPath);
	}
	FStringFree(pFSHeaderMit);
	FStringFree(pFSHeaderLgpl);
	FStringFree(pFSHeaderAgpl);
	FStringFree(pFSHeaderInternalLgpl);
	FStringFree(pFSHeaderInternalAgpl);
	FStringFree(pFSHeaderInternalMit);
	FStringFree(pFSHeaderReport);
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
			if (strcmp(fileNames[dirCount][n]->pString, "build") != 0)
			{
				FString *pFSTemp = FStringAllocFromFString(pFSPath);
				FStringAppendFFilename(pFSTemp, fileNames[dirCount][n]);
				dirCount++;
				error = ProcessDirectory(pFSTemp, flags);
				dirCount--;
				FStringFree(pFSTemp);
				chdir(pFSPath->pString);
				if (error)
					break;
			}
		}
		FStringFree(fileNames[dirCount][n]);
		fileNames[dirCount][n] = NULL;
	}

	return error;
}

int ProcessFile(FString* pPath, int type, int flags)
{
	FStringSetCurrentDir(pFSWorkPath);
	FString* pFSCurrentPath = FStringAllocFromCurrentDir();
	FStringAppendFFilename(pFSCurrentPath, pPath);
	fprintf(stderr, "%s\n", pFSCurrentPath->pString);

	FString* pFString = FStringAlloc(FSTRINGTYPE_ASCII);
	if (pFString == NULL)
		return FSTRINGERROR_MEMORY;

	if (FStringSetFromFile(pFString, pPath->pString, NULL) != FSTRINGERROR_OK)
	{
		FStringSetFString(pFSError, pPath);
		return FSTRINGERROR_CANNOTREADFILE;
	}

	// Change flag
	filesTotal++;
	BOOL bModified = FALSE;

	// Replaces headers
	int start, end;
	start = FStringFindSubstring(pFString, oldHeader, FSTRINGFLAG_LEFT);
	if (start >= 0)
	{
		FStringSetSPrint(pFSError, "Old header in file %s (should start with /*©lgpl, /*©agpl or /*©mit)", "S", pFSCurrentPath->pString);
		FStringFree(pFSCurrentPath);
		FStringFree(pFString);
		return 1;
	}
	FString* pFSHeader = NULL;

	start = FStringFindSubstring(pFString, "/*©lgpl", FSTRINGFLAG_LEFT);
	if (start >= 0)
	{
		if (flags & FPARSERFLAG_INTERNAL)
			pFSHeader = pFSHeaderInternalLgpl;
		else
			pFSHeader = pFSHeaderLgpl;
	}
	if (start < 0)
	{
		start = FStringFindSubstring(pFString, "/*©agpl", FSTRINGFLAG_LEFT);
		if (flags & FPARSERFLAG_INTERNAL)
			pFSHeader = pFSHeaderInternalAgpl;
		else
			pFSHeader = pFSHeaderAgpl;
	}
	if (start < 0)
	{
		start = FStringFindSubstring(pFString, "/*©mit", FSTRINGFLAG_LEFT);
		if (flags & FPARSERFLAG_INTERNAL)
			pFSHeader = pFSHeaderInternalMit;
		else
			pFSHeader = pFSHeaderMit;
	}
	if (start >= 0)
	{
		end = FStringFindSubstring(pFString, "**©*", FSTRINGFLAG_LEFT);
		if (end > start)
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
	FStringFree(pFString);
	FStringFree(pFSCurrentPath);
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





