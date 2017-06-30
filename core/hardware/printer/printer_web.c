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
 *  Printer web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/02/2017
 */

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

/**
 * Network handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* PrinterManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lb;
	Log( FLOG_DEBUG, "Printer Request %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
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
			"list - return all printers\n \
			add - add new printer\n \
			remove - remove printer\n \
			");

	//
	// list all avaiable ports
	//

	}
	else if (strcmp(urlpath[0], "list") == 0)
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
			int  pos = 0;
			DEBUG("Printers LIST\n");

			BufStringAdd(bs, " { \"Printers\": [");
			
			DEBUG("Printer string created\n");
			FPrinter *lprint = l->sl_PrinterM->pm_Printers;
			
			while( lprint != NULL )
			{
				DEBUG("Going through Printers \n" );
				
				char tempBuffer[ 1024 ];

				if (pos > 0)
				{
					BufStringAdd(bs, ", ");
				}

				int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"ID\":\"%lu\",\"Name\":\"%s\",\"HardwareID\":\"%s\",\"Manufacturer\":\"%s\",\"Global\":\"true\"", lprint->fp_ID, lprint->fp_Name, lprint->fp_HardwareID, lprint->fp_Manufacturer );

				BufStringAddSize(bs, tempBuffer, msgsize);
			
				DEBUG("Info about Printer added\n");
				
				pos++;
			}
			
			User *usr = loggedSession->us_User;
			if( usr != NULL )
			{
				FPrinter *lprint = usr->u_Printers;
				
				while( lprint != NULL )
				{
					DEBUG("Going through User Printers \n" );
					
					char tempBuffer[ 1024 ];
					
					if (pos > 0)
					{
						BufStringAdd(bs, ", ");
					}
					
					int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"ID\":\"%lu\",\"Name\":\"%s\",\"HardwareID\":\"%s\",\"Manufacturer\":\"%s\",\"Global\":\"false\"", lprint->fp_ID, lprint->fp_Name, lprint->fp_HardwareID, lprint->fp_Manufacturer );
					
					BufStringAddSize(bs, tempBuffer, msgsize);
					
					DEBUG("Info about User Printer added\n");
					
					pos++;
				}
			}

			BufStringAdd(bs, "  ]}");

			INFO("Printer JSON INFO: %s\n", bs->bs_Buffer);

			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;

			BufStringDelete(bs);
		}
		else
		{
			FERROR("ERROR: Cannot allocate memory for BufferString\n");
		}

	//
	// add new printer
	//

	}
	else if (strcmp(urlpath[0], "add") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		response = HttpNewSimple(HTTP_200_OK, tags);

		char buffer[512];
		int size = 0;
		
		char *name = NULL;
		char *manufacturer = NULL;
		char *hardwareid = NULL;
		char *global = NULL;

		HashmapElement *el = HttpGetPOSTParameter(request, "name");
		if (el != NULL)
		{
			name = (char *)el->data;
		}
		
		el = HttpGetPOSTParameter(request, "manufacturer");
		if (el != NULL)
		{
			manufacturer = (char *)el->data;
		}
		
		el = HttpGetPOSTParameter(request, "hardwareid");
		if (el != NULL)
		{
			hardwareid = (char *)el->data;
		}
		
		el = HttpGetPOSTParameter(request, "global");
		if (el != NULL)
		{
			global = (char *)el->data;
			if( strcmp( "true", global ) != 0 )
			{
				global = NULL;
			}
		}

		if (name != NULL)
		{
			FPrinter *nprint = PrinterNew( name );
			if( nprint != NULL )
			{
				nprint->fp_Manufacturer = StringDuplicate( manufacturer );
				nprint->fp_HardwareID = StringDuplicate( hardwareid );
				int error = 0;
				
				if( global != NULL )
				{
					if( ( error =  PrinterManagerAddPrinter( l->sl_PrinterM, nprint, NULL ) ) == 0 )
					{
						size = sprintf(buffer, "{ \"PrinterID\": \"%lu\" }", nprint->fp_ID );
					}
					else
					{
						size = sprintf(buffer, "{ \"response\": \"%s %d\" }", "Printer not added, error: ", error );
					}
				}
				else
				{
					if( ( error =  PrinterManagerAddPrinter( l->sl_PrinterM, nprint, loggedSession ) ) == 0 )
					{
						size = sprintf(buffer, "{ \"PrinterID\": \"%lu\" }", nprint->fp_ID );
					}
					else
					{
						size = sprintf(buffer, "{ \"response\": \"%s %d\" }", "Printer not added, error: ", error );
					}
				}
			}
			else
			{
				size = sprintf(buffer, "{ \"response\": \"%s\" }", "Cannot allocate memory for FPrinter");
			}
		}
		else
		{
			size = sprintf(buffer, "{ \"response\": \"%s\" }", "Name was not provided");
		}
		HttpAddTextContent(response, buffer);

	//
	// remote printer
	//

	}
	else if (strcmp(urlpath[0], "remove") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		FULONG id = 0;

		response = HttpNewSimple(HTTP_200_OK, tags);

		HashmapElement *el = HttpGetPOSTParameter(request, "id");
		if (el != NULL)
		{
			char *next;
			id = (FQUAD)strtol((char *)el->data, &next, 0);
		}
		
		if (id > 0)
		{
			char buffer[512];
			int error = PrinterManagerDeletePrinter( l->sl_PrinterM, id, loggedSession );

			if (error == 0)
			{
				int size = sprintf(buffer, "{ \"PrinterID\": \"%lu\" }", id);
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
	}
	return response;
}
