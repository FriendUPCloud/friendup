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

/* This file is to be used by the webworker for file upload */

/* Prerequisites */

var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t } }



// == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ## 
var files = [];
var volume;
var path;
var session;
var totals = 0;
var filecounter = [];
var filesundertransport = 0;

// == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ## 
self.checkVolume = function()
{
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if( this.readyState == 4 && this.status == 200 )
		{
			// Don't abort if we succeeded anyway
			if( self.delayedAbort )
			{
				clearTimeout( self.delayedAbort );
				self.delayedAbort = false;
			}
			var tmp = this.responseText.split( 'ok<!--separate-->' );
			if( typeof( tmp ) != 'undefined' )
			{
				tmp = JSON.parse( tmp[ 1 ] );
				
				var diskspace = parseInt( tmp.Filesize ) - parseInt( tmp.Used );
				var uploadsize = 0;
				
				for(var f in self.files )
				{
					if( self.files[ f ][ 'size' ] )
					{
						uploadsize += parseInt( self.files[ f ][ 'size' ] );
						self.filecounter[ f ] = [ '0', uploadsize ];
					}
				}
				
				if( diskspace < uploadsize )
				{ 
					self.postMessage({'error':1,'errormessage':'Not enough space left on volume.'}); return; 
					console.log( 'Not enough space left on volume.' );
				}
				
				self.totals = uploadsize;
				self.postMessage('ok<!--separate-->Volume has enough space left. Starting to upload files.');
				self.uploadFiles();
			}
		}
		else
		{
			//console.log( 'Error: ' + this.readyState + ' ' + this.status );
			//console.log( this );
			console.log( 'Could not retrieve volume information. Queuing abort upload' );
			self.delayedAbort = setTimeout( function()
			{
				self.postMessage('fail<!--separate-->Could not retrieve volume information. Aborting upload;')
			}, 250 );
		}
	}
	
	// NOt really sure why we have to set POST and URL twice... but thats the way it works.
	xhr.open( 'POST', '/system.library/module', true );
	xhr.setRequestHeader( 'Method', 'POST /system.library/module HTTP/1.1' );
	xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	
	var data = [];
	data.push( 'sessionid=' + encodeURIComponent( self.session ) );
	data.push( 'module=system' );
	data.push( 'command=volumeinfo' );
	data.push( 'args=' + encodeURIComponent( '{"path":"' + self.volume + ':"}' ) );

	xhr.send( data.join( '&' ) );
} // end of checkVolumne

// == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ## 
self.uploadFiles = function() 
{
	
	// once we get here we can upload all files at once :)
	var xhrs = [];
	
	//console.log('We will now look into uploading our files..');
	//console.log(self.files);
	//console.log('#### #### #### #### #### #### #### #### #### #### #### #### #### #### #### #### ');
	for(var f in self.files )
	{
		if(typeof self.files[f] != "object") continue;
		
		var file = self.files[f];
		
		xhrs[f] = new XMLHttpRequest();
		xhrs[f].upload.uploadfileindex = xhrs[f].uploadfileindex = f;
		
		xhrs[f].upload.addEventListener( 'progress', function ( e ) {
			if ( e.lengthComputable )
			{
				self.filecounter[this.uploadfileindex][0] = e.loaded;
				var uploaded = 0;
				for(var i in self.filecounter)
				{
					uploaded += self.filecounter[i][0];
				}
				var progress = Math.min((100-self.filecounter.length), ( uploaded * 100 / self.totals) );
				
				if( e.loaded == e.total ) self.filesundertransport++;
				
				self.postMessage({'progressinfo':1,'progress':progress,'progresson':this.uploadfileindex,'filesundertransport':self.filesundertransport} );
			}
		});

		xhrs[f].onreadystatechange = function()
		{
			if ( this.status == 200 )
			{
				self.filecounter[this.uploadfileindex][0] = self.filecounter[this.uploadfileindex][1];
				if( self.filesundertransport > 1 ) self.filesundertransport--;
				
				var done = true;
				var progress = 100 - self.filesundertransport;

				for(var i in self.filecounter)
				{
					if( self.filecounter[i][0] != self.filecounter[i][1] )
					{
						done = false;
					}
				}
				if(done)
					self.postMessage({'progressinfo':1,'uploadscomplete':1});
				else
					self.postMessage({'progressinfo':1,'progress':progress });
			}
			else if(this.readyState > 1 && this.status > 0)
			{
				self.postMessage({'progressinfo':1,'fileindex':this.uploadfileindex,'uploaderror':'Upload failed. Server response was readystate/status: |' + this.readyState + '/' + this.status + '|' });
			}
		}
		xhrs[f].open('POST','/system.library/file/upload',true);
		xhrs[f].setRequestHeader( 'Method', 'POST /system.library/file/upload HTTP/1.1' );
		xhrs[f].setRequestHeader( 'Content-Type', 'multipart/form-data;' );
		
		// add request data...
		var fd = new FormData();
		fd.append('sessionid',self.session);
		fd.append('module','files');
		fd.append('command','uploadfile');
		fd.append('path', ( self.path.slice(-1) == '/' ? self.path : self.path + '/') );
		fd.append('file', file);
		
		//get the party started
		xhrs[f].send( fd );
	}
} // end of uploadFiles

// == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ##  == ## 
self.onmessage = function( e )
{
	// Do a copy with files list
	if( e.data && e.data.files && e.data.targetVolume && e.data.targetPath )
	{
		self.files = e.data.files;
		self.volume = e.data.targetVolume;
		self.path = e.data.targetPath;
		self.session = e.data.session;
		self.checkVolume();
	}
	// Do a copy using objecturl instead of file!
	else if( e.data.objectdata )
	{
		self.session = e.data.session;
		self.volume = e.data.targetVolume;
		self.path = e.data.targetPath;
		
		// Get only filename
		var fname = e.data.targetPath.indexOf( '/' ) > 0 ? e.data.targetPath.split( '/' ) : e.data.targetPath.split( ':' );
		fname = fname[ fname.length - 1 ];
		
		// fix path
		self.path = self.path.substr( 0, self.path.length - fname.length );
		
		self.files = [ new File( [ Base64.decode( e.data.objectdata ) ], fname ) ];
		self.checkVolume();
	}
	else if( e.data && e.data['terminate'] == 1 )
	{
		console.log('Terminating worker here...');
		self.close();
	}
} // end of onmessage
