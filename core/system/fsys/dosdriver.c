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
	char *handler = NULL;//"handler";
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
			sprintf( fileName, "%s/sysinfo.json", path );
			//sprintf( fileName, "%s/dosdriver.ini", path );
			
			char *buffer = FMalloc( 4096 * sizeof(char) );
			if( buffer != NULL )
			{
				FILE *readfile = NULL;
				int readBytes = 0;

				if( ( readfile = fopen( fileName, "rb" ) ) != NULL )
				{
					fseek( readfile, 0, SEEK_END );
					int fsize = (int)ftell( readfile );
					fseek( readfile, 0, SEEK_SET );
		
					readBytes = fread( buffer, 1, fsize, readfile );
					buffer[ readBytes ] = 0;
					
					//DEBUG("Configuration file found, bytes: %d path : %s\n", readBytes, fileName );
					
					fclose( readfile );
				}
				
				if( readBytes > 0 )
				{
					int r;
					jsmn_parser p;
					jsmntok_t t[128]; // We expect no more than 128 tokens 
					int i, i1;
				
					jsmn_init(&p);
				
					r = jsmn_parse( &p, buffer, readBytes, t, sizeof(t)/sizeof(t[0]) );
					
					//DEBUG("Json parse entries found %d json : %s\n", r, buffer );
					
					if( r > 0 )
					{
						//DEBUG("Json parsed propertly\n");
						
						for( i = 0; i < r ; i++ )
						{
							i1 = i + 1;
							if (jsoneq( buffer, &t[ i ], "type") == 0) 
							{
								ddrive->dd_Type = StringDuplicateN( buffer+t[ i1].start, t[ i1 ].end - t[ i1 ].start );
								
								//DEBUG("Found Type: %s\n", ddrive->dd_Type );
							}
							else if (jsoneq( buffer, &t[ i ], "extensions") == 0) 
							{
								char *extensions = StringDuplicateN( buffer+t[ i1].start, t[ i1 ].end - t[ i1 ].start );
								if( extensions != NULL )
								{
									
									//DEBUG("Found extensions: %s\n", extensions );
									
									if( strstr( extensions, "copy" ) != NULL )
									{
										ddrive->dd_Extensions |= DOSDriver_Extension_Copy;
									}
									if( strstr( extensions, "delete" ) != NULL )
									{
										ddrive->dd_Extensions |= DOSDriver_Extension_Delete;
									}
									FFree( extensions );
								}
							}
							else if (jsoneq( buffer, &t[ i ], "handler") == 0) 
							{
								handler = StringDuplicateN( buffer+t[ i1].start, t[ i1 ].end - t[ i1 ].start );
							}
						}
						
						if( handler != NULL )
						{
							FHandler *efsys = sl->sl_Filesystems;
							while( efsys != NULL )
							{
								//DEBUG("[DOSDriverCreate] handler %s Type  %s  fsprefix %s\n", handler, type, efsys->GetPrefix() );
		
								if( strcmp( handler, efsys->GetPrefix() ) == 0 )
								{
									ddrive->dd_Handler = efsys;
									break;
								}
								efsys = (FHandler *)efsys->node.mln_Succ;
							}
						
							FFree( handler );
						}
					}
				}
				
				FFree( buffer );
			}
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
