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
 *  Printer devices manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2017
 */

#ifndef __HARDWARE_PRINTER_PRINTER_MANAGER_H__
#define __HARDWARE_PRINTER_PRINTER_MANAGER_H__

#include <core/types.h>
#include "printer.h"
#include <network/http.h>
#include <system/user/user_session.h>

///
//
//

typedef struct PrinterManager
{
	void								*pm_SB;
	FPrinter						*pm_Printers;
	FUQUAD						pm_IDGenerator;
}PrinterManager;

//
//
//

PrinterManager *PrinterManagerNew( void *sb );

//
//
//

void PrinterManagerDelete( PrinterManager *pm );

//
//
//

int PrinterManagerAddPrinter( PrinterManager *pm, FPrinter *np, UserSession *session );

//
//
//

int PrinterManagerDeletePrinter( PrinterManager *pm, FULONG id, UserSession *session );

#endif // __HARDWARE_PRINTER_PRINTER_MANAGER_H__