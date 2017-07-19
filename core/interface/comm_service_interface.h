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
 *  Communication Service Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 03/01/2017
 */
#ifndef __INTERFACE_COMM_SERVICE_INTERFACE_H__
#define __INTERFACE_COMM_SERVICE_INTERFACE_H__

#include <communication/comm_service.h>

typedef struct CommServiceInterface
{
	CommFCConnection	*(*CommFCConnectionNew)( const char *address, const char *name, int type, void *service );
	void				(*CommFCConnectionDelete)( CommFCConnection *con );
	CommService			*(*CommServiceNew)( int port, int secured, void *sb, int maxev, int bufsiz );
	void				(*CommServiceDelete)( CommService *s );
	int					(*CommServiceStart)( CommService *s );
	int					(*CommServiceStop)( CommService *s );
	DataForm			*(*CommServiceSendMsg)( CommService *s, DataForm *df );
	DataForm			*(*CommServiceSendMsgDirect)(  CommFCConnection *con, DataForm *df );
	CommFCConnection 	*(*CommServiceAddConnection)( CommService *s, Socket *socket, char *addr, char *id, int type );
	//CommFCConnection 	*(*CommServiceAddConnection)( void *sb, Socket *socket, char *addr, char *id, int type );
	int					(*CommServiceDelConnection)( CommService* s, CommFCConnection *loccon, Socket *sock );
	int					(*CommServiceRegisterEvent)( CommFCConnection *con, Socket *socket );
	int					(*CommServiceUnRegisterEvent)( CommFCConnection *con, Socket *socket );
}CommServiceInterface;

//
// init function
//

inline void CommServiceInterfaceInit( CommServiceInterface *si )
{
	si->CommFCConnectionNew = CommFCConnectionNew;
	si->CommFCConnectionDelete = CommFCConnectionDelete;
	si->CommServiceNew = CommServiceNew;
	si->CommServiceDelete = CommServiceDelete;
	si->CommServiceStart = CommServiceStart;
	si->CommServiceStop = CommServiceStop;
	si->CommServiceSendMsg = CommServiceSendMsg;
	si->CommServiceSendMsgDirect = CommServiceSendMsgDirect;
	si->CommServiceAddConnection = CommServiceAddConnection;
	si->CommServiceDelConnection = CommServiceDelConnection;
	si->CommServiceRegisterEvent = CommServiceRegisterEvent;
	si->CommServiceUnRegisterEvent = CommServiceUnRegisterEvent;
}

#endif