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
 * Friend helper application
 * This application communicate with Friend through the Friend Network Chrome extension
 * It obeys the commands of the client, and acts as an interface with the 
 * local file system.
 *
 *  @author FL (Francois Lionet)
 *  @date first push on 09/07/2018
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <string.h>
#include "friendstring.h"
#include "cJSON.h"
#include <errno.h>
#include <mntent.h>	
#include <sys/stat.h>
#include <time.h>
#include <limits.h>
#include <pwd.h>
#include <grp.h>
#include "main.h"

#define MAX_FILES 1024
#define CHUNK_SIZE ( 1024 * 256 )
#define MAX_MESSAGE_SIZE ( CHUNK_SIZE + 1024 )
#define ILLEGAL_NUMBER -1111111111

char identifierBuffer[ 256 ];
FString* pLogPath = NULL;
FString* pDefaultPath = NULL;
FString* pCurrentPath = NULL;
FString* pCurrentFriendPath = NULL;
FileInfo** pFiles = NULL;
char* pMessageBuffer = NULL;
int fileCount;
char hostname[ HOST_NAME_MAX ];
char username[ LOGIN_NAME_MAX ];

// Various commands
#define MAX_COMMANDS 12
char* commands[ MAX_COMMANDS ] =
{
	"getDrives",			// 0
	"getDirectory",			// 1
	"exit",					// 2
	"getInfos",				// 3
	"init",					// 4
	"readFile",				// 5
	"getFileChunk",			// 6
	"writeFile",			// 7
	"writeFileChunk",		// 8
	"getFileInformation",	// 9
	"setFileInformation",	// 10
	"dosAction"			// 11
};
enum
{
	COMMAND_GETDRIVES = 0,
	COMMAND_GETDIRECTORY = 1,
	COMMAND_EXIT = 2,
	COMMAND_GETINFOS = 3,
	COMMAND_INIT = 4,
	COMMAND_READFILE = 5,
	COMMAND_GETFILECHUNK = 6,
	COMMAND_WRITEFILE = 7,
	COMMAND_WRITEFILECHUNK = 8,
	COMMAND_GETFILEINFORMATION = 9,
	COMMAND_SETFILEINFORMATION = 10,
	COMMAND_DOSACTION = 11
};



// Write to the log
void WriteLog( char* message, char* pInfo )
{
	char temp = 0;
	int maxSize = 256;
	if ( pLogPath != NULL )
	{
		FString* pTemp = FStringAllocFromString( message );
		if ( pInfo != NULL )
		{
			if ( strlen( pInfo ) > maxSize )
			{
				temp = *( pInfo + maxSize );
				*( pInfo + maxSize ) = 0;
			}
			FStringAppendString( pTemp, pInfo );
			if ( temp != 0 )
			{
				*( pInfo + maxSize ) = temp;
			}
		}
		FStringAppendString( pTemp, "\n" );
		FStringFWriteToFile( pTemp, pLogPath->pString, "a" );
		FStringFree( pTemp );
	}
}
void WriteLogNumber( char* message, int number )
{
	if ( pLogPath != NULL )
	{
		FString* pTemp = FStringAllocFromString( message );
		char buffer[ 64 ];
		sprintf( buffer, "%d", number );
		FStringAppendString( pTemp, buffer );
		FStringAppendString( pTemp, "\n" );
		FStringFWriteToFile( pTemp, pLogPath->pString, "a" );
		FStringFree( pTemp );
	}
}

// Retrieve a message from stdin (comes from the extension)
int getMessages( FString* pResponse )
{
	char bInLength[ 4 ];
	read( 0, bInLength, 4 ); // 0 is stdin
	unsigned int inLength = *(unsigned int *)bInLength;
	
	FStringSetBufferSize( pResponse, inLength + 1 );
	char* pString = pResponse->pString;
	read( 0, pString, inLength );
	pString[ inLength ] = '\0'; 
	WriteLog( ">>> Received: ", pString );
	return inLength;
}

// Send a message to the extension
void sendMessage( char* pMessage )
{
	char* outMessage = pMessage;
	unsigned int outLength = strlen( pMessage );
	char *bOutLength = (char *)&outLength;
	write( 1, bOutLength, 4 ); // 1 is stdout
	write( 1, outMessage, outLength );
	fflush( stdout );
	WriteLog( ">>> Sent message: ", outMessage );
}

// Cleans the JSON code (removes \")
void CleanJSON( char* pDestination, char* pJSON )
{
	int count;
	char c;
	char* pDest = pDestination;
	int len = strlen( pJSON );
	for ( count = 0; count < len; count++ )
	{
		c = pJSON[ count ];
		if ( c == '\\' && pJSON[ count + 1 ] == '"' )
		{
			*(pDest++) = '"';
			count++;
		}
		else
			*(pDest++) = c;
	}
}

// Extract the value of a string from the JSON and copies it in a buffer
BOOL GetJSONString( char* pDestination, char* pJSON, char* pKeyword )
{
	// Makes the keyword search
	char keywordBuffer[ 256 ];
	char* ptr = keywordBuffer;
	*(ptr++) = '"';
	strcpy( ptr, pKeyword );
	ptr += strlen( pKeyword );
	*(ptr++) = '"';
	*(ptr++) = ':';
	*ptr = 0;

	char* pKey = strstr( pJSON, keywordBuffer );
	if ( pKey != NULL )
	{
		pKey += strlen( keywordBuffer );
		char* pStart = strchr( pKey, '"' );
		if ( pStart != NULL )
		{
			pStart++;
			char* pEnd = strchr( pStart, '"' );
			if ( pEnd != NULL )
			{
				ptr = pDestination;
				for ( ; pStart < pEnd; pStart++ )
					*(ptr++) = *pStart;
				*ptr = 0;
				return TRUE;
			}
		}
	}
	return FALSE;
}

