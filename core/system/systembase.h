/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/
/**
 *  @file systembase.h
 *  Server entry point
 *
 *  @author HT (Hogne Tildstad), PS (Pawel Stefanski)
 *  @date 16 Nov 2016
 */

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
#include "auth/authmodule.h"
#include <core/friendcore_manager.h>

#include <system/fsys/fsys.h>
#include <util/buffered_string.h>
#include <db/sqllib.h>
#include <application/applicationlibrary.h>
#include <properties/propertieslibrary.h>
#include <system/dictionary/dictionary.h>
#include <z/zlibrary.h>
#include <image/imagelibrary.h>
#include <system/module/module.h>
#include <system/fsys/dosdriver.h>
#include <util/log/log.h>
#include <magic.h>
#include <system/cache/cache_manager.h>
#include <libwebsockets.h>
#include <system/invar/invar_manager.h>
#include <system/application/app_session_manager.h>
#include <system/user/user_session.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user_manager.h>
#include <system/user/remote_user.h>
#include <system/fsys/fs_manager.h>
#include <hardware/usb/usb_manager.h>
#include <hardware/usb/usb_device_web.h>
#include <hardware/printer/printer_manager.h>
#include <hardware/printer/printer_web.h>
#include <core/pid_thread_manager.h>
#include <system/log/user_logger_manager.h>
#include <system/user/user_manager_web.h>
#include <system/autotask/autotask.h>

#include <interface/socket_interface.h>
#include <interface/string_interface.h>
#include <interface/list_string_interface.h>
#include <interface/usersession_manager_interface.h>
#include <interface/user_manager_interface.h>
#include <interface/comm_service_interface.h>
#include <interface/comm_service_remote_interface.h>
#include <core/event_manager.h>
#include <system/cache/cache_uf_manager.h>
#include <db/sqllib.h>

#define DEFAULT_SESSION_ID_SIZE 256

//
// Devices
//

typedef struct Device
{
	char             *d_Type;
	char             *d_Handler;
	char             *d_Language;
	FULONG           d_Version;
	File             *d_FSys;
	pthread_mutex_t  mutex;
} Device;

//
// Sentinel
//

 typedef struct Sentinel
 {
 char *              s_ConfigUsername;
 char *              s_ConfigPassword;
 char                s_FCID[ FRIEND_CORE_MANAGER_ID_SIZE ];
 User *              s_User;
 } Sentinel;


//
// Mount parameters
//

#define FSys_Mount_Dummy				0x00003000
#define FSys_Mount_Path					(FSys_Mount_Dummy+1)		// mount path
#define FSys_Mount_Server				(FSys_Mount_Dummy+2)		// host if needed for remote drives
#define FSys_Mount_Port					(FSys_Mount_Dummy+3)		// port if needed for remote drives
#define FSys_Mount_Type					(FSys_Mount_Dummy+4)		// type of device
#define FSys_Mount_Name					(FSys_Mount_Dummy+5)		// name of device
//#define FSys_Mount_UserSession		(FSys_Mount_Dummy+6)		// pointer to user session
#define FSys_Mount_LoginUser			(FSys_Mount_Dummy+7)		// user name if needed for remote drives
#define FSys_Mount_LoginPass			(FSys_Mount_Dummy+8)		// password if needed for remote drives
#define FSys_Mount_Module				(FSys_Mount_Dummy+9)		
#define FSys_Mount_Owner				(FSys_Mount_Dummy+10)		// owner of device
#define FSys_Mount_ID					(FSys_Mount_Dummy+11)		// id of device
#define FSys_Mount_Mount 				(FSys_Mount_Dummy+12)		// device is mounted flag
#define FSys_Mount_SysBase				(FSys_Mount_Dummy+13)		// pointer to system.library
#define FSys_Mount_Config				(FSys_Mount_Dummy + 14 ) // configuration
#define FSys_Mount_User_SessionID		(FSys_Mount_Dummy + 15 ) // user session id
#define FSys_Mount_Visible				(FSys_Mount_Dummy + 16 ) // Is the drive visible?
#define FSys_Mount_Execute				(FSys_Mount_Dummy + 17 ) // Can we execute something on mount?
#define FSys_Mount_AdminRights			(FSys_Mount_Dummy + 18 ) // If functiona was called by admin
#define FSys_Mount_UserName				(FSys_Mount_Dummy+19)		// name of device
 
//
// system.library errors
//

#define FSYS_Error_Dummy					0x00000000
#define FSys_Error_NOFSType					(FSYS_Error_Dummy+1)
#define FSys_Error_NOName					(FSYS_Error_Dummy+2)
#define FSys_Error_NOUser					(FSYS_Error_Dummy+3)
#define FSys_Error_DeviceAlreadyMounted 	(FSYS_Error_Dummy+4)
#define FSys_Error_NOFSAvaiable			 	(FSYS_Error_Dummy+5)
#define FSys_Error_UserNotLoggedIn			(FSYS_Error_Dummy+6)
#define FSys_Error_DeviceNotFound			(FSYS_Error_Dummy+7)
#define FSys_Error_CannotUnmountDevice  	(FSYS_Error_Dummy+8)
#define FSys_Error_NODevForUser				(FSYS_Error_Dummy+9)
#define FSys_Error_SelectFail				(FSYS_Error_Dummy+10)
#define FSys_Error_OpsInProgress			(FSYS_Error_Dummy+11)
 
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

