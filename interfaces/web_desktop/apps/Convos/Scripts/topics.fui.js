/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUITopics extends FUIContacts
{
	getListMethod()
    {
    	return 'topics';
    }
    
    getBasicTemplate()
    {
    	let ex = this.options.groupid ? '<div class="Group"></div>' : '';
        
        // <div class="Gearbox"></div>
        
    	return '\
        <div class="ContactSearch"><input type="text" value="' + ( typeof( self.contactFilter ) != 'undefined' ? self.contactFilter : '' ) + '" placeholder="Find a topic..."/></div>\
        <div class="Contacts"><div class="ContactList"></div><div class="Settings"><div class="Avatar"></div><div class="Toolbar">' + ex + '<div class="AddConversation"></div></div></div></div>\
        <div class="Chat"><div class="Placeholder"><span>' + i18n( 'i18n_start_conversation' ) + '</span></div></div>\
        ';
    }
    
    // Oh, no topics, do something about it?
    showNoContactsMenu()
    {
    	let self = this;
    	let d = document.createElement( 'div' );
    	d.className = 'NoContacts';
    	d.innerHTML = '<h2>' + i18n( 'i18n_no_topics' ) + '</h2><p>' + i18n( 'i18n_you_have_no_topics' ) + '</p>';
    	let b = document.createElement( 'div' );
    	b.className = 'NoContacts';
    	b.innerHTML = '<p><button class="AddButton" type="button">' + i18n( 'i18n_add_topic' ) + '</button></p>';
    	let cl = this.domContacts.querySelector( '.ContactList' );
    	cl.innerHTML = '';
    	cl.appendChild( d );
    	cl.appendChild( b );
    	b.querySelector( '.AddButton' ).onclick = function()
    	{
    		self.initChatTopic();
    	}
    }
    
    getMemberAttribute()
    {
    	return 'topics';
    }
    getRowClass()
    {
    	return 'Topic';
    }
    getListKey()
    {
    	return 'ID';
    }
    initChatTopic()
    {
    	let self = this;
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		if( me == 'ok' )
    		{
    			// Flush
    			if( self.domContacts.querySelector( '.NoContacts' ) )
    			{
    				self.domContacts.querySelector( '.ContactList' ).innerHTML = '';
    			}
				self.refreshDom();
			}
			else
			{
				// Perhaps make a message
			}
    	}
    	m.execute( 'convos', { method: 'createtopic' } );
    }
}

FUI.registerClass( 'topics', FUITopics );
