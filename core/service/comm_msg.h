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

#ifndef __SERVICE_COMM_MSG_H__
#define __SERVICE_COMM_MSG_H__

#include <core/types.h>
#include <stdio.h>
#include <core/nodes.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/types.h>
#include <util/buffered_string.h>
#include <util/tagitem.h>

/*
 type of messages

 INFO 		- information
  CORE		- get information about working cores
  SERV		- get information about working services
 CMND		- send command
  CORE		- command to core
  SERV		- command to service
 
*/

typedef LONG ID;

#define MAKE_ID32( A, B, C, D ) (( A ) | ( B << 8 ) | ( C << 16 ) | ( D << 24 ))

#define ID_FCRE MAKE_ID32('F','C','R','E')	// friend host and main header

#define ID_CORE MAKE_ID32('C','O','R','E')
#define ID_SERV MAKE_ID32('S','E','R','V')	
#define ID_CMND MAKE_ID32('C','M','N','D')	// command
#define ID_SVIN MAKE_ID32('S','V','I','N')	// service info
#define ID_FILE MAKE_ID32('F','I','L','E')	// file

#define ID_SNAM MAKE_ID32('S','N','A','M')	// server name
#define ID_SRVR MAKE_ID32('S','R','V','R')	// information from one server

#define ID_QUER MAKE_ID32('Q','U','E','R')	// query for data
#define ID_RESP MAKE_ID32('R','E','S','P')	// response

#define ID_RPOK MAKE_ID32('R','P','O','K')		// response ok
#define ID_RPKO MAKE_ID32('R','P','K','O')		// response not ok


#pragma pack(4)

typedef struct MsgItem
{
    ULONG		mi_Tag;		// description
    ULONG		mi_Size;	// size of object
    ULONG 		*mi_Data;	// data
    //ULONG 		*mi_Sizeptr;	// pointer to last size entry
}MsgItem;

#pragma pack()

#define COMM_MSG_HEADER_SIZE sizeof(ULONG)*2

typedef struct DataForm
{
	ULONG					df_ID;
	ULONG 					df_Size;
	//ULONG					df_Type;
	//BYTE 					*df_Data;
	/*
	BYTE 					*df_Data;
	
	BYTE					*df_Data;		// data holder
	ULONG 					df_Size;		// size
	//ULONG 					*df_SizePtr;	// pointer to size inside buffer
*/	
}DataForm;

DataForm *DataFormNew( MsgItem *mi );

//DataForm *DataFormQueryNew( ID id, ID qdata, char *dst, int size );

void DataFormDelete( DataForm *msg );

int DataFormAdd( DataForm **dst, BYTE *data, LONG size );

int DataFormAddForm( DataForm **dst, DataForm *afm );

BYTE *DataFormFind( DataForm *df, ID id );

#endif // __SERVICE_COMM_MSG_H__
