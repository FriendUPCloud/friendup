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