// Extract a string and copies it in an allocated memory zone
char* GetJSONStringAlloc( char* pJSON, char* pKeyword )
{
	// Makes the keyword search
	char keywordBuffer[ 256 ];
	strcpy( keywordBuffer, "\"" );
	strcat( keywordBuffer, pKeyword );
	strcat( keywordBuffer, "\":" );
	char* pKey = strstr( pJSON, keywordBuffer );
	if ( pKey != NULL )
	{
		pKey += strlen( keywordBuffer );
		char* pStart = strchr( pKey, '"' );
		if ( pStart != NULL )
		{

			pStart++;
			char* pEnd = strchr( pStart, '"' );
			if ( pEnd != NULL )
			{
				int length = ( int )( ( unsigned char* )pEnd - ( unsigned char* )pStart );
				char* pResponse = ( char* )malloc( length + 1 );
				if ( pResponse != NULL )
				{
					memcpy( pResponse, pStart, length );
					pResponse[ length ] = 0;
					return pResponse;
				}
			}
		}
	}
	return NULL;
}

// Extract a number from JSON
int GetJSONNumber( char* pJSON, char* pKeyword )
{
	// Makes the keyword search
	char keywordBuffer[ 256 ];
	strcpy( keywordBuffer, "\"" );
	strcat( keywordBuffer, pKeyword );
	strcat( keywordBuffer, "\":" );

	char* pKey = strstr( pJSON, keywordBuffer );
	if ( pKey != NULL )
	{
		pKey += strlen( keywordBuffer );
		int number = atoi( pKey );
		return number;
	}
	return ILLEGAL_NUMBER;
}

// Converts a command to its number
int GetCommandNumber( char* pCommand )
{
	int c;
	for ( c = 0; c < MAX_COMMANDS; c++ )
	{
		if ( strcmp( pCommand, commands[ c ] ) == 0 )
			return c;
	}
	return -1;
}

// Converts Friend path (with ':') to Linux path
BOOL ConvertFriendPathToLocalPath( char* pDestination, char* pFriendPath )
{
	char* pSemiColumn = strchr( pFriendPath, ':' );
	if ( pSemiColumn != NULL )
	{
		strcpy( pDestination, "/" );

		*pSemiColumn = 0;
		if ( strcmp( pFriendPath, "home" ) == 0 )
		{
			strcat( pDestination, "home/" );
			strcat( pDestination, username );
			strcat( pDestination, "/" );
			strcat( pDestination, pSemiColumn + 1 );
		}
		else
		{
			*pSemiColumn = '/';
			strcat( pDestination, pFriendPath );
		}		
		*pSemiColumn = ':';					// Restore string in parent!
		WriteLog( "Converted Friend path to local path: ", pDestination );
		return TRUE;
	}
	else
	{
		strcpy( pDestination, pFriendPath );
	}
	return FALSE;
}

// Converts Linux path to Friend path
BOOL ConvertLocalPathToFriendPath( char* pDestination, char* pLocalPath )
{
	if ( pLocalPath[ 0 ] == '/' )
	{
		char* pFirstSlash = &pLocalPath[ 1 ];
		char* pSecondSlash = strchr( pFirstSlash + 1, '/' ); 
		if ( pSecondSlash != NULL )
		{
			*pSecondSlash = 0;
			if ( strcmp( pFirstSlash + 1, "home") == 0 )
			{
				strcpy( pDestination, pFirstSlash + 1 );
				strcat( pDestination, ":" );

				// Skip the user name
				char* pThirdSlash = strchr( pSecondSlash + 1, '/' );

				// Copy the rest of the path
				strcat( pDestination, pThirdSlash + 1 );
			}
			else
			{
				strcpy( pDestination, pFirstSlash + 1 );
				strcat( pDestination, ":" );
				strcat( pDestination, pSecondSlash + 1 );
			}
			*pSecondSlash = '/';
			WriteLog( "Converted local path to Friend path: ", pDestination );
			return TRUE;
		}
	}
	WriteLog( "ERROR - Illegal localPath: ", pLocalPath );
	return FALSE;
}

// Free the memory zone used to get the directory
void FreeFiles()
{
	int f;
	if ( pFiles != NULL )
	{
		for ( f = 0; f < fileCount; f++ )
		{
			FileInfo* pFile = pFiles[ f ];
			if ( pFile->pFilename != NULL )
				FStringFree( pFile->pFilename );
			if ( pFile->pPath != NULL )
				FStringFree( pFile->pPath );
			free( pFile );
			pFiles[ f ] = NULL;
		}
		free( pFiles );
		pFiles = NULL;
		fileCount = 0;
	}
}

// Alloc memory for getDirectory
BOOL AllocFiles( int maxFiles )
{
	if ( pFiles != NULL )
		FreeFiles();
	pFiles = (FileInfo**)malloc( maxFiles * sizeof( FileInfo* ) );
	fileCount = 0;
	return pFiles != NULL;
}

