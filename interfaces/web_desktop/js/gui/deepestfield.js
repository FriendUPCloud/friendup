/*©agpl*************************************************************************
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
*****************************************************************************©*/

/**
 * The Deepest Field in FriendUP shows all the connected resources in one place
 * @author Hogne Titlestad
 */
DeepestField = {
	zones: [],
	connections: {},
	available: true,
	// For measuring network activity
	networkActivity: {
		frame: 0,
		max: 0,
		frames: new Uint16Array( window.innerWidth ),
		frameLength: window.innerWidth,
		timeToFinish: []
	},
	// Initialize deepest field
	init: function()
	{
		// No need to reinitialize
		if( this.initialized ) return;
		
		this.initialized = true;
		
		// Cound network activity
		if( !window.isMobile )
		{
			setInterval( function()
			{
				DeepestField.calculateStats();
			}, 250 );
		}
		
		var d = document.createElement( 'canvas' );
		ge( 'DeepestField' ).appendChild( d );
		d.id = 'DeepestCanvas';
		d.style.position = 'absolute';
		d.style.top = '0px';
		d.style.left = '0px';
		this.canvas = d;
		this.ctx = d.getContext( '2d' );
		
		var hiddenBuffer = document.createElement( 'div' );
		hiddenBuffer.style.position = 'absolute';
		hiddenBuffer.style.overflow = 'hidden';
		hiddenBuffer.style.width = '1px';
		hiddenBuffer.style.height = '1px';
		hiddenBuffer.style.top = '-10px';
		d.parentNode.appendChild( hiddenBuffer );
		this.hiddenBuffer = hiddenBuffer;
		
		function resizeField()
		{
			d.setAttribute( 'width', document.body.offsetWidth );
			d.setAttribute( 'height', document.body.offsetHeight );
			DeepestField.redraw();
		}
		window.addEventListener( 'resize', resizeField );
		window.addEventListener( 'mousemove', function( e )
		{
			// Only allow on canvas
			var tg = e.target ? e.target : e.srcElement;
			if( tg.id != 'DeepestCanvas' ) return;
				
			var cx = e.clientX;
			var cy = e.clientY;
			var found = false;
			for( var a = 0; a < DeepestField.zones.length; a++ )
			{
				var p = DeepestField.zones[a];
				if( cx >= p.x && cx < p.x + p.w && cy >= p.y && cy < p.y + p.h )
				{
					document.body.classList.add( 'MousePointer' );
					found = true;
					break;
				}
			}
			if( !found )
			{
				document.body.classList.remove( 'MousePointer' );
			}
		} );
		window.addEventListener( 'mouseup', function( e )
		{
			// Only allow on canvas
			var tg = e.target ? e.target : e.srcElement;
			if( tg.id != 'DeepestCanvas' ) return;
			
			var cx = e.clientX;
			var cy = e.clientY;
			for( var a = 0; a < DeepestField.zones.length; a++ )
			{
				var p = DeepestField.zones[a];
				if( cx >= p.x && cx < p.x + p.w && cy >= p.y && cy < p.y + p.h )
				{
					KillApplication( p.ele );
				}
			}
		} );
		
		
		resizeField();
	},
	redraw: function()
	{
		if( !document.body.classList.contains( 'Inside' ) || !ge( 'Tray' ) )
		{
			// Try again
			if( !this.retrying )
			{
				this.retrying = true;
				return setTimeout( function()
				{
					this.retrying = false;
					DeepestField.redraw();
				}, 150 );
					
			}
			return;
		}
		this.zones = [];
		this.getDimensions();
		this.ctx.restore();
		this.ctx.fillStyle = '#333333';
		this.ctx.fillRect( 0, 0, this.w, this.h );
		this.updateTaskInformation();
		// Don't do this on mobile
		if( !window.isMobile )
		{
			this.drawStats();
			this.updateNotificationInformation();
		}
		this.updateCapabilities();
		this.updateNetConnections();
		this.ctx.save();
	},
	updateNetConnections: function()
	{
		ge( 'NetconnectionsHeader' ).innerHTML = i18n( 'i18n_active_network_connections' ) + ':';
		ge( 'FNetHeader' ).innerHTML = i18n( 'i18n_active_fnet_connections' ) + ':';
	},
	addConnection: function( ptr, url, object )
	{
		for( var a in this.connections )
			if( this.connections[a] == ptr ) return;
		var d = document.createElement( 'div' );
		d.className = 'Connection Ellipsis FullWidth PaddingSmall IconSmall fa-bullet';
		d.innerHTML = '<span class="IconSmall fa-remove MousePointer">&nbsp;</span>' + url;
		var str = 'Url: ' + object.url;
		if( object.vars )
		{
			var varcount = 0; for( var a in object.vars ) varcount++;
			if( varcount > 0 )
			{
				str += "\nVariables:";
				for( var a in object.vars )
				{
					str += "\n" + a + ': ' + object.vars[ a ];
				}
			}
		}
		d.object = object;
		d.setAttribute( 'title', str );
		this.connections[ptr] = d;
		ge( 'Netconnections' ).appendChild( d );
		var s = d.getElementsByTagName( 'span' )[0];
		s.onclick = function()
		{
			object.close();
		}
	},
	delConnection: function( ptr )
	{
		var out = {};
		var d = false;
		for( var a in this.connections )
		{
			if( a != ptr )
				out[a] = this.connections[a];
			else d = this.connections[a];
		}
		if( d ) 
		{
			d.parentNode.removeChild( d );
		}
		this.connections = out;
	},
	updateCapabilities: function()
	{
		var self = this;
		if( self.checkedCamera )
			return;
		
		ge( 'CapabilityHeader' ).innerHTML = i18n( 'i18n_devices_and_capabilities' ) + ':';
		
		var capas = ge( 'Capabilities' );
		//var cam = ge( 'Capabilities' ).getElementsByClassName( 'Webcam' );
		//Notify( { title: i18n( 'i18n_testing_camera' ), text: i18n( 'i18n_testing_camera_desc' ) } );
		try{
			navigator.mediaDevices.enumerateDevices()
			.then( foundDevices )
			.catch( enumError );
		}
		catch( e ) {
			self.checkedCamera = true;
			console.log('navigator.mediaDevices.enumerateDevices could not be run.');
			return;
		}
		
		function foundDevices( items )
		{
			self.checkedCamera = true;
			var addedMic = false;
			var addedCam = false;
			items.forEach( addToCapa );
			if( !addedMic )
				addMicrophone({ disabled : true, });
			
			if( !addedCam )
				addCamera({ disabled : true, });
			
			function addToCapa( item )
			{
				if( 'audioinput' === item.kind )
				{
					addedMic = true;
					addMicrophone( item );
					return;
				}
				
				if( 'videoinput' === item.kind )
				{
					addedCam = true;
					addCamera( item );
					return;
				}
				//console.log( 'checkCapabilities - unhandled device', item );
			}
		}
		
		function enumError( err )
		{
			console.log( 'updateCapabilities - enumerate devices failed', err );
		}
		
		function addCamera( conf )
		{
			conf.icon = 'fa-camera';
			var label = checkLabel( conf.label );
			if ( null == label )
				label = i18n( 'i18n_webcam_disabled' );
			
			conf.labelStr = label;
			addElement( conf );
		}
		
		function addMicrophone( conf )
		{
			conf.icon = 'fa-microphone';
			var label = checkLabel( conf.label );
			if ( null == label )
				label = i18n( 'i18n_microphone_disabled' );
			
			conf.labelStr = label;
			addElement( conf );
		}
		
		function checkLabel( label )
		{
			if ( null == label )
				return null;
			
			// if label is '', the device has been blocked in the browser
			if ( 0 === label.length )
			{
				label = i18n( 'i18n_blocked_in_browser' ); 
				return label;
			}
			else
				return label;
		}
		
		function addElement( conf )
		{
			var d = document.createElement( 'div' );
			d.className = 'Webcam ' + conf.icon;
			var enableKlass = conf.disabled ? 'Disabled' : 'Enabled';
			d.classList.add( enableKlass );
			d.innerHTML = '<span>' + conf.labelStr + '</span>';
			capas.appendChild( d );
		}
	},
	updateTaskInformation: function()
	{
		ge( 'TasksHeader' ).innerHTML = ge( 'Tasks' ).getElementsByTagName( 'iframe' ).length + ' ' + i18n( 'i18n_tasks_running' ) + ':';
	},
	updateNotificationInformation: function()
	{
		var nlen = ge( 'Notifications' ).getElementsByTagName( 'div' ).length / 2;
		var not = nlen == 1 ? 'i18n_notification' : 'i18n_notifications';
		ge( 'NotificationHeader' ).innerHTML = nlen + ' ' + i18n( not ) + '.';
	},
	getDimensions: function()
	{
		this.x = 0;
		this.y = 0;
		if( this.canvas )
		{
			this.w = this.canvas.getAttribute( 'width' );
			this.h = this.canvas.getAttribute( 'height' );
			// Center of profile bubble
			this.centerx = this.x + ( this.w * .5 );
			this.centery = this.y + 100 + 10;
		}
	},
	// Draw the statistics onto the deepest field
	drawStats: function()
	{	
		this.ctx.lineWidth = 1;
		
		var statsTop = 527;
		var statsHeight = window.innerHeight - statsTop;
		var statsMid = statsTop + ( statsHeight * 0.5 ) + 20;
		var margin = 20;
	
		// The container
		this.ctx.beginPath();
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
		this.ctx.moveTo( 0, statsTop );
		this.ctx.lineTo( window.innerWidth, statsTop );
		this.ctx.stroke();
		this.ctx.fillStyle = '#111111';
		this.ctx.fillRect( 0, statsTop, window.innerWidth, window.innerHeight );
		
		this.ctx.font = "14px Lato";
		this.ctx.fillStyle = '#000000';
		this.ctx.fillText( i18n( 'i18n_network_activity' ) + ':', margin + 1, statsMid + 1 );
		this.ctx.fillStyle = '#ffffff';
		this.ctx.fillText( i18n( 'i18n_network_activity' ) + ':', margin, statsMid );
		this.ctx.closePath();
		
		var statLineLeft = this.ctx.measureText( i18n( 'i18n_network_activity' ) ).width + margin + margin;
		
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		this.ctx.moveTo( statLineLeft, statsMid );
		this.ctx.lineTo( window.innerWidth - margin, statsMid );
		this.ctx.stroke();
		this.ctx.closePath();
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#ff4444';
		this.ctx.fillStyle = '#aa0000';
		this.ctx.moveTo( statLineLeft, statsMid );
		var statW = window.innerWidth - margin - statLineLeft;
		var px = 0;
		for( var a = 0; a < this.networkActivity.frameLength; a++ )
		{
			px = a / this.networkActivity.frameLength * statW;
			var py = this.networkActivity.frames[a] / this.networkActivity.max * ( statsHeight * 0.4 );
			this.ctx.lineTo( px + statLineLeft, statsMid - py );
		}
		this.ctx.lineTo( px, statsMid );
		this.ctx.stroke();
		this.ctx.fill();
		this.ctx.closePath();
	},
	// Calculate statistics
	calculateStats: function()
	{
		var average = 0;
		if( this.networkActivity.timeToFinish.length )
		{
			for( var a = 0; a < this.networkActivity.timeToFinish.length; a++ )
			{
				average += this.networkActivity.timeToFinish[a];
			}
			average /= this.networkActivity.timeToFinish.length;
		}
		
		// Make sure to register max latency
		if( average > this.networkActivity.max )
			this.networkActivity.max = average;
		
		this.networkActivity.timeToFinish = [];
		this.networkActivity.frames[ this.networkActivity.frame++ ] = average;
		if( this.networkActivity.frame >= this.networkActivity.frameLength ) this.networkActivity.frame = 0;
	},
	// Draw a filled circle
	drawFilledCircle: function( x, y, radius, lineColor, bgColor, lineWidth )
	{
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle = bgColor;
		this.ctx.strokeStyle = lineColor;
		this.ctx.arc( x, y, radius, 0, 2 * Math.PI, false );
		this.ctx.fill();
		if( typeof( bgColor ) == 'object' )
		{
			this.ctx.clip();
			
			var nw = nh = radius * 2;
			if( bgColor.width > bgColor.height )
			{
				nh = radius * 2;
				nw = bgColor.width / bgColor.height * nh;
			}
			else
			{
				nh = bgColor.height / bgColor.width * nw;
			}
			this.ctx.drawImage( bgColor, x - ( nw / 2 ), y - ( nh / 2 ), nw, nh );
		}
		this.ctx.lineWidth = lineWidth;
		this.ctx.stroke();
		this.ctx.restore();
	},
	// Draw a filled circle
	drawCircle: function( x, y, radius, lineColor, lineWidth )
	{
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.strokeStyle = lineColor;
		this.ctx.arc( x, y, radius, 0, 2 * Math.PI, false );
		this.ctx.lineWidth = lineWidth;
		this.ctx.stroke();
		this.ctx.restore();
	},
	// Draw text centered at coordinate (on x)
	drawTextCentered: function( text, x, y, fontSize )
	{
		if( !fontSize ) fontSize = '21px';
		this.ctx.font = fontSize + " Lato";		
		var textWidth = this.ctx.measureText( text ).width;
		this.ctx.fillStyle = "#ffffff";
		this.ctx.fillText( text, x - ( textWidth * .5 ), y );
	}
};

// Dropping elements!
window.addEventListener( 'mouseup', function( e )
{
	var t = e.target ? e.target : e.srcElement;
	if( t.id != 'DeepestCanvas' )
		return;
	
	// We dropped some icon!
	if( mousePointer.elements && mousePointer.elements[0] && mousePointer.elements[0].fileInfo )
	{
		var el = mousePointer.elements[0].fileInfo;
		
		// An image!
		if( el && el.Path.indexOf( /.jpg|.png|.jpeg|.gif/i ) )
		{
			var i = new Image();
			i.src = getImageUrl( el.Path );
			i.onload = function()
			{
				DeepestField.avatar = i;
				DeepestField.redraw();	
			}
			DeepestField.hiddenBuffer.appendChild( i );
			var m = new Module( 'system' );
			m.execute( 'setsetting', { setting: 'avatar', data: el.Path } );
		}
	}
}, true );

