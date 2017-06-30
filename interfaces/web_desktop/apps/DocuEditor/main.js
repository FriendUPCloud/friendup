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

var filter = [];

function addToList( ele )
{
	for( var a = 0; a < filter.length; a++ )
	{
		if( filter[a] == ele ) return;
	}
	filter.push( ele );
}

function remFromList( ele )
{
	var nl = [];
	for( var a = 0; a < filter.length; a++ )
	{
		if( filter[a] != ele ) nl.push( filter[a] );
	}
	filter = nl;
}

function catchSearch( e, val )
{
	var kc = e.which ? e.which : e.keyCode;
	if( kc == 13 )
	{
		Application.search = val;
	}
	Application.sendMessage( { 
		command: 'refreshTopics', 
		filter: filter, 
		search: Application.search,
		parentId: Application.parentId
	} );
}

Application.run = function( msg )
{
	this.topicWin = false;
	this.userInfo = false;
	this.parentId = '0';
	
	function recess( deact )
	{
		if( deact == 1 ) this.activated = true;
		else deact = false;
		
		var f = '';
		switch( this.id )
		{
			case 'btnnew': f = '0'; break;
			case 'btnver': f = '1'; break;
            case 'btnfix': f = '2'; break;
		}
			
		if( this.activated )
		{
			this.activated = false;
			this.classList.remove( 'Recessed' );
			remFromList( f );
		}
		else
		{
			this.activated = true;
			this.classList.add( 'Recessed' );
			addToList( f );
		}
		if( !deact )
		{
			var btns = [ 'btnnew', 'btnver', 'btnfix' ];
			for( var a = 0; a < btns.length; a++ )
			{
				if( this.id != btns[a] )
				{
					ge(btns[a]).recess( 1 );
				}
			}
			Application.sendMessage( { 
				command: 'refreshTopics', 
				filter: filter.length ? ( '(\'' + filter.join( '\', \'' ) + '\')' ) : '', 
				search: Application.search,
				parentId: Application.parentId
			}  );
		}
	}
	
	// Render the hierarchy list
	RedrawHierarchy();
	
	// Assign functionality
	ge( 'btnnew' ).onclick = recess;
	ge( 'btnnew' ).recess  = recess;
	ge( 'btnver' ).onclick = recess;
	ge( 'btnver' ).recess  = recess;
	ge( 'btnfix' ).onclick = recess;
	ge( 'btnfix' ).recess  = recess;
}


function RedrawHierarchy()
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return ge( 'Structure' ).innerHTML = '<p>Empty structure.</p>';
		var data = JSON.parse( d  );
		var hierarchy = NestHierarchy( data, 0 );
		var documents = [{ name: 'Document root', identifier: '0' }].concat( hierarchy );
		//for( var a in hierarchy ) documents.push( hierarchy[a] );
		var tv = new Treeview( documents, 'TopicTree', { currentItem: ge( 'Structure' ).currentItem } );
		ge( 'Structure' ).innerHTML = '';
		ge( 'Structure' ).appendChild( tv );
	}
	m.execute( 'topichierarchy' );
}

