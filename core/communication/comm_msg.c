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
 *  DataForm structure management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#include <core/types.h>
#include <stdio.h>
#include <core/nodes.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/types.h>

#include "comm_msg.h"
#include <util/log/log.h>
#include <core/friendcore_manager.h>

/**
 * Generate DataFormGroup from tags
 *
 * @param data pointer to data memory where message will be stored
 * @param mi pointer to taglist entries
 * @return size of created message group
 */
int64_t DataFormWriteGroup( FBYTE **data, MsgItem **mi )
{
	int64_t size = 0;
	MsgItem *lmi = (*mi);

	while( (*mi)->mi_Tag != MSG_GROUP_END )
	{
		int64_t res = 0;

		memcpy( (*data), (*mi), COMM_MSG_HEADER_SIZE );
		char *t = (char *)*data;
		uint64_t *sizeptr = (uint64_t *)( (*data)+sizeof(uint64_t) );
		(*data) += COMM_MSG_HEADER_SIZE;
		size += COMM_MSG_HEADER_SIZE;

		if( (*mi)->mi_Data == MSG_GROUP_START )
		{
			(*mi)++;
			res = DataFormWriteGroup( data, mi );

			*sizeptr = res;
			size += res;
			
			if( (*mi)->mi_Tag == MSG_END )
			{
				lmi->mi_Size = size;
				return size;
			}
			//(*mi)++;
		}
		
		if( !( (*mi)->mi_Data == MSG_GROUP_START || (*mi)->mi_Tag == MSG_GROUP_END || (*mi)->mi_Tag == MSG_END ) )
		{
			if( (*mi)->mi_Data != 0 )
			{
				if( (*mi)->mi_Data == MSG_INTEGER_VALUE )
				{
					
				}
				else
				{
					if( (*mi)->mi_Size > 0 && (*mi)->mi_Data != 0 ) // != 0 before
					{
						//INFO("STORE DATA %ld  entry size %ld  TEXT %.100s\n", res, (*mi)->mi_Size,(char *)((*mi)->mi_Data ) );
						memcpy( (void *)(*data), (const void *)((*mi)->mi_Data), (*mi)->mi_Size );
						(*data) += (*mi)->mi_Size;
						size += (*mi)->mi_Size;
					}
				}
			}
		}

		(*mi)++;

		if( (*mi)->mi_Tag == MSG_END )
		{
			break;
		}
	}
	size += COMM_MSG_HEADER_SIZE; // end of group
	
	lmi->mi_Size = size;
	
	return size;
}

/**
 * Create new DataForm from tags
 *
 * @param mi pointer to taglist entries
 * @return DataForm structure
 */

DataForm *DataFormNew( MsgItem *mi )
{
	DataForm *df = NULL;
	
	if( mi != NULL )
	{
		uint64_t size = 0;
		MsgItem *lmi = mi;
		
		while( lmi->mi_Tag != MSG_END )
		{
			if( lmi->mi_Data == MSG_GROUP_START || lmi->mi_Tag == MSG_GROUP_END || lmi->mi_Tag == MSG_END || lmi->mi_Data == MSG_INTEGER_VALUE )
			{
				size += COMM_MSG_HEADER_SIZE;
				//DEBUG("GROUP %lu\n", size );
			}
			else
			{
				size += lmi->mi_Size + COMM_MSG_HEADER_SIZE;
				//DEBUG("DATA %lu\n", size );
				/*
				char *tag = (char *)&(lmi->mi_Tag);
				if( tag != NULL )
				{
					printf("sizze count %c %c %c %c  %x\n", tag[ 0 ], tag[ 1 ], tag[ 2 ], tag[ 3 ],lmi->mi_Tag );
				}*/
			}
			lmi ++;
		}
		
		df = FCalloc( size+128, sizeof( FBYTE ) );
		if( df != NULL )
		{
			FBYTE *tmpptr = (FBYTE *)df;
			lmi = mi;
			
			//
			// we are inserting data into buffer
			//

			uint64_t oldsize = (uint64_t)DataFormWriteGroup( &tmpptr, &mi );
			lmi->mi_Size = oldsize;

			//Log( FLOG_INFO, "NEWMSG Created package size %lu\n", size ); 
		}
		else
		{
			Log( FLOG_ERROR, "Cannot allocate memory for message %lu\n", size );	
		}
	}
	else
	{
		df = FCalloc( 1, sizeof( DataForm ) );
		if( df != NULL )
		{
			df->df_Size = sizeof( DataForm );
			df->df_ID = ID_FCRE;
		}
		else
		{
			Log( FLOG_ERROR, "Cannot allocate memory for data!\n");
			return NULL;
		}
	}
	return df;
}