// Filters the files and store them in an array
int FilterFiles( const struct dirent *entry )
{
	int i;
	struct stat s;

	if ( strcmp( (char*)entry->d_name, "." ) != 0 && strcmp( (char*)entry->d_name, ".." ) != 0  )
	{
		if( stat( entry->d_name, &s ) == 0 )
		{		
			FileInfo* pFileInfo = ( FileInfo* )malloc( sizeof( FileInfo ) );
			pFileInfo->pFilename = FStringAllocFromString( (char*)entry->d_name );
			pFileInfo->pPath = FStringAllocFromFString( pCurrentFriendPath );
			pFileInfo->aTime = s.st_atime;
			pFileInfo->mTime = s.st_mtime;
			pFileInfo->cTime = s.st_ctime;
			if( s.st_mode & S_IFDIR )
			{
				pFileInfo->bDirectory = TRUE;
				pFileInfo->length = 0;
			}
			else
			{
				pFileInfo->bDirectory = FALSE;
				pFileInfo->length = s.st_size;
			}
			pFiles[ fileCount++ ] = pFileInfo;
		}
	}
	return 0;
}

// Convert binary data to base64
static const char base64_table[65] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
char* ConvertToBase64( const unsigned char *src, int* pLen )
{
    char* pos;
	char* out;
    const unsigned char *end, *in;

    size_t olen;
	int len = *pLen;
    olen = 4*((len + 2) / 3); /* 3-byte blocks to 4-byte */
    if (olen < len)
        return NULL;
	
	out = ( char* )malloc( olen + 1 );
	if ( out != NULL )
	{
		end = src + len;
		in = src;
		pos = out;
		while ( end - in >= 3 ) 
		{
			*pos++ = base64_table[in[0] >> 2];
			*pos++ = base64_table[((in[0] & 0x03) << 4) | (in[1] >> 4)];
			*pos++ = base64_table[((in[1] & 0x0f) << 2) | (in[2] >> 6)];
			*pos++ = base64_table[in[2] & 0x3f];
			in += 3;
		}
		if (end - in) 
		{
			*pos++ = base64_table[in[0] >> 2];
			if (end - in == 1) 
			{
				*pos++ = base64_table[(in[0] & 0x03) << 4];
				*pos++ = '=';
			}
			else 
			{
				*pos++ = base64_table[((in[0] & 0x03) << 4) |	(in[1] >> 4)];
				*pos++ = base64_table[(in[1] & 0x0f) << 2];
			}
			*pos++ = '=';
		}
		*pos = 0;
		*pLen = ( int )( ( unsigned char* )pos - ( unsigned char* )out );
		return out;
	}
	return NULL;
}

// Convert base64 to binary data
static const int B64index[256] = { 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 62, 63, 62, 62, 63, 52, 53, 54, 55,
56, 57, 58, 59, 60, 61,  0,  0,  0,  0,  0,  0,  0,  0,  1,  2,  3,  4,  5,  6,
7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,  0,
0,  0,  0, 63,  0, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51 };
unsigned char* ConvertToBinary( const char* data, int* pLen )
{
    unsigned char* p = (unsigned char*)data;
	int len = *pLen;
    int pad = len > 0 && (len % 4 || p[len - 1] == '=');
    const size_t L = ((len + 3) / 4 - pad) * 4;
	const size_t length = L / 4 * 3 + pad;
	unsigned char* pDestination = ( unsigned char* )malloc( length );
	size_t j = 0;
	if ( pDestination != NULL )
	{
		for ( size_t i = 0; i < L; i += 4 )
		{
			int n = B64index[p[i]] << 18 | B64index[p[i + 1]] << 12 | B64index[p[i + 2]] << 6 | B64index[p[i + 3]];
			pDestination[j++] = n >> 16;
			pDestination[j++] = n >> 8 & 0xFF;
			pDestination[j++] = n & 0xFF;
		}
		if (pad)
		{
			int n = B64index[p[L]] << 18 | B64index[p[L + 1]] << 12;
			pDestination[j - 1] = n >> 16;
			if (len > L + 2 && p[L + 2] != '=')
			{
				n |= B64index[p[L + 2]] << 6;
				pDestination[j++] = (n >> 8 & 0xFF);
			}
		}
		*( pLen ) = j;
		return pDestination;
	}
    return NULL;
}

// Returns the list of mounted drives
void GetDrives()
{
	strcpy( pMessageBuffer, "{ \"command\":\"getDrivesResponse\", " );
	strcat( pMessageBuffer, "\"identifier\":\"" );
	strcat( pMessageBuffer, identifierBuffer );
	strcat( pMessageBuffer, "\", \"drives\":" );
	strcat( pMessageBuffer, "[" );
	strcat( pMessageBuffer, "\"home\"" );
	strcat( pMessageBuffer, "]" );
	strcat( pMessageBuffer, "}" );
	WriteLog( ">>> Response: ", pMessageBuffer );
	sendMessage( pMessageBuffer );
}

