

#include <stdio.h>
#include <core/types.h>

#include "managerservice.h"
#include "service.h"

int main( int argc, char *argv )
{
	ManagerService *ms;

	if( ( ms = ManagerServiceNew() ) != NULL )
	{
		printf("ManagerServicesStarted\n");
		Service *serv = NULL;
		//if( serv != NULL )
		{
			int option = 0;
			
			while( option != 10 )
			{
				printf("Enter option: 1 Start 2 Stop 10 quit\n");
 				scanf( "%d", &option );
				switch( option )
				{
					case 1:
						if( serv == NULL )
						{
							serv = ServiceNew( "./testapp", TRUE );
						}else{
							
						}
						break;
				}
			}
			
			ServiceDelete( serv );
		}

		ManagerServiceDelete( ms );
	}

	return 0;
}

