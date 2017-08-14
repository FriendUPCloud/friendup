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

// This file can be edited

var server = {
	tls : {
		keyPath : '/home/francois/friendup/build/cfg/crt/key.pem',
		certPath : '/home/francois/friendup/build/cfg/crt/certificate.pem',
		key : null,
		cert : null,
	},
	ws : {
		port : 6514,
	},
	friendcore : {
		host  : 'test.localfriend',
		port  : 6502,
	},
};

var shared = {
	rtc : {
		iceServers : [
			{
				urls : [
					"stun:friendsky.cloud:3478",
				],
			},
			{
				urls : [
					"turn:friendsky.cloud:3478",
				],
				username : 'hello-TURN-user',
				credential : 'hello-TURN-credential',
			},
		],
	},
};

var conf = {
	shared : shared,
	server : server,
};

module.exports = conf;