//
// Read / Write operations
///////////////////////////////////////////////////////////////////////
int NumberOfChunksRead;
int NumberOfChunksWrite;
int ChunkSizeRead;
int ChunkSizeWrite;
int TotalSizeRead;
int TotalSizeWrite;
int LoadedChunksRead;
int LoadedChunksWrite;
char* PBase64Write;
char* PBase64Read;
FString* pWritePath;
int Base64LengthRead;
int Base64LengthWrite;
#define CHECKSUM_LENGTH 32			// 2 integers!
char Base64ChecksumRead[ CHECKSUM_LENGTH ];
char Base64ChecksumWrite[ CHECKSUM_LENGTH ];
BOOL* PChunkMapRead = NULL;
BOOL* PChunkMapWrite = NULL;
char* GetChecksum( char* pDestination, char* pData, int size )
{
	int count;
	unsigned int sum = 0;
	unsigned char* ptr = ( unsigned char* )pData;
	for ( count = 0; count < size - 4; count++ )
	{
		sum += ( ( ptr[ count ] << 24 ) | ( ptr[ count + 1 ] << 16 ) | ( ptr[ count + 2 ] << 8 ) | ptr[ count + 3 ] );
		ptr++;
	}
	for ( ; count < size; count++ )
	{
		sum += ptr[ count ];
		ptr++;
	}
	sprintf( pDestination, "%u|%d", sum, size );
	return pDestination;
}

// Start the process of writing a file to disc
void WriteFile( char* path, int numberOfChunks, int chunkSize, int totalSize, char* pEncoding )
{
	PChunkMapWrite = NULL;
	PBase64Write = NULL;
	pWritePath = NULL;
	char* pError = "ERROR - Illegal encoding.";
	if ( strcmp( pEncoding, "base64" ) == 0 )
	{
		char pathBuffer[ 1024 ];
		ConvertFriendPathToLocalPath( pathBuffer, path );
		FStringSetString( pCurrentPath, pathBuffer );
		FStringSetString( pCurrentFriendPath, path );

		NumberOfChunksWrite = numberOfChunks;
		ChunkSizeWrite = chunkSize;
		TotalSizeWrite = totalSize;
		LoadedChunksWrite = 0;
		pWritePath = FStringAllocFromString( pathBuffer );
		pError = "ERROR - Out of memory.";
		PBase64Write = ( char* )malloc( TotalSizeWrite );
		if ( PBase64Write != NULL )
		{
			// Alloc chunk map
			PChunkMapWrite = ( BOOL* )malloc( NumberOfChunksWrite * sizeof( BOOL ) );
			if ( PChunkMapWrite != NULL )
			{
				for ( int c = 0; c < NumberOfChunksWrite; c++ )
					PChunkMapWrite[ c ] = FALSE;

				// Send initial message
				char* pText = pMessageBuffer;
				pText += sprintf( pText, "{ " );
				pText += sprintf( pText, "\"command\":\"writeFileResponse\", " );
				pText += sprintf( pText, "\"identifier\":\"%s\"", identifierBuffer );
				pText += sprintf( pText, "} " );
				WriteLog( ">>> Response: ", pMessageBuffer );
				sendMessage( pMessageBuffer );
				return;
			}
		}
	}

	// Error!
	if ( PBase64Write != NULL )
		free( PBase64Write );
	if ( PChunkMapWrite != NULL )
		free( PChunkMapWrite );		
	if ( pWritePath != NULL )
		FStringFree( pWritePath );
	char* pText = pMessageBuffer;
	pText += sprintf( pText, "{ " );
	pText += sprintf( pText, "\"command\":\"writeFileError\", " );
	pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
	pText += sprintf( pText, "\"error\":\"%s\"", pError );
	pText += sprintf( pText, "} " );
	WriteLog( ">>> Response: ", pMessageBuffer );
	sendMessage( pMessageBuffer );	
}

// Store each chunk and write the file when all are there
void WriteFileChunk( int number, int size, char* pChunk )
{
	memcpy( &PBase64Write[ number * ChunkSizeWrite ], pChunk, size );

	// The last chunk?
	BOOL done = TRUE;
	PChunkMapWrite[ number ] = TRUE;
	for ( int c = 0; c < NumberOfChunksWrite; c++ )
	{
		if ( !PChunkMapWrite[ c ] )
		{
			done = FALSE;
			break;
		}
	}
	BOOL OK = FALSE;
	char* pError = "ERROR - Cannot write file.";
	if ( done )
	{
		WriteLog( "WriteFile end!", NULL );

		int size = TotalSizeWrite;
		char* pDestination = ConvertToBinary( PBase64Write, &size );
		if ( pDestination != NULL )
		{
			int fileLength = size;
			FILE* fd = fopen( pWritePath->pString, "w" );
			if ( fd != NULL )
			{
				if ( fwrite( pDestination, 1, (size_t)fileLength, fd ) == (size_t)fileLength )
				{
					// Send end message
					char* pText = pMessageBuffer;
					pText += sprintf( pText, "{ " );
					pText += sprintf( pText, "\"command\":\"writeFileChunkEnd\", " );
					pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
					pText += sprintf( pText, "\"fileLength\":%d", fileLength );
					pText += sprintf( pText, "} " );
					WriteLog( ">>> Response: ", pMessageBuffer );
					sendMessage( pMessageBuffer );

					OK = TRUE;
				}
				fclose( fd );
			}
			free( pDestination );
		}
		free( PBase64Write );
		free( PChunkMapWrite );
		FStringFree( pWritePath );
	}
	else
	{
		// Send acknoledgement
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"writeFileChunkResponse\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\"", identifierBuffer );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
		OK = TRUE;
	}
	if ( !OK )
	{
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"writeFileChunkError\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
		pText += sprintf( pText, "\"error\":\"%s\"", pError );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
	}
}

