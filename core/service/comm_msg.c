/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/


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

//
// new / init
//

DataForm *DataFormNew( MsgItem *mi )
{
	DataForm *df = NULL;
	
	if( mi != NULL )
	{
		ULONG size = 0;
		MsgItem *lmi = mi;
		int sizePtrSize = 0;
		
		while( lmi->mi_Tag != TAG_DONE )
		{
			size += lmi->mi_Size + COMM_MSG_HEADER_SIZE;
			lmi ++;
		}
		
		df = calloc( size+1, sizeof( BYTE ) );
		if( df != NULL )
		{
			BYTE *tmpptr = (BYTE *)df;
			lmi = mi;
			
			DEBUG("NEWMSG size %ld\n", size );
			
			//
			// we are inserting data into buffer
			//
			
			while( lmi->mi_Tag != TAG_DONE )
			{
				ULONG oldSize = lmi->mi_Size;
				
				BYTE *nameptr = (BYTE *)&(lmi->mi_Tag);
				DEBUG("NEWMSG - new entry size %ld  NAME '%c %c %c %c'\n", lmi->mi_Size, (char)nameptr[0], (char)nameptr[1], (char)nameptr[2], (char)nameptr[3] );
				memcpy( tmpptr, &(lmi->mi_Tag), sizeof( ID ) );
				tmpptr += sizeof( ID );
				lmi->mi_Size += COMM_MSG_HEADER_SIZE;
				
				ULONG *datasize = (ULONG *)tmpptr;
				tmpptr += sizeof( ULONG );
				
				if( lmi->mi_Data != NULL )
				{
					memcpy( tmpptr, lmi->mi_Data, oldSize );
					tmpptr += oldSize;
					//lmi->mi_Size += oldSize;
					
					INFO("NEWMSG Found data size %ld  entry size %ld\n", oldSize, lmi->mi_Size );
				}
				*datasize = lmi->mi_Size;
				
				lmi++;
			}
			INFO("NEWMSG Created package size %ld\n", size ); 
			
			// update package size
			df->df_Size = size;
		}
		else
		{
			ERROR("Cannot allocate memory for message\n");	
		}
	}
	else
	{
		DEBUG("CREATE NEW EMPTY MESSAGE\n");
		df = calloc( 1, sizeof( DataForm ) );
		if( df != NULL )
		{
			df->df_Size = sizeof( DataForm );
			df->df_ID = ID_FCRE;
		}else{
			ERROR("Cannot allocate memory for data!\n");
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
	ULONG *ptr = (ULONG *)df;
	if( df != NULL )
	{
		df->df_Size = msgSize;
		df->df_ID = id;
		ptr[ 2 ] = ID_QUER;
		ptr[ 3 ] = qdata;
		
		memcpy( ptr+4, dst, size );
	}else{
		ERROR("Cannot allocate memory for data!\n");
		return NULL;
	}
	return df;
}*/

//
// remove form struct
//

void DataFormDelete( DataForm *msg )
{
	//if( msg->df_Data != NULL )
	{
		//free( msg->df_Data );
	}
	free( msg );
}

//
// add data to structure
//

int DataFormAdd( DataForm **dst, BYTE *srcdata, LONG size )
{
	ULONG resSize = (*dst)->df_Size + size;
	ULONG oldSize = (*dst)->df_Size;
	BYTE *data = (BYTE *)calloc( resSize + sizeof( DataForm ), sizeof(BYTE) );
	//INFO("MESSAGE DATA aDDED\n");
	
	if( data != NULL )
	{
		//DEBUG("Before copy size %ld!\n", (*dst)->df_Size );
		memcpy( data, (*dst), (*dst)->df_Size );
		
		if( *dst != NULL )
		{
			free( *dst );
		}
		
		//INFO("Before assigment\n");
		*dst = (DataForm *)data;
		memcpy( data + sizeof(ID), &resSize, sizeof( ULONG ) );
		//DEBUG("COPY SRC DATA TO %ld new size %ld allocated %d\n", oldSize, size, resSize + sizeof( DataForm ) );
		memcpy( data+oldSize, srcdata, (size_t)size );
		//printf("%c%c%c%c\n", data[ 0 ], data[ 1 ], data[ 2 ], data[ 3 ] );

	}else{
		if( data != NULL )
		{
			ERROR("Cannot add data to buffer!\n");
			free( data );
			return 1;
		}
	}
	//INFO("DataFormAdd END\n");
	
	return 0;
}

//
// Join 2 DataForms
//

int DataFormAddForm( DataForm **dst, DataForm *src )
{
	ULONG resSize = (*dst)->df_Size + src->df_Size;
	ULONG oldSize = (*dst)->df_Size;
	BYTE *data = (BYTE *)calloc( resSize + sizeof( DataForm ), sizeof( BYTE ) );
	
	if( data != NULL )
	{
		//copy original data
		memcpy( data, (*dst), (*dst)->df_Size );
		
		if( *dst != NULL )
		{
			free( *dst );
		}
		
		*dst = (DataForm *)data;
		// set new size
		memcpy( data + sizeof(ULONG), &resSize, sizeof( ULONG ) );
		// copy new data
		memcpy( data+oldSize, src, (size_t)src->df_Size );
		//DEBUG("NEW DATA COPY DONE, SIZE %ld\n", src->df_Size );
		//(*dst)->df_Size = resSize;
	}else{
		if( data != NULL )
		{
			ERROR("Cannot add data to buffer!\n");
			free( data );
			return 1;
		}
	}
	
	return 0;
}

//
// Find TAG
//

DataForm *intFind( DataForm *df, ID id, LONG *size )
{
	
	//TODO
	if( *size <= 0 )
	{
		return NULL;
	}
	return NULL;
}

BYTE *DataFormFind( DataForm *df, ID id )
{
	BYTE *data = (BYTE *)df;
	if( df == NULL )
	{
		ERROR("Dataform is empty\n");
		return NULL;
	}
	if( df->df_ID == ID_FCRE )
	{
		LONG size = (LONG)df->df_Size;
		size -= COMM_MSG_HEADER_SIZE;
		data += COMM_MSG_HEADER_SIZE;
		
		BYTE *bptr = (BYTE *)data;
		// temporary checking byte after byte
		
		while( size > 0 )
		{
			ULONG *actdata = (ULONG *)bptr;
			if( *actdata == (ULONG)id )
			{
				return bptr;
			}
			bptr++;
			size--;
		}
	}
	else
	{
		ERROR("This message is not FC message\n");
		return NULL;
	}
	return NULL;
}

