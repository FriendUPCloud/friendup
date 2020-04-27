/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* This file is to be used by the webworker for file upload */

/* Prerequisites */

var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t } }

;(function(){var k;function l(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}var m="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,d){a!=Array.prototype&&a!=Object.prototype&&(a[b]=d.value)},n="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global&&null!=global?global:this;function p(){p=function(){};n.Symbol||(n.Symbol=r)}var r=function(){var a=0;return function(b){return"jscomp_symbol_"+(b||"")+a++}}();
function u(){p();var a=n.Symbol.iterator;a||(a=n.Symbol.iterator=n.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&m(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return v(l(this))}});u=function(){}}function v(a){u();a={next:a};a[n.Symbol.iterator]=function(){return this};return a}function x(a){var b="undefined"!=typeof Symbol&&Symbol.iterator&&a[Symbol.iterator];return b?b.call(a):{next:l(a)}}var y;
if("function"==typeof Object.setPrototypeOf)y=Object.setPrototypeOf;else{var z;a:{var A={o:!0},B={};try{B.__proto__=A;z=B.o;break a}catch(a){}z=!1}y=z?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var C=y;function D(){this.g=!1;this.c=null;this.m=void 0;this.b=1;this.l=this.s=0;this.f=null}function E(a){if(a.g)throw new TypeError("Generator is already running");a.g=!0}D.prototype.h=function(a){this.m=a};
D.prototype.i=function(a){this.f={u:a,v:!0};this.b=this.s||this.l};D.prototype["return"]=function(a){this.f={"return":a};this.b=this.l};function F(a,b,d){a.b=d;return{value:b}}function G(a){this.w=a;this.j=[];for(var b in a)this.j.push(b);this.j.reverse()}function H(a){this.a=new D;this.A=a}H.prototype.h=function(a){E(this.a);if(this.a.c)return I(this,this.a.c.next,a,this.a.h);this.a.h(a);return J(this)};
function K(a,b){E(a.a);var d=a.a.c;if(d)return I(a,"return"in d?d["return"]:function(a){return{value:a,done:!0}},b,a.a["return"]);a.a["return"](b);return J(a)}H.prototype.i=function(a){E(this.a);if(this.a.c)return I(this,this.a.c["throw"],a,this.a.h);this.a.i(a);return J(this)};
function I(a,b,d,c){try{var e=b.call(a.a.c,d);if(!(e instanceof Object))throw new TypeError("Iterator result "+e+" is not an object");if(!e.done)return a.a.g=!1,e;var f=e.value}catch(g){return a.a.c=null,a.a.i(g),J(a)}a.a.c=null;c.call(a.a,f);return J(a)}function J(a){for(;a.a.b;)try{var b=a.A(a.a);if(b)return a.a.g=!1,{value:b.value,done:!1}}catch(d){a.a.m=void 0,a.a.i(d)}a.a.g=!1;if(a.a.f){b=a.a.f;a.a.f=null;if(b.v)throw b.u;return{value:b["return"],done:!0}}return{value:void 0,done:!0}}
function L(a){this.next=function(b){return a.h(b)};this["throw"]=function(b){return a.i(b)};this["return"]=function(b){return K(a,b)};u();this[Symbol.iterator]=function(){return this}}function M(a,b){var d=new L(new H(b));C&&C(d,a.prototype);return d}
if("undefined"===typeof FormData||!FormData.prototype.keys){var N=function(a,b){for(var d=0;d<a.length;d++)b(a[d])},O=function(a,b,d){if(2>arguments.length)throw new TypeError("2 arguments required, but only "+arguments.length+" present.");return b instanceof Blob?[a+"",b,void 0!==d?d+"":"string"===typeof b.name?b.name:"blob"]:[a+"",b+""]},P=function(a){if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");return[a+""]},Q=function(a){var b=x(a);a=b.next().value;b=b.next().value;
a instanceof Blob&&(a=new File([a],b,{type:a.type,lastModified:a.lastModified}));return a},R="object"===typeof window?window:"object"===typeof self?self:this,S=R.FormData,T=R.XMLHttpRequest&&R.XMLHttpRequest.prototype.send,U=R.Request&&R.fetch;p();var V=R.Symbol&&Symbol.toStringTag,W=new WeakMap,X=Array.from||function(a){return[].slice.call(a)};V&&(Blob.prototype[V]||(Blob.prototype[V]="Blob"),"File"in R&&!File.prototype[V]&&(File.prototype[V]="File"));try{new File([],"")}catch(a){R.File=function(b,
d,c){b=new Blob(b,c);c=c&&void 0!==c.lastModified?new Date(c.lastModified):new Date;Object.defineProperties(b,{name:{value:d},lastModifiedDate:{value:c},lastModified:{value:+c},toString:{value:function(){return"[object File]"}}});V&&Object.defineProperty(b,V,{value:"File"});return b}}p();u();var Y=function(a){W.set(this,Object.create(null));if(!a)return this;var b=this;N(a.elements,function(a){a.name&&!a.disabled&&"submit"!==a.type&&"button"!==a.type&&("file"===a.type?N(a.files||[],function(c){b.append(a.name,
c)}):"select-multiple"===a.type||"select-one"===a.type?N(a.options,function(c){!c.disabled&&c.selected&&b.append(a.name,c.value)}):"checkbox"===a.type||"radio"===a.type?a.checked&&b.append(a.name,a.value):b.append(a.name,a.value))})};k=Y.prototype;k.append=function(a,b,d){var c=W.get(this);c[a]||(c[a]=[]);c[a].push([b,d])};k["delete"]=function(a){delete W.get(this)[a]};k.entries=function b(){var d=this,c,e,f,g,h,q;return M(b,function(b){switch(b.b){case 1:c=W.get(d),f=new G(c);case 2:var t;a:{for(t=
f;0<t.j.length;){var w=t.j.pop();if(w in t.w){t=w;break a}}t=null}if(null==(e=t)){b.b=0;break}g=x(c[e]);h=g.next();case 5:if(h.done){b.b=2;break}q=h.value;return F(b,[e,Q(q)],6);case 6:h=g.next(),b.b=5}})};k.forEach=function(b,d){for(var c=x(this),e=c.next();!e.done;e=c.next()){var f=x(e.value);e=f.next().value;f=f.next().value;b.call(d,f,e,this)}};k.get=function(b){var d=W.get(this);return d[b]?Q(d[b][0]):null};k.getAll=function(b){return(W.get(this)[b]||[]).map(Q)};k.has=function(b){return b in
W.get(this)};k.keys=function d(){var c=this,e,f,g,h,q;return M(d,function(d){1==d.b&&(e=x(c),f=e.next());if(3!=d.b){if(f.done){d.b=0;return}g=f.value;h=x(g);q=h.next().value;return F(d,q,3)}f=e.next();d.b=2})};k.set=function(d,c,e){W.get(this)[d]=[[c,e]]};k.values=function c(){var e=this,f,g,h,q,w;return M(c,function(c){1==c.b&&(f=x(e),g=f.next());if(3!=c.b){if(g.done){c.b=0;return}h=g.value;q=x(h);q.next();w=q.next().value;return F(c,w,3)}g=f.next();c.b=2})};Y.prototype._asNative=function(){for(var c=
new S,e=x(this),f=e.next();!f.done;f=e.next()){var g=x(f.value);f=g.next().value;g=g.next().value;c.append(f,g)}return c};Y.prototype._blob=function(){for(var c="----formdata-polyfill-"+Math.random(),e=[],f=x(this),g=f.next();!g.done;g=f.next()){var h=x(g.value);g=h.next().value;h=h.next().value;e.push("--"+c+"\r\n");h instanceof Blob?e.push('Content-Disposition: form-data; name="'+g+'"; filename="'+h.name+'"\r\n',"Content-Type: "+(h.type||"application/octet-stream")+"\r\n\r\n",h,"\r\n"):e.push('Content-Disposition: form-data; name="'+
g+'"\r\n\r\n'+h+"\r\n")}e.push("--"+c+"--");return new Blob(e,{type:"multipart/form-data; boundary="+c})};Y.prototype[Symbol.iterator]=function(){return this.entries()};Y.prototype.toString=function(){return"[object FormData]"};V&&(Y.prototype[V]="FormData");[["append",O],["delete",P],["get",P],["getAll",P],["has",P],["set",O]].forEach(function(c){var e=Y.prototype[c[0]];Y.prototype[c[0]]=function(){return e.apply(this,c[1].apply(this,X(arguments)))}});T&&(XMLHttpRequest.prototype.send=function(c){c instanceof
Y?(c=c._blob(),this.setRequestHeader("Content-Type",c.type),T.call(this,c)):T.call(this,c)});if(U){var Z=R.fetch;R.fetch=function(c,e){e&&e.body&&e.body instanceof Y&&(e.body=e.body._blob());return Z(c,e)}}R.FormData=Y};
})();


