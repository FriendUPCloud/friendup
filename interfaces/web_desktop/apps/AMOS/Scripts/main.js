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
/** @file
 *
 * Friend Create - Tree engine version
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 05/03/2018
 */

// Main Friend Create object
function Main( tree, name, properties )
{
	this.fuiJson = false;
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Main', properties );

	this.projectToolbarTools = 
	[
		{
			name: 'fileNewProject',
			text: 'New Project',
			imageName: 'toolNew'
		},
		{
			name: 'open',
			text: 'Open',
			imageName: 'toolOpen',
			children:
			[
				{
					name: 'fileOpenDirectory',
					text: 'Open Directory',
					imageName: 'toolFolder',
					displayText: true,
					imageWidth: 24,
					imageHeight: 24
				},
				{
					name: 'fileOpenProject',
					text: 'Open Project',
					imageName: 'toolProject',
					displayText: true,
					imageWidth: 24,
					imageHeight: 24
				}
			]
		},
		{
			name: 'fileSaveProject',
			text: 'Save Project',
			imageName: 'toolSave'
		},
		{
			name: 'fileUpdateProject',
			text: 'Update Project',
			imageName: 'toolUpdate'
		},
		{
			name: 'editFindInFiles',
			text: 'Find in Files',
			imageName: 'toolFind'
		},
		{
			name: 'editReplaceInFiles',
			text: 'Replace in Files',
			imageName: 'toolReplace'
		},
		{
			name: 'runBuild',
			text: 'Build Project',
			imageName: 'toolBuild'
		},
		{
			name: 'runRun',
			text: 'Run Project',
			imageName: 'toolRun'
		},
		{
			name: 'filePreferences',
			text: 'Preferences',
			imageName: 'toolPreferences'
		}
	];
	this.editorToolbarTools = 
	[
		{
			name: 'fileNew',
			text: 'New File',
			imageName: 'toolNew'
		},
		{
			name: 'fileOpen',
			text: 'Open File',
			imageName: 'toolOpen'
		},
		{
			name: 'fileSave',
			text: 'Save Current File',
			imageName: 'toolSave'
		},
		{
			name: 'fileSaveAs',
			text: 'Save Current File As...',
			imageName: 'toolSaveAs'
		},
		{
			name: 'editFind',
			text: 'Find',
			imageName: 'toolFind'
		},
		{
			name: 'editReplace',
			text: 'Replace',
			imageName: 'toolReplace'
		},
		{
			name: 'editBookmark',
			text: 'Set Bookmark',
			imageName: 'toolBookmark'
		},
		{
			name: 'editPreviousBookark',
			text: 'Goto Previous Bookmark',
			imageName: 'toolPreviousBookmark'
		},
		{
			name: 'editNextBookmark',
			text: 'Goto Next Bookmark',
			imageName: 'toolNextBookmark'
		}
	];
	// The main menu
	this.menu =
	[
		{
			name: 'file',
			text: 'File',
			children:
			[
				{
					name: 'fileNew',
					text: 'New File',
					shortcut: 'ctrl-N'
				},
				{
					name: 'fileNewProject',
					text: 'New Project',
					shortcut: 'ctrl-shift-N'
				},
				{
					name: 'separator'
				},
				{
					name: 'fileOpen',
					text: 'Open File',
					shortcut: 'ctrl-O'
				},
				{
					name: 'fileOpenDirectory',
					text: 'Open Directory'
				},
				{ 
					name: 'fileOpenProject',
					text: 'Open Project'
				},
				{
					name: 'separator'
				},
				{
					name: 'fileSave',
					text: 'Save File',
					shortcut: 'ctrl-S'
				},
				{
					name: 'fileSaveAs',
					text: 'Save File As',
					shortcut: 'ctrl-shift-S'
				},
				{
					name: 'fileSaveAll',
					text: 'Save All',
					shortcut: 'ctrl-shift-A'
				},
				{
					name: 'fileSaveProject',
					text: 'Save Project'
				},
				{
					name: 'separator'
				},
				{
					name: 'fileClose',
					text: 'Close File'
				},
				{
					name: 'fileCloseProject',
					text: 'Close Project'
				},
				{
					name: 'separator'
				},
				{
					name: 'fileUpdateProject',
					text: 'Update Project'
				},
				{
					name: 'separator'
				},
				{
					name: 'filePreferences',
					text: 'Preferences'
				},
				{
					name: 'separator'
				},
				{
					name: 'fileQuit',
					text: 'Quit'
				},
			]
		},
		{
			name: 'edit',
			text: 'Edit',
			children:
			[
				{
					name: 'editUndo',
					text: 'Undo',
					shortcut: 'ctrl-Z'
				},
				{
					name: 'editRedo',
					text: 'Redo',
					shortcut: 'ctrl-Y'
				},
				{
					name: 'separator'
				},
				{
					name: 'editCopy',
					text: 'Copy',
					shortcut: 'ctrl-C'
				},
				{
					name: 'editPaste',
					text: 'Paste',
					shortcut: 'ctrl-V'
				},
				{
					name: 'editCut',
					text: 'Cut',
					shortcut: 'ctrl-X'
				},
				{
					name: 'separator'
				},
				{
					name: 'editFind',
					text: 'Find',
					shortcut: 'ctrl-F'
				},
				{
					name: 'editReplace',
					text: 'Replace',
					shortcut: 'ctrl-H'
				},
				{
					name: 'editFindInFiles',
					text: 'Find in Files',
					shortcut: 'ctrl-shift-F'
				},
				{
					name: 'editReplaceInFiles',
					text: 'Replace in Files',
					shortcut: 'ctrl-shift-H'
				},
				{
					name: 'separator'
				},
				{
					name: 'editBookmark',
					text: 'Toggle Bookmark',
					shortcut: 'ctrl-B'
				},
				{
					name: 'editPreviousBookmark',
					text: 'Goto Previous Bookmark'
				},
				{
					name: 'editNextBookmark',
					text: 'Goto Next Bookmark'
				}
			]
		},
		{
			name: 'run',
			text: 'Run',
			children: 
			[
				{
					name: 'runBuild',
					text: 'Build Project'
				},
				{
					name: 'separator'
				},
				{
					name: 'runRun',
					text: 'Run Project',
					shortcut: 'ctrl-shift-R'
				}
			]
		}
	];

	// Default theme
	this.theme =
	{
		'Friend.Tree.UI.Toolbar':
		{
			fromName:
			{
				'projectToolbar': 
				{
					color: '#272822',
					paddingV: 8
				},
				'editorToolbar':
				{
					color: '#2F3129',
					paddingV: 6
				}
			},
			color: '#272822',
			font: '12px sane',
		},
		'Friend.Tree.UI.Tool':
		{
			font: '12px sans serif',
			color: '',
			colorDown: '',
			colorMouseOver: '',
			sizeBorder: 1,
			colorBorder: '#FFFFFF'
		},
		'Friend.Tree.UI.TreeBox':
		{
			font: '12px sans serif',
			colorBack: '#272822',
			colorBackDown: '#2F3129',
			colorBackMouseOver: '#2D2D2D',
			colorText: '#C0C0C0',
			colorTextMouseOver: '#F0F0F0',
			colorTextDown: '#FFFFFF',
		},
		'Friend.Tree.UI.Tabs':
		{
			font: '12px sans serif',
			colorBack: '#272822',
			colorText: '#C0C0C0',
			colorTextMouseOver: '#F0F0F0',
			colorTextDown: '#FFFFFF',
			colorTab: '#272822',
			colorTabDown: '#2F3129',
			colorTabMouseOver: '#2D2D2D'	
		},
		'Friend.Tree.UI.MenuBar':
		{
			color: '#E0E0E0',
			font: '14px sans serif'
		},
		'Friend.Tree.UI.MenuPopup':
		{
			color: '#E0E0E0',
			font: '12px sans serif',
			paddingH: 6,
			paddingV: 6
		},
		'Friend.Tree.UI.MenuItem':
		{
			font: '12px sans serif',
			colorText: '#000000',
			colorTextMouseOver: '#000000',
			colorTextDown: '#FFFFFF',
			colorTextInactive: '#808080',
			colorBack: '#E0E0E0',
			colorBackMouseOver: '#A0A0A0',
			colorbackDown: '#202020'
		},
		'Friend.Tree.UI.Text':
		{
			font: '12px sans serif'
		}
	};

	// Menu bar, main area + information line
	this.group1 = new Friend.Tree.UI.Group( this.tree, 'group1', 
	{
		root: this.root,
		parent: this,
		x: 0,
		y: 0,
		z: 0,
		width: this.width,
		height: this.height,
		rows: 3,
		sizes: [ '24', 'calc( 100% - 24 - 24px )', '24px' ]
	} );
	this.menuBar = new Friend.Tree.UI.MenuBar( this.tree, 'menubar',
	{
		root: this.root,
		parent: this.group1,
		x: 0,
		y: 0,
		z: 1,
		width: this.width,
		height: 24,
		theme: this.theme,
		list: this.menu,
		caller: this,
		onOptionSelected: this.onMenu
	} );
	// Main display
	this.group2 = new Friend.Tree.UI.Group( this.tree, 'group2', 
	{
		root: this.root,
		parent: this.group1,
		x: 0,
		y: 0,
		z: 0,
		width: this.width,
		height: this.height,
		columns: 5,
		sizes: [ '40px', 'calc( 100% - 40px - 5px - 28px - 075% )', '5px', '28px', '075%' ]
	} );	
	this.infoLine = new Friend.Tree.UI.ColorBox( this.tree, 'information', 
	{
		root: this.root,
		parent: this.group1,
		x: 0,
		y: 0,
		z: 1,
		width: this.width / 4,
		height: this.height,
		theme: this.theme,
		color: '#FF0000'		
	} );
	this.projectToolbar = new Friend.Tree.UI.Toolbar( this.tree, 'projectToolbar', 
	{
		root: this.root,
		parent: this.group2,
		x: 0,
		y: 0,
		z: 1,
		width: 32,
		height: 32,
		imageWidth: 24,
		imageHeight: 24,
		paddingH: 8,
		paddingV: 8,
		theme: this.theme,
		list: this.projectToolbarTools
	} );
	this.group4 = new Friend.Tree.UI.Group( this.tree, 'group4', 
	{
		root: this.root,
		parent: this.group2,
		x: 0,
		y: 0,
		z: 0,
		width: this.width,
		height: this.height,
		rows: 2,
		sizes: [ '24px', 'calc( 100% - 24px )' ]
	} );	
	this.projectTabs = new Friend.Tree.UI.Tabs( this.tree, 'projectTabs', 
	{
		root: this.root,
		parent: this.group4,
		z: 1,
		theme: this.theme,
		caller: this,
		onClick: this.clickOnProjectTab,
		tabs:
		[
			{ 
				text: 'Project'
			},
			{ 
				text: 'Find in Files'
			}
		]
	} );
	this.projectTree = new Friend.Tree.UI.TreeBox( this.tree, 'project', 
	{
		root: this.root,
		parent: this.group4,
		x: 0,
		y: 0,
		z: 1,
		width: this.width / 4,
		height: this.height - 16,
		caller: this,
		theme: this.theme,
		onClick: this.clickOnProjectLine,
		onDblClick: this.dblClickOnProjectLine,
		onRightClick: this.rightClickOnProjectLine
	} );
	this.resizeBar = new Friend.Tree.UI.ResizeBar( this.tree, 'hResize', 
	{
		root: this.root,
		parent: this.group2,
		x: 0,
		y: 0,
		z: 1,
		width: 5,
		height: this.height,
		theme: this.theme,
		mask: [ '40px', 'calc( 100% - 40px - 5px - 28px - ***% )', '5px', '28px', '***%' ]
	} );
	this.editorToolbar = new Friend.Tree.UI.Toolbar( this.tree, 'editorToolbar', 
	{
		root: this.root,
		parent: this.group2,
		x: 0,
		y: 0,
		z: 1,
		width: 24,
		height: 24,
		imageWidth: 24,
		imageHeight: 24,
		paddingH: 2,
		paddingH: 2,
		theme: this.theme,
		list: this.editorToolbarTools
	} );

	this.group3 = new Friend.Tree.UI.Group( this.tree, 'tabsEditor', 
	{
		root: this.root,
		parent: this.group2,
		x: 0,
		y: 0,
		z: 0,
		width: this.width,
		height: this.height,
		rows: 2,
		sizes: [ '24px', 'calc( 100% - 24px)' ]
	} );
	this.tabs = new Friend.Tree.UI.Tabs( this.tree, 'tabs', 
	{
		root: this.root,
		parent: this.group3,
		x: 0,
		y: 0,
		z: 1,
		width: this.width,
		height: this.height,
		button: 'tab_close',
		theme: this.theme,
		caller: this,
		onClick: this.clickOnTab,
		onClose: this.closeTab,
	} );
	this.editor = new Friend.Tree.Misc.Ace( this.tree, 'editor', 
	{
		root: this.root,
		parent: this.group3,
		x: 0,
		y: 0,
		z: 3,
		width: this.width,
		height: this.height
	} );
	this.tree.sendMessageToTree( this.root, { command: 'organize', type: 'system' } );
	this.tree.start();

	var self = this;
	if ( true )
	{
		this.loadConfig( { history: true, openProject: 0 }, function( ok ) 
		{
		} );
	}
	else
	{
		this.initConfig();
		this.setDirectory( 'Home:AMOS/' );
	}
};
Main.getIconFromPath = function( path )
{
	var extension = this.utilities.getFileExtension( path );
	switch( extension )
	{
		case 'php':  
		case 'pl':   
		case 'sql':  
		case 'sh':   
		case 'as':   
		case 'sol':
		case 'info':
		case 'json':
		case 'js':
		case 'url':
		case 'jsx':
		case 'xml':
		case 'c':
		case 'h':
		case 'cpp':
		case 'd':
		case 'ini':
		case 'java':
		case 'run':
			icon = 'file_source';
			break;
		case 'css':  
			icon = 'file_css';
			break;
		case 'txt':
		case 'apf':
		case 'conf':
		case 'lang':
		case 'md':
			icon = 'file_text';
			break;
		case 'tpl':
		case 'ptpl':
		case 'html':
		case 'htm':
			icon = 'file_html';
			break;
		case 'png':
		case 'jpg':
		case 'jpeg':
		case 'gif':
			icon = 'file_image';
			break;
		case 'wav':
		case 'mp3':
			icon = 'file_sound'; 
			break;
		default:
			icon = 'file_unknown';
			break;
	}
	return icon;
};
// Message Up
Main.messageUp = function ( message )
{
	if ( message.command == 'quit' )
	{
		if ( this.projectPath != '' )
		{
			this.saveProjectConfig()
			this.saveConfig( { history: true } );
		}
	}
	return false;
};
Main.messageDown = function ( message )
{
	return false;
};

