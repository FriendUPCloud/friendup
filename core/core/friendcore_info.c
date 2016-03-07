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

#include "friendcore_info.h"
#include <core/friendcore_manager.h>
#include <core/friend_core.h>

//
//
//

FriendcoreInfo *FriendCoreInfoNew( void *fcm )
{
	FriendcoreInfo *fci;
	
	if( ( fci = FCalloc( 1, sizeof( FriendcoreInfo ) ) ) != NULL )
	{
		fci->fci_FCM = fcm;
	}
	else
	{
		ERROR("Cannot allocate memory for FriendcoreInfo structure\n");
	}
	
	return fci;
}

//
//
//

void FriendCoreInfoDelete( FriendcoreInfo *fci )
{
	if( fci != NULL )
	{
		FFree( fci );
	}
}

//
// Get information about Friend
//

BufString *FriendCoreInfoGet( FriendcoreInfo *fci )
{
	BufString *bs = BufStringNew();
	if( bs != NULL )
	{
		FriendCoreManager *fcm = (FriendCoreManager *)fci->fci_FCM;
	
		char temp[ 2048 ];
	
		BufStringAdd( bs, "{" );
	
		sprintf( temp, " 'FriendCoreName' : '%s', ", fcm->fcm_ID );
		BufStringAdd( bs, temp );
	
		BufStringAdd( bs, "'FriendCores' : " );
		FriendCoreInstance *fc = fcm->fcm_FriendCores;
		int i = 0, j =0;
	
		while( fc != NULL )
		{
			if( i == 0 )
			{
				sprintf( temp, "{ 'ID':'%32s' ,'Port':'%d','Workers':", fc->fci_CoreID, fc->fci_Port );
			}
			else
			{
				sprintf( temp, ", { 'ID':'%32s' ,'Port':'%d','Workers':", fc->fci_CoreID, fc->fci_Port );
			}
			BufStringAdd( bs, temp );
		
			for( j=0 ; j < fc->fci_WorkerManager->wm_MaxWorkers ; j++ )
			{
				Worker *wrk = fc->fci_WorkerManager->wm_Workers[ j ];
				if( j == 0 )
				{
					sprintf( temp, "{'Number':'%d', 'State':'%d', 'Quit':'%d', 'AvgUsage':'%f''}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
				}
				else
				{
					sprintf( temp, ",{'Number':'%d', 'State':'%d', 'Quit':'%d', 'AvgUsage':'%f''}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
				}
			}
		
			BufStringAdd( bs, "}" );
		
			i++;
			fc = (FriendCoreInstance *)fc->node.mln_Succ;
		}
	
		BufStringAdd( bs, "}" );
	}
	
	return bs;
}