function NestHierarchy( data, pid )
{		
	var out = [];
	var rem = [];
	
	// Add primary nested elements
	for( var a = 0; a < data.length; a++ )
	{
		if( parseInt( data[a].TopicID ) == pid )
		{
			out.push( { name: data[a].Subject, identifier: data[a].ID } );
		}
		else
		{
			rem.push( data[a] );
		}
	}
	
	// Check for children
	for( var a = 0; a < out.length; a++ )
	{
		var children = false;
		children = NestHierarchy( rem, out[a].identifier );
		if( children.length )
			out[a].children = children;
		else out[a].children = false;
	}
	return out;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'treeview':
			ge( 'Structure' ).currentItem = msg.identifier;
			Application.sendMessage( {
				command: 'refreshTopics',
				parentId: msg.identifier
			}, function(){ RedrawHierarchy(); } );
			break;
		case 'userinfo':
			this.userInfo = msg.userinfo;
			if( !this.topicsListed && this.doTheUpdate )
			{
				this.topicsListed = true;
				this.doTheUpdate();
			}
			break;
		case 'closeTopic':
			if( this.topicWin )
			{
				this.topicWin.close();
				this.topicWin = false;
			}
			break;
		case 'closeView':
			if( this.viewWin )
			{
				this.viewWin.close();
				this.viewWin = false;
			}
			break;
		case 'getcomments':
			this.topicWin.sendMessage( msg );
			break;
		case 'updatetopics':
			this.doTheUpdate = function()
			{
				if( msg.parentId ) Application.parentId = msg.parentId;
				
				ge( 'Topics' ).innerHTML = '';
				if( msg.topics.length )
				{
					var topics = JSON.parse( msg.topics );
					for( var a = 0; a < topics.length; a++ )
					{
						var div = document.createElement( 'div' ); div.className = 'Topic';
						var who = document.createElement( 'div' ); who.className = 'Who';
						var wha = document.createElement( 'div' ); wha.className = 'What';
						var btn = document.createElement( 'div' ); btn.className = 'Btns';
						var sub = document.createElement( 'div' ); sub.className = 'Subj';
			
						var iss = topics[a];
			
						var status = '';
						var vclass = '';
						switch( iss.Status )
						{
							case '1':
								status = '[Verified] ';
								vclass = 'verified ColorStGreenLight BackgroundStGreenLight';
								break;
							case '2':
								status = '[Fixed] ';
								vclass = 'fixed ColorStBlueLight BackgroundStBlueLight';
								break;
							default:
								vclass = 'ColorStGrayLight BackgroundStGrayLight';
						}
				
						div.className += ' ' + vclass;
				
						// Execute replacements
						var f = new File(); f.i18n();
						iss.Subject = f.doReplacements( iss.Subject );
						
						var so = '<input type="text" size="3" class="SortOrder" onchange="setSortOrder(\'' + iss.ID + '\', this.value)" value="' + ( iss.SortOrder >= 0 ? iss.SortOrder : '0' ) + '"/>';
						sub.innerHTML = so + '<strong>' + ( status + iss.Subject ) + '</strong>, ' + iss.DateModified;
						wha.innerHTML = '<p>' + iss.ShortDesc + '</p>';
						who.innerHTML = 'submitted by <strong>' + iss.Username + '</strong>';
						btn.innerHTML = '';
						if( iss.Category ) who.innerHTML += ' in <strong>' + iss.Category + '</strong>';
					
						if( Application.userId == iss.UserID || Application.userInfo.Level == 'Admin' )
						{
							btn.innerHTML += '<button class="Button IconSmall fa-pencil"\
										 onclick="editTopic(' + iss.ID + ')">&nbsp;' + i18n( 'i18n_edit' ) + '</button>';
						}
						btn.innerHTML += '<button class="Button IconSmall fa-eye"\
										 onclick="viewTopic(' + iss.ID + ')">&nbsp;' + i18n( 'i18n_view' ) + '</button>';
						btn.innerHTML += '<button class="Button IconSmall fa-caret-right"\
										 onclick="enterTopic(' + iss.ID + ')">&nbsp;' + i18n( 'i18n_enter_into' ) + '</button>';
						div.appendChild( sub );
						div.appendChild( who );
						div.appendChild( wha );
						div.appendChild( btn );
						ge( 'Topics' ).appendChild( div );
					}
				}
			}
			if( this.userInfo )
				this.doTheUpdate();
			break;
	}
}

function setSortOrder( id, v )
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		Application.sendMessage( {
			command: 'refreshTopics',
			parentId: Application.parentId
		} );
	}
	m.execute( 'setsortorder', { topicid: id, sortorder: v } );
}

function enterTopic( id )
{
	if( !id || id <= 0 ) id = '0';
	Application.parentId = id;
	Application.sendMessage( {
		command: 'refreshTopics',
		parentId: id
	} );
}

