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
 *  USB web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/01/2017
 */

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

/**
 * Network handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* USBManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lb;
	Log( FLOG_DEBUG, "USB Request %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	Http *response = NULL;
	
	if (strcmp(urlpath[0], "help") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		HttpAddTextContent(response, \
			"listports - return all usb ports\n \
			listdevices - list all usb devices\n \
			queryport - query for usb port\n \
			releaseport - release usb port\n \
			");

	//
	// list all avaiable ports
	//

	}
	else if (strcmp(urlpath[0], "listports") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		BufString *bs = BufStringNew();
		if (bs != NULL)
		{
			int pos = 0;

			BufStringAdd(bs, " { \"USBPorts\": [");
			
			for( pos = 0; pos < l->sl_USB->usbm_MaxPort ; pos++ )
			{
				USBDevice *dev =  l->sl_USB->usbm_Ports[ pos ];
				
				if( dev != NULL )
				{
					char tempBuffer[ 1024 ];

					if (pos > 0)
					{
						BufStringAdd(bs, ", ");
					}
				
					int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"Name\":\"%s\",\"Port\":\"%s\",\"Connected\":\"%d\"", dev->usbd_Name, dev->usbd_NetworkAddress, dev->usbd_State );

					BufStringAddSize(bs, tempBuffer, msgsize);
				}
				else
				{
					FERROR("USBPort not found\n");
				}
			}
			//INFO("JSON INFO 2: %s\n", bs->bs_Buffer );

			BufStringAdd(bs, "  ]}");

			INFO("USBPORTS JSON INFO: %s\n", bs->bs_Buffer);

			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;

			BufStringDelete(bs);
		}
		else
		{
			FERROR("ERROR: Cannot allocate memory for BufferString\n");
		}

	//
	// ask FC for USB port
	//

	}
	else if (strcmp(urlpath[0], "queryport") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		char buffer[512];

		USBDevice *dev = USBManagerLockPort(l->sl_USB, loggedSession);
		if (dev != NULL)
		{
			int size = sprintf(buffer, "{ \"USBDeviceID\": \"%llu\" }", dev->usbd_ID );
			HttpAddTextContent(response, buffer);
		}
		else
		{
			int size = sprintf(buffer, "{ \"response\": \"%s\" }", "All ports are busy");
			HttpAddTextContent(response, buffer);
		}

	//
	// release USB port
	//

	}
	else if (strcmp(urlpath[0], "releaseport") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		FULONG id = 0;

		response = HttpNewSimple(HTTP_200_OK, tags);

		HashmapElement *el = HttpGetPOSTParameter(request, "devname");
		if (el != NULL)
		{
			char *next;
			id = (FQUAD)strtol((char *)el->data, &next, 0);
		}
		
		if (id > 0)
		{
			USBDevice *dev = USBManagerGetDeviceByID(l->sl_USB, id);
			char buffer[512];
			int size = 0;
			int error = -1;

			if (dev != NULL)
			{
				error = USBManagerUnLockPort(l->sl_USB, dev);
			}
			else
			{
				error = -2;
			}

			if (error == 0)
			{
				int size = sprintf(buffer, "{ \"USBDeviceID\": \"%llu\" }", dev->usbd_ID);
				HttpAddTextContent(response, buffer);
			}
			else
			{
				if (error == -1)
				{
					int size = sprintf(buffer, "{ \"response\": \"%s %d\" }", "Cannot unlock port, error number ", error );
					HttpAddTextContent(response, buffer);
				}
				else 
				{
					int size = sprintf(buffer, "{ \"response\": \"%s %lu\" }", "Cannot find device with provided ID: ", id );
					HttpAddTextContent(response, buffer);
				}
			}
		}
		
	//
	// add USB port
	//
		
	}
	else if (strcmp(urlpath[0], "addport") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};
		char *port = NULL;
		char *description = NULL;
		
		response = HttpNewSimple(HTTP_200_OK, tags);
		
		HashmapElement *el = HttpGetPOSTParameter(request, "port");
		if (el != NULL)
		{
			port = (char *)el->data;
		}
		
		el = HttpGetPOSTParameter(request, "description");
		if (el != NULL)
		{
			description = (char *)el->data;
		}
		
		char buffer[512];
		
		if (port != NULL)
		{
			//int USBManagerAddNewPort(USBManager *usbm, char *port);
			//int size = sprintf(buffer, "{ \"USBDeviceID\": \"%llu\" }", dev->usbd_ID );
			//HttpAddTextContent(response, buffer);
		}
		else
		{
			int size = sprintf(buffer, "{ \"response\": \"%s\" }", "port paramter is missing");
			HttpAddTextContent(response, buffer);
		}
	}
	
	
	return response;
}
