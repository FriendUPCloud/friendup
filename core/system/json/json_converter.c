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
 *  JSON converter body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */

#include "json_converter.h"
#include <time.h>
#include "json.h"
#include <core/nodes.h>
#include <util/string.h>
#include "jsmn.h"

//
//
//

#define JSON_TOKENS 256

jsmntok_t * JSONTokenise(char *js, unsigned int *entr )
{
	jsmn_parser parser;
	jsmn_init(&parser);
	
	unsigned int n = JSON_TOKENS;
	jsmntok_t *tokens = FCalloc( n, sizeof(jsmntok_t) );
	
	int jssize = strlen(js);
	//r = jsmn_parse(&p, buffer, bsdir->bs_Size - 18, t, 1024*18 );
	int ret = jsmn_parse(&parser, js, jssize, tokens, n);
	
	while (ret == JSMN_ERROR_NOMEM)
	{
		n = ( SHIFT_LEFT(n, 1) ) + 1;
		tokens = realloc(tokens, sizeof(jsmntok_t) * n);
		//log_null(tokens);
		ret = jsmn_parse(&parser, js, jssize, tokens, n);
	}
	
	if (ret == JSMN_ERROR_INVAL)
	{
		*entr = 0;
		DEBUG("jsmn_parse: invalid JSON string");
	}
	if (ret == JSMN_ERROR_PART)
	{
		*entr = 0;
		DEBUG("jsmn_parse: truncated JSON string");
	}
	
	*entr = ret;
	
	return tokens;
}

int json_token_streq(char *js, jsmntok_t *t, char *s)
{
	return (strncmp(js + t->start, s, t->end - t->start) == 0
	&& strlen(s) == (size_t) (t->end - t->start));
}

char * json_token_tostr(char *js, jsmntok_t *t)
{
	js[t->end] = '\0';
	return js + t->start;
}


//
// DEBUG
//

static void print_depth_shift(int depth)
{
        int j;
        for (j=0; j < depth; j++) {
                printf(" ");
        }
}

static void process_value(json_value* value, int depth);

static void process_object(json_value* value, int depth)
{
        int length, x;
        if (value == NULL) {
                return;
        }
        length = value->u.object.length;
        for (x = 0; x < length; x++) {
                print_depth_shift(depth);
                DEBUG("object[%d].name = %s\n", x, value->u.object.values[x].name);
                process_value(value->u.object.values[x].value, depth+1);
        }
}

static void process_array(json_value* value, int depth)
{
        int length, x;
        if (value == NULL) {
                return;
        }
        length = value->u.array.length;
        DEBUG("array\n");
        for (x = 0; x < length; x++) {
                process_value(value->u.array.values[x], depth);
        }
}

static void process_value(json_value* value, int depth)
{
        int j;
        if (value == NULL) {
                return;
        }
        if (value->type != json_object) {
                print_depth_shift(depth);
        }
        
        DEBUG("PROCESSBALUE\n");
        
        switch (value->type) {
                case json_none:
                        DEBUG("none\n");
                        break;
                case json_object:
                        process_object(value, depth+1);
                        break;
                case json_array:
                        process_array(value, depth+1);
                        break;
                case json_integer:
                        DEBUG("int: %ld\n", value->u.integer);
                        break;
                case json_double:
                        DEBUG("double: %f\n", value->u.dbl);
                        break;
                case json_string:
                        DEBUG("string: %s\n", value->u.string.ptr);
                        break;
                case json_boolean:
                        DEBUG("bool: %d\n", value->u.boolean);
                        break;
				case json_null:
						DEBUG("JSON parse NULL\n");
					break;
        }
}

/**
 * Function convert C structure to JSON (char *)
 *
 * @param descr pointer to taglist which describe "to C conversion"
 * @param data json data in string
 * @return new "C" structure or NULL when error will happen
 */
