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

var AjaxWorker = {
	init: function()
	{
		if ( typeof( ActiveXObject ) != 'undefined' )
			this.proxy = new ActiveXObject( 'Microsoft.XMLHTTP' );
		else this.proxy = new XMLHttpRequest();
		
		var jax = this;
		
		this.proxy.onreadystatechange = function()
		{
			// We're finished handshaking
			if( this.readyState == 4 && this.status == 200  )
			{
				//console.log( '* We are ready ajax: ' + this.readyState + ' ' + this.status + '(' + typeof( jax.df ) + ')' );
			
				// Delete cancellable network connection
				if( jax.df && jax.df.available ) jax.df.delConnection( jax.connectionId );
		
				// Update process count and set loading
				jax.decreaseProcessCount();
			
				jax.rawData = this.responseText;
			
				if( this.hasReturnCode )
				{
					var sep = '<!--separate-->';
					if( this.responseText.indexOf( sep ) > 0)
					{
						jax.returnCode = this.responseText.substr( 0, this.responseText.indexOf( sep ) );
						jax.returnData = this.responseText.substr( this.responseText.indexOf( sep ) + sep.length );
					}
					else
					{
						jax.returnData = false;
						jax.returnCode = this.responseText;
					}
				}
				else
				{
					jax.returnCode = false;
					jax.returnData = this.responseText;
				}
			
				// TODO: This error is general
				if( JSON && jax.rawData.charAt( 0 ) == '{' )
				{
					try
					{
						var t = JSON.parse( jax.rawData );
						// Deprecate from 1.0 beta 2 "no user!"
						var res = t ? t.response.toLowerCase() : '';
						if( t && ( res == 'user not found' || res == 'user session not found' ) )
						{
							if( Workspace )
							{
								// Drop these (don't retry!) because of remote fs disconnect
								if( jax.url.indexOf( 'file/info' ) > 0 )
									return;
								// Add to queue
								friend.cajax.push( jax );
								return Workspace.relogin();
							}
						}
					}
					catch( e )
					{
						if( !jax.rawData )
						{
							if( Workspace )
							{
								friend.cajax.push( jax );
								return Workspace.relogin();
							}
						}
					}
				}
				// Respond to old expired sessions!
				else if( jax.returnCode == 'fail' )
				{
					try
					{
						var r = JSON.parse( jax.returnData );
						var res = r ? r.response.toLowerCase() : '';
						if( res == 'user session not found' )
						{
							friend.cajax.push( jax );
							return Workspace.relogin();
						}
					}
					catch( e )
					{
					}
				}
			
				// Clean out possible queue
				var o = [];
				for( var a = 0; a < friend.cajax.length; a++ )
				{
					if( friend.cajax[a] != jax )
						o.push( friend.cajax[a] );
				}
				friend.cajax = o;
				// End clean queue
			
				// Register send time
				if( jax.sendTime && jax.df && jax.df.available )
				{
					var ttr = ( new Date() ).getTime() - jax.sendTime;
					jax.sendTime = false;
					jax.df.networkActivity.timeToFinish.push( ttr );
				}

				// Execute onload action with appropriate data
				if( jax.onload )
				{
					jax.onload( jax.returnCode, jax.returnData );
				}
				jax.destroy();
			}
			// Something went wrong!
			else if( this.readyState == 4 && ( this.status == 500 || this.status == 0 || this.status == 404 ) )
			{
				//console.log( '* Error ajax: ' + this.readyState + ' ' + this.status );
			
				// Delete cancellable network connection
				if( jax.df && jax.df.available ) jax.df.delConnection( jax.connectionId );
			
				// Update process count and set loading
				jax.decreaseProcessCount();
			
				// Clean out possible queue
				var o = [];
				for( var a = 0; a < friend.cajax.length; a++ )
				{
					if( friend.cajax[a] != jax )
						o.push( friend.cajax[a] );
				}
				friend.cajax = o;
				// End clean queue

				// tell our caller...
				if( jax.onload ) jax.onload( 'fail', false );
				jax.destroy();
			}
			else
			{
				//console.log( '* Idling ajax: ' + this.readyState + ' ' + this.status );
			}
		}
		
	}
}
AjaxWorker.init();

self.onmessage = function( msg )
{
	console.log( 'Received message.', msg );
}



