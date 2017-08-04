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

/** @file
 * 
 *  USB devices manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2017
 */

#include "usb_manager.h"
#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>

#ifdef CYGWIN_BUILD
#define _WIN32
#endif

#ifdef _WIN32
#define FLONG
#include <windows.h>
#endif

/**
 * Create USBManager
 *
 * @return return new USBManager structure when success, otherwise NULL
 */

USBManager *USBManagerNew()
{
	USBManager *man = NULL;
	if ((man = FCalloc(1, sizeof(USBManager))) != NULL)
	{
		man->usbm_MinIPPort = 18000;
		man->usbm_MaxIPPort = 19000;
		man->usbm_IPPort = man->usbm_MinIPPort;
		man->usbm_Port = 0;
		man->usbm_MaxPort = 1;

		DEBUG("[USBManager] default values initalized\n");

		#ifdef _WIN32
		HMODULE lib = LoadLibrary("USBInterface.dll");
		man->usbm_LibPtr = lib;
		if (lib != NULL)
		{
			DEBUG("[USBManager] DLL found, assigning functions\n");

			man->CLibInit = GetProcAddress(lib, "CLibInit");
			man->CServerCreateEnumUsbDev = GetProcAddress(lib, "CServerCreateEnumUsbDev");
			man->CServerRemoveEnumUsbDev = GetProcAddress(lib, "CServerRemoveEnumUsbDev");
			man->CServerGetUsbDevFromHub = GetProcAddress(lib, "CServerGetUsbDevFromHub");
			man->CServerUsbDevIsHub = GetProcAddress(lib, "CServerUsbDevIsHub");
			man->CServerUsbDevIsShared = GetProcAddress(lib, "CServerUsbDevIsShared");
			man->CServerUsbDevIsConnected = GetProcAddress(lib, "CServerUsbDevIsConnected");
			man->CServerGetUsbDevName = GetProcAddress(lib, "CServerGetUsbDevName");
			man->CServerShareUsbDev = GetProcAddress(lib, "CServerShareUsbDev");
			man->CServerUnshareUsbDev = GetProcAddress(lib, "CServerUnshareUsbDev");
			man->CServerGetUsbDevStatus = GetProcAddress(lib, "CServerGetUsbDevStatus");
			man->CServerGetSharedUsbDevNetSettings = GetProcAddress(lib, "CServerGetSharedUsbDevNetSettings");
			man->CServerGetSharedUsbDevIsCrypt = GetProcAddress(lib, "CServerGetSharedUsbDevIsCrypt");
			man->CServerGetSharedUsbDevRequiresAuth = GetProcAddress(lib, "CServerGetSharedUsbDevRequiresAuth");
			man->CSetCallBackOnChangeDevList = GetProcAddress(lib, "CSetCallBackOnChangeDevList");
			man->CClientEnumAvailRemoteDevOnServer = GetProcAddress(lib, "CClientEnumAvailRemoteDevOnServer");
			man->CClientEnumAvailRemoteDev = GetProcAddress(lib, "CClientEnumAvailRemoteDev");
			man->CClientRemoveEnumOfRemoteDev = GetProcAddress(lib, "CClientRemoveEnumOfRemoteDev");
			man->CClientGetRemoteDevNetSettings = GetProcAddress(lib, "CClientGetRemoteDevNetSettings");
			man->CClientGetRemoteDevName = GetProcAddress(lib, "CClientGetRemoteDevName");
			man->CClientAddRemoteDevManually = GetProcAddress(lib, "CClientAddRemoteDevManually");
			man->CClientAddRemoteDev = GetProcAddress(lib, "CClientAddRemoteDev");
			man->CClientStartRemoteDev = GetProcAddress(lib, "CClientStartRemoteDev");
			man->CClientStopRemoteDev = GetProcAddress(lib, "CClientStopRemoteDev");
			man->CClientRemoveRemoteDev = GetProcAddress(lib, "CClientRemoveRemoteDev");
			man->CClientGetStateRemoteDev = GetProcAddress(lib, "CClientGetStateRemoteDev");
			man->CClientTrafficRemoteDevIsEncrypted = GetProcAddress(lib, "CClientTrafficRemoteDevIsEncrypted");
			man->CClientRemoteDevRequiresAuth = GetProcAddress(lib, "CClientRemoteDevRequiresAuth");
			man->CClientGetStateSharedDevice = GetProcAddress(lib, "CClientGetStateSharedDevice");
			man->CClientEnumRemoteDevOverRdp = GetProcAddress(lib, "CClientEnumRemoteDevOverRdp");
			man->CServerDisconnectRemoteDev = GetProcAddress(lib, "CServerDisconnectRemoteDev");
			man->CClientTrafficRemoteDevIsCompressed = GetProcAddress(lib, "CClientTrafficRemoteDevIsCompressed");
			man->CServerGetSharedUsbDevIsCompressed = GetProcAddress(lib, "CServerGetSharedUsbDevIsCompressed");

			man->CLibInit();

			if (man->usbm_MaxPort < 1)		// check how many ports were created and create Friend structure
			{
				USBManagerGetAllCreatedPorts(man);
			}
			else
			{
				USBManagerCreatePorts(man, TRUE);
			}
			DEBUG("[USBManager] usbcreated\n");
			
		}
		else
		{
			DWORD dwError = 0;

			dwError = GetLastError();
			DEBUG("[USBManager] DLL not found, some problems can appear during USB usage. Error:  %d\n", dwError );
		}
		#endif // _WIN32
	}
	else
	{
		//FERROR("Cannot allocate memory for USBManager\n");
	}
	return man;
}

