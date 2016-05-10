
/*

	Service Manager

*/

#include "service.h"

typedef struct ManagerService
{
	Service *services;

}ManagerService;


ManagerService *ManagerServiceNew();

void ManagerServiceDelete( ManagerService *s );

int ManagerServiceAdd( ManagerService *serv, Service *nserv );