Main.clickOnProjectNew = function()
{
	debugger;
};
Main.clickOnOpenProject = function()
{
	debugger;
};
Main.clickOnOpenDirectory = function()
{
	debugger;
};
Main.clickOnProjectSave = function()
{
	debugger;
};
Main.clickOnProjectSaveAs = function()
{
	debugger;
};
Main.clickOnProjectBuild = function()
{
	debugger;
};
Main.clickOnProjectRun = function()
{
	debugger;
};
Main.clickOnProjectFindInFiles = function()
{
	debugger;
};
Main.clickOnProjectPreferences = function()
{
	debugger;
};
Main.clickOnEditorNew = function()
{
	debugger;
};
Main.clickOnEditorOpen = function()
{
	debugger;
};
Main.clickOnEditorSave = function()
{
	debugger;
};
Main.clickOnEditorSaveAs = function()
{
	debugger;
};
Main.clickOnEditorBookmark = function()
{
	debugger;
};
Main.clickOnEditorPreviousBookmark = function()
{
	debugger;
};
Main.clickOnEditorNextBookmark = function()
{
	debugger;
};
Main.clickOnEditorFind = function()
{
	debugger;
};
Main.clickOnProjectTab = function( tab )
{
	debugger;
};
Main.rightClickOnProjectLine = function( line )
{
	if ( !this.projectPopup )
	{
		// Define the popup menu
		var popup =
		[
			{
				name: 'treeEdit',
				text: 'Edit'
			},
			{
				name: 'separator'
			},
			{
				name: 'treeCopy',
				text: 'Copy'
			},
			{
				name: 'treePaste',
				text: 'Paste'
			},
			{
				name: 'treeCut',
				text: 'Cut'
			},
			{
				name: 'separator'
			},
			{
				name: 'treeRename',
				text: 'Rename'
			},
			{
				name: 'treeDelete',
				text: 'Delete'
			}
		];
		this.projectPopup = new Friend.Tree.UI.MenuPopup( this.tree, 'projectPopup', 
		{
			root: this.root,
			parent: this,
			x: this.root.mouseX,
			y: this.root.mouseY,
			z: this.z + 10,
			theme: this.theme,
			list: popup,
			caller: this,
			onDestroyed: onDestroyed
		} );
		function onDestroyed()
		{
			this.projectPopup = false;
		}
	}	
};
Main.onMenu = function( optionName, menuItem )
{
	switch( optionName )
	{
		case 'fileNew':	
			break;
		case 'fileNewProject':
			break;
		case 'fileOpen':
			break;
		case 'fileOpenDirectory':
			break;
		case 'fileOpenProject':
			break;
		case 'fileSave':
			break;
		case 'fileSaveAs':
			break;
		case 'fileSaveAll':
			break;
		case 'fileSaveProject':
			break;
		case 'fileClose':
			break;
		case 'fileCloseProject':
			break;
		case 'fileUpdateProject':
			break;
		case 'filePreferences':
			break;
		case 'fileQuit':
			break;
		case 'editUndo':
			break;
		case 'editRedo':
			break;
		case 'editCopy':
			break;
		case 'editPaste':
			break;			
		case 'editCut':
			break;
		case 'editFind':
			break;
		case 'editReplace':
			break;
		case 'editFindInFiles':
			break;
		case 'editReplaceInFiles':
			break;
		case 'editBookmark':
			break;
		case 'editPreviousBookmark':
			break;
		case 'editNextBookmark':
			break;
		case 'runBuild':
			break;
		case 'runRun':
			break;
		default:
			console.log( 'AMOS: unimplemented option!' );
			break;
	}
};
	
