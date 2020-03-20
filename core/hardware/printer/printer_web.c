/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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

Http* PrinterManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lb;
	Log( FLOG_DEBUG, "Printer Request %s  CALLED BY: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	Http *response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/printer/help</H2>Return information about printer functions
	*
	* @param sessionid - (required) session id of logged user
	* @return return information about avaiable printer functions
	*/
	/// @endcond
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
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/printer/list</H2>List of avaiable printers for user
	*
	* @param sessionid - (required) session id of logged user
	* @return return printers table in JSON format
	*/
	/// @endcond
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

			BufStringAdd(bs, " { \"Printers\": [");

			FPrinter *lprint = l->sl_PrinterM->pm_Printers;
			
			while( lprint != NULL )
			{
				char tempBuffer[ 1024 ];

				if (pos > 0)
				{
					BufStringAdd(bs, ", ");
				}

				int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"ID\":\"%lu\",\"Name\":\"%s\",\"HardwareID\":\"%s\",\"Manufacturer\":\"%s\",\"Global\":\"true\"", lprint->fp_ID, lprint->fp_Name, lprint->fp_HardwareID, lprint->fp_Manufacturer );

				BufStringAddSize(bs, tempBuffer, msgsize);

				pos++;
			}
			
			User *usr = loggedSession->us_User;
			if( usr != NULL )
			{
				FPrinter *lprint = usr->u_Printers;
				
				while( lprint != NULL )
				{
					char tempBuffer[ 1024 ];
					
					if (pos > 0)
					{
						BufStringAdd(bs, ", ");
					}
					
					int msgsize = snprintf(tempBuffer, sizeof(tempBuffer), "\"ID\":\"%lu\",\"Name\":\"%s\",\"HardwareID\":\"%s\",\"Manufacturer\":\"%s\",\"Global\":\"false\"", lprint->fp_ID, lprint->fp_Name, lprint->fp_HardwareID, lprint->fp_Manufacturer );
					
					BufStringAddSize(bs, tempBuffer, msgsize);

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
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/printer/add</H2>Add new printer to global pool or user
	*
	* @param sessionid - (required) session id of logged user
	* @param name - (required) name of printer
	* @param manufacturer - manufacturer of printer
	* @param hardwareid - printer hardware id
	* @param global - set to 'true' if you want to make printer avaiable for everyone
	* @return { PrinterID: <number> } when success, otherwise error code
	*/
	/// @endcond
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
			name = (char *)el->hme_Data;
		}
		
		el = HttpGetPOSTParameter(request, "manufacturer");
		if (el != NULL)
		{
			manufacturer = (char *)el->hme_Data;
		}
		
		el = HttpGetPOSTParameter(request, "hardwareid");
		if (el != NULL)
		{
			hardwareid = (char *)el->hme_Data;
		}
		
		el = HttpGetPOSTParameter(request, "global");
		if (el != NULL)
		{
			global = (char *)el->hme_Data;
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
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PRINTER_NOT_ADDED_ERR], error );
						size = snprintf( buffer, sizeof(buffer), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PRINTER_NOT_ADDED_ERR );
						//size = sprintf(buffer, "{ \"response\": \"%s %d\" }", "Printer not added, error: ", error );
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
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PRINTER_NOT_ADDED_ERR], error );
						size = snprintf( buffer, sizeof(buffer), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PRINTER_NOT_ADDED_ERR );
					}
				}
			}
			else
			{
				size = snprintf( buffer, sizeof(buffer), "{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
			}
		}
		else
		{
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name" );
			size = snprintf( buffer, sizeof(buffer), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			//size = sprintf(buffer, "{ \"response\": \"%s\" }", "Name was not provided");
		}
		HttpAddTextContent(response, buffer);
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/printer/remove</H2>Remove printer
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of printer
	* @return { PrinterID: <number> } when success, otherwise error code
	*/
	/// @endcond
	else if (strcmp(urlpath[0], "remove") == 0)
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate("text/html") },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate("close") },
			{ TAG_DONE, TAG_DONE }
		};

		FLONG id = 0;

		response = HttpNewSimple(HTTP_200_OK, tags);

		HashmapElement *el = HttpGetPOSTParameter(request, "id");
		if (el != NULL)
		{
			char *next;
			id = (FLONG)strtol((char *)el->hme_Data, &next, 0);
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
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_UNLOCK_PORT], error );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_UNLOCK_PORT );
					HttpAddTextContent( response, dictmsgbuf );
				}
				else 
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_FIND_DEVICE], id );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_FIND_DEVICE );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
		}
	}
	
	//
	// function releated to devices not found
	//
	
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( DEFAULT_CONTENT_TYPE ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		response = HttpNewSimple( HTTP_200_OK, tags );
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_NOT_FOUND] , DICT_FUNCTION_NOT_FOUND );
		HttpAddTextContent( response, dictmsgbuf );
	}
	
	return response;
}
