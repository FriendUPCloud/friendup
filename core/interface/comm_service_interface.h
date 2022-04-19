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
 *  Communication Service Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 03/01/2017
 */
#ifndef __INTERFACE_COMM_SERVICE_INTERFACE_H__
#define __INTERFACE_COMM_SERVICE_INTERFACE_H__

#include <communication/comm_service.h>
#include <communication/comm_service_client.h>

typedef struct CommServiceInterface
{
	FConnection			*(*FConnectionNew)( const char *address, const char *name, int type, void *service );
	void				(*FConnectionDelete)( FConnection *con );
	CommService			*(*CommServiceNew)( int port, int secured, void *sb, int maxev, int bufsiz );
	void				(*CommServiceDelete)( CommService *s );
	int					(*CommServiceStart)( CommService *s );
	int					(*CommServiceStop)( CommService *s );
	DataForm			*(*CommServiceSendMsg)( CommService *s, DataForm *df );
	DataForm			*(*CommServiceSendMsgDirect)(  FConnection *con, DataForm *df );
	FConnection 		*(*CommServiceAddConnection)( CommService *s, Socket *socket, char *name, char *addr, char *recvfcid, int type, int node );
	int					(*CommServiceDelConnection)( CommService* s, FConnection *loccon, Socket *sock );
	int					(*CommServiceRegisterEvent)( FConnection *con, Socket *socket );
	int					(*CommServiceUnRegisterEvent)( FConnection *con, Socket *socket );
}CommServiceInterface;

//
// init function
//

static inline void CommServiceInterfaceInit( CommServiceInterface *si )
{
	si->FConnectionNew = FConnectionNew;
	si->FConnectionDelete = FConnectionDelete;
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
