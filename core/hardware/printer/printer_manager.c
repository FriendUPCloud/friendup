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

/**
 * Creates a new Printer Manager
 * 
 * @param sb pointer to SystemBase
 * @return new PrinterManager structure when success, otherwise NULL
 */
PrinterManager *PrinterManagerNew( void *sb )
{
	PrinterManager *pm = NULL;
	if( ( pm = FCalloc( 1, sizeof(PrinterManager) ) )!= NULL )
	{
		pm->pm_SB = sb;
	}
	return pm;
}

/**
 * Delete Printer Manager
 * 
 * @param pm pointer to PrinterManager which will be deleted
 */
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

/**
 * Add printer to system
 * 
 * @param pm pointer to PrinterManager
 * @param np pointer to FPrinter
 * @param session if session is provided then printer will be attached to it, otherwise printer will be added to global pool
 * @return 0 when success, otherwise error number
 */
int PrinterManagerAddPrinter( PrinterManager *pm, FPrinter *np, UserSession *session )
{
	if( pm != NULL )
	{
		pm->pm_IDGenerator++;
		np->fp_ID = pm->pm_IDGenerator;
		// printer will be added to global printers
		if( session == NULL )
		{
			DEBUG("[PrinterManager] New printer added\n");
			np->node.mln_Succ = (MinNode *)pm->pm_Printers;
			pm->pm_Printers = np;
		}
		// printer will be added to local user printers
		else
		{
			DEBUG("[PrinterManager] New printer added to user\n");
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

/**
 * Delete printer from user session or global pool
 * 
 * @param pm pointer to PrinterManager
 * @param id id of Printer
 * @param session when provided session will be removed from there, otherwise from global pool (If it exist there)
 * @return 0 when success, otherwise error number
 */
int PrinterManagerDeletePrinter( PrinterManager *pm, FULONG id, UserSession *session )
{
	if( pm != NULL )
	{
		// Trying to find printer attached to FC server
		
		FPrinter *prev = pm->pm_Printers;
		FPrinter *act = pm->pm_Printers;
		DEBUG("[PrinterManager] Printer Manager Delete Printer\n");
		
		if( act != NULL )
		{
			// we are going through all printers to find one with provided ID
			while( act != NULL )
			{
				if( act->fp_ID == id )
				{
					DEBUG("[PrinterManager] Printer found, will be removed from list now\n");
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
			DEBUG("[PrinterManager] Printer Manager Delete Printer from User\n");
		
			if( act != NULL )
			{
			// we are going through all printers to find one with provided ID
			while( act != NULL )
			{
				if( act->fp_ID == id )
				{
					DEBUG("[PrinterManager] Printer found, will be removed from list now (User)\n");
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
