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

//
//
// SystemBase
//
//

#ifndef __SYSTEM_SYSTEM_BASE_H_
#define __SYSTEM_SYSTEM_BASE_H_

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>

#include <core/types.h>
#include <core/library.h>
#include <core/friendcore_manager.h>

#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
#include <util/base64.h>
#include <user/userlibrary.h>
#include <core/friendcore_manager.h>

#include <system/handler/fsys.h>
#include <util/buffered_string.h>
#include <mysql/mysqllibrary.h>
#include <application/applicationlibrary.h>
#include <properties/propertieslibrary.h>
#include <system/dictionary/dictionary.h>
#include <z/zlibrary.h>
#include <image/imagelibrary.h>
#include <system/module/module.h>
#include <system/handler/dosdriver.h>
#include <util/log/log.h>
#include <magic.h>
#include <system/cache/cache_manager.h>
#include <libwebsockets.h>

//
// Devices
//

typedef struct Device
{
	char                *d_Type;
	char                *d_Handler;
	char                *d_Language;
	ULONG               d_Version;
	File                *d_FSys;
	pthread_mutex_t     mutex;
} Device;

//
// Mount parameters
//

#define FSys_Mount_Dummy				0x00003000
#define FSys_Mount_Path						(FSys_Mount_Dummy+1)
#define FSys_Mount_Host					(FSys_Mount_Dummy+2)
#define FSys_Mount_Port						(FSys_Mount_Dummy+3)
#define FSys_Mount_Type					(FSys_Mount_Dummy+4)
#define FSys_Mount_Name					(FSys_Mount_Dummy+5)
#define FSys_Mount_User					(FSys_Mount_Dummy+6)
#define FSys_Mount_LoginUser			(FSys_Mount_Dummy+7)
#define FSys_Mount_LoginPass			(FSys_Mount_Dummy+8)
#define FSys_Mount_Module				(FSys_Mount_Dummy+9)
#define FSys_Mount_Owner					(FSys_Mount_Dummy+10)
#define FSys_Mount_ID						(FSys_Mount_Dummy+11)
#define FSys_Mount_Mount 				(FSys_Mount_Dummy+12)

//
// system.library errors
//

#define FSYS_Error_Dummy							0x00000000
#define FSys_Error_NOFSType						(FSYS_Error_Dummy+1)
#define FSys_Error_NOName						(FSYS_Error_Dummy+2)
#define FSys_Error_NOUser							(FSYS_Error_Dummy+3)
#define FSys_Error_DeviceAlreadyMounted (FSYS_Error_Dummy+4)
#define FSys_Error_NOFSAvaiable			 	(FSYS_Error_Dummy+5)
#define FSys_Error_UserNotLoggedIn			(FSYS_Error_Dummy+6)
#define FSys_Error_DeviceNotFound			(FSYS_Error_Dummy+7)
#define FSys_Error_CannotUnmountDevice  (FSYS_Error_Dummy+8)
#define FSys_Error_NODevForUser				(FSYS_Error_Dummy+9)

//
//	library
//

enum {
	LIBRARY_APPLICATION = 1,
	LIBRARY_MYSQL,
	LIBRARY_USER,
	LIBRARY_PROERTIES,
	LIBRARY_Z
};

#define SQLLIB_POOL_NUMBER 32

typedef struct SQLConPool
{
	int inUse;
	MYSQLLibrary *sqllib;
}SQLConPool;

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct SystemBase
{
	char                                *l_Name;	// library name
	ULONG                               l_Version;		// version information
	void                                *handle;

	char                                *sl_ModPath;            // modules path
	EModule                             *sl_Modules;            // avaiable modules
	char                                *sl_FSysPath;           // fsys path
	FHandler                            *sl_Filesystems;        // avaiable filesystems
	DOSDriver                           *sl_DOSDrivers;         // avaiable DOSDrivers
	
	User                                *sl_Sessions;           // logged users with mounted devices
	
	pthread_mutex_t                     mutex;                  // Mutex for systembase
	
	struct UserLibrary                  *ulib;
	//struct SQLConPool			        **sqllib;
	struct SQLConPool                   *sqlpool;
	struct ApplicationLibrary           *alib;
	struct PropertiesLibrary            *plib;
	struct ZLibrary                     *zlib;
	struct ImageLibrary			*ilib;
	
	struct FriendCoreManager            *fcm;						// connection with FriendCores
	CacheManager 								*cm;						// cache manager
	Dictionary                          *sl_Dictionary;		// global dictionary
	
	Application                         sl_apps;					// avaiable applications
	
	int                                 UserLibCounter;						// counter of opened libraries
	int                                 MsqLlibCounter;
	int                                 AppLibCounter;
	int 								PropLibCounter;
	int 								ZLibCounter;
	int 								ImageLibCounter;
	
	magic_t                             sl_Magic;
	
	int                                 sl_Error;					// last error
	
	//struct SystemBase *(*SystemInit)( void );

	void (*SystemClose)( struct SystemBase *l );

	Http  *(*SysWebRequest)( struct SystemBase *l, char **path, Http* request );

	int (*InitSystem)( struct SystemBase *l );

	// user.library structure
	char *(*RunMod)( struct SystemBase *l, const char *mime, const char *path, const char *args, int *length );

	unsigned int (*RunHM)( struct SystemBase *l, const char *mime, const char *path, struct Hashmap *hm );

	int (*MountFS)( struct SystemBase *l, struct TagItem *tl );		// mount FS

	int (*UnMountFS)( struct SystemBase *l, struct TagItem *tl );			// unmount FS

//

	struct UserLibrary *(*LibraryUserGet)( struct SystemBase *l );

	void (*LibraryUserDrop)( struct SystemBase *l, struct UserLibrary * );

	struct MYSQLLibrary *(*LibraryMYSQLGet)( struct SystemBase *l );

	void (*LibraryMYSQLDrop)( struct SystemBase *l, struct MYSQLLibrary * );

	struct ApplicationLibrary *(*LibraryApplicationGet)( struct SystemBase *l );

	void (*LibraryApplicationDrop)( struct SystemBase *l, struct ApplicationLibrary * );

	struct PropertiesLibrary *(*LibraryPropertiesGet)( struct SystemBase *sb );

	void (*LibraryPropertiesDrop)( struct SystemBase *sb, PropertiesLibrary *pl );

	struct ZLibrary *(*LibraryZGet)( struct SystemBase *sb );

	void (*LibraryZDrop)( struct SystemBase *sb, ZLibrary *pl );
	
	struct ImageLibrary *(*LibraryImageGet)( struct SystemBase *sb );

	void (*LibraryImageDrop)( struct SystemBase *sb, ImageLibrary *pl );
	
	int (*UserDeviceMount)( struct SystemBase *l, MYSQLLibrary *sqllib, User *usr );

//
	#ifdef WEBSOCKETS
	int (*AddWebSocketConnection)(  struct SystemBase *l, struct libwebsocket *wsi, const char *sessionid );
	
	int (*WebSocketSendMessage)( struct SystemBase *l, User *user, char *msg, int len );
	#endif

	void (*SetFriendCoreManager)(  struct SystemBase *l, struct FriendCoreManager *fcm );

	int (*GetError)( struct SystemBase *l );
	
} SystemBase;


SystemBase *SystemInit( void );


//
// THIS IS OUR GLOBAL LIBRARY
//



extern SystemBase *SLIB;

#define LIBRARY_USER_GET( ) SLIB->LibraryUserGet( SLIB )

#define LIBRARY_USER_CLOSE() SLIB->LibraryUserClose( SLIB )

// 

#endif	// __SYSTEM_LIBRARY_H_