function viewTopic( id )
{
	if( Application.viewWin ) return;
	
	var v = new View( {
		title: i18n( 'i18n_viewing_topic' ),
		width: 500,
		height: 400
	} );
	
	v.onClose = function()
	{
		Application.viewWin = false;
	}
	
	Application.viewWin = v;
	
	var f = new File( 'Progdir:Templates/view.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			if( id )
			{
				v.sendMessage( { command: 'loadtopic', ID: id } );
			}
		} );
	}
	f.load();
}

function topicWin( id )
{
	
	if( Application.topicWin ) return;
	
	var v = new View( {
		title: id ? i18n( 'i18n_edit_topic' ) : i18n( 'i18n_register_topic' ),
		width: 500,
		height: 400
	} );
	
	v.setMenuItems( [
		{
			name: i18n( 'i18n_edit' ),
			items: [
				{
					name: i18n( 'i18n_register_image' ),
					command: 'registerimage',
					scope: 'local'
				},
				{
					name: i18n( 'i18n_add_image' ),
					command: 'addimage',
					scope: 'local'
				}
			]
		}
	] );
	
	v.onClose = function()
	{
		Application.topicWin = false;
	}
	
	Application.topicWin = v;
	var f = new File( 'Progdir:Templates/topic.html' );
	f.replacements = { parentId: Application.parentId, ID: '0' };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'userinfo', userinfo: Application.userInfo } );
			if( id )
			{
				v.sendMessage( { command: 'loadtopic', ID: id } );
			}
			else v.sendMessage( { command: 'init' } );
		} );
	}
	f.load();	
}

function editTopic( id )
{
	topicWin( id );
}

function LoadJSSource(that, name, callback )
{
    var scriptsLoaded = 0;

	var s = document.createElement( 'script' );
	s.src = name;
	s.onload = function()
	{
		if( callback ) callback(that);
	};
    document.body.appendChild( s );
}

/**
 * Import Files as topics
 *
 * @param id
 */
function importTopic( id )
{
    if( Application.topicWin ) return;

    // var flags =
    //     {
    //         type: 'load',
    //         title: 'Please choose a ZIP file with doxygen XML to open',
    //         path: 'Mountlist:',
    //         triggerFunction: trigger,
    //         mainView: false
    //     };
    // var fileDialog = new Filedialog( flags );
    // function trigger( files )
    // {
    //     if ( files )
    //     	importDoxygen(files);
    // }
	importDoxygen(["Home:Work/index.json"]);
}


function importDoxygen(file)
{
    var slash = file[0].lastIndexOf('/');
    var path = file[0].substring(0, slash + 1);

	var importer = new JSONImporter(path);
	importer.loadTree(path + 'index.json', function(parameter)
    {
        importer.processTree();
    }, null);
}



/**
 * Import doxygen JSON files
 *
 * @param files
 */
JSONImporter.JSONFLAG_FOUND = 0x0001;
JSONImporter.JSONFLAG_FOUNDATTRIBUTE = 0x0002;
JSONImporter.JSONFLAG_FOUNDCHILDREN = 0x0004;
JSONImporter.JSONFLAG_EXPLOREATTRIBUTE = 0x0008;
JSONImporter.JSONFLAG_EXPLORECHILDREN = 0x0010;
JSONImporter.JSONFLAG_STARTOFNAME = 0x0010;
JSONImporter.JSONFLAG_SKIPCHILDREN = 0x0020;
JSONImporter.JSONFLAG_EXPLOREONEBYONE = 0x0040;
JSONImporter.JSONFLAG_NOEXPLORE = 0x0080;
JSONImporter.JSONFLAG_NOCHILDREN = 0x0100;
JSONImporter.JSONFLAG_NOFURTHERATTRIBUTES = 0x0200;
JSONImporter.JSONFLAG_FOUNDREFID = 0x0400;
JSONImporter.JSONFLAG_STOP = 0x8000;
JSONImporter.JSONFLAG_EXPLOREMASK = (JSONImporter.JSONFLAG_SKIPCHILDREN | JSONImporter.JSONFLAG_EXPLOREATTRIBUTE | JSONImporter.JSONFLAG_EXPLORECHILDREN | JSONImporter.JSONFLAG_EXPLOREONEBYONE);
function JSONImporter(path)
{
    mergeObjects(this, JSONImporter);

    this.path = path;
    this.jsonNames = [];
    this.jsonTrees = [];
}

