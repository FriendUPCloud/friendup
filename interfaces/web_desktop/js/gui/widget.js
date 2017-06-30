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

Widget = function( flags )
{
	this.init( flags );
}

Widget.prototype.init = function( flags, target )
{
	if( !target )
		target = ge( 'DoorsScreen' );
	this.target = target;

	this.tx = 0; this.ty = 0; this.tw = 0; this.th = 0;

	var t = this;
	this.dom = document.createElement( 'div' );
	this.dom.className = 'Widget';
	this.dom.widgetObject = this;
	this.flags = flags;
	
	// Dimensions
	for( var a in this.flags ) this.setFlag( a, this.flags[a] );
	
	this.dom.onmousedown = function( e )
	{
		return cancelBubble( e );
	}
	
	target.appendChild( this.dom );
}

Widget.prototype.calcPosition = function()
{
	if( this.tw <= 0 && this.th <= 0 ) return;
	
	var realTop = this.target.screenObject._screen.offsetTop + this.target.screenObject._screen.parentNode.offsetTop;
	var target = this.target;	
	
	this.dom.style.width = this.tw + 'px';
	this.dom.style.height = this.th + 'px';
	
	// Calculate x axis
	if( isNaN( this.tx ) )
	{
		if( this.tx == 'left' )
		{
			this.dom.style.right = 'auto';
			this.dom.style.left = '0';
		}
		else if( this.tx == 'right' )
		{
			this.dom.style.right = '0';
			this.dom.style.left = 'auto';
		}
		else if( this.tx == 'center' )
		{
			this.dom.style.left = Math.floor( target.offsetWidth * 0.5 - ( this.tw * 0.5 ) ) + 'px';
		}
	}
	else
	{
		// 
		if( this.tx + this.tw > this.target.offsetWidth )
			this.tx = this.target.offsetWidth - this.tw;
		else if( this.tx < 0 ) this.tx = 0;
		//
		var px = this.tx - this.target.offsetLeft;	
		this.dom.style.left = px + 'px';
	}
	// Calculate y axis
	if( isNaN( this.ty ) )
	{
		if( this.ty == 'bottom' )
		{
			this.dom.style.top = 'auto';
			this.dom.style.bottom = '0';
		}
		else if( this.ty == 'top' )
		{
			this.dom.style.top = realTop + 'px';
			this.dom.style.bottom = 'auto';
		}
		else if( this.ty == 'middle' || this.ty == 'center' )
		{
			this.dom.style.top = Math.floor( target.offsetHeight * 0.5 - ( this.th * 0.5 ) ) + 'px';
		}
	}
	else
	{	
		// Absolute position 50 margin
		if( this.ty + this.th > ( this.target.offsetHeight - 50 ) )
			this.ty = ( this.target.offsetHeight - 50 ) - this.th;
		else if( this.ty < 0 ) this.ty = 0;
		//
		var py = this.ty - this.target.offsetTop + realTop;
		this.dom.style.top = py + 'px';
	}
}

/**
 * Set a widget flag
 * @param flag the name of the flag
 * @param val the value of the flag
 */
