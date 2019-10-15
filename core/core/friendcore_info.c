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
 *  Returns information about a running Friend Core
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 * 
 * \defgroup FriendCoreInfo Information
 * \ingroup FriendCore
 * @{
 */

#include "friendcore_info.h"
#include <core/friendcore_manager.h>
#include <core/friend_core.h>
#include <network/http_client.h>
#include <util/buffered_string.h>

/**
 * Allocates a new Friend Core information structure.
 *
 * @return pointer to allocated structure
 * @return undefined in case of error
 */
FriendcoreInfo *FriendCoreInfoNew( void *slib )
{
	SystemBase *sb = (SystemBase *)slib;
	FriendcoreInfo *fci = NULL;
	/*  XML response
	<Response>
	<IP>82.177.144.226</IP>
	<CountryCode>PL</CountryCode>
	<CountryName>Poland</CountryName>
	<RegionCode>MZ</RegionCode>
	<RegionName>Mazovia</RegionName>
	<City>Warsaw</City>
	<ZipCode>01-923</ZipCode>
	<TimeZone>Europe/Warsaw</TimeZone>
	<Latitude>52.25</Latitude>
	<Longitude>21</Longitude>
	<MetroCode>0</MetroCode>
	</Response>
	    JSON response
	{"ip":"82.177.144.226","country_code":"PL","country_name":"Poland","region_code":"MZ","region_name":"Mazovia","city":"Warsaw","zip_code":"01-923","time_zone":"Europe/Warsaw","latitude":52.25,"longitude":21,"metro_code":0}
	 */
	
	Props *prop = NULL;

	//struct PropertiesLibrary *plib = ( struct PropertiesLibrary *)sb->LibraryPropertiesGet( sb );
	PropertiesInterface *plib = &(sb->sl_PropertiesInterface);
	char *geoProvider = NULL;
	char *geoFormat = NULL;
	int geoFunction = 0;		// 0 - disabled 1 - enabled/store to file 2 - enabled call everytime

	if( plib != NULL && plib->Open != NULL )
	{
		char *ptr = getenv("FRIEND_HOME");
		char *path = FCalloc( 1000, sizeof( char ) );
		
		if( ptr != NULL )
		{
			sprintf( path, "%scfg/cfg.ini", ptr );
		}
		prop = plib->Open( path );
		FFree( path );
		
		if( prop != NULL)
		{
			char *loctmp = plib->ReadStringNCS( prop, "Global:GEOProvider", "api.ipstack.com" );
			if( loctmp != NULL )
			{
				geoProvider = StringDuplicate( loctmp );
			}
			loctmp = plib->ReadStringNCS( prop, "Global:GEOFormat", "json" );
			if( loctmp != NULL )
			{
				geoFormat = StringDuplicate( loctmp );
			}
			
			//
			loctmp = plib->ReadStringNCS( prop, "Global:GEOCall", "off" );
			if( loctmp != NULL )
			{
				if( strcmp( "onauto", loctmp ) == 0 )
				{
					geoFunction = 1;
				}
				else if( strcmp( "on", loctmp ) == 0 )
				{
					geoFunction = 2;
				}
				else
				{
					geoFunction = 0;
				}
				DEBUG("GEO: %s\n", loctmp );
			}
		}
		
		if( prop ) plib->Close( prop );
	}
	
	if( ( fci = FCalloc( 1, sizeof( FriendcoreInfo ) ) ) != NULL )
	{
		fci->fci_SLIB = slib;
		
		if( geoFunction >= 1 )
		{
			BufString *bs = NULL;
			
			if( geoProvider == NULL )
			{
				geoProvider = StringDuplicate( "api.ipstack.com" );
			}
	
			if( geoFormat == NULL )
			{
				geoFormat = StringDuplicate( "json" );
			}
			
			if( geoFunction == 1 )
			{
				bs = BufStringRead( GEO_LOCATION_FILE );
			}
		
			if( bs == NULL || geoFunction == 2 )
			{
				char tmp[ 256 ];
				//snprintf( tmp, sizeof(tmp), "/%s/", geoFormat );
				snprintf( tmp, sizeof(tmp), "/82.177.144.226?access_key=6c03cf0550f249596f97dd9aa3203fb3" );
				// POST, HTTP2, PATH, HEADERS, CONTENT
				HttpClient *c = HttpClientNew( FALSE, FALSE, tmp, NULL, NULL );
				if( c != NULL )
				{
					//freegeoip.net/xml/
			
					bs = HttpClientCall( c, geoProvider, 80, FALSE );
					HttpClientDelete( c );
				}
			}
			
			if( bs != NULL )
			{
				if( geoFunction == 1 )
				{
					BufStringWrite( bs, GEO_LOCATION_FILE );
				}
				
				char *pos = strstr( bs->bs_Buffer, "\r\n\r\n" );
				if( pos != NULL )
				{
					pos+=4;
					fci->fci_LocalisationJSON = StringDuplicate( pos );
				
					if( fci->fci_LocalisationJSON != NULL )
					{
						char *sptr = NULL;
						if( ( sptr = strstr( fci->fci_LocalisationJSON, "time_zone" ) ) != NULL )
						{
							// 12 = time_zone":"
							sptr += 12;
							char *eptr = sptr + 1;
							while( *eptr != 0 )
							{
								if( *eptr == '"' ) break;
								eptr++;
							}
							fci->fci_TimeZone = StringDuplicateN( sptr, eptr-sptr );
						}
					
						if( ( sptr = strstr( fci->fci_LocalisationJSON, "city" ) ) != NULL )
						{
							// 7 = city":"
							sptr += 7;
							char *eptr = sptr + 1;
							while( *eptr != 0 )
							{
								if( *eptr == '"' ) break;
								eptr++;
							}
							fci->fci_City = StringDuplicateN( sptr, eptr-sptr );
						}
					
						if( ( sptr = strstr( fci->fci_LocalisationJSON, "country_code" ) ) != NULL )
						{
							// 15 = country_code":"
							sptr += 15;
							int pos = 0;
							char *dptr = fci->fci_CountryCode;
							while( *sptr != 0 )
							{
								dptr[ pos++ ] = *sptr;
								if( *sptr == '"' || pos > 9 ) break;
								sptr++;
							}
						}
					}
					DEBUG("[FriendCoreInfoNew] Localisation string received %s\n", fci->fci_LocalisationJSON );
				}
				BufStringDelete( bs );
			}
		}	
		else // geoFunction, disabled
		{
			DEBUG("Geolocation disabled\n");
			fci->fci_TimeZone = StringDuplicate("none");
			fci->fci_City = StringDuplicate("none");
			strcpy( fci->fci_CountryCode, "none" );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for FriendcoreInfo structure\n");
	}
	
	if( geoProvider != NULL )
	{
		FFree( geoProvider );
	}
	
	if( geoFormat != NULL )
	{
		FFree( geoFormat );
	}
	
	return fci;
}

/**
 * Frees a Friend Core information structure.
 *
 * @param fci pointer to the structure to delete
 */
void FriendCoreInfoDelete( FriendcoreInfo *fci )
{
	if( fci != NULL )
	{
		if( fci->fci_LocalisationJSON != NULL )
		{
			FFree( fci->fci_LocalisationJSON );
		}
		if( fci->fci_City != NULL )
		{
			FFree( fci->fci_City );
		}
		if( fci->fci_TimeZone != NULL )
		{
			FFree( fci->fci_TimeZone );
		}
		FFree( fci );
	}
}

/**
 * Get information about a running Friend Core/
 *
 * @param fci pointer to the Friend Core information structure
 * @return pointer to a buffered string containing the informations
 * @return NULL in case of error
 */
BufString *FriendCoreInfoGet( FriendcoreInfo *fci )
{
	SystemBase *sb = (SystemBase *)fci->fci_SLIB;
	BufString *bs = BufStringNew();
	char *temp = FMalloc( 2048 );
	if( bs != NULL && temp != NULL )
	{
		FriendCoreManager *fcm = (FriendCoreManager *)sb->fcm;
	
		BufStringAdd( bs, "{" );
	
		sprintf( temp, " \"FriendCoreName\":\"%s\", ", fcm->fcm_ID );
		BufStringAdd( bs, temp );
		
		sprintf( temp, " \"FriendCoreVersion\":\"%s\", \"FriendCoreBuildDate\":\"%s\", \"FriendCoreBuild\":\"%s\",", APPVERSION, APPDATE, APPGITVERSION );
		BufStringAdd( bs, temp );
	
		BufStringAdd( bs, "\"FriendCores\" : " );
		FriendCoreInstance *fc = fcm->fcm_FriendCores;
		
		int i = 0, j =0;
		char coreid[ 33 ];
		
		while( fc != NULL )
		{
			//strncpy( coreid, fc->fci_CoreID, 32 );
			/*
			if( i == 0 )
			{
				sprintf( temp, "{ \"ThreadID\":\"%s\" ,\"Port\":\"%d\",\"Workers\":", coreid, fc->fci_Port );
			}
			else
			{
				sprintf( temp, ", { \"ThreadID\":\"%s\" ,\"Port\":\"%d\",\"Workers\":", coreid, fc->fci_Port );
			}
			*/
			if( i == 0 )
			{
				sprintf( temp, "{ \"ThreadID\":\"%d\" ,\"Port\":\"%d\",\"Workers\":", i, fc->fci_Port );
			}
			else
			{
				sprintf( temp, ", { \"ThreadID\":\"%d\" ,\"Port\":\"%d\",\"Workers\":", i, fc->fci_Port );
			}
			
			BufStringAdd( bs, temp );
		
			snprintf( temp, 2048, "%d", sb->sl_WorkerManager->wm_MaxWorkers );
			//strcpy( temp, "\"0\"" );
			BufStringAdd( bs, temp );
			
			if( sb->sl_WorkerManager != NULL )
			{
				if( sb->sl_WorkerManager->wm_MaxWorkers == 0 )
				{
				
				}
				else
				{
					/*
					for( j=0 ; j < sb->sl_WorkerManager->wm_MaxWorkers ; j++ )
					{
						Worker *wrk = sb->sl_WorkerManager->wm_Workers[ j ];
						if( j == 0 )
						{
							sprintf( temp, "{\"Number\":\"%d\", \"State\":\"%d\", \"Quit\":\"%d\", \"AvgUsage\":\"%f\"'}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
						}
						else
						{
							sprintf( temp, ",{\"Number\":\"%d\", \"State\":\"%d\", \"Quit\":\"%d\", \"AvgUsage\":\"%f'\"}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
						}
					}*/
				}
			}
		
			BufStringAdd( bs, "}" );
		
			i++;
			fc = (FriendCoreInstance *)fc->node.mln_Succ;
		}
		
		// add geo location
	
		BufStringAddSize( bs, ",\"GeoLocation\":", 15 );
		/*
		if( sb->fcm->fcm_FCI->fci_LocalisationJSON != NULL )
		{
			if( strlen( sb->fcm->fcm_FCI->fci_LocalisationJSON ) < 2 )
			{
				BufStringAdd( bs, "\"not available\"" );
			}
			else
			{
				BufStringAdd( bs, sb->fcm->fcm_FCI->fci_LocalisationJSON );
			}
		}
		else
		{
		*/
			BufStringAdd( bs, "\"not available\"" );
		//}

		BufStringAdd( bs, "}" );
	}
	
	if( temp != NULL )
	{
		FFree( temp );
	}
	
	return bs;
}

/**@}*/
// End of FriendCoreInfo Doxygen group
