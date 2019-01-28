/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*

	PropertiesLibrary code

*/

#include <stdio.h>
#include <limits.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include "properties.h"
#include <ctype.h>


static char pl_LibsPath[ 1024 ];

//
//
//

const char *GetConfigDirectory(  )
{
	char *ptr = NULL;
	
	ptr = getenv("FRIEND_HOME");
	//ptr = realpath( "properties.library", s->pl_LibsPath );
	if( ptr )
	{
		strcat( pl_LibsPath, "cfg/" );
		return pl_LibsPath;
	}
	else
	{
		FERROR("[ERROR]: Cannot find configuration path!\n");
	}
	
	return "";
}

//
//
//

Props *PropertiesOpen( const char *path )
{
	Props *prop = NULL;
	
	if( ( prop = FCalloc( 1, sizeof( Props ) ) ) != NULL )
	{
		prop->p_Dict = iniparser_load( path );

		// If you ever need to debug cfg.ini uncomment the line below
		// and you will get all the values to standard output.
		
		//iniparser_dump(prop->p_Dict, stdout);

		if( prop->p_Dict == NULL )
		{
			FFree( prop );
			return NULL;
		}
	}

	return prop;
}

//
//
//

void PropertiesClose( Props *p )
{
	if( p != NULL )
	{
		if( p->p_Dict != NULL )
		{
			iniparser_freedict( p->p_Dict );
			p->p_Dict = NULL;
		}
		FFree( p );
	}
}

//
//
//

char *ReadString( Props *p, char *name, char *def )
{
	if( p != NULL )
	{
		return iniparser_getstring( p->p_Dict, name, def );
	}

	return NULL;
}

//
//
//

char *ReadStringNCS( Props *p, char *name, char *def )
{
	if( p != NULL )
	{
		return iniparser_getstring_ncs( p->p_Dict, name, def );
	}

	return NULL;
}

//
//
//

char *ReadStringNCSUpper( Props *p, char *name, char *def )
{
	if( p != NULL )
	{
		char *t = iniparser_getstring_ncs( p->p_Dict, name, def );
		int len = strlen( t );
		int i;
		
		for( i=0 ; i < len ; i++ )
		{
			t[ i ] = toupper( t[ i ] );
		}
		return t;
	}

	return NULL;
}

//
//
//

int ReadInt( Props *p, const char *name, int def )
{
	if( p != NULL )
	{
		return iniparser_getint( p->p_Dict, name, def );
	}

	return 0;
}

//
//
//

int ReadIntNCS( Props *p, const char *name, int def )
{
	if( p != NULL )
	{
		return iniparser_getint_ncs( p->p_Dict, name, def );
	}

	return 0;
}

//
//
//

double ReadDouble( Props *p, const char *name, double def )
{
	if( p != NULL )
	{
		return iniparser_getdouble( p->p_Dict, name, def );
	}

	return 0;
}

//
//
//

int ReadBool( Props *p, const char *name, int def )
{
	if( p != NULL )
	{
		return iniparser_getboolean( p->p_Dict, name, def );
	}

	return 0;
}

char * readline( FILE *fp, char *buffer, int *len )
{
	int ch;
	int i = 0;
	int buff_len = 1024;

	buffer = malloc( buff_len + 1 );
	if( !buffer )
	{
		*len = -1;
		return NULL;  // Out of memory
	}

	while( (ch = fgetc(fp)) != '\n' && ch != EOF )
	{
		void *tmp = NULL;
		if( i > buff_len )
		{
			buff_len *= 2;
			tmp = realloc( buffer, buff_len + 1);
			if( tmp == NULL )
			{
				*len = -1;
				free(buffer);
				return NULL; // Out of memory
			}
			buffer = tmp;
		}

		buffer[i] = (char) ch;
		i++;
	}
	buffer[i] = '\0';
	*len = i;

	// Detect end
	if (ch == EOF && (i == 0 || ferror(fp)) )
	{
		*len = -1;
		free(buffer);
		return NULL;
	}
	
	return buffer;
}

//
//
//

int PropertiesCheck( )
{
	FILE *fp;
	int result = 0;
	
	if( ( fp = fopen( "cfg/cfg.ini", "r" )  ) != NULL )
	{
		int lineNr = 1;
		int lineChars = 0;
		char *s;
		while( ( s = readline( fp, NULL, &lineChars ) ) != NULL )
		{
			int firstCharQuote = 0;
			int equalFound = 0;
			int afterEqualChars = -1;
			int numberBadChars = 0;
			char badChars[] = {'!','@','#','$','%','^','&','*','\'','\"'};
#define BAD_CHARS_SIIZE 10
			
			char *cptr = s;

			while( *cptr != 0 )
			{
				if( equalFound == 1 )
				{
					if( *cptr != ' ' )
					{
						int i;
						if( *cptr == '"' )
						{
							if( afterEqualChars == 0 )
							{
								firstCharQuote = 1;
							}
						}
						else
						{
							afterEqualChars++;
						}
						
						for( i=0; i < BAD_CHARS_SIIZE ; i++ )
						{
							if( *cptr == badChars[ i ] )
							{
								numberBadChars++;
							}
						}
					}	// if not space
				}
				
				if( *cptr == '=' )
				{
					equalFound = 1;
					afterEqualChars = 0;
				}
				cptr++;
			}
			
			// check if first quote is where it should
			if( firstCharQuote == 1 )
			{
				// check if last quote sign is where it should
				if( s[ lineChars-1 ] == '"' )
				{
					
				}
				else
				{
					FERROR("ERROR: cfg.ini line: %d was not ended by quoute sign! Line: %s\n", lineNr, s );
					result = 1;
				}
			}
			else
			{
				if( numberBadChars > 0 )
				{
					FERROR("ERROR: cfg.ini line: %d contain chars without quote! Line: %s\n", lineNr, s );
					result = 1;
				}
			}
			lineNr++;
			free( s );
		}
		
		fclose( fp );
	}
	return result;
}

//
// Read all keys and values from one section
//

int ReadGroupEntries( Props *p, const char *name, char ***keys, char ***values )
{
	int nkeys = 0;
	if( p != NULL && p->p_Dict != NULL )
	{
		DEBUG("[ReadGroupEntries]\n");
		if (! iniparser_find_entry( p->p_Dict, (char *)name) )
		{
			DEBUG("Entry not found\n");
			return 0;
		}

		int val = iniparser_getseckeysvalues( p->p_Dict, (char *)name, keys, values );
		DEBUG("[ReadGroupEntries] returned: %d\n", val );
		return val;
	}
	return nkeys;
}
