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

/*function ModuleHref( path )
{
	if( path )
	{
		Application.sendMessage( { 'command': 'render', 'viewid': ge( 'viewId' ).value, 'path': path } );
	}
}*/

Treeroot = false;

Component = function( name, template )
{
	this.name = name;
	this.template = template;
	this.resources = [];
}

Application.run = function( msg, iface )
{
	Application.sendMessage( { 'command': 'info' } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'info':
			if( msg.obj )
			{
				Treeroot = msg.obj;
			}
			break;
	}
}

function ModuleHref( path )
{
	console.log( '---' );
	
	console.log( Treeroot );
	
	console.log( '---' );
	
	if( path )
	{
		var p = path.split( '/' );
		
		console.log( path );
		
		var m = new Module( 'treeroot2' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' && d )
			{
				var data = JSON.parse( d );
				
				console.log( data );
				
				var tmp = {
					'GlobalSearch': {},
					'Top': {},
					'Scene': {},
					'LeftCol': {},
					'MiddleCol': {},
					'RightCol': {},
					'Chat': {},
					'_Styles_': [],
					'_Scripts_': [],
					'_Exclude_': []
				};
				
				if( data.components )
				{
					if( ge( '_Styles_' ) && ge( '_Styles_' ).innerHTML )
					{
						var ele = ge( '_Styles_' ).getElementsByTagName( 'link' );
						
						if( ele.length > 0 )
						{
							for( var key in ele )
							{
								if( ele[key] && ele[key].href )
								{
									tmp['_Exclude_'].push( ele[key].href );
								}
							}
						}
					}
					
					if( ge( '_Scripts_' ) && ge( '_Scripts_' ).innerHTML )
					{
						var ele = ge( '_Scripts_' ).getElementsByTagName( 'script' );
						
						if( ele.length > 0 )
						{
							for( var key in ele )
							{
								if( ele[key] && ele[key].src )
								{
									tmp['_Exclude_'].push( ele[key].src );
								}
							}
						}
					}
					
					
					
					var loading = { 'num': 0 };
					
					for( var key in data.components )
					{
						if( data.components[key].Position && data.components[key].Name )
						{
							tmp[data.components[key].Position][data.components[key].Name] = '';
							
							loading.num++;
						}
					}
					
					
					tmp['Top']['notification'] = '';
					tmp['Top']['search'] = '';
					tmp['Top']['authentication'] = '';
					tmp['Top']['menu'] = '';
					
					
					
					loading.num++;
					loading.num++;
					loading.num++;
					loading.num++;
					
					var f = new File( 'Progdir:components/notification/templates/notification.html' );
					f.loading = loading;
					f.tmp = tmp;
					f.i18n();
					f.onLoad = function( data )
					{
						this.loading.num -= 1;
						
						if( data && this.tmp )
						{								
							data = GetLinks( data, this.tmp['_Styles_'], this.tmp['_Exclude_'] );
							data = GetScripts( data, this.tmp['_Scripts_'], this.tmp['_Exclude_'] );
							
							this.tmp['Top']['notification'] = data;
						}
						
						if( this.loading.num == 0 )
						{
							RenderMainView( this.tmp, path );
						}
					}
					f.load();
					
					var f = new File( 'Progdir:components/search/templates/search.html' );
					f.loading = loading;
					f.tmp = tmp;
					f.i18n();
					f.onLoad = function( data )
					{
						this.loading.num -= 1;
						
						if( data && this.tmp )
						{								
							data = GetLinks( data, this.tmp['_Styles_'], this.tmp['_Exclude_'] );
							data = GetScripts( data, this.tmp['_Scripts_'], this.tmp['_Exclude_'] );
							
							this.tmp['Top']['search'] = data;
						}
						
						if( this.loading.num == 0 )
						{
							RenderMainView( this.tmp, path );
						}
					}
					f.load();
					
					var f = new File( 'Progdir:components/authentication/templates/authentication.html' );
					f.loading = loading;
					f.tmp = tmp;
					f.i18n();
					f.onLoad = function( data )
					{
						this.loading.num -= 1;
						
						if( data && this.tmp )
						{
							data = GetLinks( data, this.tmp['_Styles_'], this.tmp['_Exclude_'] );
							data = GetScripts( data, this.tmp['_Scripts_'], this.tmp['_Exclude_'] );
							
							this.tmp['Top']['authentication'] = data;
						}
						
						if( this.loading.num == 0 )
						{
							RenderMainView( this.tmp, path );
						}
					}
					f.load();
					
					var f = new File( 'Progdir:components/menu/templates/menu.html' );
					f.loading = loading;
					f.tmp = tmp;
					f.i18n();
					f.onLoad = function( data )
					{
						this.loading.num -= 1;
						
						if( data && this.tmp )
						{
							data = GetLinks( data, this.tmp['_Styles_'], this.tmp['_Exclude_'] );
							data = GetScripts( data, this.tmp['_Scripts_'], this.tmp['_Exclude_'] );
							
							this.tmp['Top']['menu'] = data;
						}
						
						if( this.loading.num == 0 )
						{
							RenderMainView( this.tmp );
						}
					}
					f.load();
					
					
					
					for( var key in data.components )
					{
						if( data.components[key].Position && data.components[key].Name )
						{
							//var cmp = new Component( data.components[key].Name );
							
							// TODO: No need to render a template that allready have been rendered, but remove others not needed when switching modules
							
							var f = new File( 'Progdir:components/' + data.components[key].Name + '/templates/' + data.components[key].Name + '.html' );
							f.loading = loading;
							f.tmp = tmp;
							f.obj = data.components[key];
							f.i18n();
							f.onLoad = function( data )
							{
								this.loading.num -= 1;								
								
								if( data && this.obj && this.tmp )
								{
									data = GetLinks( data, this.tmp['_Styles_'], this.tmp['_Exclude_'] );
									data = GetScripts( data, this.tmp['_Scripts_'], this.tmp['_Exclude_'] );
									
									this.tmp[this.obj.Position][this.obj.Name] = data;
								}
								
								if( this.loading.num == 0 )
								{
									RenderMainView( this.tmp, path );
								}
							}
							f.load();
						}
					}
				}
				
				//console.log( tmp );
			}
			else
			{
				console.log( e );
			}
		}
		m.execute( 'render', { module: ( p[0] ? p[0] : 'main' ), component: ( p[1] ? p[1] : 'wall' ) } );
	}
}



