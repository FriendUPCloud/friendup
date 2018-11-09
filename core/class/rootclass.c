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
 *  Core ROOT class handling
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 10/15/2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <core/types.h>
#include <class/rootclass.h>
#include <util/log/log.h>
#include <core/event.h>


/**
 * Special class data
 */

struct Data
{
	FULONG value;
};


#ifndef DOXPUBLIC  // Internal documentation only
/**
 * Transfers data zones from all messaged to object data params
 *
 * One function sets all
 *
 * @param c pointer to class
 * @param o pointer to object
 * @param msg pointer to message structure
 */
void rootSetForAll( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	DEBUG("ROOTNEW: SET FOR ALL\n");

	struct opSet *set = (struct opSet *)msg;
	DEBUG("ROOTNEW: SET FOR ALL 1\n");
	struct TagItem *lt = (set->ops_AttrList);
	DEBUG("ROOTNEW: SET FOR ALL 2\n");
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("ROOTNEW: SET FOR ALL 3\n");

	while( lt->ti_Tag != TAG_END )
	{
		switch( lt->ti_Tag )
		{
			case FA_SetValue:
				data->value = (FULONG)lt->ti_Data;
				DEBUG("ROOTNEW FUIA_SetValue set root value %lu\n", lt->ti_Data );
			break;
		}
		
		lt++;
	}
}

#endif          // DOXPUBLIC

/**
 * Handling of the FM_NEW message for ROOT class
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return pointer to the new object
 * @return NULL if error
 */
FULONG rootNew( Class *c, Object *o __attribute__((unused)), struct Msg *msg )
{
	FULONG res = 0;
	DEBUG("ROOTNEW START\n");

	struct opSet *set = (struct opSet *)msg;//->data;
	struct TagItem *lt = (set->ops_AttrList);
	Object *newObject = NULL;

	DEBUG("ROOTNEW \n");

	if( ( newObject = calloc( sizeof( Object ), 1 ) ) != NULL )
	{
		newObject->o_UserData = calloc( sizeof( struct Data ), 1 );
		newObject->o_Class = c;
		c->cl_ObjectCount++;
		DEBUG("ROOTNEW object created %ld\n", c->cl_ObjectCount );
	}else{
		return (FULONG)NULL;
	}

	struct Data *data = (struct Data *)newObject->o_UserData;

	rootSetForAll( c, newObject, msg );

	DEBUG("ROOTNEW return new object at ptr %p\n", newObject );

	return (FULONG)newObject;
}

/**
 * Handling of the FM_DISPOSE message for ROOT class
 *
 * Release all associated memory assiciated with this instance of the class
 * then calls the super class with the same message structure
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 */
FULONG rootDispose( Class *c __attribute__((unused)), Object *o, struct Msg *msg __attribute__((unused)))
{
	FULONG res = 0;

	DEBUG("ROOTDISPOSE start\n");

	// remove notifications first

	Event *event = o->o_Event;

	while( event != NULL )
	{
		Event *delEvent = event;
		event = (Event *)event->node.mln_Succ;

		free( delEvent );
	}

	// remove data

	if( o->o_UserData != NULL)
	{
		free( o->o_UserData );
		o->o_UserData = NULL;
	}
	free( o );

	DEBUG("ROOTDISPOSE\n");

	return res;
}

/**
 * Handling of the FM_SET message for ROOT class
 *
 * Transfers the message structure data zones into the instance
 * Calls the super class for execution
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 */
FULONG rootSet( Class *c, Object *o, struct Msg *msg )
{
	FULONG res = 0;
	DEBUG("ROOTSET\n");

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);
	struct Data *data = (struct Data *)o->o_UserData;

	rootSetForAll( c, o, msg );

	return res;
}