JSONImporter.loadTree = function(fileName, callBack, callBackParam)
{
    var file = new File(fileName);
    var that = this;
    file.onLoad = function( data )
    {
        if (data)
        {
            var tree = JSON.parse(data);
            that.jsonNames.push(fileName);
            that.jsonTrees.push(tree);
            if (callBack) callBack(tree, that.jsonNames.length - 1);
        }
    };
    file.load();
};
JSONImporter.loadTrees = function(fileNames, callBack, callBackParam)
{
    var that = this;
    var count = callBackParam;
	for (n = 0; n < fileNames.length; n++)
	{
		var file = new File(fileNames[n]);
        file.onLoad = function( data )
        {
            if (data)
            {
                var tree = JSON.parse(data);
                that.jsonNames.push(fileNames[n]);
                that.jsonTrees.push(tree);
                if (callBack)
                {
                    callBack(tree, that.jsonNames.length - 1);
                    if (count)
                    {
                        count--;
                        if (count == 0)
                            callBack(tree, -1);
                    }
                }
            }
        };
        file.load();
	}
};
JSONImporter.processTree = function()
{
	this.index = this.jsonTrees[0];
	var name;

    // Loads the list of directories
    this.directories = [];
    this.directoriesRefID = [];
    this.cleanTree(this.index);
    do
    {
        if (!this.getFromTree(this.index, 'name', 'dir', '', JSONImporter.JSONFLAG_EXPLORECHILDREN | JSONImporter.JSONFLAG_EXPLOREATTRIBUTE | JSONImporter.JSONFLAG_EXPLOREONEBYONE))
            break;
        this.directories.push(this.result);
        this.directoriesRefID.push(this.resultRefID);
    } while(true);
    debugger;
	bubbleSort(this.directories, this.directoriesRefID);
	
	// Loads the list of files
    var files = [];
    this.compoundRefID = [];
    this.contentRefID = [];
    this.cleanTree(this.index);
	do
	{
		if (!this.getFromTree(this.index, 'name', 'file', '', JSONImporter.JSONFLAG_EXPLORECHILDREN | JSONImporter.JSONFLAG_EXPLOREATTRIBUTE | JSONImporter.JSONFLAG_EXPLOREONEBYONE))
			break;
		files.push(this.result);
        this.compoundRefID.push(this.resultRefID);
        this.contentRefID.push(this.resultRefID.substring(0, this.resultRefID.length - 1) + 'h');
	} while(true);

    // Loads the files
    var n;
    var filesToLoad = [];
    this.compoundIndexes = [];
    this.contentIndexes = [];
    this.countCompounds = 0;
    this.countContents = 0;
    this.loaded = false;
    var that = this;
    for (n = 0; n < this.compoundRefID.length; n++)
        filesToLoad.push(this.path + this.compoundRefID[n] + '.json');
    debugger;
	this.loadTrees(filesToLoad, function(tree, number)
	{
		if (number >= 0)
		{
            that.countCompounds++;
            that.compoundIndexes[n] = number;
		}
		else
			that.loaded = true;
	});
	if (this.loaded)
	{
        filesToLoad = [];
        for (n = 0; n < this.contentRefID.length; n++)
            filesToLoad.push(this.path + this.contentRefID[n] + '.json');
        this.loadTrees(filesToLoad, function(tree, number)
        {
            if (number >= 0)
            {
                that.countContents++;
                that.contentIndexes[n] = number;
            }
        });
	}

	// Sorts the directories
	debugger;
};

JSONImporter.cleanTree = function(tree)
{
    this.result = null;
    this.resultRefID = null;
    this.exploreTree(tree, '', '', '', 0, function(node, flags)
    {
        if (flags && JSONImporter.JSONFLAG_FOUNDATTRIBUTE)
            node.flags = 0;
        return flags;
    }, null);
};

