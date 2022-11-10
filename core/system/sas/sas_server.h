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
 *  Shared Application Session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_SAS_SAS_SESSION_H__
#define __SYSTEM_SAS_SAS_SESSION_H__

#include <time.h>
#include <core/types.h>
#include <db/sqllib.h>
#include <system/user/user.h>
#include <system/user/user_session.h>
#include <system/invar/invar.h>

enum {
	SASS_NEW = 0,
	SASS_DISABLED
};

//
// Application session
//

typedef struct SASServer
{
	FULONG				sass_ID;

	char				*sass_IP;
	FQUAD				sass_Sessions;
	int					sass_Status;
	
	MinNode				node;
}SASServer;

static const FULONG FSASServerDesc[] = { 
    SQLT_TABNAME, (FULONG)"FSASServer",       SQLT_STRUCTSIZE, sizeof( struct SASServer ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct SASServer, sass_ID ), 
	SQLT_STR,     (FULONG)"IP",          offsetof( struct SASServer, sass_IP ), 
	SQLT_INT,     (FULONG)"Sessions",    offsetof( struct SASServer, sass_Sessions ),
	SQLT_INT,     (FULONG)"Status",      offsetof( struct SASServer, sass_Status ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct SASServer, node ),
	SQLT_END 
};

#endif // __APP_SESSION_H__