#define DEFAULT_SQLLIB_POOL_NUMBER 32

typedef struct SQLConPool
{
	int inUse;
	SQLLibrary *sqllib;
}SQLConPool;

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct SystemBase
{
	char							*l_Name;	// library name
	FULONG							l_Version;		// version information
	void							*handle;

	char							*sl_ModPath;            // modules path
	EModule							*sl_Modules;            // avaiable modules
	char							*sl_FSysPath;           // fsys path
	char 							*sl_LoginModPath;
	FHandler						*sl_Filesystems;        // avaiable filesystems
	DOSDriver						*sl_DOSDrivers;         // avaiable DOSDrivers
	File 							*sl_INRAM;						// INRAM filesystem drive, avaiable for all users

	WorkerManager					*sl_WorkerManager; ///< Worker Manager
	AppSessionManager				*sl_AppSessionManager;		// application sessions
	UserSessionManager				*sl_USM;			// user session manager
	UserManager						*sl_UM;		// user database manager
	FSManager						*sl_FSM;		// filesystem manager
	USBManager						*sl_USB;		// usb manager
	PrinterManager					*sl_PrinterM;		// printer manager
	EventManager					*sl_EventManager;								///< Manager of events
	PIDThreadManager				*sl_PIDTM;			// PIDThreadManager
	UserLoggerManager				*sl_ULM;			// UserLoggerManager
	CacheUFManager					*sl_CacheUFM;		// Cache User File Manager

	pthread_mutex_t 				sl_ResourceMutex;	// resource mutex
	pthread_mutex_t					sl_InternalMutex;		// internal slib mutex
	
	AuthMod							*sl_AuthModules;				// all login modules
	AuthMod							*sl_ActiveAuthModule;		// active login module
	char 							*sl_ModuleNames;				// name of modules which will be used
	char 							*sl_ActiveModuleName;	// name of active module
	char							*sl_DefaultDBLib;		// default DB library name

	//struct UserLibrary                  *ulib;					// user.library
	struct SQLConPool				*sqlpool;			// mysql.library pool
	int								sqlpoolConnections;	// number of database connections
	struct ApplicationLibrary		*alib;				// application library
	struct PropertiesLibrary		*plib;				// properties library
	struct ZLibrary					*zlib;						// z.library
	struct ImageLibrary				*ilib;						// image.library

	struct FriendCoreManager 		*fcm;						// connection with FriendCores
	CacheManager 					*cm;						// cache manager
	INVARManager					*nm;
	Dictionary						*sl_Dictionary;		// global dictionary

	char							*sl_AutotaskPath;		// path to autotasks
	Autotask						*sl_Autotasks;		// automatically launched scripts
	Application						*sl_apps;					// avaiable applications
	
	SocketInterface					sl_SocketInterface;	// socket interface
	StringInterface					sl_StringInterface;	// string interface
	ListStringInterface				sl_ListStringInterface;	// liststring interface
	UserSessionManagerInterface		sl_UserSessionManagerInterface;	// user session manager interface
	UserManagerInterface			sl_UserManagerInterface;	// user manager interface
	CommServiceInterface			sl_CommServiceInterface;	// communication interface
	CommServiceRemoteInterface		sl_CommServiceRemoteInterface;	// communication remote interface
	
	EModule							*sl_PHPModule;
	
	#ifndef DOXIGNORE
	CommService						*sl_CommService;						    ///< FC send server
	CommServiceRemote				*sl_CommServiceRemote;			///< FCservice for non persitent calls
	#endif

	int								UserLibCounter;						// counter of opened libraries
	int								MsqLlibCounter;
	int								AppLibCounter;
	int 							PropLibCounter;
	int 							ZLibCounter;
	int 							ImageLibCounter;
	
	magic_t							sl_Magic;
	
	int								sl_Error;					// last error
	
	// global settings
	
	int								sl_WorkersNumber;  // number of workers
	int								sl_SocketTimeout;
	FBOOL 							sl_CacheFiles;
	FBOOL							sl_UnMountDevicesInDB;
	FQUAD							sl_USFCacheMax; // User Shared File Manager cache max (per device)
	Sentinel 						*sl_Sentinel;

	void							(*SystemClose)( struct SystemBase *l );

	Http							*(*SysWebRequest)( struct SystemBase *l, char **path, Http **request, UserSession *loggedSession, int *result );

	int								(*InitSystem)( struct SystemBase *l );

	int								(*MountFS)( struct SystemBase *l, struct TagItem *tl, File **mfile, User *usr );

	int								(*UnMountFS)( struct SystemBase *l, struct TagItem *tl, UserSession *usr );

// libraries

	struct AuthMod					*(*AuthModuleGet)( struct SystemBase *l );

	void							(*AuthModuleDrop)( struct SystemBase *l, struct AuthMod * );

	struct SQLLibrary				*(*LibrarySQLGet)( struct SystemBase *l );

	void							(*LibrarySQLDrop)( struct SystemBase *l, struct SQLLibrary * );

	struct ApplicationLibrary		*(*LibraryApplicationGet)( struct SystemBase *l );

	void							(*LibraryApplicationDrop)( struct SystemBase *l, struct ApplicationLibrary * );

	struct PropertiesLibrary		*(*LibraryPropertiesGet)( struct SystemBase *sb );

	void							(*LibraryPropertiesDrop)( struct SystemBase *sb, PropertiesLibrary *pl );

	struct ZLibrary					*(*LibraryZGet)( struct SystemBase *sb );

	void							(*LibraryZDrop)( struct SystemBase *sb, ZLibrary *pl );
	
	struct ImageLibrary				*(*LibraryImageGet)( struct SystemBase *sb );

	void							(*LibraryImageDrop)( struct SystemBase *sb, ImageLibrary *pl );
	
	int								(*UserDeviceMount)( struct SystemBase *l, SQLLibrary *sqllib, User *usr, int force );
	
	int								(*UserDeviceUnMount)( struct SystemBase *l, SQLLibrary *sqllib, User *usr );
	
	int								(*SystemInitExternal)( struct SystemBase *l );
	
	Sentinel						*(*GetSentinelUser)( struct SystemBase *l );

	int								(*WebSocketSendMessage)( struct SystemBase *l, UserSession *usersession, char *msg, int len );
	
	int								(*WebSocketSendMessageInt)( UserSession *usersession, char *msg, int len );
	
	int								(*WebsocketWrite)( void *wscl, unsigned char *msgptr, int msglen, int type );
	
	int								(*SendProcessMessage)( Http *request, char *data, int len );

	char							*(*RunMod)( struct SystemBase *l, const char *mime, const char *path, const char *args, unsigned long *length );

	int								(*GetError)( struct SystemBase *l );
	
	void							(*Log)( int lev, char* fmt, ...) ;
	
	char							RSA_SERVER_CERT[ CERT_PATH_SIZE ];
	char							RSA_SERVER_KEY[ CERT_PATH_SIZE ];
	char							RSA_SERVER_CA_CERT[ CERT_PATH_SIZE ];
	char							RSA_SERVER_CA_PATH[ CERT_PATH_SIZE ];
	int								fdPool[ 1024 ];
} SystemBase;