// Starts the process of reading a file
void ReadFile( char *path, char* pMode )
{
	char pathBuffer[ 1024 ];
	ConvertFriendPathToLocalPath( pathBuffer, path );
	FStringSetString( pCurrentPath, pathBuffer );
	FStringSetString( pCurrentFriendPath, path );

	// Load the file
	struct stat st;
	char* pFile;
	BOOL OK = FALSE;
	char* pError = "ERROR - File not found.";
	if ( stat( pathBuffer, &st ) == 0 )
	{
		int fileLength = ( int )st.st_size;
		WriteLog( "Opening: ", pathBuffer );
		FILE* fd = fopen( pathBuffer, "r" );
		if ( fd != NULL )
		{
			WriteLogNumber( "Filesize: ", fileLength );
			pError = "ERROR - Out of memory.";
			char* pFile = ( char * )malloc( ( size_t )( fileLength + 1 ) );
			if ( pFile != NULL )
			{
				pError = "ERROR - Cannot read file.";
				if ( fread( pFile, 1, (size_t)fileLength, fd ) == (size_t)fileLength )
				{
					int size = fileLength;
					pError = "ERROR - Out of memory.";
					WriteLog( "Convert to base64", NULL );
					PBase64Read = ConvertToBase64( pFile, &size );
					Base64LengthRead = size;
					WriteLogNumber( "Conversion result: ", size );
					//GetChecksum( Base64ChecksumRead, PBase64Read, size );
					//WriteLog( "Checksum: ", Base64ChecksumRead );
					strcpy( Base64ChecksumRead, "Youpi!" );
					if ( PBase64Read != NULL )
					{
						// How many chunks?
						NumberOfChunksRead = Base64LengthRead / CHUNK_SIZE;
						if ( NumberOfChunksRead * CHUNK_SIZE < Base64LengthRead )
							NumberOfChunksRead++;

						// Alloc chunk map
						PChunkMapRead = ( BOOL* )malloc( NumberOfChunksRead * sizeof( BOOL ) );
						for ( int c = 0; c < NumberOfChunksRead; c++ )
							PChunkMapRead[ c ] = FALSE;

						// Send initial message
						char* pText = pMessageBuffer;
						pText += sprintf( pText, "{ " );
						pText += sprintf( pText, "\"command\":\"readFileResponse\", " );
						pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
						pText += sprintf( pText, "\"totalChunks\":%d, ", NumberOfChunksRead );
						pText += sprintf( pText, "\"sizeChunk\":%d, ", CHUNK_SIZE );
						pText += sprintf( pText, "\"encoding\":\"%s\", ", "base64" );
						pText += sprintf( pText, "\"base64Length\":%d, ", Base64LengthRead );
						pText += sprintf( pText, "\"fileLength\":%d, ", fileLength );
						pText += sprintf( pText, "\"checksum\":\"%s\" ", Base64ChecksumRead );
						pText += sprintf( pText, "} " );
						WriteLog( ">>> Response: ", pMessageBuffer );
						sendMessage( pMessageBuffer );
						OK = TRUE;
					}
				}
				free( pFile );
			}
			fclose( fd );
		}
	}
	if ( !OK )
	{
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"readFileError\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
		pText += sprintf( pText, "\"error\":\"%s\"", pError );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
	}
}

// Read the file, cut it in chunks, and send the chunks to Friend
void GetFileChunk( int number )
{		
	BOOL OK = FALSE;
	char* pError;
	pError = "ERROR - readFile message not sent before.";
	if ( PBase64Read != NULL )
	{
		int size;
		int position = number * CHUNK_SIZE;
		size = CHUNK_SIZE;
		if ( position + size > Base64LengthRead )
			size = Base64LengthRead - position;
		if ( size > 0 )
		{
			char* pStart = PBase64Read + position;
			char* pEnd = pStart + size;
			char temp = *pEnd;

			*( pEnd ) = 0;
			char* pText = pMessageBuffer;
			pText += sprintf( pText, "{ " );
			pText += sprintf( pText, "\"command\":\"getFileChunkResponse\", " );
			pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
			pText += sprintf( pText, "\"number\":%d, ", number );
			pText += sprintf( pText, "\"size\":%d, ", size );
			pText += sprintf( pText, "\"data\":\"%s\"", pStart );
			pText += sprintf( pText, "} " );
			*( pEnd ) = temp;

			WriteLog( ">>> Response: ", pMessageBuffer );
			sendMessage( pMessageBuffer );

			// The last chunk?
			BOOL done = TRUE;
			PChunkMapRead[ number ] = TRUE;
			for ( int c = 0; c < NumberOfChunksRead; c++ )
			{
				if ( !PChunkMapRead[ c ] )
				{
					done = FALSE;
					break;
				}
			}
			if ( done )
			{
				WriteLog( "ReadFile end!", NULL );
				free( PBase64Read );
				free( PChunkMapRead );
			}
			OK = TRUE;
		}
	}	
	if ( !OK )
	{
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"getFileChunkError\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
		pText += sprintf( pText, "\"error\":\"%s\"", pError );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
	}
}

