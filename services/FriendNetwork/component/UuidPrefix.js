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



var log = require( './Log' )( 'Uuid-prefix' );
var uuid = require( 'uuid' );
var ns = {};

ns.UuidPrefix = function( prefix ) {
	if ( !( this instanceof ns.UuidPrefix ))
		return new ns.UuidPrefix( prefix );
	
	const self = this;
	self.prefix = prefix || 'id';
}

ns.UuidPrefix.prototype.get = function( prefix ) {
	const self = this;
	return self.v4( prefix );
}

ns.UuidPrefix.prototype.v1 = function( prefix ) {
	const self = this;
	var prefix = prefix || self.prefix;
	return prefix + '-' + uuid.v1();
}

ns.UuidPrefix.prototype.v4 = function( prefix ) {
	const self = this;
	var prefix = prefix || self.prefix;
	return prefix + '-' + uuid.v4();
}

module.exports = ns.UuidPrefix;
