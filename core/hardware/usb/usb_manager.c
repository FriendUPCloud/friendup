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
#include <system/handler/file.h>
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

//
//
//

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

		DEBUG("USBManager default values initalized\n");

		#ifdef _WIN32
		HMODULE lib = LoadLibrary("USBInterface.dll");
		man->usbm_LibPtr = lib;
		if (lib != NULL)
		{
			DEBUG("DLL found, assigning functions\n");

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

			DEBUG("Before cinit\n");
			man->CLibInit();
			DEBUG("after cinit\n");

			if (man->usbm_MaxPort < 1)		// check how many ports were created and create Friend structure
			{
				USBManagerGetAllCreatedPorts(man);
			}
			else
			{
				USBManagerCreatePorts(man, TRUE);
			}
			DEBUG("usbcreated\n");
			
		}
		else
		{
			DWORD dwError = 0;

			dwError = GetLastError();
			DEBUG("DLL not found, some problems can appear during USB usage. Error:  %d\n", dwError );
		}
		#endif // _WIN32
	}
	else
	{
		//FERROR("Cannot allocate memory for USBManager\n");
	}
	return man;
}

//
// Delete USBManager
//

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


#ifdef _WIN32

//
//
//

USBDevice *CreatePort( USBManager *usbm, int pos, FBOOL connected )
{
	USBDevice *dev = USBDeviceNew();

	if (dev != NULL)
	{
		char port[64];
		snprintf(port, sizeof(port), "%d", usbm->usbm_IPPort);
		printf("Port assigned, pointer %x\n", usbm->CClientAddRemoteDevManually);
		usbm->CClientAddRemoteDevManually(port);
		DEBUG("create port\n");
		/*
		if (ok != TRUE)
		{
			DEBUG("Port was not added\n");
			USBDeviceDelete( dev );
			dev = NULL;
			return NULL;
		}
		else
		{
		*/
			DEBUG("USBDevice found\n");
			if (connected == TRUE)
			{
				usbm->CClientStartRemoteDev(usbm->usbm_Client, pos, TRUE, "");
			}

			dev->usbd_IPPort = usbm->usbm_IPPort++;
			dev->usbd_USBID = (FUQUAD)pos;

			char *name = NULL;
			if (usbm->CClientGetRemoteDevName(usbm->usbm_Client, pos, &name) == FALSE)
			{
				printf("No more entries\n");
			}

			char *network = NULL;
			usbm->CClientGetRemoteDevNetSettings(usbm->usbm_Client, pos, &network);;
			printf("DEVICES : %s network %s\n", name, network);

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
}

//
//
//

int USBManagerCreatePorts(USBManager *usbm, FBOOL connected)
{
	usbm->usbm_Ports = FCalloc(usbm->usbm_MaxPort, sizeof(USBDevice));

	if (usbm->usbm_Ports != NULL && usbm->CClientEnumAvailRemoteDev(&usbm->usbm_Client) )
	{
		int i = 0;
		printf("USBManagerCreatePorts\n");

		for (i = 0; i < usbm->usbm_MaxPort; i++)
		{
			DEBUG("Create port %d\n", i);
			usbm->usbm_Ports[i] = CreatePort(usbm, i, connected);
		} // for() MaxPort
	}
	else
	{
		Log(FLOG_ERROR, "Cannot create more ports then %d\n", usbm->usbm_MaxPort);
		return 1;
	}

	return 0;
}

//
//
//

void USBManagerDeletePorts(USBManager *usbm)
{
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
}

//
//
//

int USBManagerAddNewPort(USBManager *usbm, char *port)
{
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

	return 0;
}

//
//
//

void USBManagerGetAllCreatedPorts(USBManager *usbm)
{
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
			printf("No more entries\n");
			break;
		}
		devices++;
	}

	if (devices > 0)
	{
		usbm->usbm_MaxPort = devices;
		USBManagerCreatePorts(usbm, TRUE);
	}
}

//
//
//

USBDevice *USBManagerLockPort(USBManager *usbm, UserSession *session)
{
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
	return NULL;	// ports are locked
}

//
//
//

int USBManagerUnLockPort(USBManager *usbm, USBDevice *ldev )
{
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
}

//
//
//

USBDevice *USBManagerGetDeviceByID(USBManager *usbm, FUQUAD id)
{
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
return NULL;
}

//
//
//

int USBManagerCreateDevice(USBManager *usbm, FBOOL connected)
{
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

}

		//
		//
		//

void USBManagerDeleteDevice( USBManager *usbm, FUQUAD id )
{
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
}

//
//
//

void USBManagerDeviceChange()
{

}

#else //_WIN32

//
// linux
//

USBDevice *CreatePort( USBManager *usbm, int pos, FBOOL connected )
{
	return NULL;
}

//
//
//

int USBManagerCreatePorts(USBManager *usbm, FBOOL connected)
{

	return 1;
}

//
//
//

void USBManagerDeletePorts(USBManager *usbm)
{

}

//
//
//

int USBManagerAddNewPort(USBManager *usbm, char *port)
{

	return 0;
}

//
//
//

void USBManagerGetAllCreatedPorts(USBManager *usbm)
{

}

//
//
//

USBDevice *USBManagerLockPort(USBManager *usbm, UserSession *session)
{

	return NULL;	// ports are locked
}

//
//
//

int USBManagerUnLockPort(USBManager *usbm, USBDevice *ldev )
{

	return -1;
}

//
//
//

USBDevice *USBManagerGetDeviceByID(USBManager *usbm, FUQUAD id)
{

	return NULL;
}

//
//
//

int USBManagerCreateDevice(USBManager *usbm, FBOOL connected)
{
		return -1;
}

//
//
//

void USBManagerDeleteDevice( USBManager *usbm, FUQUAD id )
{

}

#endif // _WIN32
