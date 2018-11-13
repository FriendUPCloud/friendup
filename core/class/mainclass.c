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
 *  Core MAIN class handling
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date pushed 06/02/2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <core/types.h>
#include <class/rootclass.h>

/**
 * Creates a new MAIN class object
 *
 * This function is not used in the system
 *
 * @param c pointer to class
 * @param o not used in this version (FL>PS what is its use?)
 * @param msg pointer to message structure
 * @return the created class
 * @return NULL is failed
 *
 * @todo FL>PS exploration of the list of message should be removed in release version
 */
FULONG mainNew( Class *c, Object *o __attribute__((unused)), struct Msg *msg )
{
	struct opSet *set = (struct opSet *)msg;//->data;
	struct TagItem *lt = (set->ops_AttrList);
	//o->o_UserData = calloc( sizeof( struct Data ), 1 );
	Object *newObject = NULL;

	DEBUG("MAINNEW START\n");

	newObject = ObjectSuperNew( c, msg );

	DEBUG("MAINNEW with setID %ld ATTRLISTPOINTER %p pointer %p\n", set->MethodID, set->ops_AttrList, set );

	while( lt->ti_Tag != TAG_END )
	{
		//printf("MAINNEW inside loop %x %lu\n", lt->ti_Tag, lt->ti_Data );
		lt++;
	}

	DEBUG("MAINNEW return new object at ptr %p\n", newObject );

	return (FULONG)newObject;
}

/**
 * Destroys a MAIN class object
 *
 * @param c pointer to class
 * @param o pointer to object o detroy
 * @param msg pointer to message structure
 * @return 0
 */
FULONG mainDispose( Class *c, Object *o, struct Msg *msg )
{
	FULONG res = 0;

	DEBUG("MAINDISPOSE start\n");

	if( o->o_UserData != NULL)
	{
		free( o->o_UserData );
		o->o_UserData = NULL;
	}

	DoSuperMethod( c, o, msg );

	free( o );

	DEBUG("MAINDISPOSE END\n");

	return res;
}

/**
 * Destroys a MAIN class object
 *
 * @param c class to destroy
 * @param o object associated with the class (FL>PS what is its use?)
 * @param msg pointer to message structure
 * @return 0
 *
 * @todo FL>PS exploration of the list of message should be removed in release version
 *
 */
FULONG mainSet( Class *c, Object *o, struct Msg *msg )
{
	FULONG res = 0;

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);
	DEBUG("MAINNEW set\n");

	while( lt->ti_Tag != TAG_END )
	{
		//printf("MAINNEW set loop %x %lu\n", lt->ti_Tag, lt->ti_Data );
		lt++;
	}

	DoSuperMethod( c, o, msg );

	return res;
}


/**
 * Dispatchs messages within a MAIN class
 *
 * @param c class to dispatch to
 * @param o object associated with the class (FL>PS what is its use?)
 * @param msg pointer to message structure
 * @return value returned by the message handling routines of the class
 * @return NULL if message don't exist
 *
 * @todo FL>PS many messages not implemented
 */
FULONG mainDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	FULONG retVal = (FULONG)NULL;
	// we dont call super methods beacouse this method is done on root
	DEBUG("MAINNEW dispatcher MID %ld \n", m->MethodID );
	//o->curr_MethodID = m->MethodID;

	switch( m->MethodID )
	{
	case FM_NEW:		return mainNew( c, o, m );
		break;

	case FM_DISPOSE:	return mainDispose( c, o, m );
		break;

	case FM_SET:		return mainSet( c, o, m );
		break;

	//case OM_GET:
	//	break;

	case FM_ADDTAIL:
		break;

	case FM_REMOVE:
		break;

	case FM_NOTIFY:
		break;
	
	case FM_UPDATE:
		break;

	case FM_ADDMEMBER:
		break;

	case FM_REMMEMBER:
		break;

	default:
		retVal = DoSuperMethod( c, o, m );
		break;
	}

	return retVal;
}




