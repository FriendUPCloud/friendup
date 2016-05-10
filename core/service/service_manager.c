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

#include <service/service_manager.h>
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <service/comm_msg.h>


//
// Create new ServiceManager
//

ServiceManager *ServiceManagerNew( void *fcm )
{
	ServiceManager *smgr = calloc( sizeof( ServiceManager ), 1 );
	if( smgr != NULL )
	{
		char tempString[ 1024 ];
		
		//DEBUG("Service Manager created\n");
		smgr->sm_FCM = fcm;
		
		getcwd( tempString, sizeof ( tempString ) );

		smgr->sm_ServicesPath = calloc( 1025, sizeof( char ) );
		if( smgr->sm_ServicesPath == NULL )
		{
			free( smgr );
			ERROR("Cannot allocate memory for ServiceManager!\n");
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
			//DEBUG(" Trying to find services in %s\n", smgr->sm_ServicesPath );
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
				
				sprintf( tempString, "%s%s", smgr->sm_ServicesPath, dir->d_name );

				DEBUG(" %s fullmodpath %s\n", dir->d_name, tempString );

				Service *locserv = ServiceOpen( tempString, 0, (void *)smgr, (void *)CommServiceSendMsg );
				
				if( locserv != NULL )
				{
					//locserv->ServiceNew( tempString );
					
					DEBUG("SERVICE created, service %s added to system\n", locserv->GetName() );
					if( smgr->sm_Services == NULL )
					{
						smgr->sm_Services = locserv;
					}
					else
					{
						Service *lserv = smgr->sm_Services;

						while( lserv->node.mln_Succ != NULL )
						{
							lserv = (Service *)lserv->node.mln_Succ;
							//DEBUG("Parsing modules\n");
						}
						lserv->node.mln_Succ = (struct MinNode *)locserv;	// add new module to list
					}
				}
				else
				{
					ERROR("Cannot load service %s\n", dir->d_name );
				}		
			}
			closedir( d );
		}
	}
	
	
	return smgr;
}

//
// delete ServiceManager
//

void ServiceManagerDelete( ServiceManager *smgr )
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
		DEBUG("Remove Service Closed\n" );
	}
	
	DEBUG("Freeing path\n" );

	if( smgr->sm_ServicesPath )
	{
		free( smgr->sm_ServicesPath );
		smgr->sm_ServicesPath = NULL;
	}
	
	DEBUG("ServiceManager delete\n");
	
	if( smgr )
	{
		free( smgr );
	}
	
	DEBUG("ServiceManager delete END\n");
}

//
// find Service by name
//

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

//
// change state of Service
//

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
	BYTE id[ FRIEND_CORE_MANAGER_ID_SIZE ];		// id of the device
	BYTE *sinfo;														// pointer to services information
}SServ;

//
// Services Manage WebReqest
//