// -----------------------------------------------------------------------------

var files = [];
var filenames = [];
var volume;
var path;
var session;
var authid;
var totals = 0;
var bytesInProgress = 0;
var bytesWritten = 0;
var loadPieces = [];
var filesUnderTransport = 0;
var makedirBuf = {};

// -----------------------------------------------------------------------------

// Gets information about disk volume
self.checkVolume = function()
{
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if( this.readyState == 4 && this.status == 200 )
		{
			//console.log( 'Response from server: ', this.responseText );
			// Don't abort if we succeeded anyway
			if( self.delayedAbort )
			{
				clearTimeout( self.delayedAbort );
				self.delayedAbort = false;
			}
			var tmp = this.responseText.split( 'ok<!--separate-->' );
			if( typeof( tmp ) != 'undefined' )
			{
				try
				{
					tmp = JSON.parse( tmp[ 1 ] );
				}
				catch( e )
				{
					self.postMessage( { 'error': 1, 'errormessage': 'Illegal server response.' } ); return; 
				}
				
				var diskspace = parseInt( tmp.Filesize ) - parseInt( tmp.Used );
				
				for( var f in self.files )
				{
					// Queue trick
					var fullPath = false;
					var file = self.files[ f ];
					if( file == 'directory' ) continue;
					var size = file.size;
					if( file.fullPath )
					{
						fullPath = file.fullPath;
						size = file.size;
						file = file.file;
					}
					if( size )
					{
						bytesInProgress += parseInt( size )
					}
				}
				
				if( diskspace < bytesInProgress )
				{ 
					self.postMessage({'error':1,'errormessage':'Not enough space left on volume.'}); return; 
				}
				
				self.totals = bytesInProgress;
				self.postMessage('ok<!--separate-->Volume has enough space left. Starting to upload files.');
				
				if( self.files.length )
				{
					self.uploadFiles();
				}
			}
		}
		else
		{
			//console.log( 'Error: ' + this.readyState + ' ' + this.status );
			//console.log( this );
			//console.log( 'Could not retrieve volume information. Queuing abort upload' );
			if( self.delayedAbort )
				clearTimeout( self.delayedAbort );
			self.delayedAbort = setTimeout( function()
			{
				self.postMessage('fail<!--separate-->Could not retrieve volume information. Aborting upload;')
			}, 500 );
		}
	}
	
	// Not really sure why we have to set POST and URL twice... but thats the way it works.
	xhr.open( 'POST', '/system.library/module', true );
	xhr.setRequestHeader( 'Method', 'POST /system.library/module HTTP/1.1' );
	xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	
	var data = [];
	data.push( self.session ? ( 'sessionid=' + encodeURIComponent( self.session ) ) : ( 'authid=' + self.authid ) );
	data.push( 'module=system' );
	data.push( 'command=volumeinfo' );
	data.push( 'args=' + encodeURIComponent( '{"path":"' + self.volume + '"}' ) );
	
	//console.log( 'Here: ' + data.join( '&' ) );

	xhr.send( data.join( '&' ) );
} // end of checkVolumne

