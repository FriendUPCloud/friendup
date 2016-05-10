
/*



*/

#include "managerservice.h"

//
// create service manager
//

ManagerService *ManagerServiceNew()
{
	ManagerService *serv = NULL;

	if( ( serv = calloc( sizeof( ManagerService ), 1 ) ) != NULL )
	{

		
	}

	return serv;
}

//
// remove service manager
//

void ManagerServiceDelete( ManagerService *s )
{
	if( s )
	{
		free( s );
	}
}

//
// Add new service
//

int ManagerServiceAdd( ManagerService *serv, Service *nserv )
{
	Service *last = serv->services;

	if( serv )
	{
		if( last == NULL )
		{
			serv->services = nserv;
		}else{
			while( last != NULL )
			{
				last = (Service *)last->node.mln_Succ;
			}
		}
	}
}

