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
 *  Function releated to printers
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/02/2017
 */

#ifndef __CORE_HARDWARE_PRINTER_PRINTER_H__
#define __CORE_HARDWARE_PRINTER_PRINTER_H__

#include <core/types.h>
#include <core/nodes.h>

typedef struct FPrinter
{
	FULONG			fp_ID;
	char					*fp_Name;
	char					*fp_Manufacturer;
	char					*fp_HardwareID;
	MinNode			node;
}FPrinter;

//
//
//

FPrinter *PrinterNew( const char *name );

//
//
//

void PrinterDelete( FPrinter *pp );

//
//
//

FPrinter *PrinterDeleteAll( FPrinter *pp );

#endif // __CORE_HARDWARE_PRINTER_PRINTER_H__