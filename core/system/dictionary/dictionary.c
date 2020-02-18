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
 * Body of  dictionary
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <stdio.h>
#include <stdlib.h>
#include <core/library.h>
#include <system/dictionary/dictionary.h>
#include <db/sqllib.h>

static const char *DefaultDictionaryMessages[] = 
{
"PID parameter is missing",
"Function not found",
"Path parameter is empty",
"sessionid or authid parameter is missing",
"Cannot execute function. Admin rights required",
"Parameters must be send by using POST method",
"Account blocked until: %lu",
"Authentication module not selected",
"Missing parameters: username,password,deviceid",
"Authentication by using publickeys is not supported",
"User session or User not found",
"User session not found",
"Missing parameters: username,deviceid",
"User not found",
"Missing parameters: %s",
"Cannot change password, error: %d",
"SQL.library not found",
"Cannot allocate memory",
"Function %s returned: %d",
"User already exist",
"Service not found or service name parameter is missing!",
"File or directory do not exist",
"Device: '%s' not found",
"Cannot open file: '%s'",
"Sentinel user access rights missing",
"Filesystem not found",
"Function %s returned empty string",
"Cannot create temporary file",
"File do not exist or its empty",
"Cannot send notification. Error %d",
"Entry with id: %lu cannot be removed",
"Cannot update notification entry. Error: %d",
"Cannot change access. Error %d",
"Cannot share file",
"Destination drive not found",
"No access to: %s",
"Module call returned empty string",
"Part %d of path is missing",
"User or device do not exist",
"Device cannot be shared. Error %d",
"Invalid user session",
"No disk name specified or disk does not exist",
"Cannot poll drive. No data in DB",
"Drive not found: %s",
"No entry in DB: %s",
"SASID not found",
"No access to variable",
"No user session in SAS",
"Cannot send message. Error %d",
"Cannot remove users",
"Cannot add users",
"Cannot create SAS",
"Cannot convert message",
"Cannot setup connection: %s",
"Cannot parse command or not existing lib was called",
"Bad user or password",
"Cannot find device by ID: %lu",
"Cannot unlock port. Error: %d",
"Printer not added. Error: %d",
"Connection created",
"Connection reused",
"FCConnection cannot be created",
"Connection not found",
"Connection deleted",
"Cannot delete connection. Internal error: %d",
"Connection with that name already exist",
"Cannot allocate memory for DOSToken",
"Cannot add token to list",
"Cannot remove token from list",
"User Group already exist",
"Bad chars used",
"No access, special rights required"
};

/**
 * Create new Dictionary
 *
 * @param mysqllib pointer to opened mysql.library
 * @return pointer to new Dictionary structure, otherwise NULL
 */
Dictionary * DictionaryNew( SQLLibrary *mysqllib )
{
	if( mysqllib == NULL )
	{
		FERROR("[DictionaryNew] Mysql.library was not opened\n");
		return NULL;
	}
	
	Dictionary *d = FCalloc( 1, sizeof( Dictionary ) );
	
	if( d != NULL )
	{
		FULONG i;
		int entry = 0;
		DictEntry *locdic = d->d_DictList = mysqllib->Load( mysqllib, DictionaryDesc, " Language='ENG' ORDER BY DictID", &(d->d_Entries) );
	
		d->d_Msg = FCalloc( DICT_MAX, sizeof(char *) );
		
		for( i = 0 ; i < DICT_MAX ; i++ )
		{
			locdic = d->d_DictList;
			char *msg = NULL;
			
			while( locdic != NULL )
			{
				if( i == locdic->de_DictID )
				{
					msg = locdic->de_Message;
				}
			
				locdic = (DictEntry *)locdic->node.mln_Succ;
			}
			
			if( msg != NULL )
			{
				d->d_Msg[ i ] = msg;
			}
			else
			{
				DEBUG("Message with ID %lu not found\n", i );
				d->d_Msg[ i ] = (char *)DefaultDictionaryMessages[ i ];
			}
		}
	}
	
	return d;
}

/**
 * Delete Dictionary
 *
 * @param d pointer to Dictionary structure which will be deleted
 */
void DictionaryDelete( Dictionary* d )
{
	//DEBUG("[DictionaryDelete] Remove dictionary from memory\n");
	if( d != NULL )
	{
		FFree( d->d_Msg );
		
		DictEntryDeleteAll( d->d_DictList );
		
		FFree( d );
	}
}

/**
 * Delete DictEntry
 *
 * @param d pointer to DictEntry structure which will be deleted
 */
void DictEntryDelete( DictEntry* d )
{
	//DEBUG("[DictionaryDelete] Remove dictionary from memory\n");
	if( d != NULL )
	{
		if( d->de_Lang != NULL )
		{
			FFree( d->de_Lang );
		}
		
		if( d->de_Message != NULL )
		{
			FFree( d->de_Message );
		}
		
		FFree( d );
	}
}

/**
 * Delete Dictionary List
 *
 * @param d pointer to DictEntry list structure which will be deleted
 */
void DictEntryDeleteAll( DictEntry* d )
{
	//DEBUG("[DictionaryDelete] Remove dictionary from memory\n");
	while( d != NULL )
	{
		DictEntry *temp = d;
		d = (DictEntry *)d->node.mln_Succ;
		
		DictEntryDelete( temp );
	}
}
