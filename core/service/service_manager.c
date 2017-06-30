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


#include <service/service_manager.h>
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <service/comm_msg.h>

/**
 * Create new ServiceManager
 *
 * @param fcm pointer to  FriendCoreManager
 * @return new pointer to ServiceManager structure
 */

ServiceManager *ServiceManagerNew( void *fcm )
{
	ServiceManager *smgr = FCalloc( 1, sizeof( ServiceManager ) );
	if( smgr != NULL )
	{
		char tempString[ 1024 ];

		smgr->sm_FCM = fcm;
		
		getcwd( tempString, sizeof ( tempString ) );

		smgr->sm_ServicesPath = FCalloc( 1025, sizeof( char ) );
		if( smgr->sm_ServicesPath == NULL )
		{
			FFree( smgr );
			FERROR("Cannot allocate memory for ServiceManager!\n");
			return NULL;
		}

		strcpy( smgr->sm_ServicesPath, tempString );
		strcat( smgr->sm_ServicesPath, "/services/");
		// all services will be avaiable in FriendCore folder/services/ subfolder

		DIR           *d;
		struct dirent *dir;
		d = opendir( smgr->sm_ServicesPath );
	
		if( d == NULL )
		{
			// try to open files from libs/ directory
			strcpy( smgr->sm_ServicesPath, tempString );
			strcat( smgr->sm_ServicesPath, "/services/");
			d = opendir( smgr->sm_ServicesPath );
		}
	
		if( d )
		{

			while( ( dir = readdir( d ) ) != NULL )
			{
				if( strncmp( dir->d_name, ".", 1 ) == 0 || strncmp( dir->d_name, "..", 2 ) == 0 )
				{
					continue;
				}

				snprintf( tempString, sizeof(tempString), "%s%s", smgr->sm_ServicesPath, dir->d_name );
				
				struct stat statbuf;
				if ( stat( tempString, &statbuf ) == 0 )
				{
					if( S_ISDIR( statbuf.st_mode ) )
					{
						
					}
					else
					{
						Service *locserv = ServiceOpen( SLIB, tempString, 0, (void *)smgr, (void *)CommServiceSendMsg );
				
						if( locserv != NULL )
						{
							//locserv->ServiceNew( tempString );

							DEBUG("SERVICE created, service %s added to system\n", locserv->GetName() );
					
							locserv ->node.mln_Succ = (MinNode *)smgr->sm_Services;
							smgr->sm_Services = locserv;
						}
						else
						{
							Log( FLOG_ERROR,"Cannot load service %s\n", dir->d_name );
						}
					}
				}
			}
			closedir( d );
		}
	}
	
	return smgr;
}

/**
 * Delete ServiceManager
 *
 * @param smgr pointer to ServiceManager which will be deleted
 */
void ServiceManagerDelete( ServiceManager *smgr )
{
	if( smgr != NULL )
	{
		Service *lserv = smgr->sm_Services;
		Service *rserv = smgr->sm_Services;
		// release and free all modules

		while( lserv != NULL )
		{
			rserv = lserv;
			lserv = (Service *)lserv->node.mln_Succ;
			DEBUG("Remove Service %s\n", rserv->GetName() );
			ServiceClose( rserv );
		}

		if( smgr->sm_ServicesPath )
		{
			FFree( smgr->sm_ServicesPath );
			smgr->sm_ServicesPath = NULL;
		}
	
		FFree( smgr );
	}
	else
	{
		DEBUG("ServerManager = NULL\n");
	}
	
	Log( FLOG_INFO,"ServiceManager delete END\n");
}

/**
 * Find service by the name
 *
 * @param smgr pointer to ServiceManager
 * @param name of the service
 * @return pointer to Service structure or NULL when it couldnt be found
 */

Service *ServiceManagerGetByName( ServiceManager *smgr, char *name )
{
	Service *currServ = smgr->sm_Services;
	
	DEBUG("Get service by name\n");
	
	while( currServ != NULL )
	{
		if( currServ->GetName() != NULL )
		{
			if( strcmp( name, currServ->GetName() ) == 0 )
			{
				DEBUG("Serice returned %s\n", currServ->GetName() );
				return currServ;
			}
		}
		currServ = (Service *) currServ->node.mln_Succ;
	}
	
	DEBUG("Couldn't find service by name '%s'\n", name );
	
	return NULL;
}

