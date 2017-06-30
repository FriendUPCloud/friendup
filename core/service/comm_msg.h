/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

/** @file
 * 
 *  DataForm structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

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
#include <network/http.h>

/*
 type of messages

 INFO 		- information
  CORE		- get information about working cores
  SERV		- get information about working services
 CMND		- send command
  CORE		- command to core
  SERV		- command to service
 
*/

typedef FLONG ID;

#define MAKE_ID32( A, B, C, D ) (0x00000000ffffffff & (( A ) | (B << 8 ) | ( C << 16 ) | ( D << 24 ) ) )

#define ID_FCRE MAKE_ID32('F','C','R','E')	// friend host and main header
#define ID_FCRS MAKE_ID32('F','C','R','S')	// friend cores
#define ID_FCID MAKE_ID32('F','C','I','D')	// friend core ID
#define ID_FRID MAKE_ID32('F','R','I','D')	// friend request id

#define ID_FCON MAKE_ID32('F','C','O','N')	// friend connection
#define ID_FCOR MAKE_ID32('F','C','O','R')	// friend connection response

#define ID_RDRI MAKE_ID32('R','D','R','I')	// register drive
#define ID_UDRI MAKE_ID32('U','D','R','I')	// unregister drive
#define ID_RUSR MAKE_ID32('R','U','S','R')	// register user
#define ID_UUSR MAKE_ID32('U','U','S','R')	// unregister user
#define ID_CMMD MAKE_ID32('C','M','M','D')	// command

#define ID_CORE MAKE_ID32('C','O','R','E')
#define ID_SERV MAKE_ID32('S','E','R','V')	
#define ID_MSER MAKE_ID32('M','S','E','R')		// multi server response
#define ID_CMND MAKE_ID32('C','M','N','D')	// command
#define ID_SVIN MAKE_ID32('S','V','I','N')	// service info
#define ID_FILE MAKE_ID32('F','I','L','E')	// file

#define ID_SNAM MAKE_ID32('S','N','A','M')	// server name
#define ID_SRVR MAKE_ID32('S','R','V','R')	// information from one server

#define ID_QUER MAKE_ID32('Q','U','E','R')	// query for data
#define ID_RESP MAKE_ID32('R','E','S','P')	// response

#define ID_RPOK MAKE_ID32('R','P','O','K')		// response ok
#define ID_RPKO MAKE_ID32('R','P','K','O')		// response not ok

#define ID_SLIB MAKE_ID32('S','L','I','B')		// system.library
#define ID_HTTP MAKE_ID32('H','T','T','P')		// http package
#define ID_PATH MAKE_ID32('P','A','T','H')		// path
#define ID_PARM MAKE_ID32('P','A','R','M')		// parameters
#define ID_PRMT MAKE_ID32('P','R','M','T')		// parameter   fe. name=user

#define ID_AUTH MAKE_ID32('A','U','T','H')		// authentication
#define ID_USER MAKE_ID32('U','S','E','R')		// user
#define ID_PSWD MAKE_ID32('P','S','W','D')		// password
#define ID_APID MAKE_ID32('A','P','I','D')			// application id

#define MSG_END 						0
#define MSG_GROUP_START		0xf0000001
#define MSG_GROUP_END			0xf0000002
#define MSG_INTEGER_VALUE		0xf0000003

//
// Message item defined by the user
//

typedef struct MsgItem
{
    FULONG		mi_Tag;		// description
    FULONG		mi_Size;	// size of object
    FULONG 		mi_Data;	// data
}MsgItem;

//
// Data form which represents MsgItem in binary form
//

typedef struct DataForm
{
	FULONG					df_ID;
	FULONG 				df_Size;
	FULONG 				df_Data;
}DataForm;

#define COMM_MSG_HEADER_SIZE sizeof(DataForm)

//#pragma pack()

//
//
//

DataForm *DataFormNew( MsgItem *mi );

//DataForm *DataFormQueryNew( ID id, ID qdata, char *dst, int size );

//
//
//

void DataFormDelete( DataForm *msg );

//
//
//

int DataFormAdd( DataForm **dst, FBYTE *data, FLONG size );

//
//
//

int DataFormAddForm( DataForm **dst, DataForm *afm );

//
//
//

FBYTE *DataFormFind( DataForm *df, ID id );

//
//
//

DataForm *DataFormFromHttp( Http *http );

#endif // __SERVICE_COMM_MSG_H__