Widget.prototype.setFlag = function( flag, val )
{
	var realTop = this.target.screenObject._titleBar.offsetHeight;
	var target = this.target;
	switch( flag )
	{
		case 'animate':
			if( val ) this.dom.style.transition = 'width,height 0.25s,0.25s';
			else this.dom.style.transition = '';
			break;
		case 'transparent':
			if( val )
			{
				this.dom.style.background = 'transparent';
				this.dom.style.boxShadow = 'none';
			}
			else 
			{
				this.dom.style.background = '';
				this.dom.style.boxShadow = '';
			}
			break;
		case 'dropShadow':
			if( val && Trim( val ) )
				this.dom.style.filter = 'drop-shadow(' + val + ')';
			else this.dom.style.filter = '';
			break;
		case 'background':
			if( val )
			{
				this.dom.style.background = val.indexOf( ':' ) > 0 ? getImageUrl( val ) : val;
			}
			else this.dom.style.background = '';
			break;
		case 'border-radius':
			if( val )
			{
				this.style.borderRadius = val;
			}
			else this.style.borderRadius = '';
			break;
		// it's a view window?
		case 'originObject':
			var vo = false;
			for( var a in movableWindows )
			{
				if( val == movableWindows[a].windowObject.viewId )
				{
					vo = movableWindows[a].windowObject;
					break;
				}
			}
			if( vo )
			{
				// Assign widget to movable window
				vo.widgets.push( this );
				this.originObject = vo;
			}
			break;
		case 'width':
			this.tw = val;
			this.calcPosition();
			break;
		case 'height':
			this.th = val;
			this.calcPosition();
			break;
		case 'top':
			this.ty = val;
			this.calcPosition();
			break;
		case 'left':
			this.tx = val;
			this.calcPosition();
			break;
		// Vertical alignment / relative position
		case 'valign':
			this.ty = val;
			this.calcPosition();
			break;
		case 'halign':
			this.tx = val;
			this.calcPosition();
			break;
		case 'scrolling':
			if( val )
				this.dom.style.overflow = 'auto';
			else this.dom.style.overflow = 'hidden';
			break;
		case 'above':
			if( val )
				this.dom.style.zIndex = 2147483647;
			else this.dom.style.zIndex = '';
			break;
		case 'below':
			this.dom.style.zIndex = '';
			break;
	}
	this.flags[flag] = val;
}

Widget.prototype.getFlag = function( flag )
{
	if( this.flags && typeof( this.flags[flag] ) != 'undefined' )
		return this.flags[flag];
	return false;
}

Widget.prototype.raise = function( callback )
{
	this.dom.classList.add( 'Raised' );
	if( callback ) callback();
}

Widget.prototype.lower = function( callback )
{
	this.dom.classList.remove( 'Raised' );
	if( callback ) callback();
}

Widget.prototype.show = function( callback )
{
	this.calcPosition();
	this.dom.style.visibility = 'visible';
	this.dom.style.pointerEvents = 'all';
	if( callback ) callback();
}

Widget.prototype.hide = function( callback )
{
	this.dom.style.visibility = 'hidden';
	this.dom.style.pointerEvents = 'none';
	if( callback ) callback();
}

Widget.prototype.setContent = function( cont, callback )
{
	this.dom.innerHTML = cont;
	
	if( this.flags.autosize === true )
	{
		this.autosize();
	}
	else this.calcPosition();
	
	if( callback ) callback();
}

