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
 *  App Session Manager
 *
 * file contain all functitons related to application sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "sas_manager.h"
#include <system/systembase.h>
#include "sas_server.h"
#include <core/functions.h>

/**
 * Create SAS Manager
 *
 * @param sb pointer to SystemBase
 * @return SASManager
 */

SASManager *SASManagerNew( void *sb )
{
	SASManager *as = NULL;
	
	if( ( as = FCalloc( 1, sizeof( SASManager ) ) ) != NULL )
	{
		as->sasm_SB = sb;
		pthread_mutex_init( &(as->sasm_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for SASManager\n");
	}
	
	return as;
}

/**
 * Delete SAS Manager
 *
 * @param asm application session to remove
 */

void SASManagerDelete( SASManager *asm )
{
	DEBUG("[AppSessionManagerGetSession] AppSessionManagerDelete\n");
	if( asm != NULL )
	{
		pthread_mutex_destroy( &(asm->sasm_Mutex) );
		
		FFree( asm );
	}
}

/**
 * Register SAS session
 *
 * @param sasm pointer to SASManager
 * @param resp respone passed as string
 * @param id id which we want to force to use
 * @return 0 when no error, otherwise error number
 */
int SASManagerRegisterSession( SASManager *sasm, BufString *resp, FULONG id )
{
	DEBUG("[SASManagerRegisterSession] ID %ld\n", id );
	
	if( FRIEND_MUTEX_LOCK( &(sasm->sasm_Mutex) ) == 0 )
	{
		SystemBase *sb = (SystemBase *)sasm->sasm_SB;
		char where[ 256 ];
		int entries = 0;
		
		//
		// We create new session, assign it to the server and return IP of the server and ID of SASSession
		//
		
		// SELECT *
		// FROM pieces
		// WHERE price =  ( SELECT MIN(price) FROM pieces ) LIMIT 1

		if( id == 0 )
		{
			strcpy( where, "Sessions=(SELECT MIN( Sessions ) FROM FSASServer) LIMIT 1" );
		}
		else
		{
			snprintf( where, sizeof( where ), "ID = (SELECT ServerID FROM FSASSession where ID=%ld )", id );
		}
	
		SASServer *server = NULL;
		
		SQLLibrary *lsqllib = sb->LibrarySQLGet( sb );
		if( lsqllib != NULL )
		{
			
			server = lsqllib->Load( lsqllib, FSASServerDesc, where, &entries );
			
			if( server != NULL )
			{
				SASSession *nsession = NULL;
				
				if( id == 0 )
				{
					DEBUG("[SASManagerRegisterSession] we have to create new sesson\n");
					nsession = SASSessionNew();
				}
				else
				{
					snprintf( where, sizeof( where ), "ID=%ld", id );
					nsession = lsqllib->Load( lsqllib, FSASSessionDesc, where, &entries );
					DEBUG("[SASManagerRegisterSession] session exist, load from DB %ld ptr %p\n", id, nsession );
				}
				
				if( nsession != NULL )
				{
					// assign server to SAS + set creation time timestamp
					if( id == 0 )
					{
						nsession->ss_ServerID = server->sass_ID;
						nsession->ss_CreationTime = time( NULL );
					
						lsqllib->Save( lsqllib, FSASSessionDesc, nsession );
					}
					
					DEBUG("[SASManagerRegisterSession] Save called\n");
					
					if( resp != NULL )
					{
						char tmp[ 256 ];
						int len = snprintf( tmp, sizeof(tmp), "\"server\":\"%s\",\"sasid\":%ld", server->sass_IP, nsession->ss_ID );
						
						BufStringAddSize( resp, tmp, len );
					}
				}
			}
			else
			{
				DEBUG("[SASManagerRegisterSession] Cannot load session with id: %d\n", id );
			}
		
			sb->LibrarySQLDrop( sb, lsqllib );
		}
		
		FRIEND_MUTEX_UNLOCK( &(sasm->sasm_Mutex) );
		
		// there are not SASServers
		
		if( server == NULL )
		{
			return 1;
		}
		else
		{
			SASServerDelete( server );
		}
	}
	
	return 0;
}

/**
 * Unregister SAS session
 *
 * @param sasm pointer to SASManager
 * @param id of SAS which will be removed
 */
void SASManagerUnregisterSession( SASManager *sasm, FULONG id )
{
	SystemBase *sb = (SystemBase *)sasm->sasm_SB;
	SQLLibrary *lsqllib = sb->LibrarySQLGet( sb );
	if( lsqllib != NULL )
	{
		char tmpQuery[ 1024 ];
		
		lsqllib->SNPrintF( lsqllib, tmpQuery, sizeof(tmpQuery), "DELETE FROM FSASSession WHERE `ID`=\"%ld\"", id );
		
		lsqllib->QueryWithoutResults(  lsqllib, tmpQuery );
		
		sb->LibrarySQLDrop( sb, lsqllib );
	}
}