Main.clickOnTab = function( tab )
{
	var line = this.findLineFromPath( tab.path );
	if ( line && line.edited )
	{
		this.projectTree.activateLine( line );
		if ( !line.edited )
			return;			// Should never happen

		this.editor.setSession( line.path );
		this.projectTree.doRefresh();
	}
};
Main.closeTab = function( tab )
{
	// Find the corresponding line
	var line = this.findLineFromPath( tab.path );
	if ( line )
	{
		// Line no longer edited
		line.edited = false;
		this.projectTree.deactivateLine( line );

		// No more active session
		this.editor.killSession( line.path );

		// Remove the tab / activate previous in history
		var tab = this.tabs.deleteTab( tab );
		if ( tab )	
		{
			line = this.findLineFromPath( tab.identifier );
			this.clickOnProjectLine( line );
		}
	}
};
Main.clickOnProjectLine = function( line )
{
	// Is the line opened?
	if ( line.type == 'file' )
	{
		if ( !line.edited )
		{
			line.edited = true;
			line.loaded = false;

			// Add a new tab if not already created
			var found = false;
			var tab = this.tabs.getFirstTab();
			while( tab )
			{
				if ( tab.identifier == line.path )
				{
					found = true;
					break;
				}
				tab = this.tabs.getNextTab();
			}
			if ( !found )
			{
				this.tabs.insertTab(
				{
					text: line.text,
					path: line.path,
					hint: this.projectPath + line.path,
					identifier: line.path
				}, 'afterCurrent' );
			}

			// Do we need to load the source?
			var self = this;
			if ( self.editor.getSession( line.path ) )
			{
				self.editor.setSession( line.path );
				line.loaded = true;
			}
			else
			{
				// Load the source
				var file = new File( self.projectPath + line.path );
				file.onLoad = function( source )
				{
					line.loaded = true;
					line.sessionIdentifier = self.editor.openSession( line.path, source );
				}
				file.load();
			}
		}
		else
		{
			// Activates the tab
			this.tabs.activateTab( line.path );
			this.projectTree.activateLine( line );
			this.editor.setSession( line.path );
		}
	}
};
Main.dblClickOnProjectLine = function( line )
{
	debugger;
};
Main.initConfig = function()
{
	this.config = 
	{
		history: []
	};
};
Main.loadConfig = function( properties, callback )
{
	// Read the config
	var self = this;

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			self.initConfig();
			config = {};
			try
			{
				var o = JSON.parse( d );
				if ( o.fc2config != '[]' )
					config = o.fc2config; 

			}
			catch( e )
			{
			}

			// Load the last open project
			if ( properties[ 'history' ] && config.history )
				self.config.history = config.history;
			if ( properties[ 'openProject' ] != 'undefined' && self.config.history.length )
			{
				var num = properties[ 'openProject' ];
				if ( num < config.history.length )
				{
					self.loadProjectConfig( self.config.history[ num ], function()
					{
						if ( callback )
							callback( true );
					} );
				}
			}
			else
			{
				if ( callback )
					callback( true );
			}
		}
		else
		{
			if ( callback )
				callback( false );
		}
	}
	m.execute( 'getsetting', { setting: 'fc2config' } );
},
Main.saveConfig = function( properties )
{
	var config = {};
	if ( properties[ 'history' ] )
	{
		// Current project first, then the others
		config.history = [ this.projectPath ];
		for ( var h = 0; h < this.config.history.length; h++ )
		{
			if ( this.config.history[ h ] != this.projectPath )
				config.history.push( this.config.history[ h ] );
		}
		// Limit the size of history to 8
		config.history.length = Math.min( 8, config.history.length );
	}

	// Save config
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
	}
	m.execute( 'setsetting', { setting: 'fc2config', data: JSON.stringify( config ) } );
},
Main.loadProjectConfig = function( path, callback )
{
	// Read the config
	var self = this;
	var file = new File( path + 'editor.config' );
	file.onLoad = function( data )
	{
		var config = false;
		try
		{
			config = JSON.parse( data );
		}
		catch( e )
		{
			if ( callback )
				callback( false );
			return;
		}
		if( config  )
		{
			self.setDirectory( config.projectPath, function( response )
			{
				// Which files are open?
				for ( var path in config.tree )
				{
					var line = self.findLineFromPath( path );
					if ( line )
					{
						line.edited = config.tree[ path ].edited;
						line.open = config.tree[ path ].open;
					}
				}
				self.projectTree.doRefresh();

				// Recreates the tabs
				for ( var t = 0; t < config.tabs.length; t++ )
				{
					var tab = config.tabs[ t ];
					var line = self.findLineFromPath( tab.identifier );
					if ( line )
					{
						var tab = 
						{
							text: line.text,
							path: line.path,
							hint: self.projectPath + line.path,
							identifier: tab.identifier						
						}
						self.tabs.insertTab( tab, 'end' );
					}
				}

				// Sets the history back
				if ( config.tabHistory )
					self.tabs.setHistory( config.tabHistory );
			
				// Restore editor sessions and tabs
				var count = 0;
				for ( var s in config.sessions )
				{
					count++;
					self.editor.setSessionInformation( config.sessions[ s ], config.projectPath, function()
					{
						count--;

						if ( count == 0 )
						{
							// Open all editors 
							for ( var t = 0; t < config.tabs.length; t++ )
							{
								var tab = config.tabs[ t ];
								var line = self.findLineFromPath( tab.identifier );
								if ( line )
								{
									line.edited = false;
									self.clickOnProjectLine( line, function( path )
									{
									} );										
								}
							}

							// Wait for all to be loaded, and activates first in history
							var handleInterval = setInterval( function()
							{
								var count = 0;
								for ( var tt = 0; tt < config.tabs.length; tt++ )
								{
									var tab = config.tabs[ tt ];
									var line = self.findLineFromPath( tab.identifier );
									if ( line.loaded )
										count++;
									if ( count == config.tabs.length )
									{
										// Activates first in history
										if ( config.tabHistory && config.tabHistory.length )
										{
											var line = self.findLineFromPath( config.tabHistory[ 0 ] );
											if ( line )
												self.clickOnProjectLine( line );
										}
										clearInterval( handleInterval );
										if ( callback )
											 callback( true );
										return;
									}																
								}
							}, 20 ); 
						}
					} );
				}
				if ( count == 0 )
				{
					if ( callback )
						callback( true );
				}				
			} );
		}
		else
		{
			if ( callback )
				callback( false );
		}
	}
	file.load();
};
Main.saveProjectConfig = function()
{
	// Build the config object
	var config = {};
	config.projectPath = this.projectPath;

	// Stores the open/close state of the tree
	config.tree = {};
	var line = this.projectTree.getFirstLine();
	while( line )
	{
		config.tree[ line.identifier ] = 
		{
			open: line.open ? true : false,
			edited: line.edited ? true : false
		};
		line = this.projectTree.getNextLine();
	}

	// Stores the tabs
	config.tabs = [];
	var tab = this.tabs.getFirstTab();
	while( tab )
	{
		config.tabs.push(
		{
			identifier: tab.identifier
		} );
		tab = this.tabs.getNextTab();
	}

	// History of the tabs
	config.tabHistory = this.tabs.getHistory();

	// Editor sessions
	config.sessions = this.editor.getSessionsInformation();

	// Save config
	var json = JSON.stringify( config );
	var file = new File( this.projectPath + 'editor.config' );
	file.save( json );
};

