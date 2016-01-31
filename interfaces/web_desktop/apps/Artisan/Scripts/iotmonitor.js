/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

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