Http *ServiceManagerWebRequest( void *lfcm, char **urlpath, Http* request )
{
	FriendCoreManager *fcm = (FriendCoreManager *)lfcm;
	char *serviceName = NULL;
	int newStatus = -1;
	Service *selService = NULL;
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
		{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
		{TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	DEBUG("ServiceManager: list all services avaiable path \n" );
	
	//
	// list all avaiable services
	//
	
	if( strcmp( urlpath[ 0 ], "list" ) == 0 )
	{
		int pos = 0;
		BufString *nbs = BufStringNew();
		char tmp[ 1024 ];
		
		DEBUG("list\n");
		
		//
		// checking services on ALL Friends servers
		//
		
		int allsize = (strlen("ALL")+1);
		MsgItem tags[] = {
			{ ID_FCRE, 0, NULL },
			{ ID_QUER, (ULONG)allsize, (ULONG)"ALL" },
			{ ID_SVIN, 0, NULL },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
		
		DEBUG("Before creating DataForm\n");
		
		DataForm *df = DataFormNew( tags );
		
				//const char *t = "hello";
		DataForm *recvdf = CommServiceSendMsg( fcm->fcm_CommServiceClient, df );
		
		if( recvdf != NULL)
		{
			DEBUG("DATAFORM Received %ld\n", recvdf->df_Size );
			
			unsigned int i=0;
			char *d = (char *)recvdf;
			for( i = 0 ; i < recvdf->df_Size ; i++ )
			{
				printf("%c", d[ i ] );
			}
			printf("end\n");
		}
		
		//
		// we must hold information about servers and services on them
		
		SServ *servInfo = NULL;
		BYTE *ld = DataFormFind( recvdf, ID_RESP );
		if( ld != NULL )
		{
			DataForm *respdf = (DataForm *)ld;
			SServ *lss = servInfo;
			
			while( respdf->df_ID == ID_RESP )
			{
				DEBUG("ServiceManager add entry '%s'\n",  ld+COMM_MSG_HEADER_SIZE + 32 );
				SServ * li = calloc( 1, sizeof( SServ ) );
				
				// we should copy whole string, but atm we are doing copy of name
				//memcpy( li->id, ld+COMM_MSG_HEADER_SIZE , FRIEND_CORE_MANAGER_ID_SIZE );
				memcpy( li->id, ld+COMM_MSG_HEADER_SIZE, 64 );
				
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
			DEBUG("No more server entries\n");
			// copy ID and point to data
			
			
			//ERROR("RESPONSE FOUND\n");
		}
		
		//BufStringAdd( nbs, "[ " );
		BufStringAdd( nbs, "{ \"Services\": [" );
		// should be changed later
		Service *ls = fcm->fcm_ServiceManager->sm_Services;
		
		//
		// going trough local services
		//
		while( ls != NULL )
		{
			if( pos == 0 )
			{
				sprintf( tmp, " { \"Service\": \"%s\" , \"Status\": \"%d\" , ", ls->GetName(), ls->ServiceGetStatus( ls ) );
			}else{
				sprintf( tmp, ",{ \"Service\": \"%s\" , \"Status\": \"%d\" , ", ls->GetName(), ls->ServiceGetStatus( ls ) );
			}
			BufStringAdd( nbs, tmp );
			
			DEBUG("Service added , server info %p\n", servInfo );
			
			BufStringAdd( nbs, " \"Hosts\" : \"" );
			
			// we add here server on which same service is working
			
			int servicesAdded = 0;
			SServ *checkedServer = servInfo;
			while( checkedServer != NULL )
			{
				DataForm *cdf = (DataForm *)checkedServer->sinfo;
				DEBUG("Services size %ld for server '%s'\n", cdf->df_Size, &(checkedServer->id[ 32 ] ) ); 
				BYTE *curserv = checkedServer->sinfo + COMM_MSG_HEADER_SIZE;
				
				cdf = (DataForm *)curserv;
				while( cdf->df_ID == ID_SNAM )
				{
					DEBUG("Service found %s  entry size %ld\n", curserv + COMM_MSG_HEADER_SIZE, cdf->df_Size );
					if( strcmp( ls->GetName(), (char *)(curserv + COMM_MSG_HEADER_SIZE) ) == 0 )
					{
						if( servicesAdded == 0 )
						{
							BufStringAdd( nbs,  (const char *)checkedServer->id );
						}
						else
						{
							BufStringAdd( nbs, "," );
							BufStringAdd( nbs, (const char *)checkedServer->id );
						}
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
		
		//DEBUG("BEFORE SENDING %s\n", nbs->bs_Buffer );
		
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
		
		//HttpWriteAndFree( response );
		return response;
	}	// list services
	
	HashmapElement *el =  HashmapGet( request->parsedPostContent, "serviceName" );
	if( el != NULL )
	{
		serviceName = (char *)el->data;
		
		Service *ls = fcm->fcm_ServiceManager->sm_Services;
		while( ls != NULL )
		{
			if( strcmp( ls->GetName(), serviceName ) == 0 )
			{
				selService = ls;
				break;
			}
			ls = (Service *)ls->node.mln_Succ;
		}
	}
	
	if( serviceName == NULL )
	{
		ERROR( "ServiceName not passed!\n" );
		HttpAddTextContent( response, "{ \"ErrorMessage\": \"ServiceName argument missing!\"}" );
		//HttpWriteAndFree( response );
		return response;
	}
	
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
	}
	
	if( selService == NULL || strlen(serviceName) <= 0 )
	{
		ERROR( "ServiceStatus not passed!\n" );
		HttpAddTextContent( response, "{ \"ErrorMessage\": \"ServiceName argument missing or Service not found!\"}" );
		//HttpWriteAndFree( response );
		return response;
	}
	int error = 0;
	
	if( strcmp( urlpath[ 0 ], "start" ) == 0 )
	{
		if( selService->ServiceStart != NULL )
		{
			DEBUG("SERVICE START\n");
			selService->ServiceStart( selService );
		}else{
			error = 1;
		}
	}else if( strcmp( urlpath[ 0 ], "stop" ) == 0 )
	{
		if( selService->ServiceStop != NULL )
		{
			selService->ServiceStop( selService );	
		}else{
			error = 1;
		}
	}else if( strcmp( urlpath[ 0 ], "pause" ) == 0 )
	{
		error = 2;
	}else if( strcmp( urlpath[ 0 ], "install" ) == 0 )
	{
		if( selService->ServiceInstall != NULL )
		{
			selService->ServiceInstall( selService );
		}else{
			error = 1;
		}
	}else if( strcmp( urlpath[ 0 ], "uninstall" ) == 0 )
	{
		if( selService->ServiceUninstall != NULL )
		{
			selService->ServiceUninstall( selService );
		}else{
			error = 1;
		}
	}else if( strcmp( urlpath[ 0 ], "status" ) == 0 )
	{
		if( selService->ServiceGetStatus != NULL )
		{
			selService->ServiceGetStatus( selService );
		}else{
			error = 1;
		}
	}else if( strcmp( urlpath[ 0 ], "command" ) == 0 )
	{
		el =  HashmapGet( request->parsedPostContent, "cmd" );
		if( el != NULL )
		{
			if( el->data != NULL )
			{
				//
				// Check if service support command function
				//
				el =  HashmapGet( request->parsedPostContent, "cmd" );
				
				//if( selService->ServiceCommand != NULL && el != NULL )
				{
					// temporary call
					selService->ServiceCommand( selService, "localhost", request->parsedPostContent );
					//selService->ServiceCommand( selService, (char *)el->data );
				}
				/*
				else
				{
					ERROR("Service do not support 'command' option or 'cmd' parameter is missing\n");
				}*/
			}
		}
		else
		{
			error = 2;
		}
	}else if( strcmp( urlpath[ 0 ], "getwebgui" ) == 0 )
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
		//HttpWriteAndFree( response );
		return response;
	}
	
	DEBUG( "Service Command OK %s !\n", urlpath[ 0 ] );
	HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
	//HttpWriteAndFree( response );
	return response;
	
	/*
	 * Http_t* response = HttpNewSimple( 
			HTTP_200_OK, 4,
			"Content-Type", StringDuplicate( "text/plain" ),
			"Connection", StringDuplicate( "close" )
		);
		
		HttpAddTextContent( response, "{ \"HELP\": \"commands: \n" 
				"- user: \n" 
				"\tcreate - create user in database\n" 
				"\tlogin - login user to system\n"
				"\tlogout - logout user from system\n\n"
				"- module - run module\n\n"
				"- device:\n"
				"\tmount - mount device\n"
				"\tunmount - unmount device\n\n"
				"\tlist - list all mounted devices\n"
				"\tlistsys - take all avaiable file systems\n"
				"- file:\n"
				"\tinfo - get information about file/directory\n"
				"\tdir - get all files in directory\n"
				"\trename - rename file or directory\n"
				"\tdelete - delete all files or directory (and all data in directory)\n"
				"\tmakedir - make new directory\n"
				"\texec - run command\n"
				"\tread - read bytes from file\n"
				"\twrite - write files to file\n"
				"\"}" );
		
		HttpWriteAndFree( response, sock );
		result = 200;
	 */

}

