'use strict';

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


const log = require( './component/Log' )( 'fnet' );
const conf = require( './component/Config' ); // not really bothering with saving the obj,
                                              // it writes itself to global.config
const fcReq = require( './component/FCRequest' )( global.config.server.friendcore );
const Hub = require( './component/Hub' );
const NML = require( './component/NoMansLand' );

log( 'conf', conf, 4 );

var fnet = {
	conn  : null,
	hub   : new Hub(),
};

fnet.conn = new NML( fcReq, fnet.hub );

