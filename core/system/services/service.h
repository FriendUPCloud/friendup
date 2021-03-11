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
 * Service header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SERVICE_SERVICE_H__
#define __SERVICE_SERVICE_H__

#include <core/types.h>
#include <core/thread.h>
#include <stdio.h>
#include <core/nodes.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/ioctl.h>
#include <communication/comm_msg.h>
#include <util/hashmap.h>
#include <network/websocket.h>

//
// ServiceApplication structure
//

typedef struct ServiceAppMsg
{
	int 		a_AppPid;
	pthread_t	a_Thread;
	int			a_Outfd[2];
	int			a_Infd[2];
	fd_set		a_Readfd, a_Writefd;
	
	int			a_Quit;
	int			a_AppQuit;
}ServiceAppMsg;

//
// Maximum buffer size
//

#define SERVICE_BUFFER_MAX 1024

#define SERVICE_TIMEOUT 5000

enum {
	SERVICE_STOPPING = 0,
	SERVICE_STOPPED,
	SERVICE_STARTED,
	SERVICE_PAUSED
};

//
// Service structure
//

typedef struct Service
{
	MinNode node;
	
	char						*s_Command;														// command
	int							s_State;																// status of service
	
	FULONG						s_Version; 															// version information
	void						*s_Handle;															// internal handle
	void						*(*ServiceNew)( void *sysbase, char *command );				// service init
	void						(*ServiceDelete)( struct Service* serv );						// service deinit
	FULONG						(*GetVersion)( void );											// version of service
	FULONG						(*GetRevision)( void );										// revision of service
	int							(*ServiceStart)( struct Service *s );				// start service command
	int							(*ServiceStop)( struct Service *s, char *data );								// stop service command
	int							(*ServiceInstall)( struct Service *s );							// install service
	int							(*ServiceUninstall)( struct Service *s );						// uninstall service
	char						*(*ServiceGetStatus)( struct Service *s, int *len );						// return service status
	char						*(*ServiceCommand)( struct Service *s, const char *serv, const char *cmd, Hashmap *params );	// command
	char						*(*ServiceRun)( struct Service *s );								// do your stuff, can be called remotly
	char						*(*ServiceGetWebGUI)( struct Service *s );		// get web gui
	const char					*(*GetName)( void );												// get service suffix'
	
	void						*s_SpecialData;													// special data for every service
	void						*s_CommService;												// pointer to communication service
	
	void						*s_UserSession;
	
	void						*(*CommServiceSendMsg)( void *commService, DataForm *df );		// pointer to communcation function

}Service;

//
//
//

Service* ServiceOpen( void *sysbase, char* name, long version, void *sm, void *(*sendMessage)(void *a, void *b) );

//
//
//

void ServiceClose( struct Service* service );

// missing definition

int pclose( FILE *st );

#endif // __SERVICE_SERVICE_H__