/**
 * Delete USBManager
 *
 * @param usbm pointer to USBManager which will be deleted
 */
void USBManagerDelete(USBManager *usbm)
{
	if (usbm != NULL)
	{
		int i;
		USBDevice *dev = usbm->usbm_Devices;
		while (dev != NULL)
		{
			USBDevice *remd = dev;
			dev = (USBDevice *)dev->node.mln_Succ;

			USBDeviceDelete(remd);
		}

		USBManagerDeletePorts(usbm);
	}
}

/**
 * Create USB port
 *
 * @param usbm pointer to USBManager
 * @param pos position on which new USB port will be created
 * @param connected set to TRUE if you want to set port to connected state
 * @return return new USBDevice structure when success, otherwise NULL
 */

USBDevice *CreatePort( USBManager *usbm, int pos, FBOOL connected )
{
	#ifdef _WIN32

	USBDevice *dev = USBDeviceNew();

	if (dev != NULL)
	{
		char port[64];
		snprintf(port, sizeof(port), "%d", usbm->usbm_IPPort);
		usbm->CClientAddRemoteDevManually(port);
		/*
		if (ok != TRUE)
		{
			USBDeviceDelete( dev );
			dev = NULL;
			return NULL;
		}
		else
		{
		*/
			if (connected == TRUE)
			{
				usbm->CClientStartRemoteDev(usbm->usbm_Client, pos, TRUE, "");
			}

			dev->usbd_IPPort = usbm->usbm_IPPort++;
			dev->usbd_USBID = (FUQUAD)pos;

			char *name = NULL;
			if (usbm->CClientGetRemoteDevName(usbm->usbm_Client, pos, &name) == FALSE)
			{

			}

			char *network = NULL;
			usbm->CClientGetRemoteDevNetSettings(usbm->usbm_Client, pos, &network);;

			if (dev != NULL)
			{
				char *dname = NULL;
				char *dnetwork = NULL;

				if (name != NULL)
				{
					int len = strlen(name);
					dname = FCalloc(len + 1, sizeof(char));
					if (dname != NULL)
					{
						strcpy(dname, name);
					}
				}
				else
				{
					dname = FCalloc(9, sizeof(char));
					if (dname != NULL)
					{
						strcpy(dname, "callback");
					}
				}

				if (dname != NULL)
				{
					dev->usbd_Name = dname;
				}

				if (network != NULL)
				{
					int len = strlen(network);
					dnetwork = FCalloc(len + 1, sizeof(char));
					if (dnetwork != NULL)
					{
						strcpy(dnetwork, network);
						dev->usbd_NetworkAddress = dnetwork;
					}
				}
			}
		//}
	}
	else
	{
		// cannot create new device
		return NULL;
	}
	return dev;
#else
	return NULL;
#endif
}