//
// new / init for query dataform
//
/*
DataForm *DataFormQueryNew( ID id, ID qdata, char *dst, int size )
{
	int msgSize = FRIEND_CORE_MANAGER_ID_SIZE + (sizeof( DataForm )*2);
	DataForm *df = calloc( 1, msgSize );
	FULONG *ptr = (FULONG *)df;
	if( df != NULL )
	{
		df->df_Size = msgSize;
		df->df_ID = id;
		ptr[ 2 ] = ID_QUER;
		ptr[ 3 ] = qdata;
		
		memcpy( ptr+4, dst, size );
	}else{
		FERROR("Cannot allocate memory for data!\n");
		return NULL;
	}
	return df;
}*/

/**
 * Delete DataForm from memory
 *
 * @param msg pointer to DataForm which will be released from memory
 */

void DataFormDelete( DataForm *msg )
{
	if( msg != NULL )
	{
		FFree( msg );
	}
}

/**
 * Add data to DataForm
 *
 * @param dst pointer to DataForm which will be extended
 * @param srcdata pointer to data which will extend DataForm
 * @param size size of data which will extend DataForm
 * @return size of created message group
 */

int64_t DataFormAdd( DataForm **dst, FBYTE *srcdata, int64_t size )
{
	if( size <= 0 )
	{
		return 2;
	}
	uint64_t resSize = (*dst)->df_Size + size;
	uint64_t oldSize = (*dst)->df_Size;
	FBYTE *data = (FBYTE *)FCalloc( resSize + sizeof( DataForm ), sizeof(FBYTE) );
	INFO("MESSAGE DATA aDDED\n");
	
	if( data != NULL && srcdata != NULL )
	{
		memcpy( data, (*dst), (*dst)->df_Size );
		
		if( *dst != NULL )
		{
			FFree( *dst );
		}
		
		*dst = (DataForm *)data;
		memcpy( data + sizeof(ID), &resSize, sizeof( FULONG ) );
		memcpy( data+oldSize, srcdata, (size_t)size );
		
		(*dst)->df_Size = resSize + sizeof( DataForm );

	}
	else
	{
		if( srcdata == NULL )
		{
			FERROR("SRC data is NULL\n");
		}
		
		if( data == NULL )
		{
			FERROR("Data = NULL\n");
		}
	
		if( data != NULL )
		{
			FERROR("Cannot add data to buffer!\n");
			FFree( data );
			return 1;
		}
	}

	return 0;
}

/**
 * Join 2 DataForm's
 *
 * @param dst pointer to memory where DataForm is placed. DataForm hich will be extended
 * @param src pointer to DataForm which will extend
 * @return 0 when success, otherwise error number
 */

