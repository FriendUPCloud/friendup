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
 *  CalendarManager body
 *
 * All functions related to CalendarManager structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 15/10/2018
 */

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include "calendar_manager.h"
#include <system/systembase.h>
#include <system/calendar/calendar_entry.h>

/**
 * Create new CalendarManager
 *
 * @param sb pointer to SystemBase
 * @return new CalendarManager structure when success, otherwise NULL
 */
CalendarManager *CalendarManagerNew( void *sb )
{
	CalendarManager *cm;
	SystemBase *lsb = (SystemBase *)sb;
	
	DEBUG("[CalendarManagerNew] start\n");
	
	if( ( cm = FCalloc( 1, sizeof(CalendarManager) ) ) != NULL )
	{
		/*
		cm->c_SB = sb;
		pthread_mutex_init( &(cm->c_Mutex), NULL );
		cm->c_Quit = FALSE;
		
		SQLLibrary *lsqllib = lsb->LibrarySQLGet( lsb );
		if( lsqllib != NULL )
		{
			int entries;
			// reading all entries from FCalendar table
			cm->c_CalEntries = lsqllib->Load( lsqllib, FCalendarEntryDesc, NULL, &entries );
	
			lsb->LibrarySQLDrop( lsb, lsqllib );
		}
		
		// we must sort all entries
		CalendarEntry *ce = cm->c_CalEntries;
		while( ce != NULL )
		{
			// create new event based on entry in table
			CalendarEvent *newEvent = CalendarEventNew( ce );
			
			CalendarManagerAddEventToList( cm, newEvent );
			
			ce = (CalendarEntry *)ce->node.mln_Succ;
		}
		
		cm->c_Thread = ThreadNew( CalendarManagerEventLoop, cm, TRUE, NULL );
		DEBUG("[CalendarManagerNew] thread started\n");
		*/
	}
	DEBUG("[CalendarManagerNew] end\n");
	return cm;
}

/**
 * Remove CalendarManager structure
 *
 * @param cm pointer to CalendarManager structure which will be deleted
 */
void CalendarManagerDelete( CalendarManager *cm )
{
	if( cm != NULL )
	{
		/*
		DEBUG("[CalendarManagerDelete] start\n"); 
		if( cm->c_Thread != NULL )
		{
			cm->c_Thread->t_Quit = TRUE;
			cm->c_Quit = TRUE;
			while( cm->c_Thread->t_Launched != FALSE )
			{
				//DEBUG("[CalendarManagerDelete] wait till end\n"); 
				sleep( 1 );
			}
		}
		DEBUG("[CalendarManagerNew] thread stopped\n");
		
		FRIEND_MUTEX_LOCK( &(cm->c_Mutex) );
		
		CalendarEventDeleteAll( cm->c_CalEvents );
		
		CalendarEntryDeleteAll( cm->c_CalEntries );
		
		FRIEND_MUTEX_UNLOCK( &(cm->c_Mutex) );
		
		pthread_mutex_destroy( &(cm->c_Mutex) );
		*/
		FFree( cm );
		DEBUG("[CalendarManagerDelete] end\n"); 
	}
}

/* function to swap data of two nodes a and b*/
inline static void CalendarManagerSwap( CalendarEvent *a, CalendarEvent *b )
{
    CalendarEvent t;
	t.ce_ActionTime = a->ce_ActionTime;
	t.ce_CalEntry = a->ce_CalEntry;
    a->ce_ActionTime = b->ce_ActionTime;
	a->ce_CalEntry = b->ce_CalEntry;
	b->ce_ActionTime = t.ce_ActionTime;
	b->ce_CalEntry = t.ce_CalEntry;
} 

/**
 * Sort CalendarManager structure (bubble sort)
 *
 * @param cm pointer to CalendarManager structure. All calendars event there will be sorted
 */
