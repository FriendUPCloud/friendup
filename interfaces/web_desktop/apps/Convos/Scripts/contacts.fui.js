/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIContacts extends FUIElement
{
    constructor( options )
    {
        super( options );
        
        this.initialized = true;
        this.contactFilter = '';
        this.userList = {}; // Dom elements
        this.userListOrder = []; // Sorted list
        
        this.refreshDom();
        
        if( this.options )
        {
        	// If this is group list, initialize the group chat
        	if( this.options.groupid && this.options.groupname )
        	{
        		this.setChatView( {
        			Type: 'chatroom',
        			ID: this.options.groupid,
        			Fullname: this.options.groupname
        		} );
        	}
        }
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIContacts';
        
        let ex = this.options.groupid ? ' Group' : '';
        
        let data = '\
        <div class="ContactSearch"><input type="text" value="' + ( typeof( self.contactFilter ) != 'undefined' ? self.contactFilter : '' ) + '" placeholder="Find a contact..."/></div>\
        <div class="Contacts"><div class="ContactList"></div><div class="Settings"><div class="Avatar"></div><div class="Gearbox' + ex + '"></div></div></div>\
        <div class="Chat"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domContacts = this.domElement.querySelector( '.Contacts' );
        this.domContactList = this.domContacts.querySelector( '.ContactList' );
        this.domSettings = this.domContacts.querySelector( '.Settings' );
        this.domChat = this.domElement.querySelector( '.Chat' );
        this.domSearch = this.domElement.querySelector( '.ContactSearch' ).getElementsByTagName( 'input' )[0];
        
        // Cache this globally!
        if( window.myAvatar )
        {
        	self.domSettings.querySelector( '.Avatar' ).style.backgroundImage = 'url(' + window.myAvatar.src + ')';
	        self.domSettings.querySelector( '.Avatar' ).classList.add( 'Loaded' );
        }
        else
        {
		    let i = new Image();
		    window.myAvatar = i;
		    i.src = '/system.library/module/?module=system&command=getavatar&userid=' + Application.userId + '&width=128&height=128&authid=' + Application.authId;
		    i.onload = function()
		    {
		        self.domSettings.querySelector( '.Avatar' ).style.backgroundImage = 'url(' + this.src + ')';
		        self.domSettings.querySelector( '.Avatar' ).classList.add( 'Loaded' );
		        document.body.removeChild( i );
		    }
		    i.style.position = 'absolute';
		    i.style.visibility = 'hidden';
		    document.body.appendChild( i );
	    }
        
        this.domSearch.addEventListener( 'keyup', function( e )
        {
            let s = this;
	        if( self.contacttimeo )
	            clearTimeout( self.contacttimeo );
            if( self.newcontacttimeo )
            	clearTimeout( self.newcontacttimeo );
    	
	        self.contacttimeo = setTimeout( function()
	        {
	            self.contactFilter = s.value.toLowerCase();
	            self.refreshDom();
	        }, 100 );
        } );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
        
        let groupId = domElement.getAttribute( 'group' );
        if( groupId ) this.options.groupid = groupId;
        
        let groupName = domElement.getAttribute( 'name' );
        if( groupName ) this.options.groupname = groupName;
        
        let parentElement = domElement.getAttribute( 'parentelement' );
        if( parentElement ) this.options.parentElement = parentElement;
        
        let user = domElement.getAttribute( 'user' );
        if( user ) this.options.user = user;
    }
    // Just check the contact
    poll( contactName, message )
    {
        let self = this;
        
        // TODO: Replace with UniqueID at one point
        // Only poll active channels
        if( typeof( self.userList[ contactName ] ) != 'undefined' )
        {
            let ele = self.userList[ contactName ].querySelector( '.Contact' );
            if( ele.classList.contains( 'Active' ) )
            {
                Application.holdConnection( { method: 'messages', roomType: 'dm-user', cid: ele.record.ID } );
            }
            // Not active, simply add activity marker
            else
            {
            	// TODO: Support public key decryption
				let text = decodeURIComponent( message );
			    try
			    {
			        let dec = new TextDecoder().decode( base64ToBytes( text ) );
			        text = dec;
			    }
			    catch( e2 ){};
            
                ele.classList.add( 'NewActivity' );
                Notify( {
                	title: 'From ' + contactName, 
                	text: text
                }, false, function()
                {
                	ele.click();                	
                } );
            }
        }
    }
    addContact( contact )
    {
        let self = this;
        
        let parentEl = self.domContactList;
        
        let d = document.createElement( 'div' );
        d.className = 'Contact';
        if( contact.Type == 'User' )
        {
            d.className += ' User';
        }
        d.record = contact;
       	let online = ( Math.floor( new Date().getTime() / 1000 ) - parseInt( contact.LastActionTime ) ) <= 600;
       	if( online )
       		d.className += ' Online';
        d.innerHTML = '<span class="Avatar"></span><span class="Name">' + contact.Fullname + '</span>';
        d.onclick = function()
        {
            self.setChatView( this.record );
            this.classList.remove( 'NewActivity' );
        }
        
        // Init user
        if( contact.Fullname == this.options.user )
        {
            self.queuedClick = function()
            {
                self.options.user = null;
                self.queuedClick = null;
                d.click();
            }
        }
        
        // Load avatar
        let i = new Image();
        i.src = '/system.library/module/?module=system&command=getavatar&userid=' + contact.UserID + '&width=128&height=128&authid=' + Application.authId;
        i.onload = function()
        {
            d.querySelector( '.Avatar' ).style.backgroundImage = 'url(' + this.src + ')';
            document.body.removeChild( i );
        }
        i.style.position = 'absolute';
        i.style.visibility = 'hidden';
        document.body.appendChild( i );
        
        // The slot does not exist?
        if( !this.userList[ contact.Fullname ] )
        {
            this.userList[ contact.Fullname ] = document.createElement( 'div' );
            this.userList[ contact.Fullname ].className = 'Slot';
            parentEl.appendChild( this.userList[ contact.Fullname ] );
            // Add to slot
            this.userList[ contact.Fullname ].appendChild( d );
        }
        setTimeout( function(){ d.classList.add( 'Showing' ); }, 2 );
    }
    contactsMode()
    {
        this.domElement.classList.remove( 'Chat' );
        
        if( this.options.parentElement )
        {
            let par = FUI.getElementByUniqueId( this.options.parentElement );
            par.setChat( false );
        }
    }
    getContacts()
    {
    	let out = [];
    	let contacts = this.domContacts.getElementsByClassName( 'Contact' );
        for( let a = 0; a < contacts.length; a++ )
        {
            if( contacts[ a ].record )
            {
            	out.push( {
            		uniqueId: contacts[ a ].record.ID,
            		fullname: contacts[ a ].record.Fullname
            	} );
            }
        }
        return out;
    }
    setChatView( record )
    {
    	this.record = record;
    	
        let context = ' context="' + ( record.Type == 'User' ? 'user' : ( record.Type == 'chatroom' ? 'chatroom' : 'contact' ) ) + '"';
        context += ' cid="' + record.ID + '"';
        let dm = record.Type == 'User' ? 'dm-user' : ( record.Type == 'chatroom' ? 'chatroom' : 'dm-contact' );
        this.domChat.innerHTML = '<fui-chatlog parentelement="' + this.options.uniqueid + '" uniqueid="messages" type="' + dm + '" name="' + record.Fullname + '"' + context + '></fui-chatlog>';
        FUI.initialize();
        
        let contacts = this.domContacts.getElementsByClassName( 'Contact' );
        for( let a = 0; a < contacts.length; a++ )
        {
            if( contacts[a].record == record )
            {
                contacts[a].classList.add( 'Active' );
            }
            else
            {
                contacts[a].classList.remove( 'Active' );
            }
        }
        
        this.domElement.classList.add( 'Chat' );
        
        if( this.options.parentElement )
        {
            let par = FUI.getElementByUniqueId( this.options.parentElement );
            par.setChat( true, record );
        }
        
        Application.holdConnection( { method: 'messages', roomType: dm, cid: record.ID } );
    }
    // Contacts are refreshed by date active
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        
        if( !this.initialized ) return;
        
        let self = this;
        
        if( self.contactFilter != '' )
        {
            let conts = self.domContacts.getElementsByClassName( 'Contact' );
            for( let a = 0; a < conts.length; a++ )
            {
                if( conts[ a ].querySelector( '.Name' ).innerText.toLowerCase().indexOf( self.contactFilter ) >= 0 )
                {
                    conts[ a ].parentNode.style.display = '';
                }
                else
                {
                    conts[ a ].parentNode.style.display = 'none';
                }
            }
            if( self.queuedClick )
                self.queuedClick();
        }
        else
        {
            let m = new Module( 'system' );
            m.onExecuted = function( me, md )
            {
                // Reset hidden
                let conts = self.domContacts.getElementsByClassName( 'Contact' );
                for( let a = 0; a < conts.length; a++ )
                {
                    conts[ a ].parentNode.style.display = '';
                }
                if( me == 'ok' )
                {
                    let list = JSON.parse( md );
                    for( let a = 0; a < list.contacts.length; a++ )
                    {
                        self.addContact( list.contacts[a] );
                    }
                }
                else
                {
                	self.showNoContactsMenu();
                }
                if( self.queuedClick )
                    self.queuedClick();
            }
            let opts = { method: 'contacts' };
            if( this.options.groupid )
            {
            	opts.groupid = this.options.groupid;
            }
            m.execute( 'convos', opts );
        }
    }
    // Oh, no contacts, do something about it?
    showNoContactsMenu()
    {
    	let self = this;
    	let d = document.createElement( 'div' );
    	d.className = 'NoContacts';
    	d.innerHTML = '<h2>' + i18n( 'i18n_nobody_here' ) + '</h2><p>' + i18n( 'i18n_you_have_no_contacts' ) + '</p>';
    	let b = document.createElement( 'div' );
    	b.className = 'NoContacts';
    	b.innerHTML = '<p><button class="AddButton" type="button">' + i18n( 'i18n_add_contacts' ) + '</button></p>';
    	let cl = this.domContacts.querySelector( '.ContactList' );
    	cl.innerHTML = '';
    	cl.appendChild( d );
    	cl.appendChild( b );
    	b.querySelector( '.AddButton' ).onclick = function()
    	{
    		self.inviteDialog = new FUIInvitedialog( { channelName: self.record.Fullname, groupId: self.record.ID } );
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
    	return '<fui-contacts' + props + '></fui-contacts>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
}
FUI.registerClass( 'contacts', FUIContacts );

