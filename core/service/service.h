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
#include "comm_msg.h"
#include <util/hashmap.h>

//
// ServiceApplication structure
//

typedef struct ServiceAppMsg
{
	int 		a_AppPid;
	pthread_t	a_Thread;
	
//	int			a_Pipes[2][2];
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
	SERVICE_STOPPED = 0,
	SERVICE_STARTED,
	SERVICE_PAUSED
};

//
// Service structure
//

typedef struct Service
{
	MinNode node;
	
	char		 				*s_Command;														// command
	int 						s_State;																// status of service
	
	ULONG					s_Version; 															// version information
	void						*s_Handle;															// internal handle
	void						*(*ServiceNew)( char *command );				// service init
	void						(*ServiceDelete)( struct Service* serv );						// service deinit
	ULONG					(*GetVersion)( void );											// version of service
	ULONG 				(*GetRevision)( void );										// revision of service
	int 						(*ServiceStart)( struct Service *s );								// start service command
	int 						(*ServiceStop)( struct Service *s );								// stop service command
	int 						(*ServiceInstall)( struct Service *s );							// install service
	int 						(*ServiceUninstall)( struct Service *s );						// uninstall service
	int 						(*ServiceGetStatus)( struct Service *s );						// return service status
	int						(*ServiceCommand)( struct Service *s, const char *cmd, Hashmap *params );	// command
	char						*(*ServiceRun)( struct Service *s );								// do your stuff, can be called remotly
	char 					*(*ServiceGetWebGUI)( struct Service *s );		// get web gui
	const char 			*(*GetName)( void );												// get service suffix'
	
	void 						*s_SpecialData;													// special data for every service
	void 						*s_CommService;												// pointer to communication service
	
	DataForm 			(*CommServiceSendMsg)( void *commService, DataForm *df );		// pointer to communcation function

}Service;

Service* ServiceOpen( char* name, long version, void *sm, void (*sendMessage)(void *a, void *b) );

void ServiceClose( struct Service* service );

// missing definition

int pclose( FILE *st );

#endif // __SERVICE_SERVICE_H__