// Set content (securely!) in a sandbox, callback when completed
Widget.prototype.setContentIframed = function( content, domain, packet, callback )
{
	if( !domain )
	{
		domain = document.location.href + '';
		domain = domain.split( 'index.html' ).join ( 'sandboxed.html' );
		domain = domain.split( 'app.html' ).join( 'sandboxed.html' );
	}	
	
	// Oh we have a conf?
	if( this.conf )
	{
		domain += '/system.library/module/?module=system&command=sandbox' +
			'&sessionid=' + Workspace.sessionId +
			'&conf=' + JSON.stringify( this.conf );
		if( this.getFlag( 'noevents' ) ) domain += '&noevents=true';
	}
	else if( domain.indexOf( 'sandboxed.html' ) <= 0 )
	{
		domain += '/webclient/sandboxed.html';
		if( this.getFlag( 'noevents' ) ) domain += '?noevents=true';
	}
	
	// Make sure scripts can be run after all resources has loaded
	var r;
	if( content )
	{
		while( r = content.match( /\<script([^>]*?)\>([\w\W]*?)\<\/script\>/i ) )
			content = content.split( r[0] ).join( '<friendscript' + r[1] + '>' + r[2] + '</friendscript>' );
	}
	else
	{
		content = '';
	}
	
	var c = this.dom;
	if( c ) c.innerHTML = '';
	
	var ifr = document.createElement( 'iframe' );
	ifr.applicationId = self.applicationId;
	ifr.authId = self.authId;
	ifr.applicationName = self.applicationName;
	ifr.applicationDisplayName = self.applicationDisplayName;
	ifr.className = 'Content';
	ifr.id = 'sandbox_widget_' + this.widgetId;
	ifr.src = domain;

	var view = this;
	this.iframe = ifr;

	if( packet.applicationId ) self.applicationId = packet.applicationId;

	ifr.onload = function()
	{	
		view.calcPosition();
		
		// Assign views to each other to allow cross window scripting
		// TODO: This could be a security hazard! Remember to use security 
		//       domains!
		var parentIframeId = false;
		var instance = Math.random() % 100;
		if( ifr.applicationId )
		{
			for( var a = 0; a < Workspace.applications.length; a++ )
			{
				var app = Workspace.applications[a];
				if( app.applicationId == ifr.applicationId )
				{
					for( var a in app.widgets )
					{
						// Ah we found our parent view
						if( self.parentWidgetId && self.parentWidgetId == a )
						{
							var win = app.widgets[a];
							parentIframeId = 'sandbox_widget_' + a;
							break;
						}
					}
					// Link to application sandbox
					if( !parentIframeId )
					{
						parentIframeId = 'sandbox_' + app.applicationId;
					}
					break;
				}
			}
		}
	
		var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
		msg.command = 'setbodycontent';
		msg.parentSandboxId = parentIframeId;
		msg.locale = Workspace.locale;
	
		// Override the theme
		if( view.getFlag( 'theme' ) ) msg.theme = view.getFlag( 'theme' );
	
		// Authid is important, should not be left out if it is available
		if( !msg.authId )
		{
			if( ifr.authId ) msg.authId = ifr.authId;
			else if( GetUrlVar( 'authid' ) ) msg.authId = GetUrlVar( 'authid' );
		}
		// Use this if the packet has it
		if( !msg.sessionId )
		{
			if( packet.sessionId ) msg.sessionId = packet.sessionId;
		}
		msg.registerCallback = addWrapperCallback( function() { if( callback ) callback(); } );
		if( packet.filePath )
		{
			msg.data = content.split( /progdir\:/i ).join( packet.filePath );
		}
		else msg.data = content;
		if( self.flags && self.flags.screen )
			msg.screenId = self.flags.screen.externScreenId;
		msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
		if( !msg.origin ) msg.origin = document.location.href;
		ifr.contentWindow.postMessage( JSON.stringify( msg ), domain );
	
		// TODO: Reenable this functionality if we need it (but now it's a security issue with CORS)
		/*
		// Remove window popup menus when clicking on the app
		if( ifr.contentWindow.addEventListener )
			ifr.contentWindow.addEventListener( 'mousedown', function(){ removeWindowPopupMenus(); }, false );
		else ifr.contentWindow.attachEvent( 'onmousedown', function(){ removeWindowPopupMenus(); }, false );*/
	}
	c.appendChild( ifr );
}

Widget.prototype.autosize = function()
{
	if( this.flags && this.flags.autosize == true )
	{
		var children = this.dom.getElementsByTagName( '*' );
		var height = 0;
		for( var a = 0; a < children.length; a++ )
		{
			var cand = children[a].offsetTop + children[a].offsetHeight;
			if( cand > height )
			{
				height = cand;
			}
		}

		// Set the height on dom
		if( height > this.dom.offsetHeight )
			this.dom.style.height = height + 'px';
		else if( height < this.dom.offsetHeight )
			this.dom.style.height = height + 'px';
		this.th = height;
		this.calcPosition();
	}
}

// Close the widget!
Widget.prototype.close = function()
{
	if( this.dom )
	{
		// Clean out relation to view window
		if( this.originObject && this.originObject.widgets.length )
		{
			var out = [];
			for( var a = 0; a < this.originObject.widgets.length; a++ )
			{
				if( this.originObject.widgets[a] == this )
					continue;
				out.push( this.originObject.widgets[a] );
			}
			this.originObject.widgets = out;
		}
		this.dom.parentNode.removeChild( this.dom );
		return true;
	}
	return false;
}
