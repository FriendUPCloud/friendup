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
 *  Communication Service header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/04/2022
 */

#ifndef __COMMUNICATION_COMM_SERVICE_CLIENT_H__
#define __COMMUNICATION_COMM_SERVICE_CLIENT_H__

#include "comm_service.h"

BufString *SendMessageAndWait( FConnection *con, DataForm *df );

//
//
//

BufString *SendMessageToSessionsAndWait( void *lsb, FQUAD userID, Http *req );

//
//
//

DataForm *CommServiceSendMsg( CommService *s, DataForm *df );

//
//
//

DataForm *CommServiceSendMsgDirect( FConnection *con, DataForm *df );

//
//
//

FConnection *FConnectionNew( const char *add, const char *name, int type, void *service );

//
//
//

void FConnectionDelete( FConnection *con );

//
//
//

FConnection *ConnectToServer( CommService *s, char *conname );

#endif // __COMMUNICATION_COMM_SERVICE_CLIENT_H__
