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

#ifndef __HANDLER_FILE_H__
#define __HANDLER_FILE_H__

//#include "fsys.h"
#include <core/types.h>
#include <util/tagitem.h>
#include <mysql/mysqllibrary.h>
//#include <handler/dosdriver.h>

//
//
//

enum {
	FType_File = 0,
	FType_Directory
};

#define FILE_MAX_BUFFER	6400

//
// File structure
//

typedef struct File
{
	ULONG											f_ID;               // ID in database
	struct MinNode                              node;               // link to another files, used by Mount
	//struct MinNode	f_SubEntries;	// files inside directory
	//struct File 	*parent;
	
	char											*f_Name;            // name of file
	//char 										*f_SharedName;		// when device is shared then name = mail+devname
	char											*f_Path;            // path
	char 										*f_SessionID;
	//char 										*f_AuthID;
	int											f_Type;             // type
	int											f_Raw;              // Do read in raw mode?
	char											*f_FSysName;        // filesystem name required by database
	void											*f_DOSDriver;
	void											*f_FSys;            // filesystem type
	void											*f_User;            // user which mounted device / or file (or owner)
																			// if user != current user device is shared
	UQUAD									f_Size;             // file size
	UQUAD									f_Position;         // position where user stopped to read/write
	ULONG										f_DataPassed;       // size in bytes, to read or write (inside buffer)
	char											*f_Buffer;          // [ FILE_MAX_BUFFER ];
	
	struct File								*f_SharedFile;		// points to shared device
	void											*f_SpecialData;     // pointer to special data
}File;

//
// Device structure
//
/*
typedef struct Device
{
	struct File d_File;
	//struct File *d_FileHandlers;	// opened files by users, we should also create lock table to
									// set access to files
	
	
	
	//void		*d_SpecialData;		// special data, different device can hold different data
}Device;*/

/*
 
 Mounted devices list in database
 
CREATE TABLE `FDevice` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `Name` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

static const ULONG DeviceTDesc[] = {
	SQLT_TABNAME, (ULONG)"FDevice", 
	SQLT_STRUCTSIZE, (ULONG)sizeof( File ), 
	SQLT_IDINT, (ULONG)"ID", 
	SQLT_NODE, (ULONG)NULL, 
	SQLT_STR, (ULONG)"NAME", 
	SQLT_STR, (ULONG)"PATH",
	SQLT_INT, (ULONG)"TYPE",
	SQLT_STR, (ULONG)"FSYSTYPE_NAME",
	SQLT_SKIPBYTES,4,
	SQLT_END 
};



#endif // __HANDLER_FILE_H__
