/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	drawTable();
	loadDevices();
}

var types = [
	'yaw',
	'pitch',
	'roll',
	'elevation',
	'angle',
	'amplitude',
	'r', 
	'g',
	'b'
];

function drawTable()
{
	var str = '';
	for( var a in types )
	{
		var t = types[a].substr( 0, 1 ).toUpperCase() + types[a].substr( 1, types[a].length - 1 );
		str += '<tr><td><strong>' + t + ':</strong></td><td><input type="text" id="inp' + t + '"/></td></tr>';
	}
	str += '<tr><td><strong>Status:</strong></td><td><input type="text" id="inpStatus" value="offline"/></td></tr>';
	ge( 'MonitorContent' ).innerHTML = '<p><strong>Datasheet:</strong></p><table>' + str + '</table>';
}

function loadDevices()
{
	var m = new Module( 'iotdevice' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			var devices = JSON.parse( data );
			var str = '';
			for( var a in devices )
			{
				var dev = devices[a];
				console.log( dev );
				str += '<option value="' + dev.Id + '">' + dev.Username + ' #' + dev.DeviceId + '</option>';
			}
			ge( 'Devices' ).innerHTML = str;
		}
	}
	m.execute( 'listdevices' );
}

// Connect to an iot device
function connect()
{
	var id = ge( 'Devices' ).value;
	var m = new Module( 'iotdevice' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			var d = JSON.parse( data );
			Application.currentUserId = d.userId;
			Application.currentDeviceId = d.deviceId;
			refreshDeviceData();
		}
	}
	m.execute( 'connect', { id: id } );
}

// Keeps data refreshed
function refreshDeviceData()
{
	var m = new Module( 'iotdevice' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			var d = JSON.parse( data );
			for( var a in d )
			{
				ge( 'inp' + a ).value = d[a];
			}
			ge( 'inpStatus' ).value = 'online';
			setTimeout( refreshDeviceData, 100 );
		}
	}
	m.execute( 'data', { deviceId: Application.currentDeviceId, userId: Application.currentUserId } );
}