//
//
//

SystemBase *SystemInit( void );

//
//
//

UserGroup *LoadGroups( struct SystemBase *sb );

//
//
//

struct ApplicationLibrary *LibraryApplicationGet( struct SystemBase *l );

//
//
//

void LibraryApplicationDrop( struct SystemBase *l, ApplicationLibrary *aclose );

//
//
//

struct PropertiesLibrary *LibraryPropertiesGet( struct SystemBase *l );

//
//
//

void LibraryPropertiesDrop( struct SystemBase *l, PropertiesLibrary *pclose );

//
//
//

struct ZLibrary *LibraryZGet( SystemBase *l );

//
//
//

void LibraryZDrop( SystemBase *l, ZLibrary *closelib );

//
//
//

struct ImageLibrary *LibraryImageGet( SystemBase *l );

//
//
//

void LibraryImageDrop( SystemBase *l, ImageLibrary *closelib );

//
//
//

struct SQLLibrary *LibrarySQLGet( struct SystemBase *l );

//
//
//

void LibrarySQLDrop( struct SystemBase *l, SQLLibrary *mclose );

//
//
//

struct AuthMod *AuthModuleGet( struct SystemBase *l );

//
//
//

void AuthModuleDrop( struct SystemBase *l, AuthMod *uclose );

//
//
//

int SystemInitExternal( SystemBase *l );

//
//
//

char *RunMod( struct SystemBase *l, const char *mime, const char *path, const char *args, unsigned long *length );

//
//
//

int GetError( struct SystemBase *l );

//
//
//

Sentinel *GetSentinelUser( SystemBase *l );

//
//
//

int WebSocketSendMessage( SystemBase *l, UserSession *usersession, char *msg, int len );

//
//
//

int WebSocketSendMessageInt( UserSession *usersession, char *msg, int len );

//
//
//

int UserDeviceMount( SystemBase *l, SQLLibrary *sqllib, User *usr, int force );

//
//
//

int UserDeviceUnMount( SystemBase *l, SQLLibrary *sqllib, User *usr );

//
//
//

int SendProcessMessage( Http *request, char *data, int len );

//
//
//

void CheckAndUpdateDB( struct SystemBase *sb );

//
// THIS IS OUR GLOBAL LIBRARY
//

extern SystemBase *SLIB;

//
//
//

inline HashmapElement *GetHEReq( Http *request, char *param )
{
	HashmapElement *tst = HashmapGet( request->parsedPostContent, param );
	if( tst == NULL ) tst = HashmapGet( request->query, param );
	if( tst && tst->data == NULL ) return NULL;
	return tst;
}

// 

#endif	// __SYSTEM_LIBRARY_H_
