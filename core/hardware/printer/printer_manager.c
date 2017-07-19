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
 *  @date created 02/02/2017
 */

#include "printer_manager.h"
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

//
//
//

PrinterManager *PrinterManagerNew( void *sb )
{
	PrinterManager *pm = NULL;
	if( ( pm = FCalloc( 1, sizeof(PrinterManager) ) )!= NULL )
	{
		pm->pm_SB = sb;
	}
	return pm;
}

//
//
//

void PrinterManagerDelete( PrinterManager *pm )
{
	if( pm != NULL )
	{
		FPrinter *lprint = pm->pm_Printers;
		FPrinter *rprint = lprint;
		while( lprint != NULL )
		{
			rprint = lprint;
			lprint = (FPrinter *)lprint->node.mln_Succ;
			
			PrinterDelete( rprint );
		}
		
		FFree( pm );
	}
}

//
//
//

int PrinterManagerAddPrinter( PrinterManager *pm, FPrinter *np, UserSession *session )
{
	if( pm != NULL )
	{
		pm->pm_IDGenerator++;
		np->fp_ID = pm->pm_IDGenerator;
		// printer will be added to global printers
		if( session == NULL )
		{
			DEBUG("New printer added\n");
			np->node.mln_Succ = (MinNode *)pm->pm_Printers;
			pm->pm_Printers = np;
		}
		// printer will be added to local user printers
		else
		{
			DEBUG("New printer added to user\n");
			User *usr = session->us_User;
			if( usr != NULL )
			{
				np->node.mln_Succ = (MinNode *)usr->u_Printers;
				usr->u_Printers = np;
			}
		}
	}
	else
	{
		return 1;
	}
	return 0;
}

//
//
//

int PrinterManagerDeletePrinter( PrinterManager *pm, FULONG id, UserSession *session )
{
	if( pm != NULL )
	{
		// Trying to find printer attached to FC server
		
		FPrinter *prev = pm->pm_Printers;
		FPrinter *act = pm->pm_Printers;
		DEBUG("Printer Manager Delete Printer\n");
		
		if( act != NULL )
		{
			// we are going through all printers to find one with provided ID
			while( act != NULL )
			{
				if( act->fp_ID == id )
				{
					DEBUG("Printer found, will be removed from list now\n");
					if( act == pm->pm_Printers )
					{
						pm->pm_Printers = (FPrinter *)act->node.mln_Succ;
					}
					else
					{
						prev->node.mln_Succ = (MinNode *)act->node.mln_Succ;
					}
					
					PrinterDelete( act );
					break;
				}
				prev = act;
				act = (FPrinter *)act->node.mln_Succ;
			}
		}
		else
		{
			FERROR("No printers to remove\n");
		}
		
		// Trying to find printer attached to FCUser
		User *usr = session->us_User;
		if( act == NULL && usr != NULL )
		{
			prev = usr->u_Printers;
			act = usr->u_Printers;
			DEBUG("Printer Manager Delete Printer from User\n");
		
			if( act != NULL )
			{
			// we are going through all printers to find one with provided ID
			while( act != NULL )
			{
				if( act->fp_ID == id )
				{
					DEBUG("Printer found, will be removed from list now (User)\n");
					if( act == usr->u_Printers )
					{
						usr->u_Printers = (FPrinter *)act->node.mln_Succ;
					}
					else
					{
						prev->node.mln_Succ = (MinNode *)act->node.mln_Succ;
					}
					
					PrinterDelete( act );
					break;
				}
				prev = act;
				act = (FPrinter *)act->node.mln_Succ;
			}
		}
		else
		{
			FERROR("No printers to remove\n");
		}
		}
	}
	
	return 0;
}