int64_t DataFormAddForm( DataForm **dst, DataForm *src )
{
	uint64_t resSize = (*dst)->df_Size + src->df_Size;
	uint64_t oldSize = (*dst)->df_Size;
	FBYTE *data = (FBYTE *)FCalloc( resSize + sizeof( DataForm ), sizeof( FBYTE ) );
	
	if( data != NULL )
	{
		//copy original data
		memcpy( data, (*dst), (*dst)->df_Size );
		
		if( *dst != NULL )
		{
			FFree( *dst );
		}
		
		*dst = (DataForm *)data;
		// set new size
		memcpy( data + sizeof(FULONG), &resSize, sizeof( FULONG ) );
		// copy new data
		memcpy( data+oldSize, src, (size_t)src->df_Size );
	}else{
		if( data != NULL )
		{
			FERROR("Cannot add data to buffer!\n");
			FFree( data );
			return 1;
		}
	}
	return 0;
}

/**
 * Finds tag inside DataForm
 *
 * @param df  DataForm to be searched
 * @param id tag which will be searched inside DataForm
 * @todo function empty, not finished
 */

DataForm *intFind( DataForm *df __attribute__((unused)), ID id __attribute__((unused)), FLONG *size )
{
	//TODO
	if( *size <= 0 )
	{
		return NULL;
	}
	return NULL;
}

/**
 * Finds tag inside DataForm
 *
 * @param df  DataForm to be searched
 * @param id tag which will be searched inside DataForm
 * @return pointer to memory where tag was found, otherwise NULL
 */

FBYTE *DataFormFind( DataForm *df, ID id )
{
	FBYTE *data = (FBYTE *)df;
	if( df == NULL )
	{
		FERROR("Dataform is empty\n");
		return NULL;
	}
	
	if( df->df_ID == ID_FCRE )
	{
		int64_t size = (int64_t)df->df_Size;
		size -= COMM_MSG_HEADER_SIZE;
		data += COMM_MSG_HEADER_SIZE;
		
		DEBUG("------->size %ld\n", size );
		
		FBYTE *bptr = (FBYTE *)data;
		// temporary checking byte after byte
		
		while( size > 0 )
		{
			FULONG *actdata = (FULONG *)bptr;
			if( *actdata == (FULONG)id )
			{
				return bptr;
			}
			bptr++;
			size--;
		}
	}
	else
	{
		FERROR("This message is not FC message\n");
		return NULL;
	}
	return NULL;
}

typedef struct DFList
{
	char *t;
	int s;
	struct DFList *n;
}DFList;

DFList *CreateListEntry( char *key, char *value )
{
	DFList *ne = NULL;
	
	int size = strlen( key ) + 2 + strlen( value );
	char *tmp = NULL;
	if( ( tmp = FCalloc( size+1, sizeof(char) ) ) != NULL )
	{
		size = snprintf( tmp, size, "%s=%s", key, value );
		ne = FCalloc( 1, sizeof(DFList) );
		if( ne != NULL )
		{
			ne->t = tmp;
			ne->s = size+1;
		}
	}
	
	return ne;
}

/**
 * Convert Http request to DataForm
 *
 * @param http pointer to Http message
 * @return DataForm which represents http request
 */

