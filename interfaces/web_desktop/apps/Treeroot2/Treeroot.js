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

Treeroot = {
	activeComponents: []
};

Component = function( name, template )
{
	this.name = name;
	this.template = template;
	this.resources = [];
}

Application.run = function( msg, iface )
{
	ModuleHref( 'main' );
}



Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'render':
			if( msg.path )
			{
				ModuleHref( msg.path );
			}
			break;
		case 'info':
			Application.sendMessage( { 'command': 'info', 'obj': Treeroot } );
			break;
	}
}



function ModuleHref( path )
{
	if( path )
	{
		var p = path.split( '/' );
		
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
					'_Scripts_': []
				};
				
				
				
				if( data.components )
				{
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
							data = GetLinks( data, this.tmp['_Styles_'] );
							data = GetScripts( data, this.tmp['_Scripts_'] );
							
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
							data = GetLinks( data, this.tmp['_Styles_'] );
							data = GetScripts( data, this.tmp['_Scripts_'] );
							
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
							data = GetLinks( data, this.tmp['_Styles_'] );
							data = GetScripts( data, this.tmp['_Scripts_'] );
							
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
							data = GetLinks( data, this.tmp['_Styles_'] );
							data = GetScripts( data, this.tmp['_Scripts_'] );
							
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
									data = GetLinks( data, this.tmp['_Styles_'] );
									data = GetScripts( data, this.tmp['_Scripts_'] );
									
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
	if( path )
	{
		var p = path.split( '/' );
	}
	
	
	
	if( this.mainView )
	{
		
	}
	else
	{
		var v = new View( {
			title: i18n( 'i18n_treeroot2' ),
			width: 1000,
			height: 820
		} );
		
		this.mainView = v;
		
		v.onClose = function(){ Application.quit(); }
	}
	
	console.log( d['_Scripts_'] );
	console.log( d['_Styles_'] );
	
	var scripts = ''; var styles = '';
	
	if( d['_Styles_'] )
	{
		for( var key in d['_Styles_'] )
		{
			var str = '<link rel="stylesheet" href="' + d['_Styles_'][key] + '">';
			
			styles = ( styles ? ( styles + str ) : str );
		}
	}
	
	if( d['_Scripts_'] )
	{
		for( var key in d['_Scripts_'] )
		{
			var str = '<[script] src="' + d['_Scripts_'][key] + '"></[script]>';
			
			// HACK!!!!! ....
			str = str.split( '[script]' ).join( 'script' );
			
			scripts = ( scripts ? ( scripts + str ) : str );
		}
	}
	
	//console.log( scripts );
	//console.log( styles );
	
	// TODO: Add changes to awdhjawdatydawtydaw before setting template
	
	var f = new File( 'Progdir:Templates/main.html' );
	
	f.replacements = {
		'viewId': v.getViewId(),
		'module': ( path && p[0] ? p[0] : 'main' ),
		'component': ( path && p[1] ? p[1] : 'wall' ),
		'Scripts': scripts,
		'Styles': styles,
		'GlobalSearch': ( d.GlobalSearch ? '<div id="_GlobalSearch_">' + ObjToString( d.GlobalSearch ) + '</div>' : '' ),
		'Top': ( d.Top ? '<div id="_Top_">' + ObjToString( d.Top ) + '</div>' : '' ),
		'Scene': ( d.Scene ? ObjToString( d.Scene ) : '' ),
		'LeftCol': ( d.LeftCol ? '<td class="Col1"><div id="Field_left"><div id="_LeftCol_">' + ObjToString( d.LeftCol ) + '</div></div></td>' : '' ),
		'MiddleCol': ( d.MiddleCol ? '<td class="Col2"><div id="Field_middle"><div id="_MiddleCol_">' + ObjToString( d.MiddleCol ) + '</div></div></td>' : '' ),
		'RightCol': ( d.RightCol ? '<td class="Col3"><div id="Field_right"><div id="_RightCol_">' + ObjToString( d.RightCol ) + '</div></div></td>' : '' ),
		'Chat': ( d.Chat ? '<div id="Field_bottom"><div id="_Chat_">' + ObjToString( d.Chat ) + '</div></div>' : '' )
	};
	
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		
		RunScripts( data );
	}
	f.load();
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

function GetLinks( data, arr )
{
	var m = ''; var i = 0;
	
	while( m = data.match( /<link.*?href='(.*?)'/i ) )
	{
		var href = ResolvePath( 'Progdir:' + m[1] );
		
		data = data.split( m[0] ).join( '<link rel="stylesheet" href="' + href + '"' );
		//data = data.split( m[0] + '>' ).join( '' );
		
		var sty = href;
		
		if( arr.indexOf( sty ) < 0 )
		{
			arr.push( sty );
		}
		
		i++;
		
		if( i >= 1000 ) break;
	}
	
	return data;
}

function GetScripts( data, arr )
{
	var m = ''; var i = 0;
	
	while( m = data.match( /<script.*?src='(.*?)'/i ) )
	{
		var src = ResolvePath( 'Progdir:' + m[1] );
		
		data = data.split( m[0] ).join( '<script src="' + src + '"' );
		//data = data.split( m[0] ).join( '' );
		
		var scr = src;
		
		if( arr.indexOf( scr ) < 0 )
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
