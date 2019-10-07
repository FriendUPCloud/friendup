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
 *  Friend Core information system definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 * 
 * \ingroup FriendCoreInfo
 * @{
 */

#ifndef __CORE_FRIENDCORE_INFO_H__
#define __CORE_FRIENDCORE_INFO_H__

#include <core/types.h>
#include <util/buffered_string.h>

#define GEO_LOCATION_FILE "cfg/geolocation"

/**
 * Structure containing information to locate the Friend Core to query
 */
typedef struct FriendcoreInfo
{
	int 						fci_FCNumber;	///< numbe of the Friend Core to query
	char						*fci_LocalisationJSON; // localisation string in json format
	char						*fci_TimeZone; // Europe, North America, etc.
	char						fci_CountryCode[ 16 ]; // Country
	char						*fci_City;
	void						*fci_SLIB; // pointer to system.library
}FriendcoreInfo;

//
//
//

FriendcoreInfo *FriendCoreInfoNew( void *slib );

//
//
//

void FriendCoreInfoDelete( FriendcoreInfo *fci );

//
//
//

BufString *FriendCoreInfoGet( FriendcoreInfo *fci );

#endif // __CORE_FRIENDCORE_INFO_H__

/**@}*/
// End of FriendCoreInfo Doxygen group
