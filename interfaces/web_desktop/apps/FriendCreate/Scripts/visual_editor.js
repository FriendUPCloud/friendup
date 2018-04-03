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

var visualMutex = null;

VisualElement = function( domObj )
{
	this.domObj = domObj;
	this.script = "// New script\n";
}
VisualElement.prototype.destroy = function()
{
	this.removeEventListener( 'mousedown', this.domObj.events.mouseDown );
	window.removeEventListener( 'mousemove', this.domObj.events.mouseMove );
	window.removeEventListener( 'mouseup', this.domObj.events.mouseUp );
}
VisualElement.prototype.play = function()
{
	eval( this.script );
}
VisualElement.prototype.initAce = function()
{
	// Create a session
	if( !this.session )
	{
		this.session = ace.require( 'ace/ace' ).createEditSession( this.script );
		this.session.rawSession = this.session;
		VisualEditor.editor.setSession( this.session );
		VisualEditor.editor.session.setUseWorker( false );
	}
	// Restore a session
	else
	{
		var session = ace.createEditSession( this.script );
		session.$undoManager.$doc = session; // NOTICE: workaround for a bug in ace
		session.setOptions( this.session.options );
		session.$undoManager.$undoStack = this.session.history.undo;
		session.$undoManager.$redoStack = this.session.history.redo;
		session.selection.fromJSON( this.session.selection );
		session.setScrollTop( this.session.scrollTop );
		session.setScrollLeft( this.session.scrollLeft );
		VisualEditor.editor.setSession( session );
		VisualEditor.editor.session.setUseWorker( false );
		this.session = session;
		this.session.rawSession = session;
	}
	
	// Is javascript
	VisualEditor.editor.getSession().setMode( 'ace/mode/javascript' );
}	
VisualElement.prototype.saveAceSession = function()
{
	var filterHistory = function( deltas )
	{
		return deltas.filter( function( d )
		{
		    return d.group != "fold";
		} );
	};
	var session = VisualEditor.editor.getSession();
	this.script = VisualEditor.editor.getValue();
	this.session = {
        selection: session.selection.toJSON(),
        value: session.getValue(),
        history: {
            undo: session.$undoManager.$undoStack.map( filterHistory ),
            redo: session.$undoManager.$redoStack.map( filterHistory )
        },
        scrollTop: session.getScrollTop(),
        scrollLeft: session.getScrollLeft(),
        options: session.getOptions(),
        rawSession: session
    };
}
VisualElement.prototype.refresh = function()
{
	var t = this;
	
	// (Re)connect events
	if( !this.domObj.events )
	{
		var dom = this.domObj;
		dom.state = null;
		this.domObj.events = {
			mouseDown( e, sas )
			{				
				if( e.button != 0 ) return;
				
				if( !sas )
				{
					var eve = {
						clientX: e.clientX,
						clientY: e.clientY,
						button: e.button
					};
					SendSasEvent( 'mousedown', { event: eve, id: dom.id } );
				}
				else
				{
					visualMutex = true;
				}
				
				for( var a = 0; a < VisualEditor.elements.length; a++ )
				{
					var el = VisualEditor.elements[a];
					if( el == t )
					{
						el.domObj.classList.add( 'Active' );
					}
					else el.domObj.classList.remove( 'Active' );
				}
				dom.px = e.clientX - dom.offsetLeft;
				dom.py = e.clientY - dom.offsetTop;
				dom.state = 1;
				// Store previous element
				if( VisualEditor.currentElement )
				{
					var to = VisualEditor.currentElement;
					to.saveAceSession();
				}
				VisualEditor.currentElement = t;
				t.initAce();
			},
			mouseUp( e, sas )
			{
				if( !sas )
				{
					SendSasEvent( 'mouseup', { event: null, id: dom.id } );
				}
				else
				{
					visualMutex = true;
				}
				
				dom.state = null;
			},
			mouseMove( e, sas )
			{
				if( !sas )
				{
					var eve = {
						clientX: e.clientX,
						clientY: e.clientY
					};
					SendSasEvent( 'mousemove', { event: eve, id: dom.id } );
				}
				
				if( dom.state == 1 )
				{
					dom.styleObject.left = ( e.clientX - dom.px );
					dom.styleObject.top = ( e.clientY - dom.py );
					dom.engine.refresh();
				}
			}
		};
		this.domObj.addEventListener( 'mousedown', this.domObj.events.mouseDown );
		window.addEventListener( 'mousemove', this.domObj.events.mouseMove );
		window.addEventListener( 'mouseup', this.domObj.events.mouseUp );
	}
	
	// Set the current position
	var so = this.domObj.styleObject;
	this.domObj.style.left = so.left + 'px';
	this.domObj.style.top = so.top + 'px';
	this.domObj.style.width = so.width + 'px';
	this.domObj.style.height = so.height + 'px';
	this.domObj.style.lineHeight = so.height + 'px';
	this.domObj.innerHTML = so.text;
}

