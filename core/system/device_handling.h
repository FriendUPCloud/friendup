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

#ifndef __SYSTEM_DEVICE_HANDLING_H__
#define __SYSTEM_DEVICE_HANDLING_H__

#include <core/types.h>
#include <core/library.h>
#include "systembase.h"

int RescanHandlers( SystemBase *l );

int RescanDOSDrivers( SystemBase *l );

int UnMountFS( struct SystemBase *l, struct TagItem *tl );

int MountFS( struct SystemBase *l, struct TagItem *tl );

File *GetFileByPath( User *usr, char **dstpath, const char *path );

int DeviceMountDB( SystemBase *l, File *rootDev, BOOL mount );


//
// find comma and return position
//

inline int doublePosition( const char *c )
{
	int res = 0;
	
	for( unsigned int i=0 ; i < strlen( c ) ; i++ )
	{
		if( c[ i ] == ':' )
		{
			return i;
		}
	}
	
	return res;
}

//
// Get root File  by its name
//

inline File *GetRootDeviceByName( User *usr, char *devname )
{
//
// Check mounted devices for user

	File *lDev = usr->u_MountedDevs;
	File *actDev = NULL;
	
	while( lDev != NULL )
	{
		//DEBUG("Checking dev act ptr %p next ptr %p\n", lDev, lDev->node.mln_Succ ); 
		DEBUG("devname %s  ldevname %s lfile \n", devname, lDev->f_Name );
		
		if( strcmp( devname, lDev->f_Name ) == 0 )
		{
			if( lDev->f_SharedFile == NULL )
			//if( usr == lDev->f_User )		// if its our current user then we compare name
			{
				actDev = lDev;
			}
			else
			{
				actDev = lDev->f_SharedFile;
			}
			DEBUG("Found file name '%s' path '%s' (%s)\n", 	actDev->f_Name, actDev->f_Path, actDev->f_FSysName );
			break;
		}
		
		lDev = (File *)lDev->node.mln_Succ;
	}
	
	if( actDev == NULL )
	{
		ERROR("Cannot find device by name : %s\n", devname );
	}
	
	return actDev;
}

#endif // __SYSTEM_DEVICE_HANDLING_H__