// Retreives the content of a directory
void GetDirectory( char* path )
{
	if ( AllocFiles( MAX_FILES ) )
	{
		char pathBuffer[ 1024 ];
		struct dirent **namelist;
		ConvertFriendPathToLocalPath( pathBuffer, path );
		FStringSetString( pCurrentPath, pathBuffer );
		FStringSetString( pCurrentFriendPath, path );

		chdir( pathBuffer );
		scandir( ".", &namelist, FilterFiles, alphasort );
		free( namelist );
		chdir( pDefaultPath->pString );

		int f;
		char temp[ 256 ];
		struct tm* time;
		strcpy( pMessageBuffer, "{ \"command\":\"getDirectoryResponse\", " );
		strcat( pMessageBuffer, "\"identifier\":\"" );
		strcat( pMessageBuffer, identifierBuffer );
		strcat( pMessageBuffer, "\", \"files\":" );
		strcat( pMessageBuffer, "[" );
		sprintf( temp, "%d", fileCount );
		for ( f = 0; f < fileCount; f++ )
		{
			FileInfo* pFileInfo = pFiles[ f ];

			if ( f > 0 )
				strcat( pMessageBuffer, ", " );
			strcat( pMessageBuffer, "{" );
			strcat( pMessageBuffer, "\"name\":\"" );
			strcat( pMessageBuffer, pFileInfo->pFilename->pString );
			strcat( pMessageBuffer, "\", \"path\":\"" );
			strcat( pMessageBuffer, pFileInfo->pPath->pString );
			strcat( pMessageBuffer, "\", \"length\":" );
			sprintf( temp, "%d", pFileInfo->length );
			strcat( pMessageBuffer, temp );
			strcat( pMessageBuffer, ", \"atime\":\"" );
			time = gmtime( &pFileInfo->aTime );
			strftime( temp, 32, "%Y-%m-%d %H:%M:%S", time );
			strcat( pMessageBuffer, temp );
			strcat( pMessageBuffer, "\", \"mtime\":\"" );
			time = gmtime( &pFileInfo->mTime );
			strftime( temp, 32, "%Y-%m-%d %H:%M:%S", time );
			strcat( pMessageBuffer, temp );
			strcat( pMessageBuffer, "\", \"ctime\":\"" );
			time = gmtime( &pFileInfo->cTime );
			strftime( temp, 32, "%Y-%m-%d %H:%M:%S", time );
			strcat( pMessageBuffer, temp );
			strcat( pMessageBuffer, "\", \"isDirectory\":" );
			if ( pFileInfo->bDirectory )
				strcat( pMessageBuffer, "1 " );
			else
				strcat( pMessageBuffer, "0 " );
			strcat( pMessageBuffer, "}" );
		}
		strcat( pMessageBuffer, " ]" );
		strcat( pMessageBuffer, " }" );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
		FreeFiles();
	}
}

// Return information about the user and his session
void GetInfos()
{
	strcpy( pMessageBuffer, "{ \"command\":\"getInfosResponse\", " );
	strcat( pMessageBuffer, "\"identifier\":\"" );
	strcat( pMessageBuffer, identifierBuffer );
	strcat( pMessageBuffer, "\", \"username\":\"" );
	strcat( pMessageBuffer, username );
	strcat( pMessageBuffer, "\", \"hostname\":\"" );
	strcat( pMessageBuffer, hostname );
	strcat( pMessageBuffer, "\"" );
	strcat( pMessageBuffer, "}" );
	WriteLog( ">>> Response: ", pMessageBuffer );
	sendMessage( pMessageBuffer );
}

// Warm initialisation
void Init()
{
	strcpy( pMessageBuffer, "{ \"command\":\"initResponse\", " );
	strcat( pMessageBuffer, "\"identifier\":\"" );
	strcat( pMessageBuffer, identifierBuffer );
	strcat( pMessageBuffer, "\", \"status\":\"ready\"" );
	strcat( pMessageBuffer, "}" );
	WriteLog( ">>> Response: ", pMessageBuffer );
	sendMessage( pMessageBuffer );
}

// Returns information about a file
void GetFileInformation( char* path )
{
	char pathBuffer[ 1024 ];
	ConvertFriendPathToLocalPath( pathBuffer, path );
	FStringSetString( pCurrentPath, pathBuffer );
	FStringSetString( pCurrentFriendPath, path );

	WriteLog( "GetFileInformation ", pathBuffer );
    struct stat st;
    char *modeval = malloc(sizeof(char) * 9 + 1);
    if( stat( pathBuffer, &st ) == 0 )
	{
		char user[ 6 ];
		char group[ 6 ];
		char others[ 6 ];
        mode_t perm = st.st_mode;
        user[ 0 ] = '-';
        user[ 1 ] = ( perm & S_IRUSR ) ? 'r' : '-';
        user[ 2 ] = ( perm & S_IWUSR ) ? 'w' : '-';
        user[ 3 ] = ( perm & S_IXUSR ) ? 'e' : '-';
        user[ 4 ] = 'd';
        user[ 5 ] = '\0';
        group[ 0 ] = '-';
        group[ 1 ] = ( perm & S_IRGRP ) ? 'r' : '-';
        group[ 2 ] = ( perm & S_IWGRP ) ? 'w' : '-';
        group[ 3 ] = ( perm & S_IXGRP ) ? 'e' : '-';
        group[ 4 ] = 'd';
        group[ 5 ] = '\0';
        others[ 0 ] = '-';
        others[ 1 ] = ( perm & S_IROTH ) ? 'r' : '-';
        others[ 2 ] = ( perm & S_IWOTH ) ? 'w' : '-';
        others[ 3 ] = ( perm & S_IXOTH ) ? 'e' : '-';
        others[ 4 ] = 'd';
        others[ 5 ] = '\0';
		struct passwd *pw = getpwuid( st.st_uid );
    	struct group  *gr = getgrgid( st.st_gid );

		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"getFileInformationResponse\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
		pText += sprintf( pText, "\"permissions\":" );
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"user\":\"%s\", ", user );
		pText += sprintf( pText, "\"group\":\"%s\", ", group );
		pText += sprintf( pText, "\"others\":\"%s\"", others );
		pText += sprintf( pText, "}" );
		pText += sprintf( pText, "\"user\":\"%s\" ", pw->pw_name );
		pText += sprintf( pText, "\"group\":\"%s\"", gr->gr_name );
		pText += sprintf( pText, "}" );
	}
}