VisualEditor = {
	mode: 'init',
	playing: false,
	eleSeed: 0,
	editor: null,
	elements: [],
	currentElement: null,
	init()
	{
		var t = this;
		var p = ge( 'VisualPage' );
		if( !p ) return;
		
		if( this.mode == 'init' )
		{
			this.eleSeed = 0;
			this.elements = [];
			
			var f = new File( 'Progdir:Templates/visual_wizard.html' );
			f.i18n();
			f.onLoad = function( data )
			{
				p.innerHTML = data;
			}
			f.load();
		}
		else if( this.mode == 'standard' )
		{
			var f = new File( 'Progdir:Templates/visual_m_standard.html' );
			f.i18n();
			f.onLoad = function( data )
			{
				p.innerHTML = data;
				t.setupAce( ge( 'VisualCodeArea' ) );
			}
			f.load();
		}
	},
	play( e )
	{
		ge( 'playButton' ).classList.add( 'Playing' );
		
		// Set all the values!
		for( var a = 0; a < this.elements.length; a++ )
		{
			this.elements[a].domObj.styleObject.script = this.elements[a].session.rawSession.getValue();
		}
		var wasPlaying = this.playing;
		this.playing = true;
		if( !wasPlaying ) visualPlayer();
	},
	stop( e )
	{
		ge( 'playButton' ).classList.remove( 'Playing' );
		this.playing = false;
	},
	reset( e )
	{
		this.stop();
		this.eleSeed = 0;
		for( var a = 0; a < this.elements.length; a++ )
		{
			var p = this.elements[a].domObj.parentNode;
			if( p )
			{
				p.removeChild( this.elements[a].domObj );
			}
		}
		this.elements = [];
		this.currentElement = null;
		this.state = 'init';
		this.init();
	},
	save( e )
	{
		var result = {};
		for( var a = 0; a < this.elements.length; a++ )
		{
			
		}
	},
	setupAce( target )
	{
		// Remove previous editor
		if( this.editor )
		{
			this.editor.destroy();
			this.editor = null;
			var p = ge( 'VisualEditorArea' );
			if( p ) p.parentNode.removeChild( p );
		}
	
		// Create editor root container
		var area = document.createElement( 'div' );
		area.id = 'VisualEditorArea';
		area.style.position = 'absolute';
		area.style.top = '0';
		area.style.left = '0';
		area.style.right = '0';
		area.style.bottom = '0';
		target.appendChild( area );

		// Setup the area with ace
		this.editor = ace.edit( 'VisualEditorArea' );
		this.editor.setTheme( 'ace/theme/' + settings.theme );
		this.editor.session.setUseWorker( false );
		this.editor.getSession().setMode( 'ace/mode/javascript' );
	
		// Remove find dialog
		this.editor.commands.removeCommand( 'find' );
	},
	checkSession( e )
	{
		var type = ge( 'editorSessionSelect' ).value;
		if( e )
		{
			SendSasEvent( 'initvisualpage', type );
		}
		switch( type )
		{
			case 'standard':
				this.mode = type;
				break;
			case 'tree-html':
				Alert( 'Mode not currently supported.', 'The mode you selected is currently under development.' );
				return false;
			case 'tree-canvas':
				this.mode = type;
				break;
			case 'tree-3d':
				Alert( 'Mode not currently supported.', 'The mode you selected is currently under development.' );
				return false;
		}
		this.init();
	},
	// Elements
	add( type, e )
	{
		var t = this;
		
		if( type == 'box' )
		{
			// Sync the add element
			if( e )
			{
				SendSasEvent( 'visual_addelement', type );
			}
			
			var ele = document.createElement( 'div' );
			ele.id = 'element_' + (++this.eleSeed);
			ele.className = 'VisBox MousePointer';
			ele.styleObject = {
				top: 0,
				left: 0,
				width: 200,
				height: 100,
				text: 'Box Element ' + this.eleSeed
			};
			ele.engine = new VisualElement( ele );
			ele.engine.refresh();
			
			ge( 'VisualArea' ).appendChild( ele );
			this.elements.push( ele.engine );
		}
		else if( type == 'image' )
		{
			var description = {
				triggerFunction: function( items )
				{
					if( items[0] && items[0].Path )
					{
						// Sync the add element
						if( e )
						{
							SendSasEvent( 'visual_addelement', type );
						}
						
						var ele = document.createElement( 'div' );
						ele.id = 'element_' + (++t.eleSeed);
						ele.className = 'VisImage MousePointer';
						ele.styleObject = {
							top: 0,
							left: 0,
							width: 200,
							height: 100,
							text: '<div class="Image" style="background-image: url(\'' + getWebUrl( items[0].Path ) + '\')"></div>',
							layout: {
								raise()
								{
									
								},
								lower()
								{
								},
								above()
								{
								},
								below()
								{
								},
								setZIndex()
								{
								}
							}
						};
						ele.engine = new VisualElement( ele );
						ele.engine.refresh();
			
						ge( 'VisualArea' ).appendChild( ele );
						t.elements.push( ele.engine );
					}
				},
				path: 'Mountlist:',
				type: 'load',
				title: i18n( 'i18n_select_image' ),
				filename: ''
			}
			// Open the file dialog view window
			var d = new Filedialog( description );
		}
	}
};

// Visual player manages elements!
function visualPlayer()
{
	if( VisualEditor.state != 'init' && VisualEditor.playing )
	{
		for( var a = 0; a < VisualEditor.elements.length; a++ )
		{
			VisualEditor.elements[a].play.call( VisualEditor.elements[a].domObj.styleObject );
			VisualEditor.elements[a].refresh();
		}
		window.requestAnimationFrame( visualPlayer );
	}
}

