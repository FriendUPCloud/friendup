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
 *  Core class handling
 *
 *  Core classes provide a C++ like system for object oriented programming
 *  in C and a message dispatch mechanism.
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date pushed 06/02/2015
 */
#include <class/class.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <util/log/log.h>

/**
 * Creates a new class
 *
 * @param[in]cid class identifier
 * @param[in]rc FLTODO
 * @param[in]disp FLTODO
 * @return the created class itself
 * @todo FL>PS Please give me information on this function, it is not called anywhere
 */
Class *ClassCreate( ClassID cid, Class *rc, struct Hook *disp )
{
	Class *c;

	DEBUG("Create class %s\n", cid );
	if( rc != NULL )
	{
		DEBUG("SUBCLASS %s\n", rc->cl_ID );
	}

	c = calloc( sizeof( Class ), 1 );

	if( c != NULL )
	{
		c->cl_ID = cid;

		if( rc != NULL )
		{
			c->cl_Super = rc;
		}

		if( disp != NULL )
		{
			memcpy( &(c->cl_Dispatcher), disp, sizeof( struct Hook ) );
			// we copy pointer to funtion and all parameters
		}else{
			goto class_error;
		}
		DEBUG("Create class %s END\n", cid );

		return c;
	}
class_error:
	if( c )
	{
		free( c );
	}
	DEBUG("Create class PROBLEM %s END\n", cid );

	return NULL;
}

/**
 * Checks if an object can be destroyed
 *
 * @param c class structure
 * @return 0 if deletion was fine
 * @return 1 if objects are still used in the class
 * @return 2 if sub-objects are in use
 * @todo FL>PS Please give me information on this function, it is not called anywhere
 */
FULONG ClassDelete( struct Class *c )
{
	FULONG res = 0;
	DEBUG("Remove class %s , instances %ld\n", c->cl_ID, c->cl_ObjectCount  );

	if( c->cl_ObjectCount > 0 )
	{
		FERROR("Cannot remove class, %ld already objects use it", c->cl_ObjectCount );
		return 1;
	}

	if( c->cl_SubclassCount > 0 )
	{
		FERROR("Cannot remove class, %ld already objects use it", c->cl_ObjectCount );
		return 2;
	}

	if( c != NULL )
	{
		free( c );
	}

	DEBUG("Remove class END\n" );

	return res;
}

//#define  DoMethodA( obj, ((struct TagItem **)tags) ); }

/**
 * Creates a new object
 *
 * Called from the ObjectNew macro
 *
 * @param c pointer the parent class
 * @param o pointer to sibling object FLTODO no sure
 * @param msg pointer to the message handling structure
 * @return the newly created object
 */
Object *ObjectNewF( Class *c, Object *o, struct Msg *msg )
{
	Object *retObject = NULL;
	DEBUG( "Create Object\n" );

	DEBUG("Create Object: Checking pointer to superclass %p  name '%s'  msg pointer %p disppointer %p\n", c, c->cl_ID, msg, c->cl_Dispatcher.h_Function );

	// we call method on object

	retObject = (Object *)c->cl_Dispatcher.h_Function( (APTR)c, (APTR)o, (APTR) msg );

	DEBUG( "Create Object END at ptr %p\n", retObject );

	return retObject;
}

/**
 * Destroys an object
 *
 * Decreases the total object count in the parent class struture
 * Skips the unused objects
 * Transmits the message to the dispatcher of the class
 *
 * @param o the object to delete
 * @todo FL>PS Please give me information on this function, it is not called anywhere
 */
void ObjectDelete( Object *o )
{
	DEBUG( "Delete Object of class '%s'\n", o->o_Class->cl_ID );

	if( o != NULL )
	{
		struct Msg message;
		Class *c;
		Class *lc;

		message.MethodID = FM_DISPOSE;
		message.data = NULL;

		c = o->o_Class;
		lc = o->o_Class;

		// lets substract used objects
		while( lc != NULL )
		{
			lc->cl_ObjectCount--;
			lc = lc->cl_Super;
		}

		DEBUG("Remove current object\n");
		c->cl_Dispatcher.h_Function( (APTR)c, (APTR)o, (APTR)&message );
	}
}

/**
 * Calls a function of the super instance of an object
 *
 * The actual call is done via dispatcher of the super object class
 *
 * @param c pointer to the class
 * @param o pointer to the object
 * @param msg pointer to the message handliing structure
 * @return the value returned by the message handling cascade
 * @return NULL if the object has no super instance
 */
FULONG DoSuperMethod( Class *c, Object *o, struct Msg *msg )
{
    if( c->cl_Super ){ 
        Object *lo = (Object *)o->o_Node.mln_Pred; 
        Class *lc = lo->o_Class;  
        return (FULONG)lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)lo, (APTR) msg ); 
    }else{
    	return (FULONG)NULL;
    }
}