// Set a file information
void SetFileInformation( char* path, char* pInformation )
{
	char* pText = pMessageBuffer;
	pText += sprintf( pText, "{ " );
	pText += sprintf( pText, "\"command\":\"setFileInformationError\", " );
	pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
	pText += sprintf( pText, "\"error\":\"%s\"", "ERROR - Function not implemented." );
	pText += sprintf( pText, "} " );
	WriteLog( ">>> Response: ", pMessageBuffer );
	sendMessage( pMessageBuffer );
}

// Performs a DOS Action
void DosAction( char* pAction, char* arg0, char* arg1, char* arg2, char* arg3 )
{
	char pathBuffer0[ 1024 ];
	char pathBuffer1[ 1024 ];
	char pathBuffer2[ 1024 ];
	char pathBuffer3[ 1024 ];
	
	BOOL OK = FALSE;
	char* pError = "ERROR - Command not implemented.";

	// Rename
	if ( strcmp( pAction, "rename" ) == 0 )
	{
		ConvertFriendPathToLocalPath( pathBuffer0, arg0 );
		ConvertFriendPathToLocalPath( pathBuffer1, arg1 );
		WriteLog( "Rename ", pathBuffer0 );
		WriteLog( "    to ", pathBuffer1 );
		pError = "ERROR - Cannot rename file.";
		if ( rename( pathBuffer0, pathBuffer1 ) == 0 )
			OK = TRUE;
	}
	else if ( strcmp( pAction, "delete" ) == 0 )
	{
		ConvertFriendPathToLocalPath( pathBuffer0, arg0 );
		WriteLog( "Delete ", pathBuffer0 );
		pError = "ERROR - Cannot delete file.";
		if ( remove( pathBuffer0 ) == 0 )
			OK = TRUE;
	}
	else if ( strcmp( pAction, "makedir" ) == 0 )
	{
		ConvertFriendPathToLocalPath( pathBuffer0, arg0 );
		WriteLog( "Makedir ", pathBuffer0 );
		pError = "ERROR - Cannot create directory.";
		if ( mkdir( pathBuffer0, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH ) == 0 )
			OK = TRUE;
	}
	else if ( strcmp( pAction, "info" ) == 0 )
	{
	}
	else if ( strcmp( pAction, "protect" ) == 0 )
	{
	}
	else if ( strcmp( pAction, "metainfo" ) == 0 )
	{
	}
	else if ( strcmp( pAction, "link" ) == 0 )
	{
	}
	if ( OK )
	{
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"dosActionResponse\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\"", identifierBuffer );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
	}
	else
	{
		char* pText = pMessageBuffer;
		pText += sprintf( pText, "{ " );
		pText += sprintf( pText, "\"command\":\"dosActionError\", " );
		pText += sprintf( pText, "\"identifier\":\"%s\", ", identifierBuffer );
		pText += sprintf( pText, "\"action\":\"%s\", ", pAction );
		pText += sprintf( pText, "\"error\":\"%s\"", pError );
		pText += sprintf( pText, "} " );
		WriteLog( ">>> Response: ", pMessageBuffer );
		sendMessage( pMessageBuffer );
	}
}