// -----------------------------------------------------------------------------
self.uploadFiles = function()
{
	var filesList = self.files;


	self.postMessage( {'filelist': filesList } );
	
	// Run a queue!
	function uploadQueueRun( queuePos )
	{
		// Are we done?
		if( queuePos > filesList.length )
		{
			//console.log( 'We should now close the window!!!!!' );
			
			self.postMessage( {
				'progressinfo': 1,
				'progress': 100,
				'progresson': 0,
				'uploadscomplete': 1,
				'filesundertransport': 0
			} );
			self.close();
			return;
		}
		else
		{
			//console.log( 'In queue: ' + queuePos + ' / ' + filesList.length );
		}
		
		if( typeof filesList[ queuePos ] != 'object' )
		{
			return setTimeout( function()
			{
				uploadQueueRun( ++queuePos );
			}, 0 );
		}
		
		var file = filesList[ queuePos ];
				
		// Queue trick
		var fullPath = false;
		var directoryMode = false;
		
		if( file.fullPath )
		{
			fullPath = file.fullPath;
			if( file.file == 'directory' )
			{
				directoryMode = true;
				file = {
					name: file.fullPath.split( '/' ).pop(),
					size: 0
				};
			}
			else
			{
				file = file.file;
			}
			
		}
						
		// Get filename and destination path
		var filename = ( self.filenames && self.filenames[ queuePos ] ? self.filenames[ queuePos ] : file.name );
		var destPath = ( self.path.slice( -1 ) == '/' ? self.path : self.path + '/' ).split( ':/' ).join( ':' )
		
		if( fullPath )
		{
			if( fullPath[0] == '/' )
				fullPath = fullPath.substr( 1, fullPath.length - 1 );
			destPath += fullPath;
			
			if( directoryMode )
			{
				if( destPath.substr( destPath.length - 1, 1 ) != '/' )
					destPath += '/';
			}
			
			if( destPath.indexOf( '/' ) > 0 )
			{
				destPath = destPath.split( '/' );
				destPath.pop();
				destPath = destPath.join( '/' ) + '/';
			}
			else
			{
				destPath = destPath.split( ':' )[0] + ':';
			}
			
			// This one always has this name!
			filename = file.name;
		}
		// Append if needed
		else
		{
			if( destPath.substr( destPath.length - 1, 1 ) != '/' )
			{
				destPath += file.name;
			}
		}
				
		// Execute the makedir
		if( directoryMode || destPath.substr( destPath.length - 1, 1 ) == '/' )
		{
			doMakedir( queuePos, destPath, function(){ 
				if( !directoryMode )
				{
					// Now go upload!
					doUpload( queuePos, function()
					{
						//console.log( 'Another next in queue!' );
						// Rerun queue
						uploadQueueRun( ++queuePos ); 
					} );
				}
				// Directory goes to next
				else
				{
					uploadQueueRun( ++queuePos ); 
				}
			} );
		}
		// Just upload the file
		else if( !directoryMode )
		{
			//console.log( 'JUST UPLOAD: ' + destPath );
			doUpload( queuePos, function()
			{ 
				//console.log( 'Next in queue!' );
				// Rerun queue
				uploadQueueRun( ++queuePos ); 
			} );
		}
		
		// Make a directory!
		function doMakedir( fileIndex, path, cbk )
		{
			// Make the directory! Just in case
			if( !makedirBuf[ path ] )
			{
				var n = new XMLHttpRequest();
				n.open( 'POST', '/system.library/file/makedir' );
				n.setRequestHeader( 'Method', 'POST /system.library/file/makedir HTTP/1.1' );
				n.send( 'path=' + path + ( self.session ? ( '&sessionid=' + self.session ) : ( '&authid=' + self.authid ) ) );
				n.counter = 0;
				n.onreadystatechange = function()
				{
					// Directory created
					if( this.readyState == 4 && this.status == 200  )
					{
						var t = this.responseText;
						if( t.substr( 0, 3 ) == 'ok<' )
						{
							makedirBuf[ destPath ] = true;
							if( cbk ) cbk();
						}
						else
						{
							self.postMessage( {
								'progressinfo' : 1,
								'fileindex' : fileIndex, 
								'uploaderror' : 'Upload failed. Server response was readystate/status: |' + 
									this.readyState + '/' + this.status + '|' 
							} );
						}
					}
					// An error occured
					else if( this.readyState > 1 && this.status > 0 )
					{
						self.postMessage( {
							'progressinfo' : 1,
							'fileindex' : fileIndex, 
							'uploaderror' : 'Upload failed. Server response was readystate/status: |' + 
								this.readyState + '/' + this.status + '|' 
						} );
					}
				}
			}
			// The directory was created, move on
			else
			{
				if( cbk ) cbk();
			}
		}
		
		// Do the actual upload
		function doUpload( ind, callback )
		{
			
			self.filesUnderTransport++;
			
			function calcProgress( linfo )
			{
				// Store progress
				if( !loadPieces[ ind ] )
					loadPieces[ ind ] = { loaded: 0, total: 0 };
				if( linfo )
				{
					loadPieces[ ind ].loaded = linfo.loaded;
					loadPieces[ ind ].total = linfo.total;
				}
				
				// Check progress
				var prog = 0, tota = 0;
				for( var a in loadPieces )
				{
					prog += parseInt( loadPieces[ a ].loaded );
					tota += parseInt( loadPieces[ a ].total );
				}
				
				if( tota > 0 )
				{
					var progress = Math.floor( prog / bytesInProgress * 100 );
			
					self.postMessage( {
						'progressinfo': 1,
						'progress': progress,
						'bytesWritten': prog,
						'bytesTotal': tota,
						'progresson': ind,
						'filesundertransport': self.filesUnderTransport
					} );
				}
			}
			
			var xh = new XMLHttpRequest();
			xh.upload.addEventListener( 'progress', function( e )
			{
				if( e.lengthComputable )
				{
					calcProgress( e );
				}
			} );

			xh.counter = 0;
			xh.onreadystatechange = function()
			{
				if( this.readyState == 4 && this.status == 200  )
				{					
					loadPieces[ ind ].loaded = loadPieces[ ind ].total;
					
					if( self.filesUnderTransport > 1 ) 
					{
						if( !loadPieces[ ind ].completed )
						{
							loadPieces[ ind ].completed = true;
							self.filesUnderTransport--;
						}
					}
				
					calcProgress();
					
					// Run callback
					//console.log( 'Checking for callback.', this.responseText );
					if( callback ) callback();
				}
				else if( this.readyState > 1 && this.status > 0 )
				{
					self.postMessage( {
						'progressinfo' : 1,
						'fileindex' : ind, 
						'uploaderror' : 'Upload failed. Server response was readystate/status: |' + 
							this.readyState + '/' + this.status + '|' 
					} );
				}
				else
				{
					//console.log( 'Some other upload status: ' + this.readyState + ' / ' + this.status );
				}
			}
		
			xh.open( 'POST', '/system.library/file/upload', true );
			xh.setRequestHeader( 'Method', 'POST /system.library/file/upload HTTP/1.1' );
			xh.setRequestHeader( 'Content-Type', 'multipart/form-data;' );
		
			// add request data...
			var fd = new FormData();
			if( self.session )
				fd.append( 'sessionid',self.session );
			else fd.append( 'authid', self.authid );
			fd.append( 'module','files' );
			fd.append( 'command','uploadfile' );
			fd.append( 'path', destPath );
			// Sanitize
			filename = filename.split( ':' ).join( '-' );
			filename = filename.split( '/' ).join( '-' );
			filename = filename.split( '[' ).join( '(' );
			filename = filename.split( ']' ).join( ')' );
			fd.append( 'file', file, encodeURIComponent( filename ) );
		
			// Get the party started
			xh.send( fd );
		}
	}
	uploadQueueRun( 0 );
} // end of uploadFiles

