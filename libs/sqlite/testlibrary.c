/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
 * 
 * 
 */

#include <stddef.h>
#include <db/sqllib.h>
#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <core/nodes.h>
#include <time.h>

/*
 *  CREATE TABLE IF NOT EXISTS `Test` ( 
   `name` varchar(255),
   `surname` varchar(255),
   `id` bigint(20) NOT NULL AUTO_INCREMENT,
   `borndate` timestamp,
   PRIMARY KEY (`id`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */

typedef struct UserT
{
	MinNode node;
	int id;
	char *name;
	char *surname;
	struct tm ts;
	
}UserT;

//
// this structure must be in same order as it is in DB!
//

static FULONG UserTDesc[] = { SQLT_TABNAME, "Test", SQLT_STRUCTSIZE, sizeof( UserT ), 
	SQLT_STR, "name", offsetof( struct UserT, name ),
	SQLT_STR, "surname", offsetof( struct UserT, surname ),
	SQLT_IDINT, "id", offsetof( struct UserT, id ), 
	SQLT_DATETIME, "borndate", offsetof( struct UserT, ts ), 
	SQLT_NODE, "node", offsetof( struct UserT, node ),
	SQLT_END };

static char *SQL_CREATE = "CREATE TABLE Test( \
name VARCHAR(255), \
surname VARCHAR(255),\
id INT,\
borndate DATETIME );";
	
int main()
{
	struct SQLLibrary *sqllib;

	if( ( sqllib = (struct SQLLibrary *)LibraryOpen( NULL,  "sqlite.library", 0 ) ) != NULL )
	{
		if( 0 == sqllib->Connect( sqllib, NULL, "test.db", NULL, NULL, 0 ) )
		{
			DEBUG("Library opened! version %d revision %d\n", sqllib->GetVersion(), sqllib->GetRevision() );
		
			struct UserT *ut, *su;
			
			sqllib->QueryWithoutResults( sqllib, SQL_CREATE );
		
			int size = 0;
			if( ( ut = sqllib->Load( sqllib, UserTDesc, "`name` = 'wwew';", &size ) ) != NULL )
			{
				su = ut;
				while( ut != NULL )
				{
					INFO("MYSQLTEST pointer to name %p\n", ut->name );
					INFO("MYSQLTEST database contain info id %d  name %s surname %s\n", ut->id, ut->name, ut->surname );
					ut = ut->node.mln_Succ;
				}

				free( su->name );
				su->name = "hello";
			
				su->ts.tm_mon = 1;
			
				sqllib->Update( sqllib, UserTDesc, su );
			
				//sqllib->Update( sqllib, ut, UserTDesc );
				//sqllib->Save( sqllib, ut, UserTDesc );
			
				free( ut );
			}
			else
			{
				FERROR("User not found!\n");
			
				UserT luser;
				luser.name = "wwew";
				luser.surname = "dupa";
			
				memset( &(luser.ts), 0, sizeof( struct tm ) );
				luser.ts.tm_year = 2015;
				luser.ts.tm_mon = 4;
				luser.ts.tm_mday = 2;
				luser.ts.tm_hour = 12;
				luser.ts.tm_min = 32;
				luser.ts.tm_sec = 22;
			
				/*
				if( sqllib->Save( sqllib, UserTDesc, &luser ) == 0 )
				{
					INFO("Data stored with id %d!\n", luser.id );
				}
				else
				{
					FERROR("Cannot store data!\n");
				}
				*/
			}
			sqllib->Disconnect( sqllib );
		}
		LibraryClose( (struct Library *)sqllib );
	}

return 0;
}

