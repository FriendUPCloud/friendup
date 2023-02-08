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
 *  DataForm structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#ifndef __COMMUNICATION_COMM_MSG_H__
#define __COMMUNICATION_COMM_MSG_H__

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
#define MAKE_ID64( A, B, C, D, E, F, G, H ) (( A ) | (B << 8 ) | ( C << 16 ) | ( D << 24 ) | ( E << 32 ) | ( F << 40 ) | ( G << 48 ) | ( H << 56 ) ) 

#define ID_FCRE MAKE_ID32('F','C','R','E')	// friend host and main header
#define ID_FCRS MAKE_ID32('F','C','R','S')	// friend cores
#define ID_FCID MAKE_ID32('F','C','I','D')	// friend core ID
#define ID_FRID MAKE_ID32('F','R','I','D')	// friend request id
#define ID_FCRI MAKE_ID32('F','C','R','I')	// friend request id (in reponse message)

#define ID_FCON MAKE_ID32('F','C','O','N')	// friend connection
#define ID_FCOR MAKE_ID32('F','C','O','R')	// friend connection response
#define ID_CLID MAKE_ID32('C','L','I','D')	// cluster ID

#define ID_RUSR MAKE_ID32('R','U','S','R')	// register user
#define ID_UUSR MAKE_ID32('U','U','S','R')	// unregister user
#define ID_CMMD MAKE_ID32('C','M','M','D')	// command
 #define ID_MUSR MAKE_ID32('M','U','S','R')	// move user session to another FC (in cluster)
 #define ID_FNOT MAKE_ID32('F','N','O','T')	// notification
 #define ID_PING MAKE_ID32('P','I','N','G')	// PING
 #define ID_RDRI MAKE_ID32('R','D','R','I')	// register drive
 #define ID_UDRI MAKE_ID32('U','D','R','I')	// unregister drive
 #define ID_ANDE MAKE_ID32('A','N','D','E')  // add Node
#define ID_FERR MAKE_ID32('F','E','R','R')	// Error

//#define ID_SSCN MAKE_ID32('S','S','C','N')	// number of user sessions on FriendCode

#define ID_CORE MAKE_ID32('C','O','R','E')
#define ID_SERV MAKE_ID32('S','E','R','V')	
#define ID_MSER MAKE_ID32('M','S','E','R')		// multi server response
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

#define ID_FINF MAKE_ID32('F','I','N','F')		// friend information
#define ID_WSES MAKE_ID32('W','S','E','S')		// number of working sessions
#define ID_FGEO MAKE_ID32('F','G','E','O')		// geolocalization
#define ID_CITY MAKE_ID32('C','I','T','Y')		// geolocalization - city
#define ID_COUN MAKE_ID32('C','O','U','N')		// geolocalization - country code

#define ID_SESS MAKE_ID32('S','E','S','S')		// user sessionid

#define MSG_END 						0
#define MSG_GROUP_START					0xf0000001
#define MSG_GROUP_END					0xf0000002
#define MSG_INTEGER_VALUE				0xf0000003

#define FC_QUERY_DEFAULT				0x000f0000
#define FC_QUERY_SERVICES				(FC_QUERY_DEFAULT)
#define FC_QUERY_GEOLOC					(FC_QUERY_DEFAULT+1)
#define FC_QUERY_FRIENDCORE_INFO		(FC_QUERY_DEFAULT+2)	// information about FriendCore
#define FC_QUERY_FRIENDCORE_SYNC		(FC_QUERY_DEFAULT+3)	// synchronization between cores (user data)

//
// Message item defined by the user
//

typedef struct MsgItem
{
    uint64_t	mi_Tag;		// description
    uint64_t	mi_Size;	// size of object
    uint64_t 	mi_Data;	// data
}MsgItem;

//
// Data form which represents MsgItem in binary form
//

typedef struct DataForm
{
	uint64_t	df_ID;
	uint64_t 	df_Size;
	uint64_t 	df_Data;
}DataForm;

#define COMM_MSG_HEADER_SIZE sizeof(DataForm)

//
//
//

DataForm *DataFormNew( MsgItem *mi );

//
//
//

void DataFormDelete( DataForm *msg );

//
//
//

int64_t DataFormAdd( DataForm **dst, FBYTE *data, int64_t size );

//
//
//

int64_t DataFormAddForm( DataForm **dst, DataForm *afm );

//
//
//

FBYTE *DataFormFind( DataForm *df, ID id );

//
// Used for remote commands
//

DataForm *DataFormFromHttpRemoteCommand( Http *http );

//
// Convert http to DataForm
//

DataForm *DataFormFromHttpToSync( char *fcid, Http *http, char *sessionid );

//
//
//

char *createParameter( char *key, char *value, int *len );

//
//
//

char *createParameterFULONG( char *key, FULONG value, int *len );


#endif // __COMMUNICATION_COMM_MSG_H__
