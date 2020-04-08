/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/**
 * The Deepest Field in FriendUP shows all the connected resources in one place
 * @author Hogne Titlestad
 * This version, for Friend OS v1.2.x is attached to tray
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
		
		// Stats...
		var f = document.createElement( 'div' );
		f.id = 'DeepestField';
		f.innerHTML = '\
				<div class="LocalElements">\
					<div id="Identity"></div>\
					<div id="TasksHeader"></div>\
					<div id="TasksList"></div>\
					<div id="NotificationHeader"></div>\
					<div id="Notifications"></div>\
					<div id="NetconnectionsHeader"></div>\
					<div id="Netconnections"></div>\
					<div id="FNetHeader"></div>\
					<div id="FNetContent"></div>\
					<div id="CapabilityHeader"></div>\
					<div id="Capabilities"></div>\
				</div>';
		Workspace.screen.contentDiv.appendChild( f );
		
		var d = document.createElement( 'canvas' );
		f.appendChild( d );
				
		d.id = 'DeepestCanvas';
		d.style.position = 'absolute';
		d.style.top = ge( 'Capabilities' ).offsetTop + ge( 'Capabilities' ).offsetHeight + 20 + 'px';
		d.style.left = '20px';
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
			d.setAttribute( 'width', document.body.offsetWidth - 40 );
			d.setAttribute( 'height', document.body.offsetHeight - ( d.offsetTop + 20 ) );
			DeepestField.redraw();
		}
		window.addEventListener( 'resize', resizeField );
		
		resizeField();
		
		// Add deepest field to screen
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
	selectTask: function()
	{
		document.body.classList.remove( 'ShowTasks' );
		
		if( !ge( 'TaskSwitcher' ) ) return;
		
		if( ge( 'TaskSwitcher' ).currentTask )
		{
			ge( 'TaskSwitcher' ).currentTask.window.windowObject.activate( 'force' );
			ge( 'TaskSwitcher' ).currentTask = null;
		}
	},
	// Clean out!
	cleanTasks: function()
	{
		if( !ge( 'TaskSwitcher' ) ) return;
		
		var currentItems = ge( 'TaskSwitcher' ).getElementsByClassName( 'WindowItem' );
		var dels = [];
		for( var a = 0; a < currentItems.length; a++ )
		{
			var found = false;
			for( var b in window.movableWindows )
			{
				if( !movableWindows[ b ].parentNode.classList.contains( 'Closing' ) && movableWindows[ b ] == currentItems[ a ].window )
				{
					found = true;
					break;
				}
			}
			if( !found )
			{
				dels.push( currentItems[ a ] );
			}
		}
		for( var a = 0; a < dels.length; a++ )
		{
			ge( 'TaskSwitcher' ).removeChild( dels[ a ] );
		}
		this.repositionTasks();
	},
	// Show task switcher (meta+tab)
	showTasks: function()
	{
		window.blur();
		window.focus();
		
		if( !ge( 'TaskSwitcher' ) ) return;
		
		// Repopulate
		var currentItems = ge( 'TaskSwitcher' ).getElementsByClassName( 'WindowItem' );
		var deletables = [];
		for( var a = 0; a < currentItems.length; a++ )
		{
			var doDelete = true;
			for( var b in movableWindows )
			{
				if( movableWindows[ b ] == currentItems[ a ].window )
				{
					doDelete = false;
					break;
				}
			}
			if( doDelete )
			{
				deletables.push( currentItems[ a ] );
			}
		}
		for( var a in movableWindows )
		{
			var found = false;
			for( var b in currentItems )
			{
				if( movableWindows[ a ] == currentItems[ b ].window )
				{
					currentItems[ b ].querySelector( '.Taskname' ).innerHTML = movableWindows[ a ].windowObject.flags.title;
					found = true;
					break;
				}
			}
			if( !found )
			{	
				var d = document.createElement( 'div' );
				d.className = 'WindowItem';
				d.window = movableWindows[ a ];
				d.innerHTML = '<div class="Close"><div class="CloseButton"></div></div><div class="Taskname">' + d.window.windowObject.flags.title + '</div>';
				var img = null;
				if( d.window.applicationId )
				{
					for( var a in Workspace.applications )
					{
						if( Workspace.applications[ a ].applicationId == d.window.applicationId )
						{
							img = Workspace.applications[ a ].icon;
							break;
						}
					}
				}
				if( !img )
				{
					if( d.window.content && d.window.content.fileInfo )
					{
						img = '/iconthemes/friendup15/Folder.svg';
					}
					else
					{
						img = '/iconthemes/friendup15/File_Binary.svg';
					}
				}
				ge( 'TaskSwitcher' ).appendChild( d );
				( function( win, close )
				{
					close.onmouseup = function( e )
					{
						win.windowObject.close();
						return cancelBubble( e );
					}
				} )( d.window, d.querySelector( '.CloseButton' ) );
				// Add image
				d.querySelector( '.Close' ).style.backgroundImage = 'url(' + img + ')';
			}
		}
		// Clean up!
		for( var a = 0; a < deletables.length; a++ )
		{
			ge( 'TaskSwitcher' ).removeChild( deletables[ a ] );
		}
		
		
		document.body.classList.add( 'ShowTasks' );
		
		this.repositionTasks();
		
		window.blur();
		window.focus();
	},
	repositionTasks: function()
	{
		// Refresh list of window items
		var eles = ge( 'TaskSwitcher' ).getElementsByClassName( 'WindowItem' );
		if( eles.length )
		{		
			// Setup mouseover events
			for( var a = 0; a < eles.length; a++ )
			{
				( function( app, appList ) {
					app.onmouseover = function( e )
					{
						for( var b = 0; b < appList.length; b++ )
						{
							if( appList[ b ] == app )
							{
								ge( 'TaskSwitcher' ).currentTask = app;
								app.classList.add( 'Current' );
							}
							else
							{
								appList[ b ].classList.remove( 'Current' );
							}
						}
					}
					app.onmouseup = function( e )
					{
						for( var b = 0; b < appList.length; b++ )
						{
							if( appList[ b ] == app )
							{
								app.window.windowObject.activate();
								DeepestField.selectTask();
								return;
							}
						}
					}
				} )( eles[ a ], eles );
			}
		
			// Reposition all tasks
			var xpos = 10;
			var ypos = 10;
			var xwid = eles[ 0 ].offsetWidth + 10;
		
			// First time we're showing the tasks
			if( !ge( 'TaskSwitcher' ).currentTask )
			{
				if( !ge( 'TaskSwitcher' ).currentTask )
				{
					var currApp = null;
					if( window.currentMovable )
					{
						currApp = currentMovable.windowObject;
						for( var a = 0; a < eles.length; a++ )
						{
							if( eles[a].window == currApp )
							{
								if( eles[ a + 1 ] )
									ge( 'TaskSwitcher' ).currentTask = eles[a + 1];
								else ge( 'TaskSwitcher' ).currentTask = eles[0];
								break;
							}
						}
					}
				}
				// Draw the highlight
				for( var a = 0; a < eles.length; a++ )
				{
					if( ge( 'TaskSwitcher' ).currentTask == eles[a] || !ge( 'TaskSwitcher' ).currentTask )
					{
						eles[a].classList.add( 'Current' );
						ge( 'TaskSwitcher' ).currentTask = eles[a];
					}
					else
					{
						eles[a].classList.remove( 'Current' );
					}
				}
			}
			// Next time.. choose next task
			else
			{
				var next = false;
				for( var a = 0; a < eles.length; a++ )
				{
					if( ge( 'TaskSwitcher' ).currentTask == eles[a] && eles[ a + 1 ] )
					{
						ge( 'TaskSwitcher' ).currentTask = eles[ a + 1 ];
						eles[ a     ].classList.remove( 'Current' );
						eles[ a + 1 ].classList.add( 'Current' );
						a++;
						next = true;
					}
					else
					{
						eles[a].classList.remove( 'Current' );
					}
				}
				if( !next )
				{
					eles[ 0 ].classList.add( 'Current' );
					ge( 'TaskSwitcher' ).currentTask = eles[ 0 ];
				}
			}
		
			// Where is the current task?
			var ct = ge( 'TaskSwitcher' ).currentTask;
		
			// Scroll into view
			for( var a = 0; a < eles.length; a++ )
			{
				eles[ a ].style.left = xpos + 'px';
				eles[ a ].style.top = ypos + 'px';
				xpos += xwid;
				if( xpos + xwid + 10 > ge( 'TaskSwitcher' ).offsetWidth && a < eles.length - 1 )
				{
					xpos = 10;
					ypos += xwid;
				}
			}
			
			ge( 'TaskSwitcher' ).style.height = ypos + xwid + 'px';
			ge( 'TaskSwitcher' ).style.top = ( ( window.innerHeight >> 1 ) - ( ( ypos + xwid ) >> 1 ) ) + 'px';
			
		}
	},
	updateTaskInformation: function()
	{
		if( !ge( 'TasksHeader' ) ) return;
		ge( 'TasksHeader' ).innerHTML = ge( 'TaskSwitcher' ).getElementsByTagName( 'iframe' ).length + ' ' + i18n( 'i18n_tasks_running' ) + ':';
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