DataForm *DataFormFromHttp( Http *http )
{
	DataForm *df = NULL;
	unsigned int i;
	char *remoteurl = NULL;
	char *remotehost = NULL;
	int numberTags = 10;
	MsgItem *items = NULL;
	DFList *re = NULL;	// root entry
	DFList *le = NULL;	// last entry
	
	DEBUG("[DataFormFromHttp] start\n");
	
	DEBUG("[DataFormFromHttp] headers parsed\n");
	
	if( http->http_ParsedPostContent != NULL )
	{
		for( i = 0 ; i < http->http_ParsedPostContent->hm_TableSize; i++ )
		{
			HashmapElement e = http->http_ParsedPostContent->hm_Data[i];
			
			if( e.hme_Key != NULL && e.hme_InUse == TRUE )
			{
				if( strcmp( e.hme_Key, "remoteurl" ) == 0 )
				{
					remoteurl = UrlDecodeToMem( e.hme_Data );
				}
				else if( strcmp( e.hme_Key, "remotehost" ) == 0 )
				{
					remotehost = UrlDecodeToMem( e.hme_Data );
				}
				else if( strcmp( e.hme_Key, "remotecommand" ) == 0 )
				{
					DEBUG("[DataFormFromHttp] remote command : %s\n", (char *)e.hme_Data );
					char *data = UrlDecodeToMem( e.hme_Data );
					if( data != NULL )
					{
						// get commands, split them and add to request
						char *key = data;
						char *value = NULL;
						unsigned int i = 0;
						
						for( i=1 ; i < strlen(data) ; i++ )
						{
							if( data[ i ] == '=' )
							{
								data[ i ] = 0;
								value = &data[ i+1 ];
							}
							else if( data[ i ] == '&' )
							{
								if( key != NULL && value != NULL )
								{
									DFList *ne = CreateListEntry( key, value );
									if( ne != NULL )
									{
										if( re == NULL )
										{
											re = ne;
											le = ne;
										}
										else
										{
											le->n = ne;
											le = ne;
										}
									} // ne != NULL
								}
								
								data[ i ] = 0;
								key = &data[ i+1 ];
								value = NULL;
							}
						}
						FFree( data );
					}
				}
				else
				{
					int size = 0;
					
					if( e.hme_Data != NULL )
					{
						char *data = UrlDecodeToMem( (char *)e.hme_Data );
						if( data != NULL )
						{
							DFList *ne = CreateListEntry( e.hme_Key, data );
							/*
							size = strlen( e.key ) + 2 + strlen( data );
							char *tmp = NULL;
							if( ( tmp = FCalloc( size+1, sizeof(char) ) ) != NULL )
							{
								size = snprintf( tmp, size, "%s=%s", e.key, data );
							DFList *ne = FCalloc( 1, sizeof(DFList) );
							*/
							if( ne != NULL )
							{
								//ne->t = tmp;
								//ne->s = size+1;
							
								if( re == NULL )
								{
									re = ne;
									le = ne;
								}
								else
								{
									le->n = ne;
									le = ne;
								}
							} // ne != NULL
						} // Calloc for temp message
						FFree( data );
					} // data != NULL 
				}	//e.data != NULL
				numberTags++;
			}
		}
	}

	DEBUG("[DataFormFromHttp] RemoteURL %s RemoteHost %s\n", remoteurl, remotehost );
	
	if( remoteurl != NULL && remotehost != NULL && ( items = FCalloc( numberTags, sizeof(MsgItem) ) ) != NULL )
	{
		DEBUG("[DataFormFromHttp] memory allocated in size %d\n", numberTags );
		
		items[ 0 ].mi_Tag = ID_FCRE;
		items[ 0 ].mi_Size = 0;
		items[ 0 ].mi_Data = MSG_GROUP_START;
		
		items[ 1 ].mi_Tag = ID_FRID;
		items[ 1 ].mi_Size = 0;
		items[ 1 ].mi_Data = MSG_INTEGER_VALUE;
		
		items[ 2 ].mi_Tag = ID_QUER;
		items[ 2 ].mi_Size = strlen( remotehost )+1;
		items[ 2 ].mi_Data = (FULONG)remotehost;
		
		items[ 3 ].mi_Tag = ID_SLIB;
		items[ 3 ].mi_Size = 0;
		items[ 3 ].mi_Data = 0;
		
		items[ 4 ].mi_Tag = ID_HTTP;
		items[ 4 ].mi_Size = 0;
		items[ 4 ].mi_Data = MSG_GROUP_START;
		
		items[ 5 ].mi_Tag = ID_PATH;
		items[ 5 ].mi_Size = strlen(remoteurl)+1;
		items[ 5 ].mi_Data = (FULONG)remoteurl;
		
		items[ 6 ].mi_Tag = ID_PARM;
		items[ 6 ].mi_Size = 0;
		items[ 6 ].mi_Data = MSG_GROUP_START;
		
		int pos = 7;
		DFList *pentry = re;
		while( pentry != NULL )
		{
			items[ pos ].mi_Tag = ID_PRMT;
			items[ pos ].mi_Size = pentry->s;
			items[ pos ].mi_Data = (FULONG)pentry->t;
			
			pos++;
			pentry = pentry->n;
		}
		
		// custom
		pos = numberTags-3;
		
		items[ pos ].mi_Tag = MSG_GROUP_END;
		items[ pos ].mi_Size = 0;
		items[ pos++ ].mi_Data = 0;
		
		items[ pos ].mi_Tag = MSG_GROUP_END;
		items[ pos ].mi_Size = 0;
		items[ pos++ ].mi_Data = 0;
		
		items[ pos ].mi_Tag = MSG_END;
		items[ pos ].mi_Size = MSG_END;
		items[ pos++ ].mi_Data = MSG_END;
		
		DEBUG("[DataFormFromHttp] generate DataForm\n");
		df = DataFormNew( items );
		DEBUG("[DataFormFromHttp] release memory\n");
	}
	
	/*
	 M sgI*tem tags[] = {
	 { ID_FCRE, (FULONG)0, MSG_GROUP_START },
	 { ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
	 { ID_QUER, (FULONG)sd->hosti, (FULONG)sd->host  },
	 { ID_SLIB, (FULONG)0, (FULONG)NULL },
	 { ID_HTTP, (FULONG)0, MSG_GROUP_START },
	 { ID_PATH, (FULONG)30, (FULONG)"system.library/login" },
	 { ID_PARM, (FULONG)0, MSG_GROUP_START },
	 { ID_PRMT, (FULONG) sd->logini, (FULONG)usernamec },
	 { ID_PRMT, (FULONG) sd->passwdi,  (FULONG)passwordc },
	 { ID_PRMT, (FULONG) sd->idi,  (FULONG)sessionidc },
	 { ID_PRMT, (FULONG) sd->devidi, (FULONG)sd->devid },
	 { ID_PRMT, (FULONG) enci, (FULONG) enc },
	 { ID_PRMT, (FULONG) 18, (FULONG)"appname=Mountlist" },
	 { MSG_GROUP_END, 0,  0 },
	 { MSG_GROUP_END, 0,  0 },
	 { MSG_END, MSG_END, MSG_END }
};
	 */
	
	DFList *pentry = re;
	DFList *dentr = re;
	while( pentry != NULL )
	{
		dentr = pentry;
		pentry = pentry->n;
		if( dentr != NULL )
		{
			if( dentr->t != NULL )
			{
				FFree( dentr->t );
			}
			FFree( dentr );
		}
	}
	
	if( remotehost != NULL )
	{
		FFree( remotehost );
	}
	
	if( remoteurl != NULL )
	{
		FFree( remoteurl );
	}
	
	return df;
}

/**
 * Create parameter
 *
 * @param key pointer to key string
 * @param value pointer to value string
 * @param len pointer to int value where length will be stored
 * @return allocated memory and string inside when success, otherwise NULL
 */

char *createParameter( char *key, char *value, int *len )
{
	char *result = NULL;
	if( key != NULL && value != NULL )
	{
		int size = strlen( key )+strlen( value ) + 3;
		if( ( result = FCalloc( size, sizeof(char) ) ) != NULL )
		{
			*len = sprintf( result, "%s=%s", key, value )+1;
		}
	}
	
	return result;
}

/**
 * Create parameter from FULONG
 *
 * @param key pointer to key string
 * @param value pointer to FULONG value
 * @param len pointer to int value where length will be stored
 * @return allocated memory and string inside when success, otherwise NULL
 */

char *createParameterFULONG( char *key, FULONG value, int *len )
{
	char *result = NULL;
	if( key != NULL )
	{
		int size = strlen( key )+ 33;
		if( ( result = FCalloc( size, sizeof(char) ) ) != NULL )
		{
			*len = sprintf( result, "%s=%lu", key, value )+1;
		}
	}
	
	return result;
}