// Main entry
int main( int argc, char *argv[] )
{
	char* pJsonBuffer = NULL;
	FString* pMessage = NULL;
	char* pError;
	while( TRUE )
	{
		// Alloc the log
		pError = "ERROR - Out of memory.";
		pLogPath = FStringAllocFromCurrentDir();
		if ( pLogPath == NULL )	break;
		FStringAppendFilename( pLogPath, "friend.log" );
		FStringWriteToFile( "Friend helper application log\n----------------------------------------------------------\n", pLogPath->pString, "w" );
		WriteLog( "By Francois Lionet", NULL );
		WriteLog( "Copyright (c) 2014 - 2018 Friend Software Labs AS", NULL );
		WriteLog( "--", NULL );

		// Alloc various components
		pFiles = (FileInfo**)malloc( sizeof( FileInfo*) * MAX_FILES );
		if ( pFiles == NULL ) break;
		pJsonBuffer = (char*)malloc( MAX_MESSAGE_SIZE );
		if ( pJsonBuffer == NULL ) break;
		pMessageBuffer = (char*)malloc( MAX_MESSAGE_SIZE );
		if ( pMessageBuffer == NULL ) break;
		pCurrentPath = FStringAlloc( FSTRINGTYPE_ASCII );
		if ( pCurrentPath == NULL ) break;
		pCurrentFriendPath = FStringAlloc( FSTRINGTYPE_ASCII );
		if ( pCurrentFriendPath == NULL ) break;
		pDefaultPath = FStringAllocFromCurrentDir();
		if ( pDefaultPath == NULL ) break;
		pMessage = FStringAlloc( FSTRINGTYPE_ASCII );
		if ( pMessage == NULL ) break;

		// Get user name
		gethostname( hostname, HOST_NAME_MAX );
		getlogin_r( username, LOGIN_NAME_MAX );

		// Send 'ready' message
		char* pTemp;
		pTemp = "{ \"command\": \"ready\" }";
		WriteLog( ">>> Response: ", pTemp );
		sendMessage( pTemp );

		// Wait for messages
		BOOL bExit = FALSE;
		char commandBuffer[ 1024 ];
		while( bExit == FALSE )
		{
			int length = getMessages( pMessage );
			if ( length > 0 )
			{
				// Parse JSON
				CleanJSON( pJsonBuffer, pMessage->pString );
				if ( GetJSONString( commandBuffer, pJsonBuffer, "command" ) )
				{
					int commandNumber = GetCommandNumber( commandBuffer );
					if ( commandNumber >= 0 )
					{
						GetJSONString( identifierBuffer, pJsonBuffer, "identifier" );
						WriteLog( "Command received: ", commands[ commandNumber ] );
						WriteLog( "Identifier", identifierBuffer );

						char* path = commandBuffer;
						char buffer[ 256 ];
						int number, size, numberOfChunks, chunkSize, totalSize;
						char* pData;
						char* pArg0;
						char* pArg1;
						char* pArg2;
						char* pArg3;

						// From the command
						switch( commandNumber )
						{ 
							case COMMAND_INIT:
								Init();
								break;
							case COMMAND_GETINFOS:
								GetInfos();
								break;
							case COMMAND_GETDRIVES:
								GetDrives();
								break;
							case COMMAND_GETDIRECTORY:
								GetJSONString( path, pJsonBuffer, "path" );
								GetDirectory( path );
								break;
							case COMMAND_EXIT:
								bExit = TRUE;
								break;
							case COMMAND_GETFILEINFORMATION:
								GetJSONString( path, pJsonBuffer, "path" );
								GetFileInformation( path );
								break;
							case COMMAND_SETFILEINFORMATION:
								GetJSONString( path, pJsonBuffer, "path" );
								GetJSONString( buffer, pJsonBuffer, "information" );
								SetFileInformation( path, buffer );
								break;
							case COMMAND_READFILE:
								GetJSONString( path, pJsonBuffer, "path" );
								GetJSONString( buffer, pJsonBuffer, "mode" );
								ReadFile( path, buffer );
								break;
							case COMMAND_GETFILECHUNK:
								number = GetJSONNumber( pJsonBuffer, "number" );
								GetFileChunk( number );
								break;
							case COMMAND_WRITEFILE:
								GetJSONString( path, pJsonBuffer, "path" );
								numberOfChunks = GetJSONNumber( pJsonBuffer, "numberOfChunks" );
								chunkSize = GetJSONNumber( pJsonBuffer, "chunkSize" );
								totalSize = GetJSONNumber( pJsonBuffer, "totalSize" );
								GetJSONString( buffer, pJsonBuffer, "encoding" );
								WriteFile( path, numberOfChunks, chunkSize, totalSize, buffer );
								break;
							case COMMAND_WRITEFILECHUNK:
								number = GetJSONNumber( pJsonBuffer, "number" );
								size = GetJSONNumber( pJsonBuffer, "size" );
								pData = GetJSONStringAlloc( pJsonBuffer, "chunk" );
								if ( pData )
								{
									WriteFileChunk( number, size, pData );
									free( pData );
								}
								break;
							case COMMAND_DOSACTION:
								pArg0 = GetJSONStringAlloc( pJsonBuffer, "arg0" );
								pArg1 = GetJSONStringAlloc( pJsonBuffer, "arg1" );
								pArg2 = GetJSONStringAlloc( pJsonBuffer, "arg2" );
								pArg3 = GetJSONStringAlloc( pJsonBuffer, "arg3" );
								GetJSONString( buffer, pJsonBuffer, "action" );
								DosAction( buffer, pArg0, pArg1, pArg2, pArg3 );
								if ( pArg0 ) free( pArg0 );
								if ( pArg1 ) free( pArg1 );
								if ( pArg2 ) free( pArg2 );
								if ( pArg3 ) free( pArg3 );
								break;
							default:
								WriteLog( "ERROR - Command not handled: ", commands[ commandNumber ] );
								break;
						}
					}
					else
					{
						WriteLog( "ERROR - Command number not found!", NULL );
					}
				}
				else
				{
					WriteLog( "ERROR - Command keyword not found!", NULL );
				}
			}
		}
	}
	if ( pError != NULL )
		WriteLog( "Friend helper - ", pError );
	if ( pMessage != NULL ) FStringFree( pMessage );
	if ( pDefaultPath != NULL ) FStringFree( pDefaultPath );
	if ( pCurrentPath != NULL ) FStringFree( pCurrentPath );
	if ( pCurrentFriendPath != NULL ) FStringFree( pCurrentFriendPath );
	if ( pLogPath != NULL ) FStringFree( pLogPath );
	if ( pFiles != NULL ) free( pFiles );
	if ( pJsonBuffer != NULL ) free( pJsonBuffer );
	if ( pMessageBuffer != NULL ) free( pMessageBuffer );

	return 0;
}