function RenderMainView( d, path )
{
	//console.log( Application );
	
	// TODO: Remove style or javascript that is not needed, keep what is rendered from before.
	
	// TODO: Also add all templates from components so there is no need to add double
	
	if( path )
	{
		var p = path.split( '/' );
	}
	
	if( d )
	{
		if( ge( 'module' ) )
		{
			ge( 'module' ).value = ( path && p[0] ? p[0] : 'main' );
			
			if( typeof Parent != "undefined" )
			{
				Parent.module = ( path && p[0] ? p[0] : 'main' );
			}
		}
		
		if( ge( 'component' ) )
		{
			ge( 'component' ).value = ( path && p[1] ? p[1] : 'wall' );
			
			if( typeof Parent != "undefined" )
			{
				Parent.component = ( path && p[1] ? p[1] : 'wall' );
			}
		}
		
		// This is where one can replace data with new but scripts and stylesheets doesn't work when switching to new components not preloaded
		
		var loadedvar = 0; var totaltoLoad = 0; var found = false;
		
		var scripts = ''; var styles = '';
		
		if( ge( '_Styles_' ) && d['_Styles_'] )
		{
			for( var key in d['_Styles_'] )
			{
				var s = document.createElement( 'link' );
				s.href = d['_Styles_'][key];
				
				ge( '_Styles_' ).appendChild( s );
			}
		}
		
		/*for( var k in d )
		{
			if( ge( '_' + k + '_' ) )
			{
				ge( '_' + k + '_' ).innerHTML = d[k];
				
				RunScripts( d[k] );
			}
		}*/
		
		if( d['_Scripts_'] )
		{
			for( var key in d['_Scripts_'] )
			{
				var s = document.createElement( 'script' );
				s.src = d['_Scripts_'][key];
				s.onload = function()
				{
					loadedvar++;
					
					if( loadedvar == totaltoLoad )
					{
						for( var k in d )
						{
							if( ge( '_' + k + '_' ) )
							{
								ge( '_' + k + '_' ).innerHTML = ObjToString( d[k] );
								
								RunScripts( ObjToString( d[k] ) );
							}
						}
						
					}
				}
				totaltoLoad++;
				
				ge( '_Scripts_' ).appendChild( s );
				
				found = true;
			}
		}
		
		if( !found )
		{
			for( var k in d )
			{
				if( ge( '_' + k + '_' ) )
				{
					ge( '_' + k + '_' ).innerHTML = ObjToString( d[k] );
					
					RunScripts( ObjToString( d[k] ) );
				}
			}
		}
	}
}

