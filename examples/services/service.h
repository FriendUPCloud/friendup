

#ifndef __SERVICE_H__
#define __SERVICE_H__

#include <core/types.h>
#include <core/thread.h>
#include <stdio.h>

/*
remove later
*/

typedef struct MinNode
{
    struct MinNode *mln_Succ, *mln_Pred;
}MinNode;

//
// Maximum buffer size
//

#define SERVICE_BUFFER_MAX 1024

#define SERVICE_TIMEOUT 500000

enum {
	SERVICE_STOPPED = 0,
	SERVICE_STARTED,
	SERVICE_PAUSED
};

typedef struct Service
{
	FThread 	*s_Thread;
	
//	FILE 		*s_ReadPipe;
	FILE 		*s_Pipe;
	BYTE		*s_Buffer;
	char 		*s_Command;
	BOOL 		s_State;
	
	struct MinNode	node;
}Service;

//
//
//

Service *ServiceNew( char *command, BOOL autostart );

//
//
//

void ServiceDelete( Service *s );

//
//
//

int ServiceStart( Service *s );

//
//
//

int ServiceStop( Service *s );

//
//
//

int ServiceThread( FThread *this );

#endif // __SERVICE_H__
