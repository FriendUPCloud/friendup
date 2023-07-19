/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIChatoverview extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIChatoverview';
        
        let data = '\
        <div class="Channels"></div>\
        <div class="Chatlist"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domChannels = this.domElement.querySelector( '.Channels' );
        this.domChatlist = this.domElement.querySelector( '.Chatlist' );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        this.redrawChannels();
    }
    setChat( mode, record = false )
    {
        if( mode == true )
        {
            this.domElement.classList.add( 'Chat' );
        }
        else
        {
            this.domElement.classList.remove( 'Chat' );
        }
        if( record && record.Type == 'User' )
        {
        	this.activateDirectMessage( record.Fullname, false );
        }
    }
    // Get markup for object
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let props = '';
    	let n = 0;
    	for( let a in this.options )
    	{
    	    if( n++ > 0 ) props += ' ';
    	    props += a + '="' + props[ a ] + '"';
    	}
    	return '<fui-chatoverview' + props + '></fui-chatoverview>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
    inactivate()
    {
        this.domChannels.classList.add( 'Inactivated' );
        this.domChatlist.classList.add( 'Inactivated' );
    }
    activate()
    {
        this.domChannels.classList.remove( 'Inactivated' );
        this.domChatlist.classList.remove( 'Inactivated' );
    }
    // Show a sliding menu
    showSlidingMenu( tpl )
    {
        this.inactivate();
        if( this.domElement.querySelector( '.SlidingMenu' ) )
        {
            this.destroySlidingMenu();
        }
        let d = document.createElement( 'div' );
        d.className = 'SlidingMenu';
        this.domElement.appendChild( d );
        let f = new File( 'Progdir:Markup/room.html' );
        f.i18n();
        f.onLoad = function( data )
        {
            d.innerHTML = data;
            FUI.initialize();
            d.classList.add( 'Showing' );
        }
        f.load();
    }
    // Remove and purge existing sliding menu(s)
    destroySlidingMenu()
    {
        let sm = this.domElement.querySelector( '.SlidingMenu' );
        if( !sm ) return;
        sm.parentNode.removeChild( sm );
    }
    // Redraw channels
    redrawChannels()
    {
    	let self = this;
    	
    	if( self.channels )
    	{
    		return;
    	}
    	
    	// Default
    	self.domChannels.innerHTML = '\
    	<div class="Channel Jeanie" uniqueid="jeanie"></div>\
    	<div class="Channel DM" uniqueid="dm"></div>';
    	
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		let rooms = [];
    		if( me == 'ok' )
    		{
    			md = JSON.parse( md );
    			for( let a = 0; a < md.length; a++ )
    			{
    				self.domChannels.innerHTML += '<div class="Channel Group" uniqueid="chatroom" name="' + md[a].Name + '" id="' + md[a].UniqueID + '"></div>';
    			}
    		}
    		
    		self.domChannels.innerHTML += '<div class="Channel Add" uniqueid="add"></div>';
    	
			let chans = self.domChannels.getElementsByClassName( 'Channel' );
			for( let a = 0; a < chans.length; a++ )
			{
				let uniqueid = chans[ a ].getAttribute( 'uniqueid' );
				let groupId = chans[ a ].getAttribute( 'id' );
				let groupName = chans[ a ].getAttribute( 'name' );
				
				if( !chans[ a ].hoverElement )
				{
					let h = document.createElement( 'div' );
					h.className = 'HoverElement';
					chans[ a ].parentNode.parentNode.appendChild( h );
					chans[ a ].hoverElement = h;
					chans[ a ].onmouseover = function()
					{
						h.style.top = GetElementTop( this ) + 6 + 'px';
						h.style.left = GetElementLeft( this ) + this.offsetWidth + 16 + 'px';
						h.classList.add( 'Showing' );
					}
					chans[ a ].onmouseout = function()
					{
						h.classList.remove( 'Showing' );
					}
					switch( uniqueid )
					{
						case 'jeanie':
							h.innerHTML = i18n( 'i18n_jeanie_ai_assistant' );
							break;
						case 'dm':
							h.innerHTML = i18n( 'i18n_direct_messages' );
							break;
						case 'chatroom':
							h.innerHTML = groupName;
							break;
						case 'add':
							h.innerHTML = i18n( 'i18n_add_a_new_chatroom' );
							break;
					}
				}
			
				( function( ele, prop, gid = false, gnam = false )
				{
					if( prop == 'jeanie' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/mascot-small-black.png' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this );
						}
					}
					else if( prop == 'dm' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/dm.png' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this );
						}
					}
					else if( prop == 'chatroom' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/groups.png' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this, gid, gnam );
						}
					}
					else if( prop == 'add' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/add.png' ) + ')';
						ele.onclick = function()
						{
							self.showSlidingMenu( 'room.html' );
						}
					}
					else
					{
						console.log( 'not yet.' );
					}
				} )( chans[ a ], uniqueid, groupId, groupName );
			}
    	}
    	m.execute( 'convos', { 'method': 'getrooms' } );
    }
    pollChatroom( user, uid )
    {
    	// Just poll myself!
        if( user == Application.fullName )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
        let tabs = this.domChannels.getElementsByClassName( 'Channel' );
        for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ].classList.contains( 'Group' ) )
    		{
    		    if( tabs[ a ].getAttribute( 'id' ) == uid )
    		    {
					// It is already active
				    if( tabs[ a ].classList.contains( 'Active' ) )
				    {
				    	console.log( 'Already active! Just refresh.' );
				        let chat = FUI.getElementByUniqueId( 'messages' );
				    	chat.refreshMessages();
				        return;
				    }
				    // Activity in an inactive tab - add some info
				    // TODO: Add a flash or bubble
				    else
				    {
				    	// There will be notifications
				    }
			    }
    		}
    	}
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + user + '"></fui-contacts>';
    	FUI.initialize();
    }
    activateDirectMessage( user, message )
    {
    	// Just poll myself!
        if( user == Application.fullName )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
        let tabs = this.domChannels.getElementsByClassName( 'Channel' );
        for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ].classList.contains( 'DM' ) )
    		{
    		    // It is already active
    		    if( tabs[ a ].classList.contains( 'Active' ) )
    		    {
    		        let contacts = FUI.getElementByUniqueId( 'contacts' );
    		        contacts.poll( user, message );
    		        return;
    		    }
    			tabs[ a ].classList.add( 'Active' );
    		}
    		else
    		{
    			tabs[ a ].classList.remove( 'Active' );
    		}
    	}
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + user + '"></fui-contacts>';
    	FUI.initialize();
    }
    // Set active channel
    setActiveChannel( label, tab, groupId = false, groupName = false )
    {
    	document.body.classList.add( 'ChannelActive' );
    	let tabs = this.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ] == tab )
    		{
    			tabs[ a ].classList.add( 'Active' );
    		}
    		else
    		{
    			tabs[ a ].classList.remove( 'Active' );
    		}
    	}
		let chlist = this.domElement.querySelector( '.Chatlist' );
		if( label == 'jeanie' )
		{
		    chlist.innerHTML = '<fui-chatlog parentelement="convos" uniqueid="messages" name="' + label + '"></fui-chatlog>';
		    Application.holdConnection( { method: 'messages', roomType: 'jeanie' } );
	    }
	    else if( label == 'dm' )
	    {
	        chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts"></fui-contacts>';
	    }
	    // Initialize a contacts element, with 
	    else if( label == 'chatroom' )
	    {
	    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" group="' + groupId + '" name="' + groupName + '"></fui-contacts>';
	    }
		FUI.initialize();
		
		let messages = FUI.getElementByUniqueId( 'messages' );
		if( messages )
		{
		    // On init, set the correct topic on the channel
		    messages.setTopic( groupName ? groupName : label, label );
	    }
    }
    abortGroupCreation()
    {
    	let self = this;
    	self.destroySlidingMenu();
		self.activate();
    }
    createGroup()
    {
    	let self = this;
    	
    	let nam = ge( 'Name' ).value; let des = ge( 'Description' ).value;
    	
    	let n = new Module( 'system' );
    	n.onExecuted = function( ne, nd )
    	{
    		if( ne == 'ok' )
    		{
    			self.redrawChannels();
    		}
			self.destroySlidingMenu();
			self.activate();
    	}
    	n.execute( 'convos', { 
    		method: 'addroom', 
    		roomName: nam, 
    		roomDescription: des 
    	} );
    }
}
FUI.registerClass( 'chatoverview', FUIChatoverview );