JSONImporter.getFromTree = function(tree, childrenName, attributeKind, attributeRefID, flags)
{
    this.result = null;
    this.resultRefID = null;
    this.flagsResult = 0;

	var that = this;
    this.exploreTree(tree, childrenName, attributeKind, attributeRefID, flags, function(node, flags, callBackParam)
    {
        if (flags && JSONImporter.JSONFLAG_FOUND)
        {
            if ((flags & (JSONImporter.JSONFLAG_FOUNDCHILDREN || JSONImporter.JSONFLAG_EXPLORECHILDREN)) == (JSONImporter.JSONFLAG_FOUNDCHILDREN || JSONImporter.JSONFLAG_EXPLORECHILDREN))
            {
                that.result = node['#children'][0];
                if (node['#attributes'] && node['#attributes']['refid'])
                    that.resultRefID = node['#attributes']['refid'];
                return flags | (JSONImporter.JSONFLAG_STOP | JSONImporter.JSONFLAG_SKIPCHILDREN);
            }
            if ((flags & (JSONImporter.JSONFLAG_FOUNDATTRIBUTE || JSONImporter.JSONFLAG_EXPLOREATTRIBUTE)) == (JSONImporter.JSONFLAG_FOUNDATTRIBUTE || JSONImporter.JSONFLAG_EXPLOREATTRIBUTE))
            {
				that.result = node;
                if (node['#attributes'] && node['#attributes']['refid'])
                    that.resultRefID = node['#attributes']['refid'];
            }
        }
        return flags;
    }, null);
    return (this.flagsResult & JSONImporter.JSONFLAG_FOUND) != 0;
};

JSONImporter.extractFromTree = function(tree, childrenName, attributeKind, attributeRefID, flags)
{
    this.result = [];
    this.resultRefID = [];
    this.flagsResult = 0;

    var that = this;
    this.exploreTree(tree, childrenName, attributeKind, attributeRefID, flags, function(node, flags, callBackParam)
    {
        if (flags && JSONImporter.JSONFLAG_FOUND)
        {
            if ((flags & (JSONImporter.JSONFLAG_FOUNDATTRIBUTE || JSONImporter.JSONFLAG_EXPLOREATTRIBUTE)) == (JSONImporter.JSONFLAG_FOUNDATTRIBUTE || JSONImporter.JSONFLAG_EXPLOREATTRIBUTE))
            {
            	if ((flags & JSONImporter.JSONFLAG_EXPLORECHILDREN) == 0)
				{
                    this.result.push(node);
                    if (node['#attributes'] && node['#attributes']['refid'])
                        that.resultRefID.push(node['#attributes']['refid']);
				}
            }
            if ((flags & (JSONImporter.JSONFLAG_FOUNDCHILDREN || JSONImporter.JSONFLAG_EXPLORECHILDREN)) == (JSONImporter.JSONFLAG_FOUNDCHILDREN || JSONImporter.JSONFLAG_EXPLORECHILDREN))
            {
                if (!that.result)
                    that.result = [];
                that.result.push(node['#children'][0]);
                if (node['#attributes'] && node['#attributes']['refid'])
                    that.resultRefID.push(node['#attributes']['refid']);
            }
        }
        return flags;
    }, null);
    return (this.flagsResult & JSONImporter.JSONFLAG_FOUND) != 0;
};

