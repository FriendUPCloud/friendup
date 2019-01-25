/*******************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

#pragma once

/**
 * Generates a random session ID string.
 * @return Pointer to random string, NULL after failure.
 */
char* SessionIDGenerate(void);

FBOOL GenerateUUID( char **dst );
