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
 *  PHP auth module code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2017
 */

#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <openssl/sha.h>
#include <string.h>
#include <interface/properties_interface.h>
#include <system/systembase.h>
#include <util/sha256.h>
#include <network/websocket_client.h>
#include <network/http.h>
#include <system/web_util.h>

#define LIB_NAME "php.authmod"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//


typedef struct SpecialData
{
	char				*sd_ModuleType;
	char 			*sd_ModulePath;
	EModule 		*sd_EModule;
	module_run_func_t RunMod;
} SpecialData;

//
// Init library
//

int libInit( AuthMod *l, void *sb )
{
	DEBUG("[PHPAUTH] libinit\n");

	if( ( l->SpecialData = FCalloc( 1, sizeof( struct SpecialData ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for special data!\n");
		return -1;
	}
	SpecialData *sd = l->SpecialData;

	l->am_Name = LIB_NAME;
	l->am_Version = LIB_VERSION;
	l->sb = sb;
	char *defaultAuth = NULL;
	char loginmodule[ 256 ];
	char modules[ 512 ];
	
	strcpy( loginmodule, "modules/login/module.php" );
	
	// modules/name/module.php
	
	sd->sd_ModuleType = StringDuplicate("login");
	
	char tempText[ 512 ];
	snprintf( tempText, sizeof(tempText), "module/%s/module.php", sd->sd_ModuleType );
	sd->sd_ModulePath = StringDuplicate( tempText );
	
	SystemBase *locsys = (SystemBase *)sb;
	sd->sd_EModule = locsys->sl_Modules;
	
	while( sd->sd_EModule != NULL )
	{
		if( sd->sd_EModule->GetSuffix != NULL )
		{
			DEBUG("[PHPAUTH] sd->sd_EModule->Name %s suffix %s\n", sd->sd_EModule->em_Name, sd->sd_EModule->GetSuffix() );
			
			if( strcmp( sd->sd_EModule->GetSuffix(), "php" ) == 0 )
			{
				sd->RunMod = sd->sd_EModule->Run;
				break;
			}
		}
		sd->sd_EModule = (EModule *)sd->sd_EModule->node.mln_Succ;
	}
	
	return 0;
}

//
// Close library
//

void libClose( struct AuthMod *l )
{
	if( l->SpecialData != NULL )
	{
		SpecialData *sd = (SpecialData *)l->SpecialData;
		
		if( sd->sd_ModuleType != NULL )
		{
			FFree( sd->sd_ModuleType );
		}
		
		if( sd->sd_ModulePath != NULL )
		{
			FFree( sd->sd_ModulePath );
		}
		
		FFree( l->SpecialData );
	}
	
	DEBUG("[PHPAUTH] close\n");
}

//
//
//

long GetVersion(void)
{
	return LIB_VERSION;
}

long GetRevision(void)
{
	return LIB_REVISION;
}

/*

#define FUP_AUTHERR_PASSWORD	1
#define FUP_AUTHERR_TIMEOUT		2
#define FUP_AUTHERR_UPDATE		3
#define FUP_AUTHERR_USRNOTFOUND	4
#define FUP_AUTHERR_WRONGSESID	5
#define FUP_AUTHERR_USER		6

//
// check password
//

FBOOL CheckPassword( struct AuthMod *l, Http *r, User *usr, char *pass, FULONG *blockTime )
{
	return FALSE;
}

//
// update password
//

int UpdatePassword( struct AuthMod *l, Http *r, User *usr, char *pass )
{
	
	return 0;
}

//
// get all users from DB
//

User *GetAllUsers( struct AuthMod *l, Http * r )
{
	return NULL;
}

//
// is user in admin group
//

FBOOL UserIsAdmin( struct AuthMod *l, Http *r, User *usr )
{
	return FALSE;
}

//
// is user in admin group
//

FBOOL UserIsAdminByAuthID( struct AuthMod *l, Http *r, char *auth )
{
	return FALSE;
}

//
// authenticate user
//

UserSession *Authenticate( struct AuthMod *l, Http *r, struct UserSession *logsess, char *name, char *pass, char *devname, char *sessionId, FULONG *blockTime )
{
	DEBUG("[PHPAUTH] Authenticate PHP\n");
	*/
/*
	// Send both get and post
	int size = 0;
	
	if( request != NULL )
	{
		SpecialData *sd = (SpecialData *)l->SpecialData;
		SystemBase *sb = (SystemBase *)l->sb;
		
		FBOOL both = request->content && request->uri->queryRaw ? TRUE : FALSE;
		if( request->content != NULL ) size += strlen( request->content );
		if( request->uri->queryRaw != NULL ) size += strlen( request->uri->queryRaw );
		
		char *allArgs = FCalloc( 1, size + 100 + ( both ? 2 : 1 ) );
		if( both == TRUE )
		{
			sprintf( allArgs, "%s&%s", request->content, request->uri->queryRaw );
		}
		else if( request->content )
		{
			sprintf( allArgs, "%s", request->content );
		}
		else
		{
			sprintf( allArgs, "%s", request->uri->queryRaw );
		}
		
		if( sb->sl_ModuleNames != NULL )
		{
			strcat( allArgs, "&modules=" );
			strcat( allArgs, sb->sl_ModuleNames );
		}
		
		char *data = NULL;
		int dataLength = 0;
		
		if( sd->RunMod != NULL )
		{
			// Execute
		
			//data = sd->RunMod( SLIB, sd->sd_ModuleType, sd->sd_ModulePath, allArgs, &dataLength );
		}
		
		FFree( allArgs );
		
		if( data != NULL )
		{

			// 5. Piped response will be output!
			char *ltype  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Type"   ) : NULL;
			char *length = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Length" ) : NULL;
			

			char *datastart = strstr( data, "---http-headers-end---" );
			if( datastart != NULL )
			{
				datastart += 23;
				if( length == NULL )
				{
					length = FCalloc( 64, 1 );
					sprintf( length, "%ld", dataLength - ( datastart - data ) );
					char *trimmed = FCalloc( strlen( length )+1, 1 );
					if( trimmed != NULL )
					{
						sprintf( trimmed, "%s", length );
					}
					FFree( length );
					length = trimmed;
				}
			}
			
			if( ltype ){ FFree( ltype ); ltype = NULL;}
			if( length ){ FFree( length ); length = NULL; }
			
			FFree( data );
		}
	}
	*/
/*
	return NULL;
}

//
// logout
//

void Logout( struct AuthMod *l, Http *r, const char *name )
{
	
}

//
//
//

User *IsSessionValid( struct AuthMod *l, Http *r, const char *sessionId )
{
	return NULL;
}

//
// Create user in database
//

int UserCreate( struct AuthMod *l, Http *r, User *usr )
{
	return 0;
}

//
// Set User Full Name
//

void SetAttribute( struct AuthMod *l, Http *r, struct User *u, const char *param, void *val )
{

}

//
// Check if user has a textual permission, like module or filesystem
// in concert with applications
//

int UserAppPermission( struct AuthMod *l,Http *r,  int userId, int applicationId, const char *permission )
{

	return -1;
}

//
// Load user assigned groups
//

int AssignGroupToUser( struct AuthMod *l, User *usr )
{
	return 3;
}

//
// assign user applications to user
//

int AssignApplicationsToUser( struct AuthMod *l, User *usr )
{
	return 0;
}
*/