/**
 * Handling of the FM_GET message for ROOT class
 *
 * Sub-messages suported:
 * FA_PHPProxy_Parameters: proxy parameters
 * FA_PHPProxy_Results: results of the last proxy action
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 */
FULONG rootGet( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	FULONG res = 0;
	DEBUG("ROOTGET\n");

	struct opGet *get = (struct opGet *)msg;
	struct Data *data = (struct Data *)o->o_UserData;

	switch( get->opg_AttrID )
	{
		case FA_SetValue:
			*(get->opg_Storage)	=	(FULONG *)data->value;
			DEBUG("ROOTGET FUIA_GetValue get root value %lu\n", data->value );
		break;
	}

	return res;
}


/**
 * Handling of the FM_NOTIFY message for ROOT class
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 * @return 1 in case of memory allocation error
 */
FULONG rootNotify( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	struct opSet *set = (struct opSet *)msg;//->data;
	FULONG *lt = (FULONG *)(set->ops_AttrList);
	Event *event = (Event *)msg;
	Event *lastEvent = o->o_Event;
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("NOTIFY: SET FOR ALL\n");

	if( ( event = calloc( sizeof( Event ), 1 ) ) != NULL )
	{
		event->e_Src = o;                	// pointer to source object
 		event->e_AttributeCheck = lt[ 0 ];  // check argument set
    	event->e_Value = lt[ 1 ];           // if value is set do something

		event->e_Dst = (void *)lt[ 2 ];
		event->e_DstMethodID = lt[ 3 ];
		event->e_Data = (void *)lt[ 4 ];
		DEBUG("NOTIFY SET OBJECT %ld  method %x data %ld\n", lt[ 2 ], (unsigned int)lt[ 3 ], lt[ 4 ] );

		if( lastEvent != NULL )
		{
			while( lastEvent->node.mln_Succ != NULL )
			{
				lastEvent = (Event *)lastEvent->node.mln_Succ;
			}

			lastEvent->node.mln_Succ = (struct MinNode *)event;
			event->node.mln_Pred = (struct MinNode *)lastEvent;
		}else{
			o->o_Event = event;
		}

		
	}else{
		return 1;
	}

	return 0;
}

//
// TEST
//
FULONG rootTest( Class *c __attribute__((unused)), Object *o __attribute__((unused)), struct Msg *msg )
{
	FULONG *data = (FULONG *)(msg->data);

	DEBUG("ROOTTEST with parameter pointer %ld\n", *data );

	return 0;
}

/**
 * Message dispatching for ROOT class
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return value returned by the object methods
 * @return 0 if message ID not found
 */
FULONG rootDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	// we dont call super methods beacouse this method is done on root
	DEBUG("ROOTCLASS dispatcher MID %ld \n", m->MethodID );
	//o->curr_MethodID = m->MethodID;

	switch( m->MethodID )
	{
	case FM_NEW:		return rootNew( c, o, m );
		break;

	case FM_DISPOSE:	return rootDispose( c, o, m );
		break;

	case FM_SET:
		{
			Event *event = o->o_Event;
			struct opSet *set = (struct opSet *)m;

			DEBUG("Event call: OM_SET called %p\n", event );

			while( event != NULL )
			{
				struct TagItem *lt = (set->ops_AttrList);

				DEBUG("Event call: check %p\n", lt );

				while( lt->ti_Tag != TAG_END )
				{
					if( lt->ti_Tag == event->e_AttributeCheck )
					{
						if( lt->ti_Data == FNotify_Everytime )
						{
							DEBUG("Event call: Every Time call\n");
							DoMethod( event->e_Dst, event->e_DstMethodID, (FULONG)event->e_Data );
						}else if( event->e_Value == (FLONG)lt->ti_Data )
						{
							DEBUG("Event call: for value %ld\n", event->e_Value );
							DoMethod( event->e_Dst, event->e_DstMethodID, (FULONG)event->e_Data );
						}
					}
					lt++;
				}

				event = (Event *)event->node.mln_Succ;
			}
			return rootSet( c, o, m );
		}
	case FM_SETNN:		return rootSet( c, o, m );
		break;

	case FM_GET:		return rootGet( c, o, m );
		break;

	case FM_NOTIFY:		return rootNotify( c, o, m );
		break;

	case FM_Root_Test: return rootTest( c, o, m );
		break;
	}

	return 0;
}