// -----------------------------------------------------------------------------

var test = '';

var queue = [];

self.onmessage = function( e )
{
	// Keep piling!
	test = e;
	if( e.data.recursiveUpdate )
	{	
		self.session = e.data.session;
		if( e.data.executeQueue )
		{
			// Organize queue
			var a = 0;
			var qmax = -1;
			var outQueue = [];
			var rl = 0;
			
			// Organize by longest path
			for( a = 0; a < queue.length; a++ )
			{
				var l = queue[ a ].fullPath.split( '/' ).length; 
				if( l > qmax ) qmax = l;
				if( !outQueue[ l ] ) 
				{
					outQueue[ l ] = [];
					rl++;
				}
				outQueue[ l ].push( queue[ a ] );		
			}
			
			// Sort ascending
			var fin = [];
			for( a = 0, rl = 0; a <= qmax; a++ )
			{
				if( outQueue[ a ] )
					fin[ rl++ ] = outQueue[ a ];
			}
			
			outQueue = fin; delete fin;
			
			
			// Relayout
			queue = [];
			var finalQueue = [];
			for( a = 0; a < rl; a++ )
			{
				for( var b = 0; b < outQueue[ a ].length; b++ )
				{
					self.files.push( outQueue[ a ][ b ] );
				}
			}
			
			// Execute!
			self.filenames = false;
			self.volume = e.data.targetVolume;
			self.path = e.data.targetPath.split( ':/' ).join( ':' );
			
			self.checkVolume();
			queue = [];
		}
		else
		{
			queue.push( {
				file: e.data.item,
				fullPath: e.data.fullPath,
				size: e.data.size
			} );
		}
	}
	// Do a copy with files list
	else if( e.data && e.data.files && e.data.targetVolume && e.data.targetPath )
	{	
		self.files = e.data.files;
		self.filenames = ( e.data.filenames ? e.data.filenames : false );
		self.volume = e.data.targetVolume;
		self.path = e.data.targetPath.split( ':/' ).join( ':' );
		self.session = e.data.session;
		self.authid = e.data.authid;
		self.checkVolume();
	}
	// Do the files
	else if( e.data && ( e.data.files || e.data.queued ) )
	{
		// Support recursive mode
		self.files = e.data.files;
		self.filenames = ( e.data.filenames ? e.data.filenames : false );
		self.volume = e.data.targetVolume;
		self.path = e.data.targetPath.split( ':/' ).join( ':' );
		self.session = e.data.session;
		self.authid = e.data.authid;
		if( !e.data.queued )
		{
			self.checkVolume();
		}
	}
	// Do a copy using objecturl instead of file!
	else if( e.data.objectdata )
	{
		self.authid = e.data.authid;
		self.session = e.data.session;
		self.volume = e.data.targetVolume;
		self.path = e.data.targetPath;
		
		// Get only filename
		var fname = e.data.targetPath.indexOf( '/' ) > 0 ? e.data.targetPath.split( '/' ) : e.data.targetPath.split( ':' );
		fname = fname[ fname.length - 1 ];
		
		// fix path
		self.path = self.path.substr( 0, self.path.length - fname.length ).split( ':/' ).join( ':' );
		
		self.files = [ new File( [ Base64.decode( e.data.objectdata ) ], fname ) ];
		self.checkVolume();
	}
	else if( e.data && e.data['terminate'] == 1 )
	{
		//console.log('Terminating worker here...');
		self.close();
	}
} // end of onmessage