/**
 * Create default USB ports
 *
 * @param usbm pointer to USBManager
 * @param connected set to TRUE if you want to have all ports in connected state
 * @return return 0 when success, otherwise error number
 */

int USBManagerCreatePorts(USBManager *usbm, FBOOL connected)
{
#ifdef _WIN32

	usbm->usbm_Ports = FCalloc(usbm->usbm_MaxPort, sizeof(USBDevice));

	if (usbm->usbm_Ports != NULL && usbm->CClientEnumAvailRemoteDev(&usbm->usbm_Client) )
	{
		int i = 0;

		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			usbm->usbm_Ports[i] = CreatePort(usbm, i, connected);
		} // for() MaxPort
	}
	else
	{
		Log(FLOG_ERROR, "Cannot create more ports then %d\n", usbm->usbm_MaxPort);
		return 1;
	}

	return 0;
#else
	return 0;
#endif
}

/**
 * Delete all USB ports
 *
 * @param usbm pointer to USBManager
 */

void USBManagerDeletePorts(USBManager *usbm)
{
#ifdef _WIN32
	if (usbm->usbm_Ports != NULL)
	{
		int i;

		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			if (usbm->usbm_Ports[i] != NULL)
			{
				USBDeviceDelete(usbm->usbm_Ports[i]);

				usbm->CClientRemoveRemoteDev(usbm->usbm_Client, i);
			}
		}

		if (usbm->usbm_Client != NULL)
		{
			usbm->CClientRemoveEnumOfRemoteDev(usbm->usbm_Client);
			usbm->usbm_Client = NULL;
		}
	}
#else

#endif
}

/**
 * Add new USB port
 *
 * @param usbm pointer to USBManager
 * @param connected set to TRUE if you want to have all ports in connected state
 * @return return 0 when success, otherwise error number
 */

int USBManagerAddNewPort(USBManager *usbm, char *port)
{
#ifdef _WIN32

	int lastPort = usbm->usbm_MaxPort;

	USBDevice *dev = CreatePort(usbm, lastPort, TRUE);
	if (dev != NULL)
	{
		USBDevice *newports = FCalloc(usbm->usbm_MaxPort + 1, sizeof(USBDevice *));
		if (newports != NULL)
		{
			// new table created
			// now we must copy pointers to old Ports
			memcpy(newports, usbm->usbm_Ports, lastPort *sizeof(USBDevice *));
			FFree(usbm->usbm_Ports);
			usbm->usbm_Ports = newports;

			usbm->usbm_MaxPort++;
			usbm->usbm_Ports[lastPort] = dev;
		}
	}
#else

#endif
	return 0;
}

/**
 * Get all information about created USB ports
 *
 * @param usbm pointer to USBManager
 */

void USBManagerGetAllCreatedPorts(USBManager *usbm)
{
#ifdef _WIN32

	if (usbm->usbm_Client != NULL)
	{
		usbm->CClientRemoveEnumOfRemoteDev(usbm->usbm_Client);
		usbm->usbm_Client = NULL;
	}

	int devices = 0, i = 0;
	usbm->CClientEnumAvailRemoteDev(&usbm->usbm_Client);

	while (TRUE)
	{
		char *name = NULL;
		if (usbm->CClientGetRemoteDevName(usbm->usbm_Client, devices, &name) == FALSE)
		{
			break;
		}
		devices++;
	}

	if (devices > 0)
	{
		usbm->usbm_MaxPort = devices;
		USBManagerCreatePorts(usbm, TRUE);
	}
#else

#endif
}

/**
 * Lock usb port
 *
 * @param usbm pointer to USBManager
 * @param usesession pointer to UserSession which is locking port
 * @return return pointer to USBDevice when success, otherwise NULL
 */