/**
 * Change service state
 *
 * @param smgr pointer to ServiceManager
 * @param srv pointer to Service on which change will be done
 * @param state new service state
 * @return 0 when success, otherwise error number
 */

int ServiceManagerChangeServiceState( ServiceManager *smgr, Service *srv, int state )
{
	return 0;
}

//
// simple structure to hold information about servers
//

typedef struct SServ
{
	struct MinNode node;
	FBYTE id[ FRIEND_CORE_MANAGER_ID_SIZE ];		// id of the device
	FBYTE *sinfo;														// pointer to services information
}SServ;

/**
 * ServiceManager web handler
 *
 * @param lfcm pointer to FriendCoreManager
 * @param urlpath pointer to memory where table with path is stored
 * @param request pointer to request sent by client
 * @return reponse in Http structure
 */

Http *ServiceManagerWebRequest( void *lfcm, char **urlpath, Http* request )
{
	FriendCoreManager *fcm = (FriendCoreManager *)lfcm;
	char *serviceName = NULL;
	int newStatus = -1;
	Service *selService = NULL;
	
	DEBUG("ServiceManagerWebRequest\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	//
	// list all avaiable services
	//
	
	if( strcmp( urlpath[ 0 ], "list" ) == 0 )
	{
		int pos = 0;
		BufString *nbs = BufStringNew();
		char tmp[ 8112 ];
		
		DEBUG("list all avaiable  services\n");
		
		//
		// checking services on ALL Friends servers
		//
		
		MsgItem tags[] = {
			{ ID_FCRE, 0, MSG_GROUP_START },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_QUER, (FULONG)4, (FULONG)"ALL" },
			{ ID_SVIN, 0, (FULONG)NULL },
			{ MSG_GROUP_END, MSG_GROUP_END, MSG_GROUP_END },
			{ MSG_END, MSG_END, MSG_END }
		};

		SServ *servInfo = NULL;
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG2("Get services from all servers\n");
				//const char *t = "hello";
		DataForm *recvdf = CommServiceSendMsg( fcm->fcm_CommService, df );
		
		if( recvdf != NULL)
		{
			DEBUG2("DATAFORM Received %ld\n", recvdf->df_Size );
			/*
			unsigned int i=0;
			char *d = (char *)recvdf;
			for( i = 0 ; i < recvdf->df_Size ; i++ )
			{
				printf("%c", d[ i ] );
			}
			printf("end\n");
			*/
		}
		
		DataFormDelete( df );
		
		//
		// we must hold information about servers and services on them
		//
		// prepare request to all servers
		
		
		FBYTE *ld = DataFormFind( recvdf, ID_RESP );
		if( ld != NULL )
		{
			DataForm *respdf = (DataForm *)ld;
			SServ *lss = servInfo;
			
			DEBUG("Found information about services\n");
			
			while( respdf->df_ID == ID_RESP )
			{
				DEBUG("ServiceManager add entry '%s'\n",  ld+COMM_MSG_HEADER_SIZE + 32 );
				SServ * li = FCalloc( 1, sizeof( SServ ) );
				if( li != NULL )
				{
				
					// we should copy whole string, but atm we are doing copy of name
					//memcpy( li->id, ld+COMM_MSG_HEADER_SIZE , FRIEND_CORE_MANAGER_ID_SIZE );
					memcpy( li->id, ld+COMM_MSG_HEADER_SIZE, FRIEND_CORE_MANAGER_ID_SIZE );
				
					li->sinfo = ld+COMM_MSG_HEADER_SIZE + FRIEND_CORE_MANAGER_ID_SIZE;
				
					if( lss != NULL )
					{
						lss->node.mln_Succ = (struct MinNode *) li;
					}
					else
					{
						if( servInfo == NULL )
						{
							servInfo = li;
							lss = li;
						}
					}
					lss = li;
				
					ld += respdf->df_Size;
					respdf = (DataForm *)ld;
				}
				else
				{
					FERROR("Cannot allocate memory for service\n");
				}
			}
			DEBUG("No more server entries\n");
		}
		
		DEBUG("Create list of services\n");
		
		//BufStringAdd( nbs, "[ " );
		BufStringAdd( nbs, "{ \"Services\": [" );
		// should be changed later
		Service *ls = fcm->fcm_ServiceManager->sm_Services;
		
		//
		// going trough local services
		//
		while( ls != NULL )
		{
			int len;
			char *stat = ls->ServiceGetStatus( ls, &len );
			
			if( pos == 0 )
			{
				sprintf( tmp, " { \"Name\": \"%s\" , \"Status\": \"%s\" , ", ls->GetName(), stat );
			}else{
				sprintf( tmp, ",{ \"Name\": \"%s\" , \"Status\": \"%s\" , ", ls->GetName(), stat );
			}
			BufStringAdd( nbs, tmp );
			
			if( stat != NULL )
			{
				FFree( stat );
			}
			
			DEBUG("Service added , server info %p\n", servInfo );
			
			BufStringAdd( nbs, " \"Hosts\" : \"My computer" );
			
			// we add here server on which same service is working
			
			int servicesAdded = 0;
			SServ *checkedServer = servInfo;
			while( checkedServer != NULL )
			{
				DataForm *cdf = (DataForm *)checkedServer->sinfo;
				DEBUG("Services size %ld for server '%s'\n", cdf->df_Size, &(checkedServer->id[ 32 ] ) ); 
				FBYTE *curserv = checkedServer->sinfo + COMM_MSG_HEADER_SIZE;
				
				cdf = (DataForm *)curserv;
				while( cdf->df_ID == ID_SNAM )
				{
					DEBUG("Service found %s  entry size %ld\n", curserv + COMM_MSG_HEADER_SIZE, cdf->df_Size );
					if( strcmp( ls->GetName(), (char *)(curserv + COMM_MSG_HEADER_SIZE) ) == 0 )
					{
						BufStringAdd( nbs, "," );
						BufStringAdd( nbs, (const char *)checkedServer->id );
						servicesAdded++;
						break;
					}
					curserv += cdf->df_Size;
					cdf = (DataForm *)curserv;
				}
				
				checkedServer = (SServ *)checkedServer->node.mln_Succ;
			} // check remote servers
			
			BufStringAdd( nbs, "\" }" );
			
			ls = (Service *)ls->node.mln_Succ;
			pos++;
		}	// going through local services
		
		BufStringAdd( nbs, "] }" );
		
		DEBUG("BEFORE SENDING %s\n", nbs->bs_Buffer );
		
		//
		// send data and release temporary used memory
		//
		
		HttpAddTextContent( response, nbs->bs_Buffer );
		DEBUG("ServiceManager: list return: '%s', Remove server info entries\n", nbs->bs_Buffer );
		
		BufStringDelete( nbs );
		
		SServ *lss = servInfo;
		while( lss != NULL )
		{
			SServ *tmp = lss;
			lss = (SServ *)lss->node.mln_Succ;
			free( tmp );
		}
		
		//free( nbs );
		DataFormDelete( recvdf );
		//HttpWriteAndFree( response );
		DEBUG("Return services list!\n");
		return response;
	}	// list services
	
#define ELEMENT_NAME 0
#define ELEMENT_COMMAND 1
	
	//HashmapElement *el =  HashmapGet( request->parsedPostContent, "Name" );
	//if( el != NULL )
	{
		serviceName = urlpath[ ELEMENT_NAME ]; //el->data;
		
		Service *ls = fcm->fcm_ServiceManager->sm_Services;
		while( ls != NULL )
		{
			DEBUG("Checking avaiable services %s pointer %x\n", ls->GetName(), ls );
			if( strcmp( ls->GetName(), serviceName ) == 0 )
			{
				selService = ls;
				INFO("ServiceFound\n");
				break;
			}
			ls = (Service *)ls->node.mln_Succ;
		}
	}
	
	if( serviceName == NULL )
	{
		FERROR( "ServiceName not passed!\n" );
		HttpAddTextContent( response, "{ \"response\": \"Name argument missing!\"}" );
		//HttpWriteAndFree( response );
		return response;
	}
	/*
	el =  HashmapGet( request->parsedPostContent, "status" );
	if( el != NULL )
	{
		if( (char *)el->data != NULL )
		{
			if( strcmp( (char *)el->data, "start" ) == 0 )
			{
				newStatus = SERVICE_STARTED;
			}else if( strcmp( (char *)el->data, "stop" ) == 0 )
			{
				newStatus = SERVICE_STOPPED;
			}else if( strcmp( (char *)el->data, "pause" ) == 0 )
			{
				newStatus = SERVICE_PAUSED;
			}
		}
	}*/
	
	if( selService == NULL || strlen(serviceName) <= 0 )
	{
		FERROR( "ServiceStatus not passed!\n" );
		HttpAddTextContent( response, "{ \"response\": \"Name argument missing or Service not found!\"}" );
		//HttpWriteAndFree( response );
		return response;
	}
	
	int error = 0;
	
	DEBUG("ServiceManager---------------------------------%s----servicename %s servicename from service %s\n", urlpath[0], serviceName, selService->GetName() );
	
	selService->s_WSI = request->h_WSocket;
	
	DEBUG( "Service Command OK %s !\n", urlpath[ ELEMENT_COMMAND ] );
	
	//
	//
	//
	
	if( strcmp( urlpath[ ELEMENT_COMMAND ], "start" ) == 0 )
	{
		if( selService->ServiceStart != NULL )
		{
			DEBUG("SERVICE START\n");
			selService->ServiceStart( selService );
		}else{
			error = 1;
		}
		
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "stop" ) == 0 )
	{
		if( selService->ServiceStop != NULL )
		{
			HashmapElement *el;
			char *data = NULL;
			
			el =  HashmapGet( request->parsedPostContent, "data" );
			if( el != NULL )
			{
				data = el->data;
			}
			
			selService->ServiceStop( selService, data );	
		}else{
			error = 1;
		}
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "pause" ) == 0 )
	{
		error = 2;
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "install" ) == 0 )
	{
		if( selService->ServiceInstall != NULL )
		{
			selService->ServiceInstall( selService );
		}else{
			error = 1;
		}
		
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "uninstall" ) == 0 )
	{
		if( selService->ServiceUninstall != NULL )
		{
			selService->ServiceUninstall( selService );
		}else{
			error = 1;
		}
		
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "status" ) == 0 )
	{
		int len;
		
		if( selService->ServiceGetStatus != NULL )
		{
			selService->ServiceGetStatus( selService, &len );
		}else{
			error = 1;
		}
		
		HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "command" ) == 0 )
	{
		HashmapElement *el;
		char *ret = NULL;
		
		el =  HashmapGet( request->parsedPostContent, "cmd" );
		if( el != NULL && el->data != NULL )
		{
			char *cmd = el->data;
			char *serv  = NULL;
			
			el =  HashmapGet( request->parsedPostContent, "servers" );
			if( el != NULL && el->data != NULL )
			{
				serv  = el->data;
			}

			if( serv == NULL )
			{
				// temporary call
				ret = selService->ServiceCommand( selService, "ALL", cmd, request->parsedPostContent );
			}
			else
			{
				ret = selService->ServiceCommand( selService, serv, cmd, request->parsedPostContent );
			}

			if( ret != NULL )
			{
				HttpSetContent( response, ret, strlen( ret ) );
			}
			else
			{
				HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
			}
		}
		else
		{
			error = 2;
		}
	}
	
	//
	//
	//
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "getwebguii" ) == 0 )
	{
		DEBUG("GetWebGUI\n");
		char *lresp = selService->ServiceGetWebGUI( selService );
		if( lresp != NULL )
		{
			DEBUG("Service response %s\n", lresp );
			HttpAddTextContent( response, lresp );
		}
		else
		{
			HttpAddTextContent( response, "<div> </div>" );
		}
	}

	return response;
}

