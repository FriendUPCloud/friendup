/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIMenubox extends FUIElement
{
	constructor( options )
	{
		console.log( 'FUIMenubox', options );
		super( options );
	}
	
	setMenu( items )
	{
		const self = this;
		console.log( 'setMenu', items );
		self.items.innerHTML = '';
		items.forEach( item => {
			console.log( 'setMenu item', item );
			const itemId = item.id;
			const el = document.createElement( 'div' );
			el.id = itemId;
			el.innerText = item.text;
			self.items.appendChild( el );
			el.addEventListener( 'click', e => {
				console.log( 'item click', itemId );
				if ( FUI.callbacks[ itemId ])
					FUI.callbacks[ itemId ]( el, item );
			}, false);
		});
	}
	
	attachDomElement()
	{
		console.log( 'attachDomElement', [ 
			this.options, 
			this.domElement, 
			this.domElement.parentElement 
		]);
		super.attachDomElement();
		this.domElement.classList.add( 'FUI', 'FUIMenubox' );
		
		console.log( 'onload things', {
			onload    : this.onload,
			callbacks : JSON.parse( JSON.stringify( window.FUI.callbacks )),
			f         : window.FUI.callbacks[ this.onload ],
		});
		if ( this.onload && window.FUI.callbacks[ this.onload ] )
		{
			console.log( 'run onload' );
			window.FUI.callbacks[ this.onload ]( this );
		}
		
	}
	
	grabAttributes( domEl )
	{
		const self = this;
		console.log( 'grabAttributes', {
			phEl  : domEl,
			domEl : self.domElement,
		});
		super.grabAttributes( domEl );

		self.id = domEl.getAttribute( 'uniqueid' );
		self.onload = domEl.getAttribute( 'onload' );
		self.domElement.id = self.id;
		
		let head = null;
		let content = null;
		const dHead = domEl.getElementsByTagName( 'menuboxhead' );
		if ( dHead[ 0 ] )
		{
			head = document.createElement( 'div' );
			head.classList.add( 'FUIMenuboxHead' );
			const dTitle = dHead[ 0 ].getElementsByTagName( 'menuboxtitle' );
			if ( dTitle[ 0 ])
			{
				const title = document.createElement( 'h2' );
				title.classList.add( 'FUIMenuboxTitle' );
				title.textContent = dTitle[ 0 ].innerHTML;
				head.appendChild( title );
				console.log( 'head/title', head );
			}
		}
		
		const dContent = domEl.getElementsByTagName( 'menuboxcontent' );
		console.log( 'dContent', dContent );
		if ( dContent[ 0 ])
		{
			content = document.createElement( 'div' );
			content.classList.add( 'FUIMenuboxContent' );
			const dItems = dContent[ 0 ].getElementsByTagName( 'menuboxitems' );
			if ( dItems[ 0 ])
			{
				const items = document.createElement( 'div' );
				items.classList.add( 'FUIMenuboxItems' );
				content.appendChild( items );
				self.items = items;
				console.log( 'content/items', content );
			}
		}
		
		if ( head )
			self.domElement.appendChild( head );
		if ( content )
			self.domElement.appendChild( content );
		
	}
	
	refreshDom()
	{
		const self = this;
		console.log( 'refreshDom', self.options );
	}
}

FUI.registerClass( 'menubox', FUIMenubox );