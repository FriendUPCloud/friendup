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
 * DOSDriver body
 *
 * @author PS (Pawel Stefansky)
 * @date created PS 2015
 */

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>

#include <core/types.h>
#include <core/library.h>
#include <core/friendcore_manager.h>

#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
#include <util/string.h>
#include <system/auth/authmodule.h>

#include <system/fsys/fsys.h>
#include <util/buffered_string.h>
#include <db/sqllib.h>
#include <application/applicationlibrary.h>
//#include <interface/properties_interface.h>
#include <system/systembase.h>
#include "dosdriver.h"

void DOSDriverDelete( DOSDriver *ddrive );

/**
 * Function reads DOSDriver file from filesystem and create C representation
 *
 * @param sl pointer to SystemBase
 * @param path path to file which represent DOSDriver
 * @param name name of DOSDriver
 * @return new DOSDriver structure when success, otherwise NULL
 */
DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name )
{
	if( !sl || name == NULL || ( name != NULL && strlen( name ) < 3 ) )
	{
		FERROR("Cannot create DOSDriver %s\n", name );
		return NULL;
	}
	
	DOSDriver *ddrive = NULL;
	char *type = "type";
	char *handler = "handler";
	unsigned int extensions = 0;
	
	DEBUG( "[DOSDriverCreate] Trying to create dos driver %s (path: %s)\n", name, path );
	
	if( ( ddrive = FCalloc( 1, sizeof( DOSDriver ) ) ) != NULL )
	{
		ddrive->dd_Name = StringDuplicateN( name, strlen( name ) );
		ddrive->dd_Type = NULL;
		
		//struct PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);
		//Props *prop = NULL;
	
		//if( ( plib = (struct PropertiesLibrary *)LibraryOpen( sl, "properties.library", 0 ) ) != NULL )
		{
			char fileName[ 1024 ];
			sprintf( fileName, "%s/dosdriver.ini", path );
			
			char *buffer = FMalloc( 4096 * sizeof(char) );
			if( buffer != NULL )
			{
				FILE *readfile = NULL;

				if( ( readfile = fopen( fileName, "rb" ) ) != NULL )
				{
					fread( buffer, 4096, 1, readfile );
					
					fclose( readfile );
				}
				
				int r;
				jsmn_parser p;
				jsmntok_t t[128]; // We expect no more than 128 tokens 
				
				jsmn_init(&p);
				
				r = jsmn_parse(&p, buffer, bs->bs_Size - 17, t, sizeof(t)/sizeof(t[0]));
				
				FFree( buffer );
			}
			
			int i, i1;
				
			
				
				char *buffer = &bs->bs_Buffer[ 17 ];
			
				
				if (r < 0) 
				{
					FERROR("Failed to parse JSON: %d\n", r);
					BufStringDelete( bs );
					return 1;
				}
			
				// Filename, Path, Filesize, DateModified, MetaType, Type (File/Directory)
				
				char *isdir = NULL;
			
				for( i = 0; i < r ; i++ )
				{
					i1 = i + 1;
					if (jsoneq( buffer, &t[ i ], "Type") == 0) 
					{
						if( strncmp( "Directory",  buffer + t[ i1 ].start, t[ i1 ].end-t[ i1 ].start ) == 0 )
						{
							isdir = buffer + t[ i1 ].start;
						}
					}
					else if (jsoneq( buffer, &t[ i ], "Filename") == 0) 
					{
						fname = buffer + t[ i1 ].start;
						fnamesize = t[ i1 ].end-t[ i1 ].start;
					}
				}
			
			/*
			prop = plib->Open( fileName );
			if( prop != NULL)
			{
				
				
				DEBUG("[SYSTEMLibrary] reading login\n");
				type = plib->ReadStringNCS( prop, "DOSDriver:type", "null" );
				handler = plib->ReadStringNCS( prop, "DOSDriver:handler", "null" );
				
				ddrive->dd_Type = StringDuplicateN( type, strlen( type ) );

				FHandler *efsys = sl->sl_Filesystems;
				while( efsys != NULL )
				{
					DEBUG("[DOSDriverCreate] handler %s Type  %s  fsprefix %s\n", handler, type, efsys->GetPrefix() );
		
					if( strcmp( handler, efsys->GetPrefix() ) == 0 )
					{
						ddrive->dd_Handler = efsys;
						break;
					}
					efsys = (FHandler *)efsys->node.mln_Succ;
				}
				
				//
				// parse and set extensions flag
				//
				
				char *tmp = plib->ReadStringNCS( prop, "DOSDriver:extensions", "null" );
				
				if( strstr( tmp, "copy" ) != NULL )
				{
					ddrive->dd_Extensions |= DOSDriver_Extension_Copy;
				}
				if( strstr( tmp, "delete" ) != NULL )
				{
					ddrive->dd_Extensions |= DOSDriver_Extension_Delete;
				}

				plib->Close( prop );
			}
			*/
		}

		if( ddrive->dd_Handler == NULL )
		{
			FERROR("[ERROR]: Handler not found cannot create DOSDriver!\n");
			sl->sl_Error = FSys_Error_NOFSAvaiable;
			DOSDriverDelete( ddrive );
			return NULL;
		}
	}
	
	return ddrive;
}

/**
 * Function delete DOSDriver
 *
 * @param ddrive pointer to DOSDriver
 */
void DOSDriverDelete( DOSDriver *ddrive )
{
	if( ddrive != NULL )
	{
		if( ddrive->dd_Name != NULL )
		{
			FFree( ddrive->dd_Name );
		}
		
		if( ddrive->dd_Type != NULL )
		{
			FFree( ddrive->dd_Type );
		}
			
		FFree( ddrive );
	}
}