void CalendarManagerSort( CalendarManager *cm )
{
	SystemBase *sb = (SystemBase *)cm->c_SB;
	CalendarEvent *start = cm->c_CalEvents;
	
	int swapped, i; 
	CalendarEvent *ptr1; 
	CalendarEvent *lptr = NULL; 
  
	// Checking for empty list 
    if( start == NULL)
	{
		return; 
	}
  
	do
	{ 
		swapped = 0; 
		ptr1 = start; 

		while( ptr1->node.mln_Succ != (MinNode *)lptr )
		{
			CalendarEvent *ne = (CalendarEvent *) ptr1->node.mln_Succ;
			if( ptr1->ce_ActionTime > ne->ce_ActionTime ) 
			{
				CalendarManagerSwap( ptr1, (CalendarEvent *)ptr1->node.mln_Succ );
				swapped = 1;
			}
			ptr1 = (CalendarEvent *)ptr1->node.mln_Succ;
		}
		lptr = ptr1;
	}
	while( swapped );
}    // end of 'Sort()'

/**
 * Calendar handling loop routine
 *
 * @param cm pointer to CalendarManager structure
 */
void CalendarManagerEventLoop( FThread *ptr )
{
	CalendarManager *cm = (CalendarManager *)ptr->t_Data;
	SystemBase *sb = (SystemBase *)cm->c_SB;
	CalendarEvent *ce = cm->c_CalEvents;
	
	while( cm->c_Quit != TRUE )
	{
		//DEBUG("[CalendarManagerEventLoop] quit %d\n", cm->c_Quit );
		if( ce != NULL )
		{
			// wait 5 seconds and check if action must be done, otherwise back to loop
			while( cm->c_Quit != TRUE )
			{
				time_t currTime = time( NULL );
				time_t diffTime = ce->ce_ActionTime - currTime;
				if( diffTime > 5 )
				{
					diffTime = 5;
				}
				sleep( diffTime );
				
				if( currTime >= ce->ce_ActionTime )
				{
					// we found entry which we can handle
					break;
				}
			}

			FBOOL timeUpdated = FALSE;
			time_t currTime = time( NULL );
			
			while( ce != NULL )
			{
				FBOOL removeMe = FALSE;
		
				if( currTime >= ce->ce_ActionTime )
				{
					// if this is not "last warning"
					if( ce->ce_ActionTime != ce->ce_CalEntry->ce_TimeFrom )
					{
						ce->ce_ActionTime = ce->ce_CalEntry->ce_TimeFrom;
						timeUpdated = TRUE;	// if time was updated we must sort entries in list
					}
					else	// information after reminder
					{
						if( ce->ce_CalEntry->ce_RepeatTime == -1 )
						{
							// never ending loop
						}
						else
						{
							ce->ce_CalEntry->ce_RepeatTime--;
							
							if( ce->ce_CalEntry->ce_RepeatTime <= 0 )	// remove entry
							{
								removeMe = TRUE;
							}
						}
					}
				}
				else	// next entries
				{
					break;
				}
		
				// remove event, if it was executed
				if( removeMe == TRUE )
				{
					CalendarEvent *delMe = ce;
					ce = (CalendarEvent *)ce->node.mln_Succ;
					
					if( delMe != NULL )
					{
						CalendarEvent *p = (CalendarEvent *)delMe->node.mln_Pred;
						if( p == cm->c_CalEvents )
						{
							
						}
						CalendarEvent *n = (CalendarEvent *)delMe->node.mln_Succ;
						p->node.mln_Succ = (MinNode *)n;
						n->node.mln_Pred = (MinNode *)p;
						
						CalendarEventDelete( delMe );
					}
				}
				else
				{
					ce = (CalendarEvent *)ce->node.mln_Succ;
				}
			}
			
			if( timeUpdated == TRUE )
			{
				DEBUG("[CalendarManagerEventLoop] Sort entries\n");
				CalendarManagerSort( cm );
			}
		} // ce == NULL
		else
		{
			//DEBUG("[CalendarManagerEventLoop] default wait\n");
			sleep( 5 );
		}
	}	// while quit
	DEBUG("[CalendarManagerEventLoop] quit\n");
	ptr->t_Launched = FALSE;
}