BufString *GetJSONFromStructure( FULONG *descr, void *data )
{
	BufString *bs = BufStringNew();
	if( bs == NULL )
	{
		FERROR("ERROR: bufstring is null\n");
		return NULL;
	}
	
	DEBUG("[GetJSONFromStructure] \n");
	
	if( descr == NULL || data == NULL )
	{
		BufStringDelete( bs );
		FERROR("Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		BufStringDelete( bs );
		FERROR("SQLT_TABNAME was not provided!\n");
		return 0;
	}
	
	DEBUG("JSONParse\n");

	FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	unsigned char *strptr = (unsigned char *)data;	// pointer to structure to which will will insert data
	int opt = 0;
	
	BufStringAdd( bs, "{" );
	
	while( dptr[0] != SQLT_END )
	{
		//DEBUG("Found on pos %d tag %d   row %s\n", i, dptr[ 0 ], row[ i ] ); 

		switch( dptr[ 0 ] )
		{
			case SQLT_IDINT:	// primary key
			case SQLT_INT:
				{
					char tmp[ 256 ];
					int tmpint;
					memcpy( &tmpint, strptr + dptr[2], sizeof( int ) );
					
					if( opt == 0 )
					{
						sprintf( tmp, "\"%s\": %d ", (char *)dptr[ 1 ], tmpint );
						BufStringAdd( bs, tmp );
					}
					else
					{
						sprintf( tmp, ", \"%s\": %d ", (char *)dptr[ 1 ], tmpint );
						BufStringAdd( bs, tmp );
					}
					
					opt++;
				}
				break;
				
			case SQLT_STR:
				{
					char tmp[ 512 ];
					char *tmpchar;
					memcpy( &tmpchar, strptr+dptr[2], sizeof( char *) );
					
					if( tmpchar != NULL )
					{
						if( opt == 0 )
						{
							sprintf( tmp, "\"%s\": \"%s\" ", (char *)dptr[ 1 ], tmpchar );
							BufStringAdd( bs, tmp );
						}
						else
						{
							sprintf( tmp, ", \"%s\": \"%s\" ", (char *)dptr[ 1 ], tmpchar );
							BufStringAdd( bs, tmp );
						}
					}
					
					opt++;
				}
				break;
				
			case SQLT_DATETIME:
				{
					// '2015-08-10 16:28:31'
					char date[ 512 ];

					struct tm *tp = (struct tm *)( strptr+dptr[2]);
					if( opt == 0 )
					{
						sprintf( date, "\"%s\": \"%04d-%02d-%02d %20d:%02d:%02d\" ", (char *)dptr[ 1 ], tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
						BufStringAdd( bs, date );
					}
					else
					{
						sprintf( date, ", \"%s\": \"%04d-%02d-%02d %02d:%02d:%02d\" ", (char *)dptr[ 1 ], tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
						BufStringAdd( bs, date );
					}
					
					opt++;
				}
			break;
		}
		
		dptr += 3;
	}
	
	BufStringAdd( bs, "}" );
	//DEBUG("Object to JSON parse end %s\n", bs->bs_Buffer );
	
	return bs;
}

/**
 * Function convert JSON to C structure
 *
 * @param descr pointer to taglist which describe "to C conversion"
 * @param jsondata json data in string
 * @return new "C" structure or NULL when error will happen
 */
void *GetStructureFromJSON( FULONG *descr, const char *jsondata )
{
	char tmpQuery[ 1024 ];
	void *firstObject = NULL;
	void *lastObject = NULL;
	
	DEBUG("[GetStructureFromJSON] Load\n");
	
	if( jsondata == NULL  )
	{
		FERROR("Cannot parse NULL!\n");
		return NULL;
	}
	
	if( descr == NULL  )
	{
		FERROR("Data description was not provided!\n");
		return NULL;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		FERROR("SQLT_TABNAME was not provided!\n");
		return NULL;
	}
	
	INFO("Start\n");
	
	int j = 0;
	json_char* json;
	json_value* value;
	MinNode *node = NULL;
	
		//[{'ID'= '1' , 'Name'= 'testowa' , 'API'= '11' , 'Version'= '1' , 'Author'= 'stefanek' , 'Email'= '1' , 'Description'= 'jacek@placek.pl' , 'PEGI'= '0' , 'DateCreated'= '18' , 'DateInstalled'= '2015' }]
	//json = (json_char*)"{ \"applications\" :  [  {\"ID\": \"1\" , \"Name\": \"testowa\" , \"API\": \"11\" , \"Version\": \"1\" , \"Author\": \"stefanek\" , \"Email\": \"1\" , \"Description\": \"jacek@placek.pl\" , \"PEGI\": \"0\" , \"DateCreated\": \"18\" , \"DateInstalled\": \"2015\" }] }";

	json = (json_char*)jsondata;
	
	//DEBUG("[GetStructureFromJSON] Before parse  -> '%s' \n", json );

	value = json_parse( json, strlen( json ) );

	if (value == NULL) 
	{
		FERROR("Cannot parse string to object\n");
		return NULL;
	}
	
	if( value->type == json_object || value->type == json_array )			// ''main object"
	{
		//DEBUG("OBJECT NAME = %s value array length %d\n", value->u.object.values[0].name, value->array.length );
		
		json_value* arrval;
		
		
		DEBUG("Parse arrval type %d value type %d \n", value->type, value->type );
		
		if( value->type == json_object )
		{
			void *data = calloc( 1, descr[ SQL_DATA_STRUCTURE_SIZE ] );
		
			FUBYTE *strptr = (FUBYTE *)data;	// pointer to structure to which will will insert data
			FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table and size, rest information provided is about columns
				
			unsigned int i;
			
			lastObject = data;
			
			while( dptr[0] != SQLT_END )
			{
				switch( dptr[ 0 ] )
				{
					case SQLT_NODE:
					{
					}
					break;
					
					case SQLT_IDINT:	// primary key
					case SQLT_INT:
					{
						int retPos = -1;
						for( i = 0; i <  value->u.object.length; i++) 
						{
							if( strcmp( value->u.object.values[i].name, (char *) dptr[1] ) == 0 )
							{
								retPos = i;
							}
						}
						
						json_value*mval = NULL;
						if( retPos >= 0 )
						{
							mval = value->u.object.values[retPos].value;
						}
						
						/*
						if( retPos >= 0 && mval->type == json_integer )
						{
							//DEBUG("ENTRY FOUND %s  int val %d\n",(char *) dptr[ 1 ], mval->u.integer );
							memcpy( strptr + dptr[ 2 ], &(mval->u.integer), sizeof( int ) );
						}
						*/
						
						if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
						{
							char *end;
							FLONG val = strtol( mval->u.string.ptr, &end, 0 );
							memcpy( strptr + dptr[ 2 ], &val, sizeof( FLONG ) );
						}
						else
						{
							memcpy( strptr + dptr[ 2 ], &(mval->u.integer), sizeof( int ) );
						}
					}
					break;
						
					case SQLT_STR:
					{
						int retPos = -1;
						for( i = 0; i <  value->u.object.length; i++) 
						{
							//DEBUG("aaaaaaaaaaobject[%d].name = %s\n", i, value->u.object.values[i].name);
							if( strcmp( value->u.object.values[i].name, (char *)dptr[1] ) == 0 )
							{
								retPos = i;
							}
						}
						
						json_value*mval = NULL;
						
						if( retPos >= 0 )
						{
							mval = value->u.object.values[retPos].value;
						}
						
						if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
						{
							char *tmpval = StringDuplicate( mval->u.string.ptr );
							memcpy( strptr+ dptr[ 2 ], &tmpval, sizeof( char *) );
						}
					}
					break;
					case SQLT_DATETIME:
					{
						int retPos = -1;
						for( i = 0; i <  value->u.object.length; i++) 
						{
							if( strcmp( value->u.object.values[i].name, (char *)dptr[1] ) == 0 )
							{
								retPos = i;
							}
						}
						
						json_value*mval = NULL;
						
						if( retPos >= 0 )
						{
							mval = value->u.object.values[retPos].value;
						}
						
						if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
						{
							// this is date
							if( strlen( mval->u.string.ptr ) == 19 && mval->u.string.ptr[ 4 ] == '-' && mval->u.string.ptr[ 7 ] == '-' )
							{
								struct tm extm;
								//2017-03-03 15:06:29
								if( sscanf( (char *)mval->u.string.ptr, "%d-%d-%d %d:%d:%d", &(extm.tm_year), &(extm.tm_mon), &(extm.tm_mday), &(extm.tm_hour), &(extm.tm_min), &(extm.tm_sec) ) != EOF )
								{
								}
								if( extm.tm_year > 1900 )
								{
									extm.tm_year -= 1900;
								}
							
								memcpy( strptr + dptr[ 2 ], &extm, sizeof( struct tm) );
							}
						}
					}
					break;
				}
				i++;
				dptr += 3;
			}
		}
		else if( value->type == json_array )		// object contain our objects
		{
			arrval = value;

			int length = value->u.array.length;
			int x;
			for (x = 0; x < length; x++) // get object from array
			{
				json_value*locaval = value->u.array.values[x]; 
				
				void *data = calloc( 1, descr[ SQL_DATA_STRUCTURE_SIZE ] );
				if( firstObject == NULL )
				{
					firstObject = data;
				}
		
				FUBYTE *strptr = (FUBYTE *)data;	// pointer to structure to which will will insert data
				FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table and size, rest information provided is about columns
				
				int intlength = locaval->u.object.length;
				int i;
				
				while( dptr[0] != SQLT_END )
				{
					switch( dptr[ 0 ] )
					{
						case SQLT_NODE:
						{
							MinNode *locnode = (MinNode *)(data + dptr[ 2 ]);
							locnode->mln_Succ = (MinNode *)lastObject;
						}
						break;
					
						case SQLT_IDINT:	// primary key
						case SQLT_INT:
						{
							int retPos = -1;
							for( i = 0; i < intlength; i++) 
							{
								if( strcmp( locaval->u.object.values[i].name, (char *) dptr[1] ) == 0 )
								{
									retPos = i;
								}
							}
							json_value*mval = locaval->u.object.values[retPos].value;
							
							//DEBUG("INT 1 '%s' '%ld'!\n", mval->u.string.ptr, mval->u.integer );
							if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
							{
								char *end;
								FLONG val = strtol( mval->u.string.ptr, &end, 0 );
								memcpy( strptr + dptr[ 2 ], &val, sizeof( FLONG ) );
							}
							else
							{
								memcpy( strptr + dptr[ 2 ], &(mval->u.integer), sizeof( int ) );
							}
						}
						break;
						
						case SQLT_STR:
						{
							int retPos = -1;
							for( i = 0; i < intlength; i++) 
							{
								if( strcmp( locaval->u.object.values[i].name, (char *)dptr[1] ) == 0 )
								{
									retPos = i;
								}
							}
							
							json_value*mval = locaval->u.object.values[retPos].value;
							
							if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
							{
								char *tmpval = StringDuplicate( mval->u.string.ptr );
								memcpy( strptr+ dptr[ 2 ], &tmpval, sizeof( char *) );
							}
						}
						break;
						
						case SQLT_DATETIME:
						{
							int retPos = -1;
							for( i = 0; i < intlength; i++) 
							{
								if( strcmp( locaval->u.object.values[i].name, (char *)dptr[1] ) == 0 )
								{
									retPos = i;
								}
							}
							
							json_value*mval = locaval->u.object.values[retPos].value;
							
							if( retPos >= 0  && mval->type == json_string && mval->u.string.ptr != NULL )
							{
								// this is date
								if( strlen( mval->u.string.ptr ) == 19 && mval->u.string.ptr[ 4 ] == '-' && mval->u.string.ptr[ 7 ] == '-' )
								{
									struct tm extm;
									if( sscanf( (char *)mval->u.string.ptr, "%d-%d-%d %d:%d:%d", &(extm.tm_year), &(extm.tm_mon), &(extm.tm_mday), &(extm.tm_hour), &(extm.tm_min), &(extm.tm_sec) ) != EOF )
									{
									}
									if( extm.tm_year > 1900 )
									{
										extm.tm_year -= 1900;
									}
							
									memcpy( strptr + dptr[ 2 ], &extm, sizeof( struct tm) );
								}
							}
						}
						break;
					}
					i++;
					dptr += 3;
				}
				lastObject = data;
			}
		}
	}
	firstObject = lastObject;

	json_value_free( value );
	
	return firstObject;
}
