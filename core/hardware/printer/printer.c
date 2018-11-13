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

#include "printer.h"
#include <util/string.h>

//
//
//

FPrinter *PrinterNew( const char *name )
{
	FPrinter *fp = NULL;
	if( ( fp = FCalloc( 1, sizeof(FPrinter) ) ) != NULL )
	{
		fp->fp_Name = StringDuplicate( name );
	}
	else
	{
		FERROR("Cannot allocate memory for FPrinter\n");
	}
	return fp;
}

//
//
//

void PrinterDelete( FPrinter *pp )
{
	if( pp != NULL )
	{
		if( pp->fp_HardwareID  != NULL )
		{
			FFree( pp->fp_HardwareID );
		}
		
		if( pp->fp_Manufacturer  != NULL )
		{
			FFree( pp->fp_Manufacturer );
		}
		
		if( pp->fp_Name  != NULL )
		{
			FFree( pp->fp_Name );
		}
	}
}

//
//
//

FPrinter *PrinterDeleteAll( FPrinter *pp )
{
	FPrinter *loc = pp;
	FPrinter *rem = pp;
	
	while( loc != NULL )
	{
		rem =  loc;
		loc = (FPrinter *)loc->node.mln_Succ;
		
		PrinterDelete( rem );
	}
	return NULL;
}