JSONImporter.exploreTree = function(node, childrenName, attributeKind, attributeRefID, flags, callBack, callBackParam, parent)
{
    if ((flags & JSONImporter.JSONFLAG_STOP) == 0)
    {
        var flagsFound = 0;
        if ((flags & JSONImporter.JSONFLAG_EXPLOREATTRIBUTE) != 0 && (flags & JSONImporter.JSONFLAG_NOFURTHERATTRIBUTES) == 0 )
		{
            if (!node.flags || (node.flags && (node.flags & JSONImporter.JSONFLAG_NOEXPLORE) == 0))
			{
				if (!attributeKind && !attributeRefID)
                    flagsFound |= JSONImporter.JSONFLAG_FOUNDATTRIBUTE | JSONImporter.JSONFLAG_FOUND;
				else if (attributeKind)
				{
					if (node['#attributes'])
					{
						if (node['#attributes'].kind)
						{
							if (node['#attributes'].kind == attributeKind)
                            {
                            	flagsFound |= JSONImporter.JSONFLAG_FOUNDATTRIBUTE | JSONImporter.JSONFLAG_FOUND;
                                flags |= JSONImporter.JSONFLAG_NOFURTHERATTRIBUTES;
                            }
						}
					}
				}
				else if (attributeRefID)
				{
					if (node['#attributes']['refid'])
					{
						if (node['#attributes']['refid'] == attributeRefID)
						{
                            flagsFound |= JSONImporter.JSONFLAG_FOUNDREFID | JSONImporter.JSONFLAG_FOUND;
							flags |= JSONImporter.JSONFLAG_NOFURTHERATTRIBUTES;
						}
					}
				}
			}
        }
        else
		{
            flagsFound |= JSONImporter.JSONFLAG_FOUND;
		}

		if ((flagsFound & JSONImporter.JSONFLAG_FOUND) != 0)
		{
			if (((flags & JSONImporter.JSONFLAG_EXPLORECHILDREN) != 0) && childrenName && node['#name'])
			{
				if (node['#name'] == childrenName)
					flagsFound |= JSONImporter.JSONFLAG_FOUNDCHILDREN;
			}
			if (node.flags && ((node.flags & JSONImporter.JSONFLAG_NOEXPLORE) != 0))
			{
				flags &= ~(JSONImporter.JSONFLAG_FOUNDATTRIBUTE | JSONImporter.JSONFLAG_FOUNDREFID | JSONImporter.JSONFLAG_FOUNDCHILDREN);
				flags |= JSONImporter.JSONFLAG_SKIPCHILDREN;
            }
			else if ( (flagsFound & JSONImporter.JSONFLAG_FOUND)!= 0)
			{
                this.flagsResult |= flagsFound;
				if (callBack)
                    flags |= callBack(node, flags | JSONImporter.JSONFLAG_FOUND | flagsFound, callBackParam);
				if ((flags & JSONImporter.JSONFLAG_EXPLOREONEBYONE) != 0)
				{
					if ((flags & JSONImporter.JSONFLAG_EXPLOREATTRIBUTE) != 0)
						parent.flags |= JSONImporter.JSONFLAG_NOEXPLORE;
					else
                        node.flags |= JSONImporter.JSONFLAG_NOEXPLORE;
                }
			}
		}

		if ((flags & JSONImporter.JSONFLAG_STOP) == 0)
		{
			if ((flags & (JSONImporter.JSONFLAG_SKIPCHILDREN | JSONImporter.JSONFLAG_SKIPCHILDREN)) == 0)
			{
				if (node['#children'])
				{
					var n;
					for (n = 0; n < node['#children'].length && (flags & JSONImporter.JSONFLAG_STOP) == 0; n++)
					{
						if (typeof node['#children'][n] == 'object')
						{
							flags |= this.exploreTree(node['#children'][n], childrenName, attributeKind, attributeRefID, flags, callBack, callBackParam, node);
                        }
					}
				}
			}
        }
        flags &= ~(JSONImporter.JSONFLAG_SKIPCHILDREN | JSONImporter.JSONFLAG_NOFURTHERATTRIBUTES);
    }
    return flags;
};

/*
 * Merges properties of two objects
 */
function mergeObjects(object1, object2)
{
    var p;
    for (p in object2)
        object1[p] = object2[p];
}
function bubbleSort(a, b)
{
	var swapped;
	do
	{
		swapped = false;
		for (var i = 0; i < a.length - 1; i++)
		{
			if (a[i] > a[i + 1])
			{
				var temp = a[i];
				a[i] = a[i + 1];
				a[i + 1] = temp;
				temp = b[i];
				b[i] = b[i + 1];
				b[i + 1] = temp;
				swapped = true;
			}
		}
	} while (swapped);
}
