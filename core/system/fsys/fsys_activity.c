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
 *  Filesystem activity body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 28/08/2017
 */

#include "fsys_activity.h"
#include <system/systembase.h>

/**
 * Load FilesystemActivity table
 *
 * @param sb pointer to systembase
 * @param act pointer to Filesystem Activity structure
 * @param id FilesystemID
 * @param byDate set TRUE if you want to load activity by new date
 * @return success (0) or fail value (not equal to 0)
 */
int LoadFilesystemActivityDB( void *sb, FilesystemActivity *act, FULONG id, FBOOL byDate )
{
	SystemBase *l = (SystemBase *)sb;
	DEBUG("[LoadFilesystemActivityDB] id %lu\n", id );
	int errRet = 0;
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 512 ];

		if( byDate == TRUE )
		{
			snprintf( temptext, sizeof(temptext), "SELECT `ID`,`FilesystemID`,`StoredBytesLeft`,`ReadedBytesLeft`,`ToDate` FROM `FilesystemActivity` WHERE `ToDate` <> '%04d-%02d-%02d' AND `FilesystemID` = '%lu'", act->fsa_ToDate.tm_year, act->fsa_ToDate.tm_mon, act->fsa_ToDate.tm_mday, id );
		}
		else
		{
			snprintf( temptext, sizeof(temptext), "SELECT `ID`,`FilesystemID`,`StoredBytesLeft`,`ReadedBytesLeft`,`ToDate` FROM `FilesystemActivity` WHERE `FilesystemID` = '%lu'", id );
		}
		void *res = sqllib->Query( sqllib, temptext );
		if( res != NULL )
		{
			char **row;
			int j = 0;

			while( ( row = sqllib->FetchRow( sqllib, res ) ) )
			{
				if( row[ 0 ] != NULL )
				{
					char *end;
					act->fsa_ID = strtoul( (char *)row[ 0 ],  &end, 0 );
				}
				if( row[ 1 ] != NULL )
				{
					char *end;
					act->fsa_FilesystemID = strtoul( (char *)row[ 1 ],  &end, 0 );
				}
				if( row[ 2 ] != NULL )
				{
					char *end;
					act->fsa_StoredBytesLeft = strtoul( (char *)row[ 2 ],  &end, 0 );
				}
				if( row[ 3 ] != NULL )
				{
					char *end;
					act->fsa_ReadBytesLeft = strtoul( (char *)row[ 3 ],  &end, 0 );
				}
				if( row[ 4 ] != NULL )
				{
					if( sscanf( (char *)row[ 4 ], "%d-%d-%d", &(act->fsa_ToDate.tm_year), &(act->fsa_ToDate.tm_mon), &(act->fsa_ToDate.tm_mday) ) != EOF )
					{
						act->fsa_ToDate.tm_hour = act->fsa_ToDate.tm_min = act->fsa_ToDate.tm_sec = 0;
					}
				}
			}
			sqllib->FreeResult( sqllib, res );
		}

		l->LibrarySQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}

/**
 * Update FilesystemActivity table
 *
 * @param sb pointer to systembase
 * @param act pointer to Filesystem Activity structure
 * @return success (0) or fail value (not equal to 0)
 */
int UpdateFilesystemActivityDB( void *sb, FilesystemActivity *act )
{
	SystemBase *l = (SystemBase *)sb;
	
	int errRet = 0;
	
	time_t rawtime;

	time( &rawtime );
		
	if( ( act->fsa_ToDateTimeT - rawtime ) > 0 || act->fsa_StoredBytesLeft < 0 )
	{	// our current contain old information, we must update them
		LoadFilesystemActivityDB( sb, act, act->fsa_FilesystemID, TRUE );
	}
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];
		
		snprintf( temptext, sizeof(temptext), "UPDATE `FilesystemActivity` SET `StoredBytesLeft`='%ld',`ReadedBytesLeft`='%ld' WHERE `ID` = '%lu'", act->fsa_StoredBytesLeft, act->fsa_ReadBytesLeft, act->fsa_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );

		l->LibrarySQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}
