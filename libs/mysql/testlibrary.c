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

/*
 * 
 * 
 */

#include <stddef.h>
#include "mysqllibrary.h"
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

static ULONG UserTDesc[] = { SQLT_TABNAME, "Test", SQLT_STRUCTSIZE, sizeof( UserT ), 
	SQLT_STR, "name", offsetof( struct UserT, name ),
	SQLT_STR, "surname", offsetof( struct UserT, surname ),
	SQLT_IDINT, "id", offsetof( struct UserT, id ), 
	SQLT_TIMESTAMP, "borndate", offsetof( struct UserT, ts ), 
	SQLT_NODE, "node", offsetof( struct UserT, node ),
	SQLT_END };

int main()
{
	struct MYSQLLibrary *sqllib;

	if( ( sqllib = (struct UserLibrary *)LibraryOpen( "mysql.library", 0 ) ) != NULL )
	{

		DEBUG("Library opened! version %d revision %d\n", sqllib->GetVersion(), sqllib->GetRevision() );
		
		struct UserT *ut, *su;
		
		//DEBUG("Test pointers %p  %p  %p\n", &(ut->id), &(ut->name), &(ut->pass) );
		
		if( ( ut = sqllib->Load( sqllib, UserTDesc, "name = 'wweew'" ) ) != NULL )
		{
			su = ut;
			while( ut != NULL )
			{
				INFO("MYSQLTEST pointer to name %p\n", ut->name );
				INFO("MYSQLTEST database contain info id %d  name %s surname %s\n", ut->id, ut->name, ut->surname );
				ut = ut->node.mln_Succ;
			}
			DEBUG("Before set name 1\n");
			
			free( su->name );
			DEBUG("Before set name\n");
			su->name = "hello";
			
			su->ts.tm_mon = 1;
			
			sqllib->Update( sqllib, UserTDesc, su );
			
			//sqllib->Update( sqllib, ut, UserTDesc );
			
			
			
			//sqllib->Save( sqllib, ut, UserTDesc );
			
			free( ut );
		}
		else
		{
			ERROR("User not found!\n");
			
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
			
			if( sqllib->Save( sqllib, UserTDesc, &luser ) == 0 )
			{
				INFO("Data stored with id %d!\n", luser.id );
			}
			else
			{
				ERROR("Cannot store data!\n");
			}
		}
		
		LibraryClose( (struct Library *)sqllib );
	}

return 0;
}

