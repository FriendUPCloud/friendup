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