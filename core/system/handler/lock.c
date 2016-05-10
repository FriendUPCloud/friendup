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

#include "lock.h"
#include <system/systembase.h>

extern SystemBase *SLIB;

#define LOCK_TIMEOUT 100000

//
//
//

void LockFree( Lock *lck )
{
	if( lck != NULL )
	{
		if( lck->l_Path != NULL )
		{
			FFree( lck->l_Path );
		}
		FFree( lck );
	}
}

//
//
//

int LockNew( User *usr, char *path, int type )
{
	Lock lck;
	lck.l_LockTime = 1;// time();
	lck.l_Path = path;
	lck.l_Type = type;
	
	MYSQLLibrary *sqllib = SLIB->LibraryMYSQLGet( SLIB );
	if( sqllib != NULL )
	{
		switch( type )	// write locks should also notify read users to read
		{
			case LOCK_READ:
				{
				
				}
				break;
				
			case LOCK_READ_EXCLUSIVE:
				{
					char tmp[ 1024 ];
					int entries = 0;
					Lock *dblck = sqllib->Load( sqllib, LockDesc, tmp, &entries );
					Lock *curlck;
					
					while( dblck )
					{
						curlck = dblck;
						dblck = (Lock *)dblck->node.mln_Succ;
						
						LockFree( curlck );
					}
				
				}
				break;
				
			case LOCK_WRITE:
				{
					char tmp[ 1024 ];
					//int rec =sqllib->NumberOfRecords( sqllib, tmp );
				}
				break;
		}
		
		SLIB->LibraryMYSQLDrop( SLIB, sqllib );
	}
	else
	{
		return -1;
	}
	
	return 0;
}

//
//
//

int LockDelete( User *usr, char *path )
{
	return 0;
}

