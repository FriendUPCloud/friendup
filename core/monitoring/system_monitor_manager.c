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
 * Body of System Monitor Manager
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (04/12/2020)
 */

#include "system_monitor_manager.h"
#include <util/session_id.h>
#include <system/systembase.h>

/**
 * Create SystemMonitorManager
 *
 * @param sb pointer to SystemBase
 * @return new instance of SystemMonitorManager
 */
SystemMonitorManager *SystemMonitorManagerNew( void *sb )
{
	SystemMonitorManager *smm = FCalloc( 1, sizeof( SystemMonitorManager ) );
	if( smm != NULL )
	{
		smm->smm_SB = sb;
		pthread_mutex_init( &smm->smm_Mutex, NULL );
		
		Props *prop = NULL;
		PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);
		{
			char *ptr, path[ 1024 ];
			path[ 0 ] = 0;
			
			ptr = getenv("FRIEND_HOME");
			
			if( ptr != NULL )
			{
				sprintf( path, "%scfg/cfg.ini", ptr );
			}

			prop = plib->Open( path );
			if( prop != NULL)
			{
				char *tptr  = plib->ReadStringNCS( prop, "Monitoring:key", "" );
				smm->smm_Key = StringDuplicate( tptr );
				plib->Close( prop );
			}
		}
	}
	return smm;
}

/**
 * Release SystemMonitorManager
 *
 * @param smm pointer to SystemMonitorManager which will be deleted
 */
void SystemMonitorManagerDelete( SystemMonitorManager *smm )
{
	if( smm != NULL )
	{
		pthread_mutex_destroy( &smm->smm_Mutex );
		
		FFree( smm );
	}
}

/**
 * Handle System Monitoring Web Requests
 *
 * @param smm pointer to SystemMonitorManager
 * @return
 */
Http *SystemMonitorManagerWEB( SystemMonitorManager *smm, char *function, Http *req )
{
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate("text/html") },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
		{ TAG_DONE, TAG_DONE}
		};
	Http *response = HttpNewSimple( HTTP_200_OK, tags );
	
	if( function == NULL )
	{
		HttpAddTextContent( response, "fail<!--separate-->{\"response\":1,\"code\":1}" );
	}
	else
	{
		char *key = NULL;
		FBOOL raw = FALSE;
		HashmapElement *el = HttpGetPOSTParameter( req, "key" );
		if( el == NULL ) el = HashmapGet( req->http_Query, "key" );
		if( el != NULL )
		{
			key = StringDuplicate( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( req, "raw" );
		if( el == NULL ) el = HashmapGet( req->http_Query, "raw" );
		if( el != NULL )
		{
			if( strcmp( el->hme_Data,"1" ) == 0 )
			{
				raw = TRUE;
			}
		}
		
		if( key == NULL )
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"response\":1,\"code\":2}" );
		}
		else
		{
			char *locKey = NULL;
			
			SQLLibrary *sqllib  = SLIB->LibrarySQLGet( SLIB );

			if( sqllib != NULL )
			{
				char *qery = FMalloc( 1048 );
				qery[ 1024 ] = 0;
				
				// example: INSERT INTO `FGlobalVariables` ( `Key`, `Value`, `Comment`, `Date`) VALUES ('MONITORING_KEY', 'blabla1', 'monitoring key', '0');
				
				sqllib->SNPrintF( sqllib, qery, 1024, "SELECT * FROM `FGlobalVariables` WHERE `Key`=\"MONITORING_KEY\"" );
				void *res = sqllib->Query( sqllib, qery );
				if( res != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						locKey = UrlDecodeToMem( row[0] );
					}
					sqllib->FreeResult( sqllib, res );
				}
				SLIB->LibrarySQLDrop( SLIB, sqllib );
				FFree( qery );
			}
			
			/// @cond WEB_CALL_DOCUMENTATION
			/**
			*
			* <HR><H2>monitor/presence</H2>return information about presence connection (last call timestamp diff)
			*
			* @param key - (required) authentication key, stored in DB in FGLobalVariables with key MONITORING_KEY
			* @param raw - if 1 then only difference will be returned otherwise full response in json format
			* 
			* @return return information about connection state
			*/
			/// @endcond
			
			DEBUG("[SystemMonitorManagerWEB] compare key %s=%s", locKey, key );
			
			if( locKey == NULL || strcmp( locKey, key ) == 0 )
			{
				if( strcmp( function, "presence" ) == 0 )
				{
					char resp[ 512 ];
					time_t currTimestamp = time( NULL );
					
					// we just want to get timestamp
					if( raw == TRUE )
					{
						snprintf( resp, sizeof( resp ), "%ld", currTimestamp-smm->smm_PresenceTimestamp );
					}
					else
					{
						snprintf( resp, sizeof( resp ), "ok<!--separate-->{\"response\":0,\"lastcall\":%ld}", currTimestamp-smm->smm_PresenceTimestamp );
					}
					HttpAddTextContent( response, resp );
				}
			}
			else	// key is NULL or not equal
			{
				HttpAddTextContent( response, "fail<!--separate-->{\"response\":1,\"code\":3}" );
			}
			
			if( locKey != NULL )
			{
				FFree( locKey );
			}
		}
	}
	return response;
}