function ResolvePath( filename )
{
	if( filename.toLowerCase().substr( 0, 8 ) == 'progdir:' )
	{
		filename = filename.substr( 8, filename.length - 8 );
		if( Application && Application.filePath )
			filename = Application.filePath + filename;
	}
	// TODO: Remove system: here (we're rollin with Libs:)
	else if( 
		filename.toLowerCase().substr( 0, 7 ) == 'system:' ||
		filename.toLowerCase().substr( 0, 4 ) == 'libs:' 
	)
	{
		filename = filename.substr( 7, filename.length - 7 );
		filename = '/webclient/' + filename;
	}
	// Fix broken paths
	if( filename.substr( 0, 20 ) == 'resources/webclient/' )
		filename = filename.substr( 20, filename.length - 20 );
		
	return filename;
}

function RunScripts( data )
{
	if( data )
	{
		var wholescript = [];
		
		while( scripts = data.match( /\<script[^>]*?\>([\w\W]*?)\<\/script[^>]*?\>/i ) )
		{
			wholescript.push( scripts[1] );
			data = data.split( scripts[0] ).join ( '' );
		}
		// Run script
		if( wholescript.length )
		{
			eval( wholescript.join ( '' ) );
		}
	}
}

function GetLinks( data, arr, exl )
{
	var m = ''; var i = 0;
	
	while( m = data.match( /<link.*?href='(.*?)'/i ) )
	{
		var href = ResolvePath( 'Progdir:' + m[1] );
		
		data = data.split( m[0] ).join( '<link rel="stylesheet" href="' + href + '"' );
		//data = data.split( m[0] + '>' ).join( '' );
		
		var sty = href;
		
		if( arr.indexOf( sty ) < 0 && exl.indexOf( sty ) < 0 )
		{
			arr.push( sty );
		}
		
		i++;
		
		if( i >= 1000 ) break;
	}
	
	return data;
}

function GetScripts( data, arr, exl )
{
	var m = ''; var i = 0;
	
	while( m = data.match( /<script.*?src='(.*?)'/i ) )
	{
		var src = ResolvePath( 'Progdir:' + m[1] );
		
		data = data.split( m[0] ).join( '<script src="' + src + '"' );
		//data = data.split( m[0] ).join( '' );
		
		var scr = src;
		
		if( arr.indexOf( scr ) < 0/* && exl.indexOf( scr ) < 0*/ )
		{
			arr.push( scr );
		}
		
		i++;
		
		if( i >= 1000 ) break;
	}
	
	return data;
}

function ObjToString( obj )
{
	if( obj )
	{
		var string = '';
		
		for( var key in obj )
		{
			string += obj[key];
		}
		
		return string;
	}
	
	return obj;
}
