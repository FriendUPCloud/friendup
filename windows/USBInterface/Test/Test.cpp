// Test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "USBInterface.h"
#include <stdio.h>

void *clientContext = NULL;
void *serverContext = NULL;

FBOOL EnumHub(void *context)
{
	long index = 0;
	char *name = NULL, *network = NULL;
	void *devcon = NULL;

	while (CServerGetUsbDevFromHub(serverContext, context, index, &devcon))
	{
		if (CServerUsbDevIsHub(serverContext, devcon))
		{
			printf("HUB\n");
			EnumHub(devcon);
		}
		else
		{
			CServerGetUsbDevName(serverContext, devcon, &name);
			CServerGetSharedUsbDevNetSettings(serverContext, devcon, &network);

			printf("DEVICES : %s - net %s\n", name, network );
		}
		index++;
	}
	return TRUE;
}

int _tmain(int argc, _TCHAR* argv[])
{
	
	if (CLibInit() == 0)
	{
		printf("lib initalized\n");

		FBOOL ok = CClientAddRemoteDevManually( "1015");
		printf("ok %d\n", ok);

		if (CServerCreateEnumUsbDev(&serverContext))
		{
			printf("server context %x\n", serverContext);

			long index = 0;
			char *name = NULL;
			void *devcon = NULL;

			EnumHub(serverContext);
		}

		CClientRemoveEnumOfRemoteDev(clientContext);
		//CServerRemoveEnumUsbDev(pDlg->m_ServerHandle);;

		//if (CClientEnumAvailRemoteDevOnServer(NULL, &clientContext) )
		//if (CClientEnumRemoteDevOverRdp(&clientContext))
		if (CClientEnumAvailRemoteDev(&clientContext))
		{
			printf("context %x\n", clientContext);

			long index = 0;
			char *name = NULL;
			while ( TRUE )
			{
				if (CClientGetRemoteDevName(clientContext, index, &name) == FALSE)
				{
					printf("No more entries\n");
					break;
				}
				char *network = NULL;
				CClientGetRemoteDevNetSettings(clientContext, index, &network);;
				printf("DEVICES : %s network %s\n", name, network);
				index++;
			}
		}
	}
	else
	{
		printf("loading lib fail");
	}

	int a;
	scanf("%d", &a);

	return 0;
}