USBDevice *USBManagerLockPort(USBManager *usbm, UserSession *session)
{
#ifdef _WIN32

	int i;

	if (usbm != NULL)
	{
		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			if (usbm->usbm_Ports[i] != NULL && usbm->usbm_Ports[i]->usbd_LockUser == NULL)
			{
				usbm->usbm_Ports[i]->usbd_LockUser = session;

				return usbm->usbm_Ports[i];
			}
		}
	}
	
#else

#endif
	return NULL;	// ports are locked
}

/**
 * UnLock usb port
 *
 * @param usbm pointer to USBManager
 * @param ldev pointer to USBDevice which will be unlocked
 * @return return 0 when success, otherwise error number
 */

int USBManagerUnLockPort(USBManager *usbm, USBDevice *ldev )
{
#ifdef _WIN32

	if (usbm != NULL)
	{
		int i = 0;

		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			if (usbm->usbm_Ports[ i ] == ldev )
			{
				usbm->usbm_Ports[ i ]->usbd_LockUser = NULL;
				return 0;
			}
		}
	}
	return -1;
#else
	return -1;
#endif
}

/**
 * Get USBDevice by ID
 *
 * @param usbm pointer to USBManager
 * @param id id of device which you want to get
 * @return return pointer to USBDevice when success, otherwise NULL
 */

USBDevice *USBManagerGetDeviceByID(USBManager *usbm, FUQUAD id)
{
#ifdef _WIN32

	if (usbm != NULL)
	{
		int i = 0;

		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			if (usbm->usbm_Ports[i] != NULL && usbm->usbm_Ports[i]->usbd_ID == id )
			{
				return usbm->usbm_Ports[i];
			}
		}
	}
#else

#endif
return NULL;
}

/**
 * Create new USBDevice
 *
 * @param usbm pointer to USBManager
 * @param connected set to TRUE if you want to create new device in connected state 
 * @return return 0 when success, otherwise error number
 */

int USBManagerCreateDevice(USBManager *usbm, FBOOL connected)
{
#ifdef _WIN32

/*
USBDevice *dev = USBDeviceNew();
if( dev != NULL )
{
	if( usbm->usbm_Port < usbm->usbm_MaxPort )
	{
		VARIANT v;
		v.vt = VT_I4; // signed 4 byte integer
		v.intVal = usbm->usbm_IPPort;
		BOOL ok = ClientAddRemoteDevManually( v );

		dev->usbd_IPPort = usbm->usbm_IPPort;
		dev->usbd_USBID = usbm->usbm_Port;

		usbm->usbm_IPPort++;
		usbm->usbm_Port++;

		// add port to list
		dev->node.mln_Succ = (MinNode *)usbm->usbm_Ports;
		usbm->usbm_Ports = dev;
	}
	else
	{
		Log( FLOG_ERROR, "Cannot create more ports then %d\n", usbm->usbm_MaxPort );
		return 1;
	}
}
*/
#else

#endif
}

/**
 * Delete USBDevice by ID
 *
 * @param usbm pointer to USBManager
 * @param id id of device which will be deleted
 */

void USBManagerDeleteDevice( USBManager *usbm, FUQUAD id )
{
#ifdef _WIN32

	USBDevice *ldev = usbm->usbm_Devices;
	USBDevice *prev = ldev;
	while( ldev != NULL )
	{
		if( id == ldev->usbd_USBID )
		{
			if( ldev == usbm->usbm_Devices )
			{
				usbm->usbm_Devices = (USBDevice *) ldev->node.mln_Succ;
			}
			else
			{
				prev->node.mln_Succ = ldev->node.mln_Succ;
			}

			USBDeviceDelete( ldev );

			break;
		}
		prev = ldev;
		ldev = (USBDevice *) ldev->node.mln_Succ;
	}
#else

#endif
}

/**
 * USBManager device change function
 */

void USBManagerDeviceChange()
{
#ifdef _WIN32

#else
	
#endif
}