Main.findTabFromPath = function( path )
{
	var tab = this.tabs.getFirstTab();
	while( tab )
	{
		if ( tab.path == line.path )
			return tab;
		tab = this.tabs.getNextTab();
	}
	return null;
}
Main.findLineFromPath = function( path )
{
	var line = this.projectTree.getFirstLine();
	while( line )
	{
		if ( line.path == path )
			return line;
		line = this.projectTree.getNextLine();
	}
	return false;
};
Main.setDirectory = function( path, callback )
{
	this.projectPath = path;
	this.treeContent = false;

	// Get project directory, folders first
	var self = this;
	DOS.getDirectory( path, { recursive: true, sort: true }, function( message )
	{
		if ( message.list )
		{
			// Setup root
			var p = path;
			var fileName;
			if ( p.substring( path.length -1 ) == '/' )
				p = p.substring( 0, p.length -1 );
			if ( p.lastIndexOf( '/' ) >= 0 )
				fileName = p.substring( p.lastIndexOf( '/' ) + 1 );
			else
				fileName = p.split( ':' )[ 1 ];
			var def = 
			{
				text: fileName,
				path: '<---root--->',
				type: 'directory',
				children: [],
				identifier: '<---root--->'
			}
			self.treeContent = def;

			// Directories to explore?
			if ( message.list.length )
			{
				doDirectory( def.children, message.list );
				self.projectTree.setTreeDefinition( self.treeContent );
			}
		}
		if ( callback )
			callback( 'done' );

		function doDirectory( destination, list )
		{
			for ( var l = 0; l < list.length; l++ )
			{
				var item = list[ l ];
				var subPath = item.Path.substring( path.length );
				if ( item.Type == 'Directory' )
				{
					var def = 
					{
						text: item.Filename,
						path: subPath,
						type: 'directory',
						children: [],
						identifier: subPath
					}
					destination.push( def );
					doDirectory( def.children, item.Children );		
				}
				else if ( item.Type == 'File' )
				{
					var def = 
					{
						text: item.Filename,
						path: subPath,
						type: 'file',
						identifier: subPath						
					}
					// Finds the icon
					def.icon = self.getIconFromPath( item.Filename );

					destination.push ( def );
				}
			}
		}
	} );
}